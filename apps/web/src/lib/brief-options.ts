// Human-friendly labels + complete option lists for DesignBrief enums.
// Source of truth for the enum values remains in @repo/shared-types; this
// file just maps them to UX strings used in dropdowns.

export const ARCHETYPE_OPTIONS = [
  { value: 'hero', label: 'Hero — bold, triumphant, transformation' },
  { value: 'caregiver', label: 'Caregiver — warm, nurturing, protective' },
  { value: 'sage', label: 'Sage — expert, evidence-led, authoritative' },
  { value: 'explorer', label: 'Explorer — adventurous, freedom-seeking' },
  { value: 'creator', label: 'Creator — imaginative, artistic' },
  { value: 'ruler', label: 'Ruler — premium, control, mastery' },
  { value: 'magician', label: 'Magician — transformative, visionary' },
  { value: 'everyman', label: 'Everyman — approachable, honest' },
  { value: 'lover', label: 'Lover — sensual, intimate, indulgent' },
  { value: 'jester', label: 'Jester — playful, irreverent, fun' },
  { value: 'outlaw', label: 'Outlaw — rebellious, disruptive' },
  { value: 'innocent', label: 'Innocent — pure, simple, optimistic' },
] as const;

export const PALETTE_STRATEGY_OPTIONS = [
  { value: 'monochromatic', label: 'Monochromatic — single hue, tonal' },
  { value: 'duotone_high_contrast', label: 'Duotone — two strong colors' },
  { value: 'warm_earth', label: 'Warm earth — browns, terracottas, creams' },
  { value: 'cool_premium', label: 'Cool premium — navy, charcoal, off-white' },
  { value: 'vibrant_energetic', label: 'Vibrant energetic — saturated, bold' },
  { value: 'pastel_soft', label: 'Pastel soft — muted, gentle' },
  { value: 'dark_mode_native', label: 'Dark mode native' },
  { value: 'minimal_neutral', label: 'Minimal neutral — black, white, one accent' },
  { value: 'natural_organic', label: 'Natural organic — greens, beiges, sage' },
  { value: 'neon_dark', label: 'Neon dark — dark base + electric accents' },
  { value: 'luxury_metallic', label: 'Luxury metallic — dark + gold' },
  { value: 'medical_clean', label: 'Medical clean — whites, light blues, greens' },
] as const;

export const TYPOGRAPHY_OPTIONS = [
  { value: 'bebas_inter', label: 'Bebas Neue + Inter' },
  { value: 'playfair_lato', label: 'Playfair Display + Lato' },
  { value: 'space_grotesk_dm_sans', label: 'Space Grotesk + DM Sans' },
  { value: 'fraunces_inter', label: 'Fraunces + Inter' },
  { value: 'archivo_inter', label: 'Archivo + Inter' },
  { value: 'manrope_only', label: 'Manrope only' },
  { value: 'instrument_serif_geist', label: 'Instrument Serif + Geist' },
  { value: 'syne_inter', label: 'Syne + Inter' },
  { value: 'dm_serif_dm_sans', label: 'DM Serif Display + DM Sans' },
  { value: 'ibm_plex_only', label: 'IBM Plex only' },
  { value: 'general_sans_only', label: 'General Sans only' },
  { value: 'cormorant_montserrat', label: 'Cormorant + Montserrat' },
  { value: 'anton_open_sans', label: 'Anton + Open Sans' },
  { value: 'outfit_only', label: 'Outfit only' },
  { value: 'epilogue_only', label: 'Epilogue only' },
] as const;

export const LAYOUT_OPTIONS = [
  { value: 'hero_centric', label: 'Hero-centric' },
  { value: 'storytelling_scroll', label: 'Storytelling scroll' },
  { value: 'grid_showcase', label: 'Grid showcase' },
  { value: 'split_screen', label: 'Split-screen' },
  { value: 'editorial_asymmetric', label: 'Editorial asymmetric' },
  { value: 'video_first', label: 'Video-first' },
  { value: 'bento_box', label: 'Bento box' },
  { value: 'classic_corporate', label: 'Classic corporate' },
  { value: 'minimal_typographic', label: 'Minimal typographic' },
  { value: 'immersive_visual', label: 'Immersive visual' },
] as const;

