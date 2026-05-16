/**
 * image-resolution.ts
 *
 * Post-AI enrichment step: walks the Site tree and populates `ImageRef.url`
 * for every image that has a `query` but no `url`.
 *
 * Uses the Unsplash Source API (no key, no rate-limit at generation time):
 *   https://source.unsplash.com/featured/<width>x<height>/?<comma-joined-query>
 *
 * The URL is a redirect — Unsplash resolves it to a matching photo at
 * request time (i.e. when the browser fetches the image). This means:
 *   - Zero latency added at generation time
 *   - Zero API key required
 *   - Each render independently pulls a matching photo
 *
 * Dimensions by surface:
 *   hero media.image  → 1600×900  (wide banner)
 *   feature_grid item → 800×600   (card image)
 *   other             → 1200×800  (default)
 *
 * Pure function — returns a new Site, does not mutate the input.
 */

import { type Site } from '@repo/shared-types';

const UNSPLASH_BASE = 'https://source.unsplash.com/featured';

type Dimensions = `${number}x${number}`;

const HERO_DIM: Dimensions = '1600x900';
const GRID_DIM: Dimensions = '800x600';

/** Build a Unsplash Source URL from a query string and target dimensions. */
function buildUrl(query: string, dim: Dimensions): string {
  // Normalise: split on spaces, join with commas, URL-encode the result.
  const encoded = encodeURIComponent(query.trim().replace(/\s+/g, ','));
  return `${UNSPLASH_BASE}/${dim}/?${encoded}`;
}

/** Return `url` if already set; otherwise derive from `query` if present.
 *  Accepts `string | undefined` for both params to satisfy exactOptionalPropertyTypes. */
function resolveUrl(
  existingUrl: string | undefined,
  query: string | undefined,
  dim: Dimensions,
): string | undefined {
  if (existingUrl) return existingUrl;
  if (query) return buildUrl(query, dim);
  return undefined;
}

export function resolveImageRefs(site: Site): Site {
  const pages = site.pages.map((page) => {
    const sections = page.sections.map((section) => {
      if (section.type === 'hero') {
        const media = section.props.media;
        if (media?.kind === 'image' && media.image) {
          const url = resolveUrl(media.image.url, media.image.query, HERO_DIM);
          if (url === media.image.url) return section; // nothing changed
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
        const items = section.props.items.map((item) => {
          if (!item.image) return item;
          const url = resolveUrl(item.image.url, item.image.query, GRID_DIM);
          if (url === item.image.url) return item;
          return { ...item, image: { ...item.image, url } };
        });
        // Avoid rebuilding if nothing changed
        const anyChanged = items.some((item, i) => item !== section.props.items[i]);
        if (!anyChanged) return section;
        return { ...section, props: { ...section.props, items } };
      }

      // Other section types: no-op for Phase 3-minimal.
      // Future phases can add about.image, testimonials, etc. here.
      return section;
    });

    const anyChanged = sections.some((s, i) => s !== page.sections[i]);
    if (!anyChanged) return page;
    return { ...page, sections };
  });

  const anyPageChanged = pages.some((p, i) => p !== site.pages[i]);
  if (!anyPageChanged) return site;
  return { ...site, pages };
}
