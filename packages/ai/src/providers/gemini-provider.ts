import { ApiError, GoogleGenAI } from '@google/genai';
import { z, type ZodType } from 'zod';

import { AIError, AIQuotaExhaustedError, AIRateLimitError, AIValidationError } from '../errors';
import { TokenBucket } from '../rate-limiter';
import { withRetry } from '../retry';
import { type AIProvider, type AIProviderName, type GenerateOptions } from '../types';

export interface GeminiProviderConfig {
  apiKey: string;
  /** Requests per minute throttle. Default 15 (Flash free tier). */
  rpm?: number;
  /** Default retries if not specified in GenerateOptions. Default 3. */
  defaultRetries?: number;
}

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = 'gemini';
  private readonly client: GoogleGenAI;
  private readonly limiter: TokenBucket;
  private readonly defaultRetries: number;

  constructor(config: GeminiProviderConfig) {
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.limiter = new TokenBucket({
      capacity: config.rpm ?? 15,
      refillIntervalMs: 60_000,
    });
    this.defaultRetries = config.defaultRetries ?? 3;
  }

  async generateText(prompt: string, options: GenerateOptions): Promise<string> {
    const config = buildBaseConfig(options);
    return withRetry(
      async () => {
        await this.limiter.acquire();
        const response = await this.client.models.generateContent({
          model: options.model,
          contents: prompt,
          config,
        });
        const text = response.text;
        if (typeof text !== 'string') {
          throw new AIError('Gemini returned no text in response');
        }
        return text;
      },
      buildRetryOptions(options, this.defaultRetries),
    );
  }

  async generateStructured<T>(
    schema: ZodType<T>,
    prompt: string,
    options: GenerateOptions,
  ): Promise<T> {
    const jsonSchema = toGeminiSchema(schema);
    const config = {
      ...buildBaseConfig(options),
      responseMimeType: 'application/json',
      responseJsonSchema: jsonSchema,
    };

    const rawText = await withRetry(
      async () => {
        await this.limiter.acquire();
        const response = await this.client.models.generateContent({
          model: options.model,
          contents: prompt,
          config,
        });
        const text = response.text;
        if (typeof text !== 'string') {
          throw new AIError('Gemini returned no text in response');
        }
        return text;
      },
      buildRetryOptions(options, this.defaultRetries),
    );

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (err) {
      throw new AIValidationError('Gemini returned invalid JSON', rawText, null, err);
    }

    const result = schema.safeParse(parsedJson);
    if (!result.success) {
      throw new AIValidationError(
        'Gemini response did not match schema',
        rawText,
        result.error.issues,
      );
    }
    return result.data;
  }
}

/**
 * Build a GenerateContentConfig with only the fields the caller actually
 * specified. With `exactOptionalPropertyTypes`, leaving keys present with
 * `undefined` values fails the SDK's typing — so we omit them.
 */
function buildBaseConfig(options: GenerateOptions): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  if (options.system !== undefined) config.systemInstruction = options.system;
  if (options.maxOutputTokens !== undefined) config.maxOutputTokens = options.maxOutputTokens;
  if (options.temperature !== undefined) config.temperature = options.temperature;
  return config;
}

function buildRetryOptions(
  options: GenerateOptions,
  defaultRetries: number,
): {
  retries: number;
  classifyError: typeof classifyGeminiError;
  signal?: AbortSignal;
} {
  const retries = options.retries ?? defaultRetries;
  if (options.signal !== undefined) {
    return { retries, classifyError: classifyGeminiError, signal: options.signal };
  }
  return { retries, classifyError: classifyGeminiError };
}

/**
 * Convert a Zod schema to the JSON Schema dialect Gemini accepts on the
 * `responseJsonSchema` config field. `z.toJSONSchema` emits Draft 2020-12
 * with a `$schema` URL; Gemini ignores top-level `$schema` but we strip it
 * for a cleaner request payload and to avoid future strict-validator
 * surprises.
 */
function toGeminiSchema(schema: ZodType<unknown>): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  const { $schema: _ignored, ...rest } = json;
  return rest;
}

/**
 * Map @google/genai SDK errors to AIError subtypes. The SDK throws
 * `ApiError` (exported from the package) carrying an HTTP status code on
 * non-2xx responses.
 *
 * - 429 → AIRateLimitError (transient)
 * - 403 RESOURCE_EXHAUSTED quota message → AIQuotaExhaustedError (fatal)
 * - 5xx / network → leave as-is (withRetry treats non-AIError as transient)
 * - other 4xx → AIError (fatal)
 */
export function classifyGeminiError(err: unknown): Error {
  if (err instanceof ApiError) {
    const message = err.message;
    if (err.status === 429) {
      const retryAfterMs = parseRetryAfterMs(message);
      return new AIRateLimitError(message, retryAfterMs, err);
    }
    if (/quota|resource[_ ]?exhausted/i.test(message)) {
      return new AIQuotaExhaustedError(message, err);
    }
    if (err.status >= 500) {
      // Transient — return as-is so withRetry treats as retryable.
      return err;
    }
    // Other 4xx (400 bad request, 401 auth, 403 permission, 404, ...) — fatal.
    return new AIError(`Gemini API error ${String(err.status)}: ${message}`, err);
  }
  if (err instanceof Error) {
    // Generic / network errors — let withRetry decide (treated as transient).
    return err;
  }
  return new AIError(String(err));
}

/**
 * Pull a retry-after value out of a Gemini error message. The SDK's error
 * body often embeds `retryDelay: "27s"` from the underlying gRPC status.
 * Best-effort — returns undefined if not parseable.
 */
function parseRetryAfterMs(message: string): number | undefined {
  const match = /retry(?:Delay)?["':\s]+(\d+(?:\.\d+)?)\s*s/i.exec(message);
  if (match?.[1] === undefined) return undefined;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds)) return undefined;
  return Math.round(seconds * 1000);
}
