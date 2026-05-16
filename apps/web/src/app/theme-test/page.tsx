import { ThemeProvider } from '@repo/design-system';
import { getFontsForPairing } from '@repo/design-system/fonts';
import { type Site } from '@repo/shared-types';

// Hand-authored ThemeTokens to exercise the provider end-to-end.
// In production this object is the validated `theme` field of a SiteSchema.
const PAIRING = 'bebas_inter' as const;

function buildTokens(): Site['theme'] {
  const fonts = getFontsForPairing(PAIRING);
  return {
    colors: {
      primary: 'oklch(0.55 0.22 25)',
      secondary: 'oklch(0.28 0.04 250)',
      accent: 'oklch(0.78 0.18 80)',
      background: 'oklch(0.98 0.005 250)',
      surface: 'oklch(1 0 0)',
      foreground: 'oklch(0.15 0.02 250)',
      mutedForeground: 'oklch(0.48 0.02 250)',
      border: 'oklch(0.88 0.01 250)',
      success: 'oklch(0.7 0.18 145)',
      warning: 'oklch(0.8 0.15 75)',
      danger: 'oklch(0.6 0.22 25)',
    },
    typography: {
      pairingId: PAIRING,
      headingFamily: fonts.cssFamilies.heading,
      bodyFamily: fonts.cssFamilies.body,
      scale: 'balanced',
    },
    radius: 'subtle',
    shadow: 'soft_diffuse',
    density: 'balanced',
    motion: 'snappy_aggressive',
  };
}

export default function ThemeTestPage() {
  const tokens = buildTokens();
  const fonts = getFontsForPairing(PAIRING);

  return (
    <div className={fonts.variables}>
      <ThemeProvider tokens={tokens}>
        <main className="mx-auto max-w-3xl px-8 py-16">
          <p className="font-body text-muted-foreground mb-2 text-sm uppercase tracking-widest">
            Theme test — pairing: {PAIRING}
          </p>
          <h1 className="font-heading text-foreground mb-4 text-6xl leading-none">
            The quick brown fox
          </h1>
          <p className="font-body text-foreground mb-8 text-lg leading-relaxed">
            This page renders <code>ThemeProvider</code> with a hand-authored set of theme tokens.
            Headings use the pairing&apos;s display family, body uses the pairing&apos;s text
            family, and every color resolves through the design-system CSS variables.
          </p>

          <div className="mb-8 flex gap-3">
            <button
              type="button"
              className="bg-primary text-background font-body rounded-[var(--radius)] px-6 py-3 shadow-[var(--shadow)] transition-opacity hover:opacity-90"
            >
              Primary action
            </button>
            <button
              type="button"
              className="border-border text-foreground font-body rounded-[var(--radius)] border px-6 py-3 transition-colors hover:bg-[var(--color-surface)]"
            >
              Secondary
            </button>
          </div>

          <div
            className="border-border rounded-[var(--radius)] border bg-[var(--color-surface)] p-6 shadow-[var(--shadow)]"
            data-testid="surface-card"
          >
            <h2 className="font-heading text-foreground mb-2 text-2xl">Surface card</h2>
            <p className="font-body text-muted-foreground">
              Renders with the surface color, the active radius, and the active shadow — all from
              the same <code>ThemeTokens</code> object.
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <dt className="font-body text-muted-foreground">radius</dt>
            <dd className="font-body text-foreground">{tokens.radius}</dd>
            <dt className="font-body text-muted-foreground">shadow</dt>
            <dd className="font-body text-foreground">{tokens.shadow}</dd>
            <dt className="font-body text-muted-foreground">density</dt>
            <dd className="font-body text-foreground">{tokens.density}</dd>
            <dt className="font-body text-muted-foreground">pairingId</dt>
            <dd className="font-body text-foreground">{tokens.typography.pairingId}</dd>
          </dl>
        </main>
      </ThemeProvider>
    </div>
  );
}
