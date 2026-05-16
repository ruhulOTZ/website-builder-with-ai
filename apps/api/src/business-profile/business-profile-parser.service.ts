import { Inject, Injectable, Logger } from '@nestjs/common';
import { type AIProvider } from '@repo/ai';
import { type BusinessProfile, BusinessProfileSchema } from '@repo/shared-types';

import { AI_PROVIDER } from '../ai/ai.tokens';
import { normalizeStrings } from '../shared/normalize-strings';

import { buildParsePrompt, PROMPT_VERSION } from './prompts/parse-v2';

const MODEL = 'gemini-2.5-flash';
const TEMPERATURE = 0.2;
const MAX_OUTPUT_TOKENS = 8192;

export interface ParseInput {
  rawText: string;
  sourceLabel?: string;
}

export interface ParseResult {
  profile: BusinessProfile;
  modelUsed: string;
  promptVersion: string;
  /** Best-effort token estimate (not exact; the SDK doesn't surface counts on every response). */
  tokensApprox?: number;
}

/**
 * Pure extraction service. Reads a plain-text requirements document, asks the
 * AI provider to extract a BusinessProfile, validates the response against
 * BusinessProfileSchema, and returns it.
 *
 * No persistence here — the controller owns that decision. Keep this method
 * side-effect free so the eval rig can run it repeatedly without DB churn.
 */
@Injectable()
export class BusinessProfileParserService {
  private readonly logger = new Logger(BusinessProfileParserService.name);

  /** Read-only identifiers exposed for cache keying / introspection. */
  readonly model: string = MODEL;
  readonly promptVersion: string = PROMPT_VERSION;

  constructor(@Inject(AI_PROVIDER) private readonly ai: AIProvider) {}

  async parse(input: ParseInput): Promise<ParseResult> {
    const { system, user } = buildParsePrompt(input.rawText);

    this.logger.log(
      `Parsing requirements doc (source=${input.sourceLabel ?? 'unlabeled'}, len=${String(input.rawText.length)} chars, prompt=${PROMPT_VERSION})`,
    );

    // generateStructured throws AIValidationError on schema mismatch, AIRateLimitError
    // / AIQuotaExhaustedError on provider issues. Let those propagate — the controller
    // / eval rig surfaces them.
    //
    // 8192 to safely cover long-tail BusinessProfile outputs.
    // parse-v1 at 2048 truncated ~40% of detailed fixtures; 4096 cleared most;
    // 8192 gives headroom for parse-v2 verbosity and corpus growth.
    const profile = await this.ai.generateStructured(BusinessProfileSchema, user, {
      model: MODEL,
      system,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    return {
      profile: normalizeStrings(profile),
      modelUsed: MODEL,
      promptVersion: PROMPT_VERSION,
    };
  }
}
