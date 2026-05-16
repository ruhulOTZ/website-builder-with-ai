import { BusinessProfileSchema, DesignBriefSchema } from '@repo/shared-types';
import { z } from 'zod';

/**
 * Wire-shape Zod schema for POST /api/home-page/generate.
 * Validated in the controller before the service is called.
 */
export const GenerateHomePageRequestSchema = z.object({
  profile: BusinessProfileSchema,
  brief: DesignBriefSchema,
  /** Persisted DesignBriefRecord id, stamped on the generated Site for audit. */
  designBriefId: z.string().max(64),
  /** Original requirements doc, for voice/tone color. Optional. */
  rawDocumentText: z.string().max(50_000).optional(),
  sourceLabel: z.string().max(200).optional(),
  /** When true, the generated site is persisted to generated_site_records. */
  persist: z.boolean().default(true),
});

export type GenerateHomePageRequest = z.infer<typeof GenerateHomePageRequestSchema>;
