import { BusinessProfileSchema, DesignBriefSchema } from '@repo/shared-types';
import { z } from 'zod';

// Wire-shape schemas for /api/projects. Match these against shared-types
// when Project crosses the package boundary (none of those use cases exist
// yet in 2.4a; this is web-app-internal).

const NAME_MIN = 3;
const NAME_MAX = 80;
const REQUIREMENTS_MIN = 50;
const REQUIREMENTS_MAX = 50_000;

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(NAME_MIN).max(NAME_MAX),
});

export const PatchProjectSchema = z
  .object({
    name: z.string().trim().min(NAME_MIN).max(NAME_MAX).optional(),
    rawRequirements: z.string().trim().min(REQUIREMENTS_MIN).max(REQUIREMENTS_MAX).optional(),
    // When the user saves edits to the parsed profile. The full schema is
    // validated upstream by Zod — drift between AI output and stored row
    // is caught at this seam.
    businessProfileJson: BusinessProfileSchema.optional(),
    // When the user clicks "Confirm and continue" on the profile. Advances
    // status from PROFILE_GENERATED → PROFILE_CONFIRMED. Requires
    // businessProfileJson to already be populated; the route handler enforces.
    confirmProfile: z.literal(true).optional(),
    // Same pattern for the design brief (Phase 2.4c).
    designBriefJson: DesignBriefSchema.optional(),
    confirmBrief: z.literal(true).optional(),
  })
  .refine(
    (v) =>
      v.name !== undefined ||
      v.rawRequirements !== undefined ||
      v.businessProfileJson !== undefined ||
      v.confirmProfile !== undefined ||
      v.designBriefJson !== undefined ||
      v.confirmBrief !== undefined,
    { message: 'At least one field must be provided' },
  );

export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>;
export type PatchProjectRequest = z.infer<typeof PatchProjectSchema>;

export const PROJECT_NAME_LIMITS = { min: NAME_MIN, max: NAME_MAX } as const;
export const REQUIREMENTS_LIMITS = { min: REQUIREMENTS_MIN, max: REQUIREMENTS_MAX } as const;
