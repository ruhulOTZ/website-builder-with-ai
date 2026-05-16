import { Cta } from '../../../shared/Cta';
import { type HeroData } from '../types';

export function MinimalTypographic({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
}: HeroData) {
  return (
    <section
      className="bg-background"
      style={{
        paddingTop: 'calc(9rem * var(--density-scale))',
        paddingBottom: 'calc(9rem * var(--density-scale))',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        {eyebrow ? (
          <p className="font-body text-muted-foreground mb-8 text-xs font-semibold uppercase tracking-[0.32em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-foreground text-balance text-[clamp(2.75rem,9vw,8rem)] font-semibold leading-[0.95] tracking-tight">
          {headline}
        </h1>
        {subheadline ? (
          <p className="font-body text-muted-foreground mt-8 max-w-2xl text-balance text-lg leading-relaxed md:text-xl">
            {subheadline}
          </p>
        ) : null}
        {(primaryCta ?? secondaryCta) ? (
          <div className="mt-12 flex flex-wrap items-center gap-6">
            {primaryCta ? <Cta cta={primaryCta} size="lg" /> : null}
            {secondaryCta ? <Cta cta={{ ...secondaryCta, style: 'link' }} size="lg" /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
