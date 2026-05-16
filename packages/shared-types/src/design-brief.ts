// packages/shared-types/src/design-brief.ts
import { z } from 'zod';

// ---------- Enums ----------

export const BusinessDomain = z.enum([
  'gym_fitness',
  'yoga_wellness',
  'dental_clinic',
  'medical_clinic',
  'restaurant_cafe',
  'ecommerce_fashion',
  'ecommerce_general',
  'it_services',
  'saas_product',
  'law_firm',
  'real_estate',
  'construction',
  'education_tutoring',
  'salon_spa',
  'automotive',
  'nonprofit',
  'creative_agency',
  'consulting',
  'other',
]);

export const BrandArchetype = z.enum([
  // Based loosely on Jung's 12 archetypes — gives AI a concrete vocabulary
  'hero', // bold, triumphant, athletic (CrossFit gym)
  'caregiver', // warm, nurturing (pediatric dental)
  'sage', // expert, authoritative (consulting, law)
  'explorer', // adventurous, freedom (travel, outdoor)
  'creator', // imaginative, artistic (agency, design studio)
  'ruler', // premium, control, luxury (high-end fitness, lux real estate)
  'magician', // transformative, visionary (wellness, tech)
  'everyman', // approachable, honest (family restaurant, neighborhood gym)
  'lover', // sensual, intimate (spa, boutique fashion)
  'jester', // fun, playful (kids brand, casual food)
  'outlaw', // rebellious, disruptive (edgy fitness, alt fashion)
  'innocent', // pure, simple, optimistic (wellness, kids)
]);

export const LayoutArchetype = z.enum([
  'hero_centric', // one huge hero, minimal below
  'storytelling_scroll', // long narrative, sections flow
  'grid_showcase', // everything in cards
  'split_screen', // image-left/content-right repeating
  'editorial_asymmetric', // magazine-style, varied alignment
  'video_first', // big video hero dominates
  'bento_box', // mixed-size tiles (Apple-style)
  'classic_corporate', // predictable, trust-building
  'minimal_typographic', // type-driven, sparse imagery
  'immersive_visual', // full-bleed imagery, overlay text
]);

export const TypographyPairing = z.enum([
  'bebas_inter', // bold athletic display + clean sans
  'playfair_lato', // editorial serif + soft sans
  'space_grotesk_dm_sans', // modern tech
  'fraunces_inter', // contemporary serif + neutral sans
  'archivo_inter', // condensed display + neutral
  'manrope_only', // single-family minimal
  'instrument_serif_geist', // fashion-forward serif + technical sans
  'syne_inter', // geometric display + neutral
  'dm_serif_dm_sans', // matched serif+sans family
  'ibm_plex_only', // single-family corporate
  'general_sans_only', // single-family modern
  'cormorant_montserrat', // luxury serif + clean sans
  'anton_open_sans', // bold condensed + readable
  'outfit_only', // single-family rounded modern
  'epilogue_only', // single-family variable
]);

export const ColorPaletteStrategy = z.enum([
  'monochromatic', // single hue, tonal variations
  'duotone_high_contrast', // two strong colors
  'warm_earth', // browns, terracottas, creams
  'cool_premium', // navys, charcoals, off-whites
  'vibrant_energetic', // saturated, bold combos
  'pastel_soft', // muted, gentle
  'dark_mode_native', // designed for dark
  'minimal_neutral', // black/white/one accent
  'natural_organic', // greens, beiges, sage
  'neon_dark', // dark bg + electric accents
  'luxury_metallic', // dark + gold/copper accents
  'medical_clean', // whites, light blues, greens
]);

export const ImageryDirection = z.enum([
  'documentary_photography', // real, candid, gritty
  'editorial_lifestyle', // staged, magazine-quality
  'studio_product', // clean backgrounds, product focus
  'abstract_geometric', // shapes, gradients, no photos
  'illustration_flat', // flat vector illustrations
  'illustration_textured', // grain, hand-drawn feel
  '3d_render', // 3D objects, isometric
  'duotone_treated', // photos with color treatment
  'black_and_white', // BW photography
  'mixed_collage', // photos + illustration + type
  'minimal_no_imagery', // typography-driven, no images
]);

export const MotionPersonality = z.enum([
  'snappy_aggressive', // quick, harsh easing
  'smooth_premium', // slow, elegant
  'playful_bouncy', // springy, fun
  'minimal_subtle', // almost no motion
  'kinetic_dynamic', // lots of motion, parallax
]);

