import { type ProjectStatus } from '@repo/database';

// User-facing label + badge variant per status. Keep this isolated so the
// downstream sub-steps (2.4b–2.4d) can extend without spreading status
// strings across components.

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  REQUIREMENTS_SUBMITTED: 'Requirements submitted',
  PROFILE_GENERATED: 'Profile generated',
  PROFILE_CONFIRMED: 'Profile confirmed',
  BRIEF_GENERATED: 'Brief generated',
  BRIEF_CONFIRMED: 'Brief confirmed',
  COMPLETED: 'Completed',
};

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export const STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  DRAFT: 'outline',
  REQUIREMENTS_SUBMITTED: 'secondary',
  PROFILE_GENERATED: 'secondary',
  PROFILE_CONFIRMED: 'default',
  BRIEF_GENERATED: 'secondary',
  BRIEF_CONFIRMED: 'default',
  COMPLETED: 'default',
};
