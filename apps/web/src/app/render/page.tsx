import { SiteRenderer } from '@repo/components-library';
import { getFontsForPairing } from '@repo/design-system/fonts';
import { type Metadata } from 'next';

import { sampleSite } from '@/fixtures/sample-site';

function getHomePage() {
  const page = sampleSite.pages[0];
  if (!page) {
    // Unreachable in practice: SiteSchema enforces .min(1) on pages.
    throw new Error('sample-site fixture has no pages');
  }
  return page;
}

export function generateMetadata(): Metadata {
  const page = getHomePage();
  return {
    title: page.seo.metaTitle,
    description: page.seo.metaDescription,
    robots: page.seo.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default function RenderPage() {
  const page = getHomePage();
  const fonts = getFontsForPairing(sampleSite.theme.typography.pairingId);

  // Resolve font-family CSS values once here; the fixture's typography
  // placeholders get overwritten with the actual next/font variable references.
  const site = {
    ...sampleSite,
    theme: {
      ...sampleSite.theme,
      typography: {
        ...sampleSite.theme.typography,
        headingFamily: fonts.cssFamilies.heading,
        bodyFamily: fonts.cssFamilies.body,
      },
    },
  };

  return (
    <div className={fonts.variables}>
      <SiteRenderer site={site} page={page} />
    </div>
  );
}
