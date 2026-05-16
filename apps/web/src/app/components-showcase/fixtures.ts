// Realistic, intentionally-varied placeholder data for the showcase page.
// Each variant gets distinct copy so visual differences are easier to spot.

import {
  type FeatureGridSection,
  type FooterSection,
  type HeaderSection,
  type HeroSection,
} from '@repo/components-library';
import { type Site } from '@repo/shared-types';

export const SHOWCASE_THEME: Site['theme'] = {
  colors: {
    primary: 'oklch(0.55 0.22 25)',
    secondary: 'oklch(0.42 0.06 250)',
    accent: 'oklch(0.78 0.16 80)',
    background: 'oklch(0.985 0.005 250)',
    surface: 'oklch(1 0 0)',
    foreground: 'oklch(0.16 0.02 250)',
    mutedForeground: 'oklch(0.48 0.02 250)',
    border: 'oklch(0.9 0.01 250)',
    success: 'oklch(0.7 0.18 145)',
    warning: 'oklch(0.8 0.15 75)',
    danger: 'oklch(0.6 0.22 25)',
  },
  typography: {
    pairingId: 'space_grotesk_dm_sans',
    headingFamily: '',
    bodyFamily: '',
    scale: 'balanced',
  },
  radius: 'subtle',
  shadow: 'soft_diffuse',
  density: 'balanced',
  motion: 'smooth_premium',
};

// ---------- Header variants ----------

export const HEADERS: HeaderSection[] = [
  {
    id: 'h_a',
    type: 'header',
    variant: 'logo_left_links_right',
    props: {
      logo: { text: 'Atlas Capital' },
      links: [
        { label: 'Strategies', href: '#', external: false },
        { label: 'Research', href: '#', external: false },
        { label: 'Team', href: '#', external: false },
        { label: 'Insights', href: '#', external: false },
      ],
      cta: { label: 'Schedule a call', href: '#', style: 'primary', external: false },
      sticky: true,
    },
  },
  {
    id: 'h_b',
    type: 'header',
    variant: 'logo_center_links_split',
    props: {
      logo: { text: 'Marrow' },
      links: [
        { label: 'Menu', href: '#', external: false },
        { label: 'Reservations', href: '#', external: false },
        { label: 'Private events', href: '#', external: false },
        { label: 'Visit', href: '#', external: false },
      ],
      cta: { label: 'Book a table', href: '#', style: 'secondary', external: false },
      sticky: true,
    },
  },
  {
    id: 'h_c',
    type: 'header',
    variant: 'minimal_logo_only',
    props: {
      logo: { text: 'Studio Voss' },
      links: [],
      cta: { label: 'Contact', href: '#', style: 'link', external: false },
      sticky: false,
    },
  },
  {
    id: 'h_d',
    type: 'header',
    variant: 'logo_left_cta_right',
    props: {
      logo: { text: 'Forge OS' },
      links: [],
      cta: { label: 'Start free trial', href: '#', style: 'primary', external: false },
      sticky: true,
    },
  },
];

// ---------- Hero variants ----------

