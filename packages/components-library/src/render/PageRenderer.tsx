import { type Page } from '@repo/shared-types';

import { SectionRenderer } from './SectionRenderer';

export function PageRenderer({ page }: { page: Page }) {
  // TODO: respect `page.themeOverride` when needed. v1 of the renderer
  // ignores it and uses site-level theme only.
  return (
    <main>
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </main>
  );
}
