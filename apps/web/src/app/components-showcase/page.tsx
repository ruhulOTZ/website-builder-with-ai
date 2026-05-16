import { FeatureGrid, Footer, Header, Hero } from '@repo/components-library';
import { ThemeProvider } from '@repo/design-system';
import { getFontsForPairing } from '@repo/design-system/fonts';

import { FEATURE_GRIDS, FOOTERS, HEADERS, HEROES, SHOWCASE_THEME } from './fixtures';

function VariantFrame({
  kind,
  variant,
  children,
}: {
  kind: string;
  variant: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-muted-foreground/5 border-border border-b">
      <div className="border-border bg-background mx-auto flex max-w-7xl items-center justify-between border-x px-4 py-3">
        <p className="font-body text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
          {kind}
        </p>
        <p className="font-body text-foreground text-xs font-medium">{variant}</p>
      </div>
      <div className="border-border bg-background mx-auto max-w-7xl border-x">{children}</div>
    </section>
  );
}

export default function ComponentsShowcasePage() {
  const fonts = getFontsForPairing(SHOWCASE_THEME.typography.pairingId);
  const tokens: typeof SHOWCASE_THEME = {
    ...SHOWCASE_THEME,
    typography: {
      ...SHOWCASE_THEME.typography,
      headingFamily: fonts.cssFamilies.heading,
      bodyFamily: fonts.cssFamilies.body,
    },
  };

  return (
    <div className={fonts.variables}>
      <ThemeProvider tokens={tokens}>
        <main>
          <div className="bg-foreground text-[color:var(--color-background)]">
            <div className="mx-auto max-w-7xl px-6 py-10">
              <p className="font-body mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] opacity-70">
                Internal · Components showcase
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
                Section variants, batch 1
              </h1>
              <p className="font-body mt-3 max-w-2xl text-sm opacity-80 md:text-base">
                Every variant of Header, Hero, FeatureGrid, and Footer rendered with the same theme
                tokens. Use this to spot visual drift and variant collisions.
              </p>
            </div>
          </div>

          <div>
            {HEADERS.map((s) => (
              <VariantFrame key={s.id} kind="Header" variant={s.variant}>
                {/* Headers honor sticky internally; in the showcase the frame is the
                    scrolling context, not the page, so sticky is visually inert here. */}
                <Header {...s} />
              </VariantFrame>
            ))}

            {HEROES.map((s) => (
              <VariantFrame key={s.id} kind="Hero" variant={s.variant}>
                <Hero {...s} />
              </VariantFrame>
            ))}

            {FEATURE_GRIDS.map((s) => (
              <VariantFrame key={s.id} kind="FeatureGrid" variant={s.variant}>
                <FeatureGrid {...s} />
              </VariantFrame>
            ))}

            {FOOTERS.map((s) => (
              <VariantFrame key={s.id} kind="Footer" variant={s.variant}>
                <Footer {...s} />
              </VariantFrame>
            ))}
          </div>
        </main>
      </ThemeProvider>
    </div>
  );
}
