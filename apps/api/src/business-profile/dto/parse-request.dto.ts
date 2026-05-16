import { z } from 'zod';

/**
 * Wire-shape Zod schema for POST /api/business-profile/parse.
 * Validated in the controller before the service is called.
 */
export const ParseRequestSchema = z.object({
  rawText: z.string().min(10, 'rawText must be at least 10 characters'),
  sourceLabel: z.string().max(200).optional(),
  /** When true, the parsed profile is persisted to business_profile_records. */
  persist: z.boolean().default(true),
});

export type ParseRequest = z.infer<typeof ParseRequestSchema>;
