import { Cta } from '../../../shared/Cta';
import { Icon } from '../../../shared/Icon';
import { Image } from '../../../shared/Image';
import { type HeroData } from '../types';

export function AsymmetricFloating({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  media,
  floatingBadges,
}: HeroData) {
  const image = media?.image;

  return (
    <section
      className="bg-background relative isolate overflow-hidden"
      style={{
        paddingTop: 'calc(6rem * var(--density-scale))',
        paddingBottom: 'calc(6rem * var(--density-scale))',
      }}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7 lg:pt-16">
            {eyebrow ? (
              <p className="font-body text-primary mb-4 text-xs font-semibold uppercase tracking-[0.28em]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-heading text-foreground text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]">
              {headline}
            </h1>
            {subheadline ? (
              <p className="font-body text-muted-foreground mt-6 max-w-xl text-base leading-relaxed md:text-lg">
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

          <div className="relative lg:col-span-5 lg:-mt-8">
            {/* Image is the positioning context: badges anchor to *its* edges. */}
            <div className="bg-surface relative aspect-[3/4] overflow-visible rounded-[var(--radius)] shadow-[var(--shadow)] lg:translate-x-8">
              <div className="absolute inset-0 overflow-hidden rounded-[var(--radius)]">
                {image ? <Image image={image} className="h-full w-full" /> : null}
              </div>

              {floatingBadges?.length ? (
                <>
                  {floatingBadges.slice(0, 4).map((badge, i) => {
                    const anchor = BADGE_ANCHORS[i % BADGE_ANCHORS.length];
                    return (
                      <div
                        key={`${badge.label}-${String(i)}`}
                        className={`bg-background border-border text-foreground absolute z-10 inline-flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-xs font-medium shadow-[var(--shadow)] ${anchor}`}
                      >
                        {badge.icon ? <Icon icon={badge.icon} className="size-4" /> : null}
                        <span className="font-body whitespace-nowrap">{badge.label}</span>
                      </div>
                    );
                  })}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Each badge anchors to one edge of the image with deliberate half-on/half-off
// overlap. Negative offset = sticks past the edge; positive offset = sits on
// the image. Order: top edge → right edge → bottom edge → left edge.
const BADGE_ANCHORS = [
  '-top-3 left-6 sm:left-10',
  'top-[22%] -right-4',
  '-bottom-3 right-8 sm:right-12',
  'bottom-[28%] -left-4',
] as const;
