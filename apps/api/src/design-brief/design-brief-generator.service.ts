import { Inject, Injectable, Logger } from '@nestjs/common';
import { type AIProvider } from '@repo/ai';
import { type BusinessProfile, type DesignBrief, DesignBriefSchema } from '@repo/shared-types';
import { z } from 'zod';

import { AI_PROVIDER } from '../ai/ai.tokens';
import { normalizeStrings } from '../shared/normalize-strings';

import { buildBriefPrompt, PROMPT_VERSION } from './prompts/brief-v2';

const MODEL = 'gemini-2.5-flash';
// Creative reasoning, not extraction — higher temperature so distinct businesses
// produce distinct briefs. Determinism is less valuable here than variety.
const TEMPERATURE = 0.7;
// Brief output is substantially larger than BusinessProfile: archetype +
// 6 traits + 12-field palette + every rationale + recommendedPages array.
// 16384 gives headroom for verbose rationale and corpus growth.
const MAX_OUTPUT_TOKENS = 16384;

/**
 * Schema used for the AI call. `businessProfile` is intentionally typed as
 * `z.unknown().optional()` so the model can emit `{}` (or omit) instead of
 * round-tripping the full input profile through its output. The service
 * replaces this field with the validated input profile post-AI, then runs
 * the merged object through the canonical DesignBriefSchema for final
 * validation. See the Phase 2.3a review thread for the rationale (saves
 * ~1500 output tokens per call and eliminates paraphrasing drift).
 */
const GenerationSchema = DesignBriefSchema.omit({ businessProfile: true }).extend({
  businessProfile: z.unknown().optional(),
});
type GenerationOutput = z.infer<typeof GenerationSchema>;

export interface GenerateInput {
  profile: BusinessProfile;
  rawDocumentText?: string;
  sourceLabel?: string;
}

export interface GenerateResult {
  brief: DesignBrief;
  modelUsed: string;
  promptVersion: string;
}

/**
 * Pure generation service. Reads a BusinessProfile (plus optional raw
 * document text for voice/tone context) and asks the AI to produce a
 * DesignBrief — archetype, palette, typography, layout, voice.
 *
 * No persistence here — the controller owns that decision. Keep this method
 * side-effect free so the eval rig can run it repeatedly without DB churn.
 */
@Injectable()
export class DesignBriefGeneratorService {
  private readonly logger = new Logger(DesignBriefGeneratorService.name);

  /** Read-only identifiers exposed for cache keying / introspection. */
  readonly model: string = MODEL;
  readonly promptVersion: string = PROMPT_VERSION;

  constructor(@Inject(AI_PROVIDER) private readonly ai: AIProvider) {}

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const { system, user } = buildBriefPrompt({
      profile: input.profile,
      ...(input.rawDocumentText !== undefined ? { rawDocumentText: input.rawDocumentText } : {}),
    });

    this.logger.log(
      `Generating design brief (source=${input.sourceLabel ?? 'unlabeled'}, business=${input.profile.businessName}, prompt=${PROMPT_VERSION})`,
    );

    // Generate with the trimmed schema (businessProfile as unknown). The model
    // is instructed to emit businessProfile: {} so it doesn't waste tokens
    // copying the input.
    const generated: GenerationOutput = await this.ai.generateStructured(GenerationSchema, user, {
      model: MODEL,
      system,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    // Debug instrumentation: log a compact summary of what the model emitted
    // into businessProfile. The prompt instructs `{}`; any other shape is the
    // model wasting tokens that we'd want to know about. Only the size + a
    // truncated preview are logged — never the full content, since the
    // discarded payload may be large.
    const emittedProfile = generated.businessProfile;
    const emittedProfileJson = JSON.stringify(emittedProfile ?? null);
    const isEmptyObject =
      emittedProfile !== null &&
      typeof emittedProfile === 'object' &&
      !Array.isArray(emittedProfile) &&
      Object.keys(emittedProfile).length === 0;
    this.logger.log(
      `pre-injection businessProfile: ${isEmptyObject ? 'empty {} (correct)' : `populated (${String(emittedProfileJson.length)} chars: ${emittedProfileJson.slice(0, 120)}${emittedProfileJson.length > 120 ? '…' : ''})`}`,
    );

    // Inject the real input profile and validate against the canonical
    // DesignBriefSchema. If the model produced anything that's structurally
    // wrong with the canonical schema (e.g. missing schemaVersion, bad
    // archetype value), this is where it surfaces.
    const merged = {
      ...generated,
      businessProfile: input.profile,
    };
    const brief = DesignBriefSchema.parse(merged);

    return {
      brief: normalizeStrings(brief),
      modelUsed: MODEL,
      promptVersion: PROMPT_VERSION,
    };
  }
}
