// File-backed cache for eval runs. Generic over the cached value's type —
// the parser eval caches BusinessProfile entries, the brief eval caches
// DesignBrief entries, both go through this module with their own cache
// directories.
//
// Skips the AI call when (fixture content + prompt version + model name)
// all match a previous successful run. Indefinite retention — disk is cheap,
// hashes are stable, bumping PROMPT_VERSION automatically invalidates the
// relevant entries.
//
// Cache key: SHA-256 hex of `<fixture content>|<promptVersion>|<modelName>`
// using `|` as separator (unlikely to appear in fixture text).
//
// Cache file: <cacheDir>/<hash>.json
//
// We deliberately do NOT cache failed runs. Errors always re-run on the
// next invocation — the user wants a fresh look at any failure mode.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

export interface CacheKeyInputs {
  fixtureContent: string;
  promptVersion: string;
  modelName: string;
}

/**
 * Deterministic SHA-256 over (fixtureContent | promptVersion | modelName).
 * The same three inputs always produce the same hex hash; any change to any
 * input changes the hash. This is the cache invalidation strategy.
 */
export function computeCacheKey(inputs: CacheKeyInputs): string {
  const h = createHash('sha256');
  h.update(inputs.fixtureContent);
  h.update('|');
  h.update(inputs.promptVersion);
  h.update('|');
  h.update(inputs.modelName);
  return h.digest('hex');
}

function cachePathFor(cacheDir: string, key: string): string {
  return join(cacheDir, `${key}.json`);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the cached entry if present and parseable, or `null` if absent /
 * corrupt. We treat parse failures as misses so a malformed cache file never
 * blocks a fresh run.
 *
 * The caller chooses `T` — there is no schema validation at the cache layer.
 * If the cached payload doesn't match `T`, the caller is responsible for
 * detecting and recovering.
 */
export async function readCache<T>(cacheDir: string, key: string): Promise<T | null> {
  const path = cachePathFor(cacheDir, key);
  if (!(await fileExists(path))) return null;
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Write a successful run to cache. Creates `cacheDir` on first use. */
export async function writeCache<T>(cacheDir: string, key: string, entry: T): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePathFor(cacheDir, key), JSON.stringify(entry, null, 2), 'utf8');
}
