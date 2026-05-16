// packages/shared-types/src/site-schema.ts
import { z } from 'zod';

import { TypographyPairing } from './design-brief';

// ---------- Theme (design tokens at site level) ----------

export const ThemeTokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    foreground: z.string(),
    mutedForeground: z.string(),
    border: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
  }),
  darkMode: z
    .object({
      background: z.string(),
      surface: z.string(),
      foreground: z.string(),
      mutedForeground: z.string(),
      border: z.string(),
    })
    .optional(),
  typography: z.object({
    pairingId: TypographyPairing,
    headingFamily: z.string(), // resolved font-family CSS value
    bodyFamily: z.string(),
    // Scale ratios — let theme decide actual sizes
    scale: z.enum(['compact', 'balanced', 'spacious']),
  }),
  radius: z.enum(['sharp', 'subtle', 'rounded', 'pill']),
  shadow: z.enum(['none', 'subtle', 'dramatic', 'soft_diffuse']),
  density: z.enum(['tight', 'balanced', 'airy']),
  motion: z.enum([
    'snappy_aggressive',
    'smooth_premium',
    'playful_bouncy',
    'minimal_subtle',
    'kinetic_dynamic',
  ]),
});

// ---------- Shared atoms ----------

export const LinkSchema = z.object({
  label: z.string(),
  href: z.string(), // can be internal slug like "/contact" or external URL
  external: z.boolean().default(false),
});

export const ImageRefSchema = z.object({
  // Either a URL (from Unsplash, R2, S3) or a placeholder descriptor
  url: z.string().optional(),
  // If url is absent, the renderer shows a placeholder and the generator
  // uses this query to fetch one later
  query: z.string().optional(),
  alt: z.string(),
  // For art-direction
  focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  credit: z
    .object({ source: z.string(), author: z.string().optional(), url: z.string().optional() })
    .optional(),
});

export const IconRefSchema = z.object({
  // Icon set: "lucide" | "tabler" — and the icon name within that set
  set: z.enum(['lucide', 'tabler']),
  name: z.string(),
});

export const CtaSchema = z.object({
  label: z.string(),
  href: z.string(),
  style: z.enum(['primary', 'secondary', 'ghost', 'link']).default('primary'),
  external: z.boolean().default(false),
});

// ---------- Section types (discriminated union) ----------
// Each section is one entry in a page's sections array.
// `type` is the discriminator; `variant` picks the visual variant within that type.

const baseSection = z.object({
  id: z.string(), // stable id, e.g. "sec_home_hero_a1b2"
  // Optional section-level overrides for spacing/background
  background: z.enum(['default', 'surface', 'muted', 'primary', 'accent', 'image']).optional(),
  paddingY: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  // Free-form notes from the AI explaining the choice — useful for debugging,
  // hidden from the rendered output
  generatorNotes: z.string().optional(),
});

// --- Header ---
export const HeaderSectionSchema = baseSection.extend({
  type: z.literal('header'),
  variant: z.enum([
    'logo_left_links_right',
    'logo_center_links_split',
    'minimal_logo_only',
    'logo_left_cta_right',
  ]),
  props: z.object({
    logo: z.object({
      text: z.string().optional(), // text logo
      image: ImageRefSchema.optional(), // image logo
    }),
    links: z.array(LinkSchema),
    cta: CtaSchema.optional(),
    sticky: z.boolean().default(true),
  }),
});

// --- Hero ---
export const HeroSectionSchema = baseSection.extend({
  type: z.literal('hero'),
  variant: z.enum([
    'centered_text_over_image',
    'split_image_right',
    'split_image_left',
    'video_background',
    'gradient_mesh',
    'asymmetric_floating',
    'minimal_typographic',
  ]),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string(),
    subheadline: z.string().optional(),
    primaryCta: CtaSchema.optional(),
    secondaryCta: CtaSchema.optional(),
    media: z
      .object({
        kind: z.enum(['image', 'video', 'none']).default('image'),
        image: ImageRefSchema.optional(),
        videoUrl: z.string().optional(),
      })
      .optional(),
    // For asymmetric/floating variants
    floatingBadges: z
      .array(z.object({ label: z.string(), icon: IconRefSchema.optional() }))
      .optional(),
  }),
});

// --- Feature Grid ---
export const FeatureGridSectionSchema = baseSection.extend({
  type: z.literal('feature_grid'),
  variant: z.enum(['3_col_icon_top', '2_col_image_left', '4_col_minimal', 'alternating_rows']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    items: z
      .array(
        z.object({
          icon: IconRefSchema.optional(),
          image: ImageRefSchema.optional(),
          title: z.string(),
          body: z.string(),
          link: LinkSchema.optional(),
        }),
      )
      .min(2)
      .max(8),
  }),
});

