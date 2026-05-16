import { type ZodType } from 'zod';

export type AIProviderName = 'gemini' | 'anthropic' | 'openrouter';

export interface GenerateOptions {
  /** Provider-namespaced model id (e.g. "gemini-2.5-flash"). */
  model: string;
  /** System prompt. Sent via the provider's native systemInstruction-equivalent. */
  system?: string;
  /** Soft cap on output tokens. Providers interpret differently. */
  maxOutputTokens?: number;
  /** 0..1. Lower = more deterministic. */
  temperature?: number;
  /** Retries on transient errors (network, 429, 5xx). */
  retries?: number;
  /** Cancellation signal. */
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly name: AIProviderName;

  /**
   * Generate plain text. No structured output.
   */
  generateText(prompt: string, options: GenerateOptions): Promise<string>;

  /**
   * Generate a value matching the given Zod schema. The provider asks the
   * model for JSON, parses it, and validates with Zod before returning.
   * Throws `AIValidationError` if the model returned output that couldn't
   * be coerced into the schema after retries.
   */
  generateStructured<T>(schema: ZodType<T>, prompt: string, options: GenerateOptions): Promise<T>;
}
