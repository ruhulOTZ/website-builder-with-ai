import { Cta } from '../../../shared/Cta';
import { type HeroData } from '../types';

export function VideoBackground({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  media,
}: HeroData) {
  const videoUrl = media?.videoUrl;
  const poster = media?.image?.url;

  return (
    <section className="bg-foreground relative isolate overflow-hidden">
      {videoUrl ? (
        <video
          src={videoUrl}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 -z-10 bg-[color:var(--color-foreground)]"
          aria-hidden="true"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[color:var(--color-foreground)] opacity-50"
      />

      <div
        className="relative mx-auto flex w-full max-w-5xl flex-col items-start px-6 text-[color:var(--color-background)]"
        style={{
          paddingTop: 'calc(8rem * var(--density-scale))',
          paddingBottom: 'calc(8rem * var(--density-scale))',
          minHeight: 'min(85vh, 800px)',
        }}
      >
        <div className="mt-auto">
          {eyebrow ? (
            <p className="font-body mb-5 text-xs font-semibold uppercase tracking-[0.32em] opacity-80">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
            {headline}
          </h1>
          {subheadline ? (
            <p className="font-body mt-6 max-w-2xl text-base leading-relaxed opacity-90 md:text-lg">
              {subheadline}
            </p>
          ) : null}
          {(primaryCta ?? secondaryCta) ? (
            <div className="mt-10 flex flex-wrap items-center gap-3">
              {primaryCta ? <Cta cta={primaryCta} size="lg" /> : null}
              {secondaryCta ? <Cta cta={secondaryCta} size="lg" /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
