import { type Section } from '@repo/shared-types';
import { type ComponentType } from 'react';

import { FeatureGrid } from '../sections/feature-grid';
import { Footer } from '../sections/footer';
import { Header } from '../sections/header';
import { Hero } from '../sections/hero';

/**
 * For a given Section discriminator, the registered component (if any) must
 * accept that exact narrowed Section shape — Header takes HeaderSection,
 * Hero takes HeroSection, etc.
 */
type SectionComponent<T extends Section['type']> = ComponentType<Extract<Section, { type: T }>>;

type RegistryShape = {
  [T in Section['type']]: SectionComponent<T> | null;
};

/**
 * Section type → component. `satisfies RegistryShape` guarantees every
 * Section['type'] is covered; adding a new section type to the schema will
 * fail compilation here until it's registered (even if as `null`). That's
 * the contract — the renderer cannot silently drop a new type.
 *
 * `null` entries are intentional placeholders for section types that aren't
 * yet implemented in the component library; SectionRenderer renders the
 * UnknownSection fallback for them.
 */
export const SECTION_REGISTRY = {
  header: Header,
  hero: Hero,
  feature_grid: FeatureGrid,
  footer: Footer,

  // Not yet implemented — explicit null, not missing key.
  service_list: null,
  about: null,
  stats: null,
  testimonials: null,
  pricing: null,
  faq: null,
  cta_block: null,
  contact: null,
  logo_cloud: null,
  gallery: null,
  team: null,
  rich_text: null,
} satisfies RegistryShape;

export type SectionRegistry = typeof SECTION_REGISTRY;