export const HEROES: HeroSection[] = [
  {
    id: 'hero_a',
    type: 'hero',
    variant: 'centered_text_over_image',
    props: {
      eyebrow: 'Powerlifting · Strength · Discipline',
      headline: 'The weight will not move itself.',
      subheadline:
        'A private training floor for serious lifters. No machines you don’t need, no music you don’t want, no excuses.',
      primaryCta: { label: 'Tour the gym', href: '#', style: 'primary', external: false },
      secondaryCta: { label: 'Membership', href: '#', style: 'secondary', external: false },
      media: {
        kind: 'image',
        image: {
          url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=2000&q=80',
          alt: 'Athlete preparing a heavy barbell on the platform',
        },
      },
    },
  },
  {
    id: 'hero_b',
    type: 'hero',
    variant: 'split_image_right',
    props: {
      eyebrow: 'Issue 04 — Spring',
      headline: 'Magazines made the slow way.',
      subheadline:
        'Long-form features, original photography, and zero affiliate links. Printed in Reykjavík, shipped worldwide.',
      primaryCta: { label: 'Subscribe', href: '#', style: 'primary', external: false },
      secondaryCta: { label: 'Read sample', href: '#', style: 'ghost', external: false },
      media: {
        kind: 'image',
        image: {
          url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80',
          alt: 'Open editorial magazine on a textured surface',
        },
      },
    },
  },
  {
    id: 'hero_c',
    type: 'hero',
    variant: 'split_image_left',
    props: {
      eyebrow: 'Consulting',
      headline: 'Operational clarity for teams that have outgrown their tools.',
      subheadline:
        'We work alongside founders and operators for ninety days. You keep the playbooks, the dashboards, and the calm afterwards.',
      primaryCta: { label: 'See engagements', href: '#', style: 'primary', external: false },
      media: {
        kind: 'image',
        image: {
          url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
          alt: 'Quiet modern office with whiteboard and natural light',
        },
      },
    },
  },
  {
    id: 'hero_d',
    type: 'hero',
    variant: 'video_background',
    props: {
      eyebrow: 'Field Notes',
      headline: 'Built for builders who work outdoors.',
      subheadline:
        'Boots, jackets, and tools tested against actual coastlines. Engineered in Bristol, refined in the Highlands.',
      primaryCta: { label: 'Shop the collection', href: '#', style: 'primary', external: false },
      secondaryCta: { label: 'Our story', href: '#', style: 'ghost', external: false },
      media: {
        kind: 'video',
        videoUrl: 'https://cdn.coverr.co/videos/coverr-walking-in-the-forest-9476/1080p.mp4',
        image: {
          url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=80',
          alt: 'Mountain ridgeline at dusk',
        },
      },
    },
  },
  {
    id: 'hero_e',
    type: 'hero',
    variant: 'gradient_mesh',
    props: {
      eyebrow: 'Now in private beta',
      headline: 'The control plane for AI evals.',
      subheadline:
        'Track regressions, compare model versions, and surface failure modes before your customers do. Built by the team behind Pageant.',
      primaryCta: { label: 'Request access', href: '#', style: 'primary', external: false },
      secondaryCta: { label: 'Read the docs', href: '#', style: 'link', external: false },
    },
  },
  {
    id: 'hero_f',
    type: 'hero',
    variant: 'asymmetric_floating',
    props: {
      eyebrow: 'Studio',
      headline: 'Brand systems for ambitious independents.',
      subheadline:
        'Visual identity, voice, and motion — designed in tandem so the work feels like one thing, not five.',
      primaryCta: { label: 'View case studies', href: '#', style: 'primary', external: false },
      secondaryCta: { label: 'Say hello', href: '#', style: 'ghost', external: false },
      media: {
        kind: 'image',
        image: {
          url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80',
          alt: 'Designer working on a typographic brand spread',
        },
      },
      floatingBadges: [
        { label: 'Award · Brand New 2025', icon: { set: 'lucide', name: 'Award' } },
        { label: '24 active engagements', icon: { set: 'lucide', name: 'Sparkles' } },
        { label: 'Working with founders', icon: { set: 'lucide', name: 'Users' } },
        { label: 'Est. 2019', icon: { set: 'lucide', name: 'Calendar' } },
      ],
    },
  },
  {
    id: 'hero_g',
    type: 'hero',
    variant: 'minimal_typographic',
    props: {
      eyebrow: 'Volume One',
      headline: 'Slower work, quieter rooms, better books.',
      subheadline:
        'An independent press for new fiction. Two titles a year, no exceptions. Read by people who finish what they start.',
      primaryCta: { label: 'See the catalogue', href: '#', style: 'primary', external: false },
      secondaryCta: { label: 'Submissions', href: '#', style: 'link', external: false },
    },
  },
];

// ---------- FeatureGrid variants ----------

