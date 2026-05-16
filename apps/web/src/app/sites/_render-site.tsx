// Shared render shape for /sites/* routes. Each fixture is loaded by its route
// page, which calls renderSite(fixture). Keeping this co-located (under _name)
// so it isn't treated as a route by Next.js.

import { SiteRenderer } from '@repo/components-library';
import { getFontsForPairing } from '@repo/design-system/fonts';
import { type Page, type Site } from '@repo/shared-types';
import { type Metadata } from 'next';

function homePageOf(site: Site): Page {
  const page = site.pages[0];
  if (!page) {
    throw new Error(`Site "${site.id}" has no pages — SiteSchema.min(1) violated.`);
  }
  return page;
}

export function buildSiteMetadata(site: Site): Metadata {
  const page = homePageOf(site);
  return {
    title: page.seo.metaTitle,
    description: page.seo.metaDescription,
    robots: page.seo.noIndex ? { index: false, follow: false } : undefined,
  };
}

export function RenderSite({ site }: { site: Site }) {
  const page = homePageOf(site);
  const fonts = getFontsForPairing(site.theme.typography.pairingId);

  const themed: Site = {
    ...site,
    theme: {
      ...site.theme,
      typography: {
        ...site.theme.typography,
        headingFamily: fonts.cssFamilies.heading,
        bodyFamily: fonts.cssFamilies.body,
      },
    },
  };

  return (
    <div className={fonts.variables}>
      <SiteRenderer site={themed} page={page} />
    </div>
  );
}
