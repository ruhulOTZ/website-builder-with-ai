// brief-to-theme — mechanical mapping from DesignBrief → ThemeTokens.
//
// DesignBriefSchema.colorPalette and ThemeTokensSchema.colors have nearly
// identical shapes (12 color fields). The brief's typography is an enum
// string; ThemeTokens.typography.pairingId is the same enum. The brief's
// density / radius / shadow / motion map 1:1 to ThemeTokens. This is a
// mechanical map — no creativity, no AI involvement.
//
// Lives next to the home-page generator (not in shared-types) because the
// mapping is a server-side derivation, not a shared contract.

// TYPOGRAPHY_PAIRINGS lives in shared-types (pure data, CJS-friendly).
// design-system re-exports it for apps/web consumers, but on the api side
// we read directly from shared-types so the NestJS runtime doesn't pull
// in @repo/design-system/fonts (which depends on next/font/google).
import { type DesignBrief, type ThemeTokens, TYPOGRAPHY_PAIRINGS } from '@repo/shared-types';

// The brief carries `density` directly; ThemeTokens.typography.scale is a
// related but distinct enum (compact/balanced/spacious). They mean roughly
// the same thing — tight density → compact scale, airy → spacious. Keep
// these aligned so the generated site visually matches the brief's design
// DNA without requiring the AI to reason about them separately.
const DENSITY_TO_SCALE: Record<DesignBrief['density'], ThemeTokens['typography']['scale']> = {
  tight: 'compact',
  balanced: 'balanced',
  airy: 'spacious',
};

export function briefToThemeTokens(brief: DesignBrief): ThemeTokens {
  const cp = brief.colorPalette;
  // brief.typography is already a TypographyPairing enum value (validated
  // by DesignBriefSchema on input). Look it up directly.
  const pairingId = brief.typography;
  const pairingConfig = TYPOGRAPHY_PAIRINGS[pairingId];

  const theme: ThemeTokens = {
    colors: {
      primary: cp.primary,
      secondary: cp.secondary,
      accent: cp.accent,
      background: cp.background,
      surface: cp.surface,
      foreground: cp.foreground,
      mutedForeground: cp.mutedForeground,
      border: cp.border,
      success: cp.success,
      warning: cp.warning,
      danger: cp.danger,
    },
    typography: {
      pairingId,
      headingFamily: pairingConfig.headingFamily,
      bodyFamily: pairingConfig.bodyFamily,
      scale: DENSITY_TO_SCALE[brief.density],
    },
    radius: brief.radius,
    shadow: brief.shadow,
    density: brief.density,
    motion: brief.motion,
  };

  // darkMode is optional on both schemas with identical shape.
  if (cp.darkMode !== undefined) {
    theme.darkMode = {
      background: cp.darkMode.background,
      surface: cp.darkMode.surface,
      foreground: cp.darkMode.foreground,
      mutedForeground: cp.darkMode.mutedForeground,
      border: cp.darkMode.border,
    };
  }

  return theme;
}
