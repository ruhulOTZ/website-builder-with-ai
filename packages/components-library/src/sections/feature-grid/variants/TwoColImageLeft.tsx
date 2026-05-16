import { Icon } from '../../../shared/Icon';
import { Image } from '../../../shared/Image';
import { SectionIntro } from '../SectionIntro';
import { type FeatureGridData } from '../types';

export function TwoColImageLeft({ eyebrow, headline, subheadline, items }: FeatureGridData) {
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
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {items.map((item, i) => (
            <li
              key={`${item.title}-${String(i)}`}
              className="bg-surface border-border overflow-hidden rounded-[var(--radius)] border"
            >
              <div className="bg-background aspect-[16/10] w-full">
                {item.image ? (
                  <Image image={item.image} className="h-full w-full" />
                ) : item.icon ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon icon={item.icon} className="text-primary size-12" />
                  </div>
                ) : null}
              </div>
              <div className="p-6">
                <h3 className="font-heading text-foreground mb-2 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  {item.body}
                </p>
                {item.link ? (
                  <a
                    href={item.link.href}
                    target={item.link.external ? '_blank' : undefined}
                    rel={item.link.external ? 'noopener noreferrer' : undefined}
                    className="font-body text-primary mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
                  >
                    {item.link.label} →
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
