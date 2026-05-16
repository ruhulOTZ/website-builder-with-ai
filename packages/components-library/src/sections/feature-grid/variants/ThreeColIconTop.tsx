import { Icon } from '../../../shared/Icon';
import { SectionIntro } from '../SectionIntro';
import { type FeatureGridData } from '../types';

export function ThreeColIconTop({ eyebrow, headline, subheadline, items }: FeatureGridData) {
  return (
    <section
      className="bg-background"
      style={{
        paddingTop: 'calc(5rem * var(--density-scale))',
        paddingBottom: 'calc(5rem * var(--density-scale))',
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-6">
        <SectionIntro
          eyebrow={eyebrow}
          headline={headline}
          subheadline={subheadline}
          align="center"
        />
        <ul className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li
              key={`${item.title}-${String(i)}`}
              className="flex flex-col items-center text-center"
            >
              {item.icon ? (
                <div className="bg-primary/10 text-primary mb-5 inline-flex size-12 items-center justify-center rounded-[var(--radius)]">
                  <Icon icon={item.icon} className="size-6" />
                </div>
              ) : null}
              <h3 className="font-heading text-foreground mb-3 text-xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="font-body text-muted-foreground text-base leading-relaxed">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
