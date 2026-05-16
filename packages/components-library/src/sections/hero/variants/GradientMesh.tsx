import { Cta } from '../../../shared/Cta';
import { type HeroData } from '../types';

export function GradientMesh({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
}: HeroData) {
  return (
    <section className="bg-background relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(60% 50% at 18% 22%, color-mix(in oklch, var(--color-primary) 70%, transparent), transparent 70%),
            radial-gradient(55% 50% at 82% 78%, color-mix(in oklch, var(--color-accent) 70%, transparent), transparent 70%),
            radial-gradient(40% 40% at 50% 50%, color-mix(in oklch, var(--color-secondary) 35%, transparent), transparent 70%),
            var(--color-background)
          `,
        }}
      />
      <div
        className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center"
        style={{
          paddingTop: 'calc(8rem * var(--density-scale))',
          paddingBottom: 'calc(8rem * var(--density-scale))',
        }}
      >
        {eyebrow ? (
          <p className="font-body text-primary mb-5 text-xs font-semibold uppercase tracking-[0.32em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-foreground text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          {headline}
        </h1>
        {subheadline ? (
          <p className="font-body text-muted-foreground mt-6 max-w-2xl text-base leading-relaxed md:text-lg">
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