// --- Service / Product Cards ---
export const ServiceListSectionSchema = baseSection.extend({
  type: z.literal('service_list'),
  variant: z.enum(['card_grid', 'list_with_image', 'tabbed', 'accordion_detailed']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    items: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          image: ImageRefSchema.optional(),
          icon: IconRefSchema.optional(),
          bulletPoints: z.array(z.string()).optional(),
          price: z.string().optional(),
          cta: CtaSchema.optional(),
        }),
      )
      .min(2),
  }),
});

// --- About / Story ---
export const AboutSectionSchema = baseSection.extend({
  type: z.literal('about'),
  variant: z.enum(['text_with_image', 'image_grid_with_text', 'timeline', 'stats_with_story']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string(),
    body: z.string(), // can include double-newline paragraph breaks
    image: ImageRefSchema.optional(),
    secondaryImages: z.array(ImageRefSchema).optional(),
    timeline: z
      .array(z.object({ date: z.string(), title: z.string(), body: z.string() }))
      .optional(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    cta: CtaSchema.optional(),
  }),
});

// --- Stats / Numbers ---
export const StatsSectionSchema = baseSection.extend({
  type: z.literal('stats'),
  variant: z.enum(['row_large', 'grid_with_labels', 'row_with_dividers']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    items: z
      .array(
        z.object({
          value: z.string(), // "10k+", "98%", "$2M"
          label: z.string(),
          icon: IconRefSchema.optional(),
        }),
      )
      .min(2)
      .max(6),
  }),
});

// --- Testimonials ---
export const TestimonialsSectionSchema = baseSection.extend({
  type: z.literal('testimonials'),
  variant: z.enum(['single_large_quote', 'card_grid_3', 'carousel', 'masonry_wall']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    items: z
      .array(
        z.object({
          quote: z.string(),
          authorName: z.string(),
          authorRole: z.string().optional(),
          authorImage: ImageRefSchema.optional(),
          rating: z.number().int().min(1).max(5).optional(),
          isPlaceholder: z.boolean().default(true),
        }),
      )
      .min(1),
  }),
});

// --- Pricing ---
export const PricingSectionSchema = baseSection.extend({
  type: z.literal('pricing'),
  variant: z.enum(['3_tier_classic', '2_tier_focused', 'comparison_table', 'single_card']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    billingToggle: z.boolean().default(false),
    tiers: z
      .array(
        z.object({
          name: z.string(),
          price: z.string(), // "$29/mo" — keep as string for flexibility
          priceSecondary: z.string().optional(), // for billing toggle
          description: z.string().optional(),
          features: z.array(z.string()).min(1),
          highlighted: z.boolean().default(false),
          cta: CtaSchema,
        }),
      )
      .min(1)
      .max(4),
  }),
});

// --- FAQ ---
export const FaqSectionSchema = baseSection.extend({
  type: z.literal('faq'),
  variant: z.enum(['accordion_single_col', 'accordion_two_col', 'grouped_categories']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    items: z.array(z.object({ question: z.string(), answer: z.string() })).min(2),
  }),
});

// --- CTA block ---
export const CtaSectionSchema = baseSection.extend({
  type: z.literal('cta_block'),
  variant: z.enum(['centered_simple', 'split_with_image', 'full_bleed_image', 'card_floating']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string(),
    subheadline: z.string().optional(),
    primaryCta: CtaSchema,
    secondaryCta: CtaSchema.optional(),
    image: ImageRefSchema.optional(),
  }),
});

// --- Contact / Form ---
export const ContactSectionSchema = baseSection.extend({
  type: z.literal('contact'),
  variant: z.enum(['form_left_info_right', 'form_only_centered', 'info_with_map', 'split_full']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    fields: z
      .array(
        z.object({
          name: z.string(),
          label: z.string(),
          type: z.enum(['text', 'email', 'tel', 'textarea', 'select']),
          required: z.boolean().default(false),
          options: z.array(z.string()).optional(), // for select
          placeholder: z.string().optional(),
        }),
      )
      .min(1),
    submitLabel: z.string().default('Send message'),
    successMessage: z.string().default("Thanks — we'll be in touch."),
    info: z
      .object({
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        hours: z.string().optional(),
      })
      .optional(),
    mapEmbedUrl: z.string().optional(),
  }),
});

// --- Logo cloud / partners ---
export const LogoCloudSectionSchema = baseSection.extend({
  type: z.literal('logo_cloud'),
  variant: z.enum(['single_row_grayscale', 'grid_color', 'marquee_scrolling']),
  props: z.object({
    headline: z.string().optional(),
    logos: z.array(z.object({ name: z.string(), image: ImageRefSchema })).min(3),
  }),
});

