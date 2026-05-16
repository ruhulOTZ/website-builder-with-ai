// inject-fixture-site.ts — one-off script that writes the Forge Athletics
// fixture directly into GeneratedSiteRecord so the render route at
// /render/[siteId] can be tested without any AI call.
//
// Run via:
//   ts-node --transpile-only --project tsconfig.build.json scripts/inject-fixture-site.ts
//
// Prints the record ID. Navigate to http://localhost:3000/render/<id>.

import { PrismaClient } from '@prisma/client';
import { SiteSchema } from '@repo/shared-types';

// ---------------------------------------------------------------------------
// Inline Forge Athletics fixture (same shape as apps/web/src/fixtures/forge-site.ts
// but without next/font — this script runs in a plain Node context).
// ---------------------------------------------------------------------------
const RAW_FORGE_SITE = {
  schemaVersion: 1,
  id: 'site_forge_athletics_fixture',
  designBriefId: 'brief_forge_athletics_fixture',
  metadata: {
    siteName: 'Forge Athletics',
    siteDescription:
      'A private training floor for serious lifters. Powerlifting coaching, programmed training, no nonsense.',
    locale: 'en',
  },
  theme: {
    colors: {
      primary: 'oklch(0.62 0.24 27)',
      secondary: 'oklch(0.78 0.16 60)',
      accent: 'oklch(0.85 0.18 90)',
      background: 'oklch(0.13 0.01 250)',
      surface: 'oklch(0.18 0.012 250)',
      foreground: 'oklch(0.96 0.005 250)',
      mutedForeground: 'oklch(0.68 0.01 250)',
      border: 'oklch(0.26 0.012 250)',
      success: 'oklch(0.7 0.18 145)',
      warning: 'oklch(0.8 0.17 75)',
      danger: 'oklch(0.62 0.24 27)',
    },
    typography: {
      pairingId: 'anton_open_sans',
      headingFamily: 'system-ui, sans-serif',
      bodyFamily: 'system-ui, sans-serif',
      scale: 'balanced',
    },
    radius: 'sharp',
    shadow: 'dramatic',
    density: 'tight',
    motion: 'snappy_aggressive',
  },
  navigation: {
    primary: [
      { label: 'Programs', href: '#programs', external: false },
      { label: 'Coaches', href: '#coaches', external: false },
      { label: 'Membership', href: '#membership', external: false },
    ],
  },
  pages: [
    {
      id: 'page_home',
      slug: '',
      title: 'Home',
      seo: {
        metaTitle: 'Forge Athletics — Powerlifting & Strength',
        metaDescription:
          'A private training floor for serious lifters. Coached programs, calibrated platforms.',
        noIndex: false,
      },
      sections: [
        {
          id: 'sec_forge_header',
          type: 'header',
          variant: 'logo_left_links_right',
          props: {
            logo: { text: 'FORGE' },
            links: [
              { label: 'Programs', href: '#programs', external: false },
              { label: 'Coaches', href: '#coaches', external: false },
              { label: 'Membership', href: '#membership', external: false },
            ],
            sticky: true,
          },
        },
        {
          id: 'sec_forge_hero',
          type: 'hero',
          variant: 'centered_text_over_image',
          props: {
            eyebrow: 'Powerlifting · Strongman · Strength',
            headline: 'The bar does not lie.',
            subheadline:
              'A private platform floor for serious lifters. Real coaching, real loads, real numbers.',
            primaryCta: {
              label: 'Book a trial session',
              href: '#trial',
              style: 'primary',
              external: false,
            },
            secondaryCta: {
              label: 'See programs',
              href: '#programs',
              style: 'secondary',
              external: false,
            },
            media: {
              kind: 'image',
              image: {
                url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=2000&q=80',
                alt: 'Lifter setting up a heavy deadlift on a calibrated platform',
              },
            },
          },
        },
        {
          id: 'sec_forge_programs',
          type: 'feature_grid',
          variant: 'alternating_rows',
          props: {
            eyebrow: 'Programs',
            headline: 'Train with intent. Not enthusiasm.',
            items: [
              {
                icon: { set: 'lucide', name: 'Dumbbell' },
                title: 'Powerlifting — competition prep',
                body: 'Twelve-week meet prep with weekly attempt selection, opener calls, and a dialled peak.',
                image: {
                  url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
                  alt: 'Athlete locking out a heavy back squat',
                },
              },
              {
                icon: { set: 'lucide', name: 'Activity' },
                title: 'Strength foundations',
                body: 'For the lifter who is past beginner gains and needs a real plan.',
                image: {
                  url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80',
                  alt: 'Heavy bumper plates on the platform',
                },
              },
            ],
          },
        },
        {
          id: 'sec_forge_footer',
          type: 'footer',
          variant: 'minimal_centered',
          props: {
            logo: { text: 'FORGE ATHLETICS' },
            tagline: 'A private platform floor for serious lifters. Bristol, since 2018.',
            legal: {
              copyright: '© 2026 Forge Athletics Ltd.',
              links: [
                { label: 'Privacy', href: '#privacy', external: false },
                { label: 'Terms', href: '#terms', external: false },
              ],
            },
          },
        },
      ],
    },
  ],
  generation: {
    generatedAt: '2026-05-16T00:00:00.000Z',
    model: 'fixture',
    promptVersion: 'fixture-inject',
  },
};

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    // Validate against canonical schema first — mirrors what the render route does.
    const validated = SiteSchema.parse(RAW_FORGE_SITE);

    const record = await prisma.generatedSiteRecord.create({
      data: {
        siteJson: validated,
        modelUsed: 'fixture',
        promptVersion: 'fixture-inject',
        designBriefId: 'brief_forge_athletics_fixture',
        userId: null,
      },
      select: { id: true, createdAt: true },
    });

    console.log('\nInjected Forge Athletics fixture into GeneratedSiteRecord.');
    console.log(`  id:         ${record.id}`);
    console.log(`  createdAt:  ${record.createdAt.toISOString()}`);
    console.log(`\nRender URL:  http://localhost:3000/render/${record.id}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('inject-fixture-site: error', err);
  process.exit(1);
});
