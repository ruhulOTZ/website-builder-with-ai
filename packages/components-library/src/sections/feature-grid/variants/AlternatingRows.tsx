import { Icon } from '../../../shared/Icon';
import { Image } from '../../../shared/Image';
import { SectionIntro } from '../SectionIntro';
import { type FeatureGridData } from '../types';

export function AlternatingRows({ eyebrow, headline, subheadline, items }: FeatureGridData) {
  return (
    <section
      className="bg-background"
      style={{
        paddingTop: 'calc(5rem * var(--density-scale))',
        paddingBottom: 'calc(5rem * var(--density-scale))',
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionIntro eyebrow={eyebrow} headline={headline} subheadline={subheadline} />
        <div className="flex flex-col gap-20 lg:gap-28">
          {items.map((item, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={`${item.title}-${String(i)}`}
                className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <div className={reversed ? 'lg:order-2' : 'lg:order-1'}>
                  <div className="bg-surface border-border aspect-[4/3] overflow-hidden rounded-[var(--radius)] border">
                    {item.image ? (
                      <Image image={item.image} className="h-full w-full" />
                    ) : item.icon ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon icon={item.icon} className="text-primary size-16" />
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className={reversed ? 'lg:order-1' : 'lg:order-2'}>
                  {item.icon ? (
                    <Icon icon={item.icon} className="text-primary mb-4 size-7" />
                  ) : null}
                  <h3 className="font-heading text-foreground mb-4 text-2xl font-semibold tracking-tight md:text-3xl">
                    {item.title}
                  </h3>
                  <p className="font-body text-muted-foreground text-base leading-relaxed">
                    {item.body}
                  </p>
                  {item.link ? (
                    <a
                      href={item.link.href}
                      target={item.link.external ? '_blank' : undefined}
                      rel={item.link.external ? 'noopener noreferrer' : undefined}
                      className="font-body text-primary mt-5 inline-block text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {item.link.label} →
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