export const VoiceTone = z.enum([
  'confident_direct', // "Train harder. Get stronger."
  'warm_friendly', // "We're glad you're here."
  'expert_authoritative', // "Backed by 20 years of clinical research."
  'playful_irreverent', // "Yes, we know dentists are scary."
  'minimal_understated', // "Strength. Discipline. Results."
  'inspirational_uplifting', // "Your best self is waiting."
  'technical_precise', // "ISO-certified processes, measurable outcomes."
  'luxurious_evocative', // "An experience curated for the discerning few."
]);

export const Density = z.enum(['tight', 'balanced', 'airy']);
export const Radius = z.enum(['sharp', 'subtle', 'rounded', 'pill']);
export const Shadow = z.enum(['none', 'subtle', 'dramatic', 'soft_diffuse']);

// ---------- Sub-schemas ----------

export const ColorPaletteSchema = z.object({
  strategy: ColorPaletteStrategy,
  // OKLCH or HSL strings — pick one and be consistent. OKLCH is better for design tokens.
  primary: z.string(), // brand primary
  secondary: z.string(), // supporting
  accent: z.string(), // CTAs, highlights
  background: z.string(), // page background
  surface: z.string(), // cards, elevated surfaces
  foreground: z.string(), // body text
  mutedForeground: z.string(), // secondary text
  border: z.string(),
  // Semantic
  success: z.string(),
  warning: z.string(),
  danger: z.string(),
  // Optional dark mode mirror
  darkMode: z
    .object({
      background: z.string(),
      surface: z.string(),
      foreground: z.string(),
      mutedForeground: z.string(),
      border: z.string(),
    })
    .optional(),
});

export const BusinessProfileSchema = z.object({
  domain: BusinessDomain,
  domainSpecifier: z.string().optional(), // e.g. "powerlifting gym", "pediatric dental"
  businessName: z.string(),
  tagline: z.string().optional(),
  oneLineDescription: z.string(),
  services: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  targetAudience: z.string(),
  uniqueSellingPoints: z.array(z.string()),
  brandPersonality: z.array(z.string()), // free-form adjectives extracted from doc
  pricePoint: z.enum(['budget', 'mid', 'premium', 'luxury']),
  location: z
    .object({
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      isOnlineOnly: z.boolean().default(false),
    })
    .optional(),
  contact: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  socials: z.record(z.string(), z.string()).optional(),
});

// ---------- The Design Brief itself ----------

export const DesignBriefSchema = z.object({
  schemaVersion: z.literal(1),

  businessProfile: BusinessProfileSchema,

  // The "personality" axis — drives high-level feel
  brandArchetype: BrandArchetype,
  brandArchetypeRationale: z.string(),

  // Continuous traits (1-5 scale) — map to many design choices
  traits: z.object({
    energy: z.number().int().min(1).max(5), // calm <-> high-energy
    formality: z.number().int().min(1).max(5), // casual <-> formal
    warmth: z.number().int().min(1).max(5), // cool <-> warm
    sophistication: z.number().int().min(1).max(5), // playful <-> sophisticated
    trustworthiness: z.number().int().min(1).max(5), // edgy <-> trustworthy
    novelty: z.number().int().min(1).max(5), // conventional <-> novel
  }),

  // Visual system
  colorPalette: ColorPaletteSchema,
  colorPaletteRationale: z.string(),

  typography: TypographyPairing,
  typographyRationale: z.string(),

  layoutArchetype: LayoutArchetype,
  layoutArchetypeRationale: z.string(),

  imagery: ImageryDirection,
  imageryRationale: z.string(),

  // Style tokens
  density: Density,
  radius: Radius,
  shadow: Shadow,

  motion: MotionPersonality,

  // Copy
  voice: VoiceTone,
  voiceRationale: z.string(),
  // Optional explicit examples to guide content gen
  voiceExamples: z
    .object({
      headline: z.string().optional(),
      cta: z.string().optional(),
      microcopy: z.string().optional(),
    })
    .optional(),

  // Component preferences — soft hints, not hard requirements
  componentPreferences: z.object({
    heroVariantHint: z
      .enum([
        'centered_text_over_image',
        'split_image_right',
        'split_image_left',
        'video_background',
        'gradient_mesh',
        'asymmetric_floating',
        'minimal_typographic',
      ])
      .optional(),
    cardStyleHint: z.enum(['flat', 'outlined', 'elevated', 'glass']).optional(),
    buttonStyleHint: z.enum(['solid', 'outlined', 'ghost', 'pill']).optional(),
  }),

  // What pages this site should have (locked in by the architect step,
  // but the brief carries the initial recommendation)
  recommendedPages: z.array(
    z.object({
      slug: z.string(), // "home", "services", "contact"
      title: z.string(), // "Our Services"
      purpose: z.string(), // one-line purpose
      priority: z.enum(['primary', 'secondary', 'optional']),
    }),
  ),
});

export type DesignBrief = z.infer<typeof DesignBriefSchema>;
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
