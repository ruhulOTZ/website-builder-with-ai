import { type Section } from '@repo/shared-types';
import { type ComponentType } from 'react';

import { SECTION_REGISTRY } from './section-registry';
import { UnknownSection } from './UnknownSection';

/**
 * Wrapper choice: SectionRenderer renders a `<div>` (not a `<section>`) so
 * the inner components keep their own semantic tags — Header keeps `<header>`,
 * Footer keeps `<footer>`, others render `<section>` internally. Wrapping in
 * `<section>` here would double-wrap with no semantic gain. The `<div>` exists
 * purely to host the anchor id and data attributes that aid debugging /
 * direct linking. Tradeoff: in the DOM you'll see an extra div per section;
 * this is the less disruptive of the two options the spec offers.
 */
export function SectionRenderer({ section }: { section: Section }) {
  const Component = SECTION_REGISTRY[section.type];

  if (!Component) {
    return <UnknownSection sectionType={section.type} sectionId={section.id} />;
  }

  // The registry is correlated by section.type, but TS cannot follow an
  // indexed-access lookup through a discriminated union: from TS's view,
  // Component is the union of all SectionComponent<T>, and section is still
  // a Section. The cast is sound — Component[section.type] is by construction
  // the component for that exact section type.
  const TypedComponent = Component as ComponentType<typeof section>;

  return (
    <div id={section.id} data-section-type={section.type} data-variant={section.variant}>
      <TypedComponent {...section} />
    </div>
  );
}
