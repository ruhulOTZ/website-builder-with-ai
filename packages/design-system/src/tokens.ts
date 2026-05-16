// Minimal scaffold. Full token system lands in a later step.
//
// The contract: every token below maps to a CSS custom property in `tokens.css`.
// Generated sites read the CSS variables; the TS shape is only for typed access
// in dashboard tooling or runtime overrides.

export interface ColorTokens {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
}

export interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
}

export interface FontTokens {
  sans: string;
  display: string;
}

export interface DesignTokens {
  colors: ColorTokens;
  radius: RadiusTokens;
  fonts: FontTokens;
}

export const defaultTokens: DesignTokens = {
  colors: {
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.145 0 0)',
    primary: 'oklch(0.205 0 0)',
    primaryForeground: 'oklch(0.985 0 0)',
    muted: 'oklch(0.97 0 0)',
    mutedForeground: 'oklch(0.556 0 0)',
    border: 'oklch(0.922 0 0)',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
  fonts: {
    sans: 'var(--font-sans)',
    display: 'var(--font-display)',
  },
};
