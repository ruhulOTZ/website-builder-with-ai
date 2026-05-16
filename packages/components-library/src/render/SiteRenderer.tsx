import { ThemeProvider } from '@repo/design-system';
import { type Page, type Site } from '@repo/shared-types';

import { PageRenderer } from './PageRenderer';

/**
 * Top-level renderer. Wraps the page in ThemeProvider using the site's theme
 * tokens. Font loading is the consumer's responsibility — `next/font` must
 * be called at module scope in a Next.js context, so apps/web instantiates
 * fonts and provides the CSS variable className on a parent element. The
 * SiteRenderer just relies on those variables being present.
 */
export function SiteRenderer({ site, page }: { site: Site; page: Page }) {
  return (
    <ThemeProvider tokens={site.theme}>
      <PageRenderer page={page} />
    </ThemeProvider>
  );
}
