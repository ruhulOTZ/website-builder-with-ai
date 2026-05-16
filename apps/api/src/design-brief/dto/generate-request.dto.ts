import { BusinessProfileSchema } from '@repo/shared-types';
import { z } from 'zod';

/**
 * Wire-shape Zod schema for POST /api/design-brief/generate.
 * Validated in the controller before the service is called.
 *
 * `profile` is the parser's output (validated against BusinessProfileSchema).
 * `rawDocumentText` is the original requirements doc — passed through to the
 * prompt for voice/tone context. Optional: the eval rig always includes it,
 * but the UI flow may not have it once a profile is loaded from the DB.
 */
export const GenerateBriefRequestSchema = z.object({
  profile: BusinessProfileSchema,
  rawDocumentText: z.string().max(50_000).optional(),
  sourceLabel: z.string().max(200).optional(),
  /** Optional reference to a persisted BusinessProfileRecord. Loose string. */
  businessProfileId: z.string().max(64).optional(),
  /** When true, the generated brief is persisted to design_brief_records. */
  persist: z.boolean().default(true),
});

export type GenerateBriefRequest = z.infer<typeof GenerateBriefRequestSchema>;
