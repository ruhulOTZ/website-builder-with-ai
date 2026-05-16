// theme-provider.tsx — Renders a wrapper element that exposes a `ThemeTokens`
// value as CSS custom properties (the `--ds-*` namespace). Tailwind utilities
// declared by `tailwind-preset.css` resolve to these variables, so any descendant
// rendered with `bg-primary`, `font-heading`, etc. picks up the active theme.
//
// Design rules enforced here:
//   * Pure CSS-variable propagation. No layout (no padding/margin/dimensions).
//   * No Zod validation at render time — types are the boundary contract; runtime
//     validation belongs where data enters the system.

import { type Site } from '@repo/shared-types';
import { type CSSProperties, type ReactNode } from 'react';

type ThemeTokens = Site['theme'];
type ColorMode = 'light' | 'dark';

export interface ThemeProviderProps {
  tokens: ThemeTokens;
  colorMode?: ColorMode;
  children: ReactNode;
  /** Optional extra className(s) for the wrapper (e.g. font variable classes). */
  className?: string;
}

const RADIUS_MAP: Record<ThemeTokens['radius'], string> = {
  sharp: '0px',
  subtle: '0.375rem',
  rounded: '0.75rem',
  pill: '9999px',
};

const SHADOW_MAP: Record<ThemeTokens['shadow'], string> = {
  none: 'none',
  subtle: '0 1px 2px 0 oklch(0 0 0 / 0.06), 0 1px 3px 0 oklch(0 0 0 / 0.08)',
  dramatic: '0 25px 50px -12px oklch(0 0 0 / 0.35)',
  soft_diffuse: '0 10px 40px -10px oklch(0 0 0 / 0.18)',
};

const DENSITY_SCALE: Record<ThemeTokens['density'], number> = {
  tight: 0.85,
  balanced: 1,
  airy: 1.2,
};

export function ThemeProvider({
  tokens,
  colorMode = 'light',
  children,
  className,
}: ThemeProviderProps) {
  const dark = colorMode === 'dark' ? tokens.darkMode : undefined;

  // Color resolution: light is always baseline; dark overrides only the surfaces
  // that the schema declares dark-mode mirrors for.
  const background = dark?.background ?? tokens.colors.background;
  const surface = dark?.surface ?? tokens.colors.surface;
  const foreground = dark?.foreground ?? tokens.colors.foreground;
  const mutedForeground = dark?.mutedForeground ?? tokens.colors.mutedForeground;
  const border = dark?.border ?? tokens.colors.border;

  const style = {
    // Colors
    '--ds-color-primary': tokens.colors.primary,
    '--ds-color-secondary': tokens.colors.secondary,
    '--ds-color-accent': tokens.colors.accent,
    '--ds-color-background': background,
    '--ds-color-surface': surface,
    '--ds-color-foreground': foreground,
    '--ds-color-muted-foreground': mutedForeground,
    '--ds-color-border': border,
    '--ds-color-success': tokens.colors.success,
    '--ds-color-warning': tokens.colors.warning,
    '--ds-color-danger': tokens.colors.danger,

    // Typography
    '--ds-font-heading': tokens.typography.headingFamily,
    '--ds-font-body': tokens.typography.bodyFamily,

    // Scalars (unprefixed — referenced directly by components via
    // `rounded-[var(--radius)]`, `shadow-[var(--shadow)]`, etc.)
    '--radius': RADIUS_MAP[tokens.radius],
    '--shadow': SHADOW_MAP[tokens.shadow],
    '--density-scale': String(DENSITY_SCALE[tokens.density]),

    // Surface defaults (so children inherit token colors without per-element work)
    backgroundColor: 'var(--ds-color-background)',
    color: 'var(--ds-color-foreground)',
  } as CSSProperties;

  return (
    <div
      data-ds-theme=""
      data-ds-color-mode={colorMode}
      data-ds-pairing={tokens.typography.pairingId}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