export const FEATURE_GRIDS: FeatureGridSection[] = [
  {
    id: 'fg_a',
    type: 'feature_grid',
    variant: '3_col_icon_top',
    props: {
      eyebrow: 'How it works',
      headline: 'Three things we do better than anyone else.',
      subheadline:
        'Not a long list of buzzwords — three principles we hold to in every engagement.',
      items: [
        {
          icon: { set: 'lucide', name: 'Compass' },
          title: 'Discovery before delivery',
          body: 'We map the constraints first. The deliverable falls out of the diagnosis, not the other way around.',
        },
        {
          icon: { set: 'lucide', name: 'Layers' },
          title: 'Systems, not screens',
          body: 'Every visual decision ladders up to a token, a pattern, or a principle you can hand to the next person.',
        },
        {
          icon: { set: 'lucide', name: 'Hand' },
          title: 'Handover that lasts',
          body: 'Documentation written for the team that inherits the work — not the team that built it.',
        },
      ],
    },
  },
  {
    id: 'fg_b',
    type: 'feature_grid',
    variant: '2_col_image_left',
    props: {
      eyebrow: 'Services',
      headline: 'What we offer.',
      items: [
        {
          title: 'Annual physicals',
          body: 'Same-day labs, longer appointments, and a clinician who actually remembers your name.',
          image: {
            url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
            alt: 'Clinician reviewing notes with a patient',
          },
          link: { label: 'Book now', href: '#', external: false },
        },
        {
          title: 'Pediatrics',
          body: 'Newborn to teenager. The visit length scales with the conversation, not the billing code.',
          image: {
            url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=900&q=80',
            alt: 'Pediatrician examining a smiling child',
          },
          link: { label: 'Meet the team', href: '#', external: false },
        },
        {
          title: 'Imaging on site',
          body: 'X-ray and ultrasound in the same building. Results the same afternoon, not next week.',
          image: {
            url: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=900&q=80',
            alt: 'Modern medical imaging room',
          },
          link: { label: 'Learn more', href: '#', external: false },
        },
        {
          title: 'Mental health',
          body: 'Licensed therapists embedded in the practice. Continuity with your primary care, not a separate silo.',
          image: {
            url: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=900&q=80',
            alt: 'Therapy session in a calm office',
          },
          link: { label: 'Approach', href: '#', external: false },
        },
      ],
    },
  },
  {
    id: 'fg_c',
    type: 'feature_grid',
    variant: '4_col_minimal',
    props: {
      eyebrow: 'Capabilities',
      headline: 'Built for serious workloads.',
      items: [
        {
          icon: { set: 'lucide', name: 'ShieldCheck' },
          title: 'SOC 2 Type II',
          body: 'Annual audits, continuous controls, customer-facing trust portal.',
        },
        {
          icon: { set: 'lucide', name: 'Network' },
          title: 'Bring your own cloud',
          body: 'Deploy into your AWS, GCP, or Azure with infra as code.',
        },
        {
          icon: { set: 'lucide', name: 'KeyRound' },
          title: 'SSO + SCIM',
          body: 'Okta, Entra, Google. Provisioning out of the box, no surcharge.',
        },
        {
          icon: { set: 'lucide', name: 'Activity' },
          title: 'Audit log streaming',
          body: 'Native sinks for Splunk, Datadog, S3 — plus a tail-able API.',
        },
        {
          icon: { set: 'lucide', name: 'GitBranch' },
          title: 'Versioned changes',
          body: 'Roll forward, roll back, diff anywhere. Treat config like code.',
        },
        {
          icon: { set: 'lucide', name: 'Cpu' },
          title: 'Edge runtime',
          body: 'Sub-30ms latency from any of 22 PoPs. No cold starts.',
        },
        {
          icon: { set: 'lucide', name: 'Lock' },
          title: 'Customer-managed keys',
          body: 'KMS-backed encryption, regional residency, BYOK.',
        },
        {
          icon: { set: 'lucide', name: 'Headphones' },
          title: 'Dedicated support',
          body: 'Named engineer, signed SLA, Slack-shared channel.',
        },
      ],
    },
  },
  {
    id: 'fg_d',
    type: 'feature_grid',
    variant: 'alternating_rows',
    props: {
      eyebrow: 'The product',
      headline: 'Designed for people who care how their tools work.',
      items: [
        {
          icon: { set: 'lucide', name: 'PenTool' },
          title: 'Drafts that feel like notebooks',
          body: 'Move blocks with your hands, not your menus. Undo back to anywhere. Forget about saving.',
          image: {
            url: 'https://images.unsplash.com/photo-1495465798138-718f86d1a4bc?auto=format&fit=crop&w=1200&q=80',
            alt: 'Designer sketching on grid paper',
          },
        },
        {
          icon: { set: 'lucide', name: 'Eye' },
          title: 'Preview that mirrors production',
          body: 'No "but it looked fine in dev" — the preview is the production renderer, served by the same edge.',
          image: {
            url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
            alt: 'Side-by-side screens showing design preview',
          },
        },
        {
          icon: { set: 'lucide', name: 'GitMerge' },
          title: 'Branches, finally, for content',
          body: 'Spin up a copy of any page, edit, request review, merge. The history is the audit trail.',
          image: {
            url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
            alt: 'Version history on a developer screen',
          },
        },
      ],
    },
  },
];