// --- Gallery ---
export const GallerySectionSchema = baseSection.extend({
  type: z.literal('gallery'),
  variant: z.enum(['masonry', 'grid_uniform', 'carousel_full_bleed', 'lightbox_grid']),
  props: z.object({
    headline: z.string().optional(),
    images: z.array(ImageRefSchema).min(3),
  }),
});

// --- Team ---
export const TeamSectionSchema = baseSection.extend({
  type: z.literal('team'),
  variant: z.enum(['grid_with_photos', 'list_with_bios', 'card_hover_reveal']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    members: z
      .array(
        z.object({
          name: z.string(),
          role: z.string(),
          bio: z.string().optional(),
          image: ImageRefSchema.optional(),
          socials: z.record(z.string(), z.string()).optional(),
        }),
      )
      .min(1),
  }),
});

// --- Footer ---
export const FooterSectionSchema = baseSection.extend({
  type: z.literal('footer'),
  variant: z.enum(['columns_with_newsletter', 'minimal_centered', 'large_with_sitemap']),
  props: z.object({
    logo: z.object({
      text: z.string().optional(),
      image: ImageRefSchema.optional(),
    }),
    tagline: z.string().optional(),
    columns: z
      .array(
        z.object({
          title: z.string(),
          links: z.array(LinkSchema),
        }),
      )
      .optional(),
    socials: z.record(z.string(), z.string()).optional(),
    newsletter: z
      .object({
        headline: z.string(),
        placeholder: z.string().default('you@example.com'),
        cta: z.string().default('Subscribe'),
      })
      .optional(),
    legal: z.object({
      copyright: z.string(),
      links: z.array(LinkSchema).optional(),
    }),
  }),
});

// --- Rich text / fallback (for future expansion) ---
export const RichTextSectionSchema = baseSection.extend({
  type: z.literal('rich_text'),
  variant: z.enum(['narrow_column', 'two_column', 'wide_with_sidebar']),
  props: z.object({
    headline: z.string().optional(),
    // Stored as Markdown — renderer parses to HTML.
    // Keeps content portable and easy for AI to generate.
    bodyMarkdown: z.string(),
  }),
});

// ---------- The discriminated union ----------

export const SectionSchema = z.discriminatedUnion('type', [
  HeaderSectionSchema,
  HeroSectionSchema,
  FeatureGridSectionSchema,
  ServiceListSectionSchema,
  AboutSectionSchema,
  StatsSectionSchema,
  TestimonialsSectionSchema,
  PricingSectionSchema,
  FaqSectionSchema,
  CtaSectionSchema,
  ContactSectionSchema,
  LogoCloudSectionSchema,
  GallerySectionSchema,
  TeamSectionSchema,
  FooterSectionSchema,
  RichTextSectionSchema,
]);

export type Section = z.infer<typeof SectionSchema>;

// ---------- Page ----------

export const PageSchema = z.object({
  id: z.string(), // "page_home"
  slug: z.string(), // "" for home, "services", "about/team"
  title: z.string(), // "Home", "Our Services"
  // SEO
  seo: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
    ogImage: ImageRefSchema.optional(),
    canonicalPath: z.string().optional(),
    noIndex: z.boolean().default(false),
  }),
  // Ordered sections
  sections: z.array(SectionSchema).min(1),
  // Optional page-level theme override (rare — usually inherit from site)
  themeOverride: ThemeTokensSchema.partial().optional(),
});

export type Page = z.infer<typeof PageSchema>;

// ---------- Site (the top-level document) ----------

export const SiteNavigationSchema = z.object({
  // The header sources its links from here so they stay in sync across pages.
  // Header sections can either embed links directly OR reference these by id.
  primary: z.array(LinkSchema),
  footer: z
    .array(
      z.object({
        title: z.string(),
        links: z.array(LinkSchema),
      }),
    )
    .optional(),
});

export const SiteSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(), // "site_xxx"
  designBriefId: z.string(), // links back to the brief that generated this

  metadata: z.object({
    siteName: z.string(),
    siteDescription: z.string(),
    locale: z.string().default('en'),
    favicon: ImageRefSchema.optional(),
    defaultOgImage: ImageRefSchema.optional(),
  }),

  theme: ThemeTokensSchema,

  navigation: SiteNavigationSchema,

  // Pages, ordered. Home is conventionally first.
  pages: z.array(PageSchema).min(1),

  // Audit
  generation: z.object({
    generatedAt: z.string(), // ISO timestamp
    model: z.string(), // "gemini-2.0-flash" | "claude-sonnet-4-6" etc.
    promptVersion: z.string(), // for tracking which prompt produced this
    jobId: z.string().optional(),
  }),
});

export type Site = z.infer<typeof SiteSchema>;
