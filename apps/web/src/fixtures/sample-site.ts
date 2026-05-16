// Hand-authored sample site used by /render. Conforms to SiteSchema.
// SiteSchema.parse() runs at module load — if the literal below drifts from
// the schema, the import fails immediately with a clear Zod error.

import { SiteSchema, type Site } from '@repo/shared-types';

const rawSite: Site = {
  schemaVersion: 1,
  id: 'site_sample_cadence',
  designBriefId: 'brief_sample_cadence',

  metadata: {
    siteName: 'Cadence',
    siteDescription: 'Release management for engineering teams that ship every day.',
    locale: 'en',
  },

  theme: {
    colors: {
      primary: 'oklch(0.38 0.13 260)',
      secondary: 'oklch(0.55 0.05 260)',
      accent: 'oklch(0.65 0.18 240)',
      background: 'oklch(0.985 0.005 250)',
      surface: 'oklch(1 0 0)',
      foreground: 'oklch(0.18 0.05 260)',
      mutedForeground: 'oklch(0.48 0.03 260)',
      border: 'oklch(0.9 0.015 260)',
      success: 'oklch(0.7 0.18 145)',
      warning: 'oklch(0.78 0.15 75)',
      danger: 'oklch(0.6 0.22 25)',
    },
    typography: {
      pairingId: 'space_grotesk_dm_sans',
      // Resolved at render time by apps/web's font loader before SiteRenderer
      // mounts; the placeholders are valid CSS family strings so the fixture
      // remains schema-valid in isolation (e.g. unit tests).
      headingFamily: 'system-ui, sans-serif',
      bodyFamily: 'system-ui, sans-serif',
      scale: 'balanced',
    },
    radius: 'subtle',
    shadow: 'subtle',
    density: 'balanced',
    motion: 'smooth_premium',
  },

  navigation: {
    primary: [
      { label: 'Product', href: '#product', external: false },
      { label: 'Customers', href: '#customers', external: false },
      { label: 'Pricing', href: '#pricing', external: false },
      { label: 'Docs', href: '#docs', external: false },
    ],
  },

  pages: [
    {
      id: 'page_home',
      slug: '',
      title: 'Home',
      seo: {
        metaTitle: 'Cadence — Release management for engineering teams',
        metaDescription:
          'Plan, ship, and verify releases without losing the thread. Cadence is the release management system for teams that deploy every day.',
        noIndex: false,
      },
      sections: [
        {
          id: 'sec_home_header',
          type: 'header',
          variant: 'logo_left_links_right',
          props: {
            logo: { text: 'Cadence' },
            links: [
              { label: 'Product', href: '#product', external: false },
              { label: 'Customers', href: '#customers', external: false },
              { label: 'Pricing', href: '#pricing', external: false },
              { label: 'Docs', href: '#docs', external: false },
            ],
            cta: { label: 'Start free', href: '#start', style: 'primary', external: false },
            sticky: true,
          },
        },
        {
          id: 'sec_home_hero',
          type: 'hero',
          variant: 'gradient_mesh',
          props: {
            eyebrow: 'Release management',
            headline: 'Ship every day without losing the thread.',
            subheadline:
              'Cadence connects your release plan, your deploys, and your verification in one timeline. Built for teams that move fast and want the receipts.',
            primaryCta: {
              label: 'Start free trial',
              href: '#trial',
              style: 'primary',
              external: false,
            },
            secondaryCta: {
              label: 'Read the docs',
              href: '#docs',
              style: 'link',
              external: false,
            },
          },
        },
        {
          id: 'sec_home_features',
          type: 'feature_grid',
          variant: '3_col_icon_top',
          props: {
            eyebrow: 'How Cadence works',
            headline: 'Three primitives, fewer dashboards.',
            subheadline:
              'Replace your spreadsheet, your changelog, and your post-mortem template with a single timeline that everyone in the company can read.',
            items: [
              {
                icon: { set: 'lucide', name: 'GitBranch' },
                title: 'Release plans',
                body: 'Group commits, flags, and migrations into a release. Approve once, ship in waves.',
              },
              {
                icon: { set: 'lucide', name: 'Rocket' },
                title: 'Deploy timeline',
                body: 'Every environment, every region, every cohort — visible in one chronological view.',
              },
              {
                icon: { set: 'lucide', name: 'ShieldCheck' },
                title: 'Verification',
                body: 'Tie metrics, alerts, and user reports to the release that caused them. No more guessing.',
              },
            ],
          },
        },
        {
          id: 'sec_home_footer',
          type: 'footer',
          variant: 'columns_with_newsletter',
          props: {
            logo: { text: 'Cadence' },
            tagline:
              'Release management for teams that ship every day. Built in Bristol, used worldwide.',
            columns: [
              {
                title: 'Product',
                links: [
                  { label: 'Release plans', href: '#plans', external: false },
                  { label: 'Deploy timeline', href: '#timeline', external: false },
                  { label: 'Verification', href: '#verify', external: false },
                  { label: 'Changelog', href: '#changelog', external: false },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '#about', external: false },
                  { label: 'Customers', href: '#customers', external: false },
                  { label: 'Careers', href: '#careers', external: false },
                ],
              },
              {
                title: 'Resources',
                links: [
                  { label: 'Docs', href: '#docs', external: false },
                  { label: 'API', href: '#api', external: false },
                  { label: 'Status', href: '#status', external: false },
                ],
              },
            ],
            socials: {
              twitter: 'https://twitter.com/cadence',
              linkedin: 'https://linkedin.com/company/cadence',
              github: 'https://github.com/cadence',
            },
            newsletter: {
              headline: 'Release notes, monthly.',
              placeholder: 'you@company.com',
              cta: 'Subscribe',
            },
            legal: {
              copyright: '© 2026 Cadence Software Ltd.',
              links: [
                { label: 'Privacy', href: '#privacy', external: false },
                { label: 'Terms', href: '#terms', external: false },
                { label: 'Security', href: '#security', external: false },
              ],
            },
          },
        },
      ],
    },
  ],

  generation: {
    generatedAt: '2026-05-15T00:00:00.000Z',
    model: 'fixture',
    promptVersion: 'fixture-step-6',
  },
};

export const sampleSite: Site = SiteSchema.parse(rawSite);
