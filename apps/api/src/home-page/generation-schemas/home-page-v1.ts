// home-page-v1 — narrow AI-surface schemas for the home-page generator.
//
// ─── Why these schemas exist ──────────────────────────────────────────
// Phase 3-minimal ships 4 section types (Header, Hero, FeatureGrid,
// Footer). The canonical schemas in @repo/shared-types are the wide
// renderer/storage surface — they support 16 section types, art-direction
// fields the AI never emits (image URLs, focal points, credits), open-
// ended dictionaries (Footer.socials as z.record), and array bounds
// (.min/.max on items). When passed to Gemini's structured-output system,
// the wide schemas compile to a constraint automaton with more states
// than Gemini will serve, returning HTTP 400 "too many states" before
// the model ever runs.
//
// Two earlier attempts established the failure mode:
//   1. PageSchema verbatim → 400. 16-branch discriminator alone too big.
//   2. PageSchema with 4-branch discriminator only → still 400. Per-section
//      feature surface (numeric bounds, array bounds, z.record, deeply
//      nested optionals) was the rest of the budget.
// This file is the third attempt: aggressive per-section narrowing.
//
// ─── Narrowing rules applied ──────────────────────────────────────────
// Default is drop. Optional fields not specifically retained are removed
// from the AI surface. We keep:
//   - All required fields (necessary).
//   - Optional fields the prompt actively uses (eyebrow, subheadline,
//     primaryCta/secondaryCta, logo.text, generatorNotes).
//   - The variant enum (required, narrows from large canonical pools but
//     each section still keeps its full variant enum — that's the
//     creative surface).
// We drop:
//   - Server-injectable fields: ImageRef.url (set by the image resolver
//     stage), ImageRef.focalPoint (numeric bounds, art-direction), credit
//     (server-injected from Unsplash), Header.props.sticky (server has a
//     default), baseSection.background, baseSection.paddingY.
//   - Out-of-scope: Hero.floatingBadges, Hero.media.videoUrl, Footer.
//     socials (z.record), Page.themeOverride, Page.seo.ogImage,
//     Page.seo.canonicalPath, Page.seo.noIndex.
//   - Array bounds: dropped everywhere. The prompt expresses item-count
//     expectations in prose; the schema doesn't enforce them.
//   - Numeric/string bounds: none retained.
//   - Boolean defaults: where canonical has `.default(true|false)`, the AI
//     surface keeps the field as plain bool without a default — the AI
//     emits the value.
//
// ─── The narrow→wide invariant ────────────────────────────────────────
// Any object that parses against HomePageGenerationSchema, after the
// service applies its post-AI enrichment (server-injected schemaVersion,
// id, designBriefId, metadata, theme, navigation, generation), must
// parse against canonical SiteSchema. This is the contract that lets us
// keep one final validation gate (SiteSchema.parse in the service).
//
// scripts/verify-generation-roundtrip.ts asserts this invariant
// deterministically without an AI call. Run it after every change to
// either schema family.
//
// ─── Versioning ───────────────────────────────────────────────────────
// GENERATION_SCHEMA_VERSION moves in lockstep with PROMPT_VERSION in
// prompts/home-page-v1.ts. When the prompt opens the section pool to a
// new type (e.g. about, cta_block in v2), copy this file to home-page-
// v2.ts and add the narrowed branch there.

import { z } from 'zod';

// ─── Narrowed atoms ───────────────────────────────────────────────────

/** Narrowed Link. Same shape as canonical; the AI emits `external` so we
 *  drop the default and require it as a plain boolean. */
const LinkAISchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean(),
});

/** Narrowed ImageRef.
 *  Dropped relative to canonical ImageRefSchema:
 *    - url (server-injected by the image-resolver stage)
 *    - focalPoint (numeric bounds — Gemini constraint heaviness)
 *    - credit (server-injected from Unsplash)
 *  `query` is required here (canonical: optional) because the AI's only
 *  job for images is to emit a search query. */
export const ImageRefAISchema = z.object({
  query: z.string(),
  alt: z.string(),
});

/** Narrowed Icon. Same shape as canonical. */
const IconRefAISchema = z.object({
  set: z.enum(['lucide', 'tabler']),
  name: z.string(),
});

/** Narrowed Cta. Same fields as canonical but no defaults — the AI emits
 *  style and external explicitly. */
const CtaAISchema = z.object({
  label: z.string(),
  href: z.string(),
  style: z.enum(['primary', 'secondary', 'ghost', 'link']),
  external: z.boolean(),
});