// ---------- Footer variants ----------

export const FOOTERS: FooterSection[] = [
  {
    id: 'foot_a',
    type: 'footer',
    variant: 'columns_with_newsletter',
    props: {
      logo: { text: 'Forge OS' },
      tagline: 'The control plane for AI evals. Built quietly in Berlin.',
      columns: [
        {
          title: 'Product',
          links: [
            { label: 'Evals', href: '#', external: false },
            { label: 'Tracing', href: '#', external: false },
            { label: 'Datasets', href: '#', external: false },
            { label: 'Changelog', href: '#', external: false },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About', href: '#', external: false },
            { label: 'Careers', href: '#', external: false },
            { label: 'Customers', href: '#', external: false },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Docs', href: '#', external: false },
            { label: 'Blog', href: '#', external: false },
            { label: 'Status', href: '#', external: false },
          ],
        },
      ],
      socials: {
        twitter: '#',
        linkedin: '#',
        github: '#',
      },
      newsletter: {
        headline: 'Field notes, monthly.',
        placeholder: 'you@company.com',
        cta: 'Subscribe',
      },
      legal: {
        copyright: '© 2026 Forge Labs, GmbH.',
        links: [
          { label: 'Privacy', href: '#', external: false },
          { label: 'Terms', href: '#', external: false },
          { label: 'Security', href: '#', external: false },
        ],
      },
    },
  },
  {
    id: 'foot_b',
    type: 'footer',
    variant: 'minimal_centered',
    props: {
      logo: { text: 'Studio Voss' },
      tagline: 'A two-person design studio. Brand systems for ambitious independents.',
      columns: [
        {
          title: 'Nav',
          links: [
            { label: 'Work', href: '#', external: false },
            { label: 'About', href: '#', external: false },
            { label: 'Notes', href: '#', external: false },
            { label: 'Contact', href: '#', external: false },
          ],
        },
      ],
      socials: {
        instagram: '#',
        twitter: '#',
      },
      legal: {
        copyright: '© 2026 Studio Voss. All rights reserved.',
      },
    },
  },
  {
    id: 'foot_c',
    type: 'footer',
    variant: 'large_with_sitemap',
    props: {
      logo: { text: 'Atlas Capital' },
      tagline: 'A wealth management firm for founders, operators, and the families who back them.',
      columns: [
        {
          title: 'Strategies',
          links: [
            { label: 'Public equity', href: '#', external: false },
            { label: 'Private markets', href: '#', external: false },
            { label: 'Real assets', href: '#', external: false },
            { label: 'Cash management', href: '#', external: false },
          ],
        },
        {
          title: 'Research',
          links: [
            { label: 'Quarterly letters', href: '#', external: false },
            { label: 'Whitepapers', href: '#', external: false },
            { label: 'Talks', href: '#', external: false },
          ],
        },
        {
          title: 'Firm',
          links: [
            { label: 'About', href: '#', external: false },
            { label: 'Team', href: '#', external: false },
            { label: 'Careers', href: '#', external: false },
            { label: 'Press', href: '#', external: false },
          ],
        },
        {
          title: 'Clients',
          links: [
            { label: 'Login', href: '#', external: false },
            { label: 'Statements', href: '#', external: false },
            { label: 'Schedule a call', href: '#', external: false },
          ],
        },
      ],
      socials: {
        linkedin: '#',
        twitter: '#',
        youtube: '#',
      },
      newsletter: {
        headline: 'The quarterly letter.',
        placeholder: 'name@example.com',
        cta: 'Sign up',
      },
      legal: {
        copyright: '© 2026 Atlas Capital LLC. Registered with the SEC.',
        links: [
          { label: 'Disclosures', href: '#', external: false },
          { label: 'Form CRS', href: '#', external: false },
          { label: 'Privacy', href: '#', external: false },
          { label: 'Terms', href: '#', external: false },
        ],
      },
    },
  },
];
