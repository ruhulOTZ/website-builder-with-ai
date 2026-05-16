// Bloom Pediatric Dental — warm neighborhood clinic for kids 2–12.
// Soft pastel + warm earth palette, Fraunces serif paired with Inter for body.
// Airy density, rounded radius, soft-diffuse shadow.

import { SiteSchema, type Site } from '@repo/shared-types';

const rawSite: Site = {
  schemaVersion: 1,
  id: 'site_bloom_pediatric',
  designBriefId: 'brief_bloom_pediatric',

  metadata: {
    siteName: 'Bloom Pediatric Dental',
    siteDescription:
      'A gentle, kid-first dental practice for ages 2–12. Family-owned in the West End of Asheville since 2014.',
    locale: 'en',
  },

  theme: {
    colors: {
      // Pastel-soft: dusty mint primary, warm peach secondary, soft rose accent.
      // Cream background, near-white surface, brown-warm foreground.
      primary: 'oklch(0.72 0.085 175)',
      secondary: 'oklch(0.82 0.08 45)',
      accent: 'oklch(0.84 0.06 25)',
      background: 'oklch(0.975 0.018 80)',
      surface: 'oklch(0.995 0.005 80)',
      foreground: 'oklch(0.28 0.04 40)',
      mutedForeground: 'oklch(0.52 0.03 40)',
      border: 'oklch(0.88 0.02 60)',
      success: 'oklch(0.72 0.14 145)',
      warning: 'oklch(0.82 0.13 75)',
      danger: 'oklch(0.62 0.18 25)',
    },
    typography: {
      pairingId: 'fraunces_inter',
      headingFamily: 'system-ui, sans-serif',
      bodyFamily: 'system-ui, sans-serif',
      scale: 'spacious',
    },
    radius: 'rounded',
    shadow: 'soft_diffuse',
    density: 'airy',
    motion: 'smooth_premium',
  },

  navigation: {
    primary: [
      { label: 'Services', href: '#services', external: false },
      { label: 'Our team', href: '#team', external: false },
      { label: 'First visit', href: '#first-visit', external: false },
      { label: 'Contact', href: '#contact', external: false },
    ],
  },

  pages: [
    {
      id: 'page_home',
      slug: '',
      title: 'Home',
      seo: {
        metaTitle: 'Bloom Pediatric Dental — Asheville',
        metaDescription:
          'Gentle, kid-first dental care for ages 2 through 12. Family-owned in West Asheville, NC.',
        noIndex: false,
      },
      sections: [
        {
          id: 'sec_bloom_header',
          type: 'header',
          variant: 'logo_center_links_split',
          props: {
            logo: { text: 'Bloom' },
            links: [
              { label: 'Services', href: '#services', external: false },
              { label: 'Our team', href: '#team', external: false },
              { label: 'First visit', href: '#first-visit', external: false },
              { label: 'Contact', href: '#contact', external: false },
            ],
            cta: {
              label: 'Book a visit',
              href: '#book',
              style: 'primary',
              external: false,
            },
            sticky: true,
          },
        },
        {
          id: 'sec_bloom_hero',
          type: 'hero',
          variant: 'split_image_right',
          props: {
            eyebrow: 'For kids ages 2 to 12',
            headline: 'A dental visit your kid will actually look forward to.',
            subheadline:
              'We move slowly, explain everything, and keep the office quiet, warm, and full of light. Our pediatric specialists have been caring for West Asheville kids since 2014.',
            primaryCta: {
              label: 'Book a first visit',
              href: '#book',
              style: 'primary',
              external: false,
            },
            secondaryCta: {
              label: 'Meet our team',
              href: '#team',
              style: 'ghost',
              external: false,
            },
            media: {
              kind: 'image',
              image: {
                // Unsplash photo-1652761029249-6ec32a82ccb0: a smiling child
                // brushing her teeth. Photographer: Mieke Campbell. Verified
                // 2026-05-15 — HTTP 200, ~470 KB, depicts the right subject.
                url: 'https://images.unsplash.com/photo-1652761029249-6ec32a82ccb0?auto=format&fit=crop&w=1600&q=80',
                alt: 'A young child smiling while brushing her teeth',
              },
            },
          },
        },
        {
          id: 'sec_bloom_services',
          type: 'feature_grid',
          variant: '3_col_icon_top',
          props: {
            eyebrow: 'What we do',
            headline: 'Care that grows with your child.',
            subheadline:
              'From the first tooth to the teenage check-up, every visit is paced to your child — never to the clock.',
            items: [
              {
                icon: { set: 'lucide', name: 'Smile' },
                title: 'Gentle first visits',
                body: 'A 45-minute appointment with a "ride along" tour, a chair lift demo, and zero pressure. Cleanings only happen if your child is ready.',
              },
              {
                icon: { set: 'lucide', name: 'Heart' },
                title: 'Routine cleanings & checks',
                body: 'Six-month visits that stay on schedule without feeling rushed. Same hygienist every time, so trust builds over years.',
              },
              {
                icon: { set: 'lucide', name: 'Sparkles' },
                title: 'Fluoride & sealants',
                body: 'Evidence-based prevention without the lecture. We explain options to you, not at you, and we never up-sell treatments your child does not need.',
              },
              {
                icon: { set: 'lucide', name: 'ShieldCheck' },
                title: 'Early orthodontic screens',
                body: 'We watch for crowding and bite issues from age seven. If we recommend a specialist, we coordinate the referral and the records.',
              },
              {
                icon: { set: 'lucide', name: 'Stethoscope' },
                title: 'Special needs care',
                body: 'Quiet rooms, weighted blankets, longer appointments. We work with neurodivergent kids and families on a plan that fits them.',
              },
              {
                icon: { set: 'lucide', name: 'CloudSun' },
                title: 'Emergency same-day',
                body: 'Knocked-out tooth, broken filling, mystery ache. Call before 11am and we will see you the same day, every day we are open.',
              },
            ],
          },
        },
        {
          id: 'sec_bloom_first_visit',
          type: 'feature_grid',
          variant: 'alternating_rows',
          props: {
            eyebrow: 'What to expect',
            headline: 'The first visit, step by step.',
            subheadline:
              'No surprises. Here is exactly what a first visit looks like — share this page with your child before you come in.',
            items: [
              {
                icon: { set: 'lucide', name: 'Coffee' },
                title: 'You arrive ten minutes early.',
                body: 'Park around the back. Drop your coat in the cubby. There is a kettle, kid books, and a corner with a rug — we built the waiting area for actual humans.',
                image: {
                  url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80',
                  alt: 'Warm reception area with natural light',
                },
              },
              {
                icon: { set: 'lucide', name: 'Compass' },
                title: 'We give your child the tour.',
                body: 'Before any exam, your child meets the chair, the light, the little mirror, and the "Mr Whoosh" suction. They press the buttons. They name it. Then we begin.',
                image: {
                  url: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=1600&q=80',
                  alt: 'Pediatric clinic chair, bright and friendly',
                },
              },
              {
                icon: { set: 'lucide', name: 'BookOpen' },
                title: 'You leave with a plan, not a sales pitch.',
                body: 'We share what we saw, what to watch, and what (if anything) comes next. You get the plan written down. We never recommend treatments your child does not need.',
                image: {
                  url: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=1600&q=80',
                  alt: 'A clinician explaining a treatment plan to a parent',
                },
              },
            ],
          },
        },
        {
          id: 'sec_bloom_footer',
          type: 'footer',
          variant: 'columns_with_newsletter',
          props: {
            logo: { text: 'Bloom Pediatric' },
            tagline:
              'Family-owned pediatric dental care in West Asheville. Open Tuesday through Saturday.',
            columns: [
              {
                title: 'Care',
                links: [
                  { label: 'Services', href: '#services', external: false },
                  { label: 'First visit', href: '#first-visit', external: false },
                  { label: 'Insurance & billing', href: '#billing', external: false },
                  { label: 'FAQs', href: '#faq', external: false },
                ],
              },
              {
                title: 'Practice',
                links: [
                  { label: 'Our team', href: '#team', external: false },
                  { label: 'The office', href: '#office', external: false },
                  { label: 'For referring dentists', href: '#referrals', external: false },
                ],
              },
              {
                title: 'Visit',
                links: [
                  { label: 'Hours & directions', href: '#hours', external: false },
                  { label: 'New patient forms', href: '#forms', external: false },
                  { label: 'Contact', href: '#contact', external: false },
                ],
              },
            ],
            socials: {
              instagram: 'https://instagram.com/bloompediatric',
              facebook: 'https://facebook.com/bloompediatric',
            },
            newsletter: {
              headline: 'Little check-in, monthly.',
              placeholder: 'parent@example.com',
              cta: 'Subscribe',
            },
            legal: {
              copyright: '© 2026 Bloom Pediatric Dental, PLLC.',
              links: [
                { label: 'Privacy', href: '#privacy', external: false },
                { label: 'Notice of Privacy Practices', href: '#hipaa', external: false },
                { label: 'Accessibility', href: '#a11y', external: false },
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
    promptVersion: 'fixture-step-7-bloom',
  },
};

export const bloomSite: Site = SiteSchema.parse(rawSite);
