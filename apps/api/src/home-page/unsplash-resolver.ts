/**
 * unsplash-resolver.ts
 *
 * Wraps the Unsplash official API (https://api.unsplash.com) behind the
 * `ImageResolver` contract from image-resolution.ts.
 *
 * Why the official API and not the old `source.unsplash.com` redirect:
 *   Unsplash deprecated the unauthenticated Source endpoint in 2023; it now
 *   returns 503 Service Unavailable for every request. Topic-matched photos
 *   require an authenticated API call against /search/photos with an access
 *   key (free demo tier: 50 requests/hour).
 *
 * Failure model:
 *   - Network error / non-2xx response / empty results → resolver returns
 *     undefined for that ImageRef. Generation still succeeds; the rendered
 *     page falls back to the placeholder scrim (see CenteredTextOverImage).
 *   - Wrong key: Unsplash returns 401; logged as a warning, no throw.
 *   - Rate-limit: 403 with `X-Ratelimit-Remaining: 0`; logged, no throw.
 *
 * If you need attribution rendering later, the API also returns:
 *   results[0].user.name, results[0].user.links.html, results[0].links.html
 * Add an `attribution` field to ImageRefSchema and extend the resolver
 * signature to return both `url` and attribution data.
 */

import { Logger } from '@nestjs/common';

import { type ImageResolver } from './image-resolution';

const UNSPLASH_BASE = 'https://api.unsplash.com';

interface UnsplashPhoto {
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

const logger = new Logger('UnsplashResolver');

/**
 * No-op resolver — used when `UNSPLASH_ACCESS_KEY` is unset. ImageRefs keep
 * `url` undefined and pages render with placeholder scrims. Used to keep the
 * generation pipeline working in environments without an Unsplash key
 * configured (CI, fresh checkouts).
 */
export const noopResolver: ImageResolver = () => Promise.resolve(undefined);

/**
 * Perform one Unsplash search. Returns the URL on success, null when the
 * search ran cleanly but returned no matches, and undefined on hard errors
 * (4xx/5xx/network) — the caller may want to abort the fallback chain on
 * a hard error rather than burn through retries.
 */
async function searchOnce(
  accessKey: string,
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish',
): Promise<string | null | undefined> {
  const url = new URL('/search/photos', UNSPLASH_BASE);
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', orientation);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });
    if (!response.ok) {
      logger.warn(`Unsplash search failed (${String(response.status)}) for query "${query}"`);
      return undefined;
    }
    const body = (await response.json()) as UnsplashSearchResponse;
    const first = body.results[0];
    if (!first) return null;
    // `regular` is ~1080px wide — fine for hero (we don't need the full
    // 4000px raw) and for grid cards. Browsers handle resizing.
    return first.urls.regular;
  } catch (err) {
    logger.warn(
      `Unsplash search threw for query "${query}": ${err instanceof Error ? err.message : String(err)}`,
    );
    return undefined;
  }
}

/**
 * Reduce a long query to a shorter candidate. The AI sometimes emits very
 * descriptive queries (e.g. "beginner climber learning bouldering technique
 * in gym natural light") that Unsplash returns zero hits for. Drop trailing
 * adjectives and qualifier phrases first, since the most-specific information
 * usually sits at the front of the AI's prompt.
 */
function* shortenQuery(query: string): Generator<string> {
  const words = query.trim().split(/\s+/);
  // Tries: first 5 words, then first 3, then first 2, then first 1.
  for (const n of [5, 3, 2, 1]) {
    if (n >= words.length) continue;
    yield words.slice(0, n).join(' ');
  }
}

/** Build an Unsplash-backed resolver. The key is captured in closure. */
export function createUnsplashResolver(accessKey: string): ImageResolver {
  return async (query, dim) => {
    const orientation = pickOrientation(dim);

    // First attempt: the full query as the AI emitted it.
    const first = await searchOnce(accessKey, query, orientation);
    if (typeof first === 'string') return first;
    // Hard error (401 / network / etc.) — don't burn retries, the fallback
    // queries will hit the same failure.
    if (first === undefined) return undefined;

    // first === null → ran cleanly but no matches. Try progressively shorter
    // variants until one returns a hit.
    for (const shorter of shortenQuery(query)) {
      const retry = await searchOnce(accessKey, shorter, orientation);
      if (typeof retry === 'string') {
        logger.log(`Unsplash fallback succeeded with "${shorter}" (original: "${query}")`);
        return retry;
      }
      if (retry === undefined) return undefined;
    }

    logger.warn(`Unsplash search exhausted all fallbacks for query "${query}"`);
    return undefined;
  };
}

/** Map a `WxH` dimension string to an Unsplash orientation enum. */
function pickOrientation(dim: string): 'landscape' | 'portrait' | 'squarish' {
  const match = /^(\d+)x(\d+)$/.exec(dim);
  if (!match) return 'landscape';
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (w === h) return 'squarish';
  return w > h ? 'landscape' : 'portrait';
}
