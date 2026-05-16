import { Cta } from '../../../shared/Cta';
import { Image } from '../../../shared/Image';
import { type HeroData } from '../types';

export function CenteredTextOverImage({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  media,
}: HeroData) {
  const image = media?.image;

  return (
    <section className="bg-background relative isolate overflow-hidden">
      {image ? (
        <div className="absolute inset-0 -z-10">
          <Image image={image} className="h-full w-full" />
          {/* Foreground-tinted scrim — uses theme foreground so light themes
              get a dark wash and dark themes get the opposite. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[color:var(--color-foreground)] opacity-60 mix-blend-multiply"
          />
        </div>
      ) : (
        <div className="bg-foreground absolute inset-0 -z-10 opacity-90" aria-hidden="true" />
      )}

      <div
        className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center text-[color:var(--color-background)]"
        style={{
          paddingTop: 'calc(7rem * var(--density-scale))',
          paddingBottom: 'calc(7rem * var(--density-scale))',
          minHeight: 'min(75vh, 720px)',
        }}
      >
        {eyebrow ? (
          <p className="font-body mb-5 text-xs font-semibold uppercase tracking-[0.28em] opacity-80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          {headline}
        </h1>
        {subheadline ? (
          <p className="font-body mt-6 max-w-2xl text-base leading-relaxed opacity-90 md:text-lg">
            {subheadline}
          </p>
        ) : null}
        {(primaryCta ?? secondaryCta) ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {primaryCta ? <Cta cta={primaryCta} size="lg" /> : null}
            {secondaryCta ? <Cta cta={secondaryCta} size="lg" /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
