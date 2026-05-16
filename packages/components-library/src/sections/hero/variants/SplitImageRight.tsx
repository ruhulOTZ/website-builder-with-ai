import { Cta } from '../../../shared/Cta';
import { Image } from '../../../shared/Image';
import { type HeroData } from '../types';

export function SplitImageRight({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  media,
}: HeroData) {
  const image = media?.image;

  return (
    <section
      className="bg-background"
      style={{
        paddingTop: 'calc(5rem * var(--density-scale))',
        paddingBottom: 'calc(5rem * var(--density-scale))',
      }}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          {eyebrow ? (
            <p className="font-body text-primary mb-4 text-xs font-semibold uppercase tracking-[0.24em]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading text-foreground text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
            {headline}
          </h1>
          {subheadline ? (
            <p className="font-body text-muted-foreground mt-6 max-w-xl text-base leading-relaxed md:text-lg">
              {subheadline}
            </p>
          ) : null}
          {(primaryCta ?? secondaryCta) ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {primaryCta ? <Cta cta={primaryCta} size="lg" /> : null}
              {secondaryCta ? <Cta cta={secondaryCta} size="lg" /> : null}
            </div>
          ) : null}
        </div>
        <div className="order-1 lg:order-2">
          {image ? (
            <div className="aspect-[4/5] w-full overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow)]">
              <Image image={image} className="h-full w-full" />
            </div>
          ) : (
            <div className="bg-surface border-border aspect-[4/5] w-full rounded-[var(--radius)] border" />
          )}
        </div>
      </div>
    </section>
  );
}
