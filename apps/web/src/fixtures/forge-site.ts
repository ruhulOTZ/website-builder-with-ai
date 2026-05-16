// Forge Athletics — gritty powerlifting gym.
// Dark, aggressive, no-fluff. Vibrant-energetic palette: near-black surfaces +
// vivid red primary. Anton (condensed display) for headlines, Open Sans for body.

import { SiteSchema, type Site } from '@repo/shared-types';

const rawSite: Site = {
  schemaVersion: 1,
  id: 'site_forge_athletics',
  designBriefId: 'brief_forge_athletics',

  metadata: {
    siteName: 'Forge Athletics',
    siteDescription:
      'A private training floor for serious lifters. Powerlifting coaching, programmed training, no nonsense.',
    locale: 'en',
  },

  theme: {
    colors: {
      // Vibrant red on a near-black canvas — the "neon dark" / vibrant energetic
      // strategy. Foreground is intentionally near-white because the whole site
      // reads as dark-mode-native.
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
      { label: 'Schedule', href: '#schedule', external: false },
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
          'A private training floor for serious lifters. Coached programs, calibrated platforms, open seven days a week.',
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
              { label: 'Schedule', href: '#schedule', external: false },
              { label: 'Membership', href: '#membership', external: false },
            ],
            cta: { label: 'Book a trial', href: '#trial', style: 'primary', external: false },
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
              'A private platform floor for serious lifters. Real coaching, real loads, real numbers. No mirrors, no music you did not ask for, no excuses.',
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
            subheadline:
              'Every program is written, scaled to the lifter, and revised on a four-week cycle. You leave with numbers on the board, not vibes.',
            items: [
              {
                icon: { set: 'lucide', name: 'Dumbbell' },
                title: 'Powerlifting — competition prep',
                body: 'Twelve-week meet prep with weekly attempt selection, opener calls, and a dialled peak. Coached on the platform, every session.',
                image: {
                  url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
                  alt: 'Athlete locking out a heavy back squat',
                },
              },
              {
                icon: { set: 'lucide', name: 'Activity' },
                title: 'Strength foundations',
                body: 'For the lifter who is past the beginner gains and needs a real plan. Three or four sessions a week, programmed and progressed.',
                image: {
                  url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80',
                  alt: 'Heavy bumper plates on the platform',
                },
              },
              {
                icon: { set: 'lucide', name: 'Flame' },
                title: 'Strongman accessory',
                body: 'Yoke, log, farmers, stones. Open to lifters with a foundation in the main lifts. Coached on Saturdays, weather-dependent on the lot.',
                image: {
                  url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1600&q=80',
                  alt: 'Athletes training on the warehouse floor',
                },
              },
            ],
          },
        },
        {
          id: 'sec_forge_join',
          type: 'hero',
          variant: 'split_image_left',
          props: {
            eyebrow: 'Membership',
            headline: 'Train with people who know what they are doing.',
            subheadline:
              'Eighty members. Forty platforms hours a week. Two head coaches, both elite-level competitors. No drop-ins. No tourists. If you want a globo gym, we are not it.',
            primaryCta: {
              label: 'Apply for membership',
              href: '#apply',
              style: 'primary',
              external: false,
            },
            media: {
              kind: 'image',
              image: {
                url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1600&q=80',
                alt: 'Dark gym interior with calibrated barbell platforms',
              },
            },
          },
        },
        {
          id: 'sec_forge_footer',
          type: 'footer',
          variant: 'large_with_sitemap',
          props: {
            logo: { text: 'FORGE ATHLETICS' },
            tagline: 'A private platform floor for serious lifters. Bristol, since 2018.',
            columns: [
              {
                title: 'Train',
                links: [
                  { label: 'Programs', href: '#programs', external: false },
                  { label: 'Coaches', href: '#coaches', external: false },
                  { label: 'Schedule', href: '#schedule', external: false },
                  { label: 'Membership', href: '#membership', external: false },
                ],
              },
              {
                title: 'Compete',
                links: [
                  { label: 'Meet prep', href: '#meets', external: false },
                  { label: 'Open mats', href: '#open', external: false },
                  { label: 'Sponsorships', href: '#sponsor', external: false },
                ],
              },
              {
                title: 'Forge',
                links: [
                  { label: 'About', href: '#about', external: false },
                  { label: 'Contact', href: '#contact', external: false },
                  { label: 'Visit the floor', href: '#visit', external: false },
                ],
              },
            ],
            socials: {
              instagram: 'https://instagram.com/forgeathletics',
              youtube: 'https://youtube.com/@forgeathletics',
            },
            legal: {
              copyright: '© 2026 Forge Athletics Ltd. · Bristol, UK',
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
    generatedAt: '2026-05-15T00:00:00.000Z',
    model: 'fixture',
    promptVersion: 'fixture-step-7-forge',
  },
};

export const forgeSite: Site = SiteSchema.parse(rawSite);