export const IMAGERY_OPTIONS = [
  { value: 'documentary_photography', label: 'Documentary photography' },
  { value: 'editorial_lifestyle', label: 'Editorial lifestyle' },
  { value: 'studio_product', label: 'Studio product' },
  { value: 'abstract_geometric', label: 'Abstract geometric' },
  { value: 'illustration_flat', label: 'Illustration — flat' },
  { value: 'illustration_textured', label: 'Illustration — textured' },
  { value: '3d_render', label: '3D render' },
  { value: 'duotone_treated', label: 'Duotone treated' },
  { value: 'black_and_white', label: 'Black & white' },
  { value: 'mixed_collage', label: 'Mixed collage' },
  { value: 'minimal_no_imagery', label: 'Minimal — no imagery' },
] as const;

export const DENSITY_OPTIONS = [
  { value: 'tight', label: 'Tight' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'airy', label: 'Airy' },
] as const;

export const RADIUS_OPTIONS = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
] as const;

export const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'soft_diffuse', label: 'Soft diffuse' },
] as const;

export const MOTION_OPTIONS = [
  { value: 'snappy_aggressive', label: 'Snappy aggressive' },
  { value: 'smooth_premium', label: 'Smooth premium' },
  { value: 'playful_bouncy', label: 'Playful bouncy' },
  { value: 'minimal_subtle', label: 'Minimal subtle' },
  { value: 'kinetic_dynamic', label: 'Kinetic dynamic' },
] as const;

export const VOICE_OPTIONS = [
  { value: 'confident_direct', label: 'Confident, direct' },
  { value: 'warm_friendly', label: 'Warm, friendly' },
  { value: 'expert_authoritative', label: 'Expert, authoritative' },
  { value: 'playful_irreverent', label: 'Playful, irreverent' },
  { value: 'minimal_understated', label: 'Minimal, understated' },
  { value: 'inspirational_uplifting', label: 'Inspirational, uplifting' },
  { value: 'technical_precise', label: 'Technical, precise' },
  { value: 'luxurious_evocative', label: 'Luxurious, evocative' },
] as const;

export const HERO_VARIANT_OPTIONS = [
  { value: 'centered_text_over_image', label: 'Centered text over image' },
  { value: 'split_image_right', label: 'Split — image right' },
  { value: 'split_image_left', label: 'Split — image left' },
  { value: 'video_background', label: 'Video background' },
  { value: 'gradient_mesh', label: 'Gradient mesh' },
  { value: 'asymmetric_floating', label: 'Asymmetric floating' },
  { value: 'minimal_typographic', label: 'Minimal typographic' },
] as const;

export const CARD_STYLE_OPTIONS = [
  { value: 'flat', label: 'Flat' },
  { value: 'outlined', label: 'Outlined' },
  { value: 'elevated', label: 'Elevated' },
  { value: 'glass', label: 'Glass' },
] as const;

export const BUTTON_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'outlined', label: 'Outlined' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'pill', label: 'Pill' },
] as const;

export const PAGE_PRIORITY_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'optional', label: 'Optional' },
] as const;

export const TRAIT_LABELS: readonly {
  key: 'energy' | 'formality' | 'warmth' | 'sophistication' | 'trustworthiness' | 'novelty';
  label: string;
  low: string;
  high: string;
}[] = [
  { key: 'energy', label: 'Energy', low: 'Calm', high: 'High-energy' },
  { key: 'formality', label: 'Formality', low: 'Casual', high: 'Formal' },
  { key: 'warmth', label: 'Warmth', low: 'Cool', high: 'Warm' },
  { key: 'sophistication', label: 'Sophistication', low: 'Playful', high: 'Sophisticated' },
  { key: 'trustworthiness', label: 'Trustworthiness', low: 'Edgy', high: 'Trustworthy' },
  { key: 'novelty', label: 'Novelty', low: 'Conventional', high: 'Novel' },
];

// Color palette swatch order — matches the schema's required twelve fields
// plus the optional darkMode subset. Used to render the swatch grid.
export const PALETTE_SWATCHES = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'mutedForeground', label: 'Muted FG' },
  { key: 'border', label: 'Border' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'danger', label: 'Danger' },
] as const;

export const DARK_MODE_SWATCHES = [
  { key: 'background', label: 'Dark BG' },
  { key: 'surface', label: 'Dark surface' },
  { key: 'foreground', label: 'Dark FG' },
  { key: 'mutedForeground', label: 'Dark muted FG' },
  { key: 'border', label: 'Dark border' },
] as const;
