// Re-export from shared-types so existing imports from
// `@repo/design-system` and `@repo/design-system/typography` continue to
// work. The canonical home for this data is shared-types — see comment
// at the top of packages/shared-types/src/typography-pairings.ts for why.
export { TYPOGRAPHY_PAIRINGS, type TypographyPairingConfig } from '@repo/shared-types';