// ─── Narrowed sections ────────────────────────────────────────────────

/** Narrowed Header.
 *  Dropped relative to canonical HeaderSectionSchema:
 *    - props.cta (rarely used in practice; canonical allows it but the
 *      phase-3 prompt's variants don't surface it)
 *    - props.sticky (server has a sensible default)
 *    - baseSection.background, baseSection.paddingY (style overrides) */
export const HeaderSectionAISchema = z.object({
  id: z.string(),
  generatorNotes: z.string().optional(),
  type: z.enum(['header']),
  variant: z.enum([
    'logo_left_links_right',
    'logo_center_links_split',
    'minimal_logo_only',
    'logo_left_cta_right',
  ]),
  props: z.object({
    logo: z.object({
      text: z.string().optional(),
      image: ImageRefAISchema.optional(),
    }),
    links: z.array(LinkAISchema),
  }),
});

/** Narrowed Hero.
 *  Dropped relative to canonical HeroSectionSchema:
 *    - props.floatingBadges (out of scope for phase 3)
 *    - props.media.videoUrl (out of scope; image-only)
 *    - baseSection.background, baseSection.paddingY */
export const HeroSectionAISchema = z.object({
  id: z.string(),
  generatorNotes: z.string().optional(),
  type: z.enum(['hero']),
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
    primaryCta: CtaAISchema.optional(),
    secondaryCta: CtaAISchema.optional(),
    media: z
      .object({
        kind: z.enum(['image', 'none']),
        image: ImageRefAISchema.optional(),
      })
      .optional(),
  }),
});

/** Narrowed FeatureGrid.
 *  Dropped relative to canonical FeatureGridSectionSchema:
 *    - items.min(2).max(8) array bounds — Gemini constraint heaviness
 *    - per-item: link (rarely used; navigation lives in Header)
 *    - baseSection.background, baseSection.paddingY */
export const FeatureGridSectionAISchema = z.object({
  id: z.string(),
  generatorNotes: z.string().optional(),
  type: z.enum(['feature_grid']),
  variant: z.enum(['3_col_icon_top', '2_col_image_left', '4_col_minimal', 'alternating_rows']),
  props: z.object({
    eyebrow: z.string().optional(),
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    items: z.array(
      z.object({
        icon: IconRefAISchema.optional(),
        image: ImageRefAISchema.optional(),
        title: z.string(),
        body: z.string(),
      }),
    ),
  }),
});

/** Narrowed Footer.
 *  Dropped relative to canonical FooterSectionSchema:
 *    - props.socials (z.record open-ended dictionary — primary Gemini
 *      offender; out of scope for phase 3)
 *    - props.newsletter (out of scope for phase 3; renderer can ignore)
 *    - baseSection.background, baseSection.paddingY */
export const FooterSectionAISchema = z.object({
  id: z.string(),
  generatorNotes: z.string().optional(),
  type: z.enum(['footer']),
  variant: z.enum(['columns_with_newsletter', 'minimal_centered', 'large_with_sitemap']),
  props: z.object({
    logo: z.object({
      text: z.string().optional(),
      image: ImageRefAISchema.optional(),
    }),
    tagline: z.string().optional(),
    columns: z
      .array(
        z.object({
          title: z.string(),
          links: z.array(LinkAISchema),
        }),
      )
      .optional(),
    legal: z.object({
      copyright: z.string(),
      links: z.array(LinkAISchema).optional(),
    }),
  }),
});

// ─── The page ─────────────────────────────────────────────────────────

/** Narrowed Page (the AI's full output surface).
 *  Dropped relative to canonical PageSchema:
 *    - seo.ogImage (server-injected later)
 *    - seo.canonicalPath, seo.noIndex (server-controlled SEO mechanics)
 *    - themeOverride (per-page theme overrides out of scope)
 *  Section array `min(1)` retained (.min(1) is a single state, not a
 *  range — well within Gemini's budget). */
export const HomePageGenerationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  seo: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
  }),
  sections: z
    .array(
      z.discriminatedUnion('type', [
        HeaderSectionAISchema,
        HeroSectionAISchema,
        FeatureGridSectionAISchema,
        FooterSectionAISchema,
      ]),
    )
    .min(1),
});

export type HomePageGenerationOutput = z.infer<typeof HomePageGenerationSchema>;

export const GENERATION_SCHEMA_VERSION = 'home-page-v1';
