/**
 * image-resolution.ts
 *
 * Post-AI enrichment step: walks the Site tree and populates `ImageRef.url`
 * for every image that has a `query` but no `url`.
 *
 * URL resolution is delegated to an injected `ImageResolver` — production
 * uses `createUnsplashResolver` (against api.unsplash.com), tests pass a
 * stub, and environments without a key get `noopResolver` (URLs stay
 * undefined and pages render with placeholder scrims).
 *
 * Dimensions by surface:
 *   hero media.image  → 1600×900  (wide banner)
 *   feature_grid item → 800×600   (card image)
 *
 * Returns a new Site; does not mutate the input.
 */

import { type Site } from '@repo/shared-types';

export type Dimensions = `${number}x${number}`;

/**
 * Looks up a URL for a given query at the requested dimensions, or
 * returns undefined if no match can be resolved. Implementations may make
 * network calls (Unsplash) or be pure (no-op, fixture).
 */
export type ImageResolver = (query: string, dim: Dimensions) => Promise<string | undefined>;

export const HERO_DIM: Dimensions = '1600x900';
export const GRID_DIM: Dimensions = '800x600';

/**
 * Returns the existing URL if already set; otherwise asks the resolver for
 * a URL matching `query`. Returns undefined if both `existingUrl` and
 * `query` are absent, or the resolver could not satisfy the query.
 */
async function resolveOrKeep(
  existingUrl: string | undefined,
  query: string | undefined,
  dim: Dimensions,
  resolver: ImageResolver,
): Promise<string | undefined> {
  if (existingUrl) return existingUrl;
  if (!query) return undefined;
  return resolver(query, dim);
}

export async function resolveImageRefs(site: Site, resolver: ImageResolver): Promise<Site> {
  const pages = await Promise.all(
    site.pages.map(async (page) => {
      const sections = await Promise.all(
        page.sections.map(async (section) => {
          if (section.type === 'hero') {
            const media = section.props.media;
            if (media?.kind === 'image' && media.image) {
              const url = await resolveOrKeep(
                media.image.url,
                media.image.query,
                HERO_DIM,
                resolver,
              );
              if (url === media.image.url) return section;
              return {
                ...section,
                props: {
                  ...section.props,
                  media: {
                    ...media,
                    image: { ...media.image, url },
                  },
                },
              };
            }
            return section;
          }

          if (section.type === 'feature_grid') {
            const items = await Promise.all(
              section.props.items.map(async (item) => {
                if (!item.image) return item;
                const url = await resolveOrKeep(
                  item.image.url,
                  item.image.query,
                  GRID_DIM,
                  resolver,
                );
                if (url === item.image.url) return item;
                return { ...item, image: { ...item.image, url } };
              }),
            );
            const anyChanged = items.some((item, i) => item !== section.props.items[i]);
            if (!anyChanged) return section;
            return { ...section, props: { ...section.props, items } };
          }

          // Other section types: no-op for Phase 3-minimal.
          // Future phases can add about.image, testimonials, etc. here.
          return section;
        }),
      );

      const anyChanged = sections.some((s, i) => s !== page.sections[i]);
      if (!anyChanged) return page;
      return { ...page, sections };
    }),
  );

  const anyPageChanged = pages.some((p, i) => p !== site.pages[i]);
  if (!anyPageChanged) return site;
  return { ...site, pages };
}
