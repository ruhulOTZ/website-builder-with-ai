import { Icon } from '../../../shared/Icon';
import { SectionIntro } from '../SectionIntro';
import { type FeatureGridData } from '../types';

export function FourColMinimal({ eyebrow, headline, subheadline, items }: FeatureGridData) {
  return (
    <section
      className="bg-background"
      style={{
        paddingTop: 'calc(5rem * var(--density-scale))',
        paddingBottom: 'calc(5rem * var(--density-scale))',
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-6">
        <SectionIntro eyebrow={eyebrow} headline={headline} subheadline={subheadline} />
        <ul className="border-border grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border bg-[color:var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <li key={`${item.title}-${String(i)}`} className="bg-background p-6">
              {item.icon ? <Icon icon={item.icon} className="text-primary mb-4 size-7" /> : null}
              <h3 className="font-heading text-foreground mb-2 text-base font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
