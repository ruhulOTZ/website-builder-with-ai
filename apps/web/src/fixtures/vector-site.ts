// Vector Systems — B2B IT consulting (cloud, DevOps, platform engineering).
// Cool premium: deep navy, near-black foreground, restrained steel-blue accent.
// Instrument Serif headlines with Geist body — sage / sophisticated.
// Imagery direction: minimal_no_imagery — gradient_mesh hero, no person photos.

import { SiteSchema, type Site } from '@repo/shared-types';

const rawSite: Site = {
  schemaVersion: 1,
  id: 'site_vector_systems',
  designBriefId: 'brief_vector_systems',

  metadata: {
    siteName: 'Vector Systems',
    siteDescription:
      'Enterprise cloud, DevOps, and platform engineering consulting for mid-market technology companies.',
    locale: 'en',
  },

  theme: {
    colors: {
      primary: 'oklch(0.22 0.05 260)',
      secondary: 'oklch(0.48 0.04 260)',
      accent: 'oklch(0.58 0.16 250)',
      background: 'oklch(0.985 0.004 260)',
      surface: 'oklch(1 0 0)',
      foreground: 'oklch(0.18 0.04 260)',
      mutedForeground: 'oklch(0.46 0.02 260)',
      border: 'oklch(0.9 0.008 260)',
      success: 'oklch(0.65 0.13 160)',
      warning: 'oklch(0.78 0.13 80)',
      danger: 'oklch(0.58 0.2 25)',
    },
    typography: {
      pairingId: 'instrument_serif_geist',
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
      { label: 'Practice areas', href: '#practice', external: false },
      { label: 'Case studies', href: '#cases', external: false },
      { label: 'Insights', href: '#insights', external: false },
      { label: 'Firm', href: '#firm', external: false },
    ],
  },

  pages: [
    {
      id: 'page_home',
      slug: '',
      title: 'Home',
      seo: {
        metaTitle: 'Vector Systems — Cloud, DevOps, and platform engineering',
        metaDescription:
          'Vector Systems advises mid-market technology companies on cloud architecture, DevOps, and platform engineering. Twelve years, two-hundred-plus engagements.',
        noIndex: false,
      },
      sections: [
        {
          id: 'sec_vector_header',
          type: 'header',
          variant: 'logo_left_links_right',
          props: {
            logo: { text: 'Vector Systems' },
            links: [
              { label: 'Practice areas', href: '#practice', external: false },
              { label: 'Case studies', href: '#cases', external: false },
              { label: 'Insights', href: '#insights', external: false },
              { label: 'Firm', href: '#firm', external: false },
            ],
            cta: {
              label: 'Request a consultation',
              href: '#consult',
              style: 'primary',
              external: false,
            },
            sticky: true,
          },
        },
        {
          id: 'sec_vector_hero',
          type: 'hero',
          variant: 'gradient_mesh',
          props: {
            eyebrow: 'Cloud · DevOps · Platform engineering',
            headline: 'Engineering operations that scale with the business.',
            subheadline:
              'Vector Systems partners with mid-market technology companies on the work between architecture and production: migrations, platform foundations, observability, and the operational discipline that keeps it running.',
            primaryCta: {
              label: 'Request a consultation',
              href: '#consult',
              style: 'primary',
              external: false,
            },
            secondaryCta: {
              label: 'Read recent work',
              href: '#cases',
              style: 'link',
              external: false,
            },
          },
        },
        {
          id: 'sec_vector_practice',
          type: 'feature_grid',
          variant: '4_col_minimal',
          props: {
            eyebrow: 'Practice areas',
            headline: 'Eight disciplines, one operating model.',
            subheadline:
              'We do not specialise in tools. We specialise in the operating model — the standards, ceremonies, and feedback loops that keep platforms healthy as headcount doubles.',
            items: [
              {
                icon: { set: 'lucide', name: 'CloudCog' },
                title: 'Cloud migration',
                body: 'Lift, replatform, or rearchitect — chosen on evidence, not preference.',
              },
              {
                icon: { set: 'lucide', name: 'Layers' },
                title: 'Platform engineering',
                body: 'Internal developer platforms that earn adoption without policy.',
              },
              {
                icon: { set: 'lucide', name: 'LineChart' },
                title: 'Observability',
                body: 'Service-level objectives, error budgets, alerting that respects sleep.',
              },
              {
                icon: { set: 'lucide', name: 'Workflow' },
                title: 'DevOps & CI/CD',
                body: 'Trunk-based delivery, signed releases, recoverable rollbacks.',
              },
              {
                icon: { set: 'lucide', name: 'ShieldCheck' },
                title: 'Security automation',
                body: 'Continuous controls, drift detection, audit-ready evidence.',
              },
              {
                icon: { set: 'lucide', name: 'BadgeDollarSign' },
                title: 'Cost & FinOps',
                body: 'Unit economics on the workloads that matter — not month-end surprises.',
              },
              {
                icon: { set: 'lucide', name: 'GraduationCap' },
                title: 'Team capability',
                body: 'Embedded mentorship and handover that outlasts the engagement.',
              },
              {
                icon: { set: 'lucide', name: 'FileCheck' },
                title: 'Compliance frameworks',
                body: 'SOC 2 Type II, HIPAA, ISO 27001 — implemented, not just attested.',
              },
            ],
          },
        },
        {
          id: 'sec_vector_principles',
          type: 'hero',
          variant: 'minimal_typographic',
          props: {
            eyebrow: 'How we work',
            headline: 'Three principles guide every engagement.',
            subheadline:
              'First, evidence before opinion — we measure the system before we change it. Second, operating model before tooling — we change the meetings, the ceremonies, and the standards before we change the stack. Third, handover from day one — your team owns the work; we make the work hand-over-able.',
            primaryCta: {
              label: 'See recent engagements',
              href: '#cases',
              style: 'primary',
              external: false,
            },
            secondaryCta: {
              label: 'The Vector method',
              href: '#method',
              style: 'link',
              external: false,
            },
          },
        },
        {
          id: 'sec_vector_footer',
          type: 'footer',
          variant: 'large_with_sitemap',
          props: {
            logo: { text: 'Vector Systems' },
            tagline:
              'Independent consulting firm. Founded 2014. Offices in London, Amsterdam, and Toronto.',
            columns: [
              {
                title: 'Practice areas',
                links: [
                  { label: 'Cloud migration', href: '#cloud', external: false },
                  { label: 'Platform engineering', href: '#platform', external: false },
                  { label: 'Observability', href: '#observability', external: false },
                  { label: 'DevOps & CI/CD', href: '#devops', external: false },
                  { label: 'Security automation', href: '#security', external: false },
                ],
              },
              {
                title: 'Insights',
                links: [
                  { label: 'Whitepapers', href: '#whitepapers', external: false },
                  { label: 'Case studies', href: '#cases', external: false },
                  { label: 'Quarterly reports', href: '#reports', external: false },
                ],
              },
              {
                title: 'Firm',
                links: [
                  { label: 'About', href: '#about', external: false },
                  { label: 'Partners & directors', href: '#leadership', external: false },
                  { label: 'Careers', href: '#careers', external: false },
                  { label: 'Press', href: '#press', external: false },
                ],
              },
              {
                title: 'Contact',
                links: [
                  { label: 'Request a consultation', href: '#consult', external: false },
                  { label: 'Speaker enquiries', href: '#speak', external: false },
                  { label: 'Offices', href: '#offices', external: false },
                ],
              },
            ],
            socials: {
              linkedin: 'https://linkedin.com/company/vector-systems',
              github: 'https://github.com/vector-systems',
            },
            newsletter: {
              headline: 'The Vector quarterly.',
              placeholder: 'firstname.lastname@company.com',
              cta: 'Subscribe',
            },
            legal: {
              copyright:
                '© 2026 Vector Systems Consulting LLP. Registered in England and Wales (OC418227).',
              links: [
                { label: 'Privacy', href: '#privacy', external: false },
                { label: 'Terms of engagement', href: '#terms', external: false },
                { label: 'Modern Slavery Statement', href: '#slavery', external: false },
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
    promptVersion: 'fixture-step-7-vector',
  },
};

export const vectorSite: Site = SiteSchema.parse(rawSite);
