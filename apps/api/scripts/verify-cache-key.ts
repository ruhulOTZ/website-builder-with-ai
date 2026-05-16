// Verifies the file-cache hashing + read/write round-trip without any AI call.
// Run via `pnpm --filter api eval:cache:verify`.
//
// What this exercises:
//   1. Determinism: hashing the same (content + version + model) twice yields
//      the same hex digest.
//   2. Invalidation: changing the prompt version produces a different digest.
//   3. Round-trip: a synthetic cached entry written to .cache/<tmp>.json can
//      be read back identically. Test entry is removed before exit so it
//      doesn't pollute the real cache.

import { readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { type BusinessProfile } from '@repo/shared-types';

import { computeCacheKey, readCache, writeCache } from './file-cache';

const FIXTURE_PATH = resolve(
  __dirname,
  '../test/fixtures/requirements/gym-powerlifting-detailed.txt',
);
const MODEL = 'gemini-2.5-flash';
const PARSE_CACHE_DIR = resolve(__dirname, '../test/eval-output/.cache');

interface ParseCachedEntry {
  profile: BusinessProfile;
  modelUsed: string;
  promptVersion: string;
  durationMs: number;
  cachedAt: string;
}

async function main(): Promise<void> {
  const fixtureContent = await readFile(FIXTURE_PATH, 'utf8');

  // 1. Determinism: same inputs → same hash, run twice.
  const keyV1a = computeCacheKey({
    fixtureContent,
    promptVersion: 'parse-v1',
    modelName: MODEL,
  });
  const keyV1b = computeCacheKey({
    fixtureContent,
    promptVersion: 'parse-v1',
    modelName: MODEL,
  });
  const determinismOk = keyV1a === keyV1b;

  // 2. Invalidation: different prompt version → different hash.
  const keyV2 = computeCacheKey({
    fixtureContent,
    promptVersion: 'parse-v2',
    modelName: MODEL,
  });
  const invalidationOk = keyV1a !== keyV2;

  // 3. Round-trip: write a synthetic entry under a tmp key, read it back.
  const tmpKey = `__verify_${Date.now().toString(36)}`;
  const synthetic: ParseCachedEntry = {
    profile: {
      domain: 'gym_fitness',
      businessName: 'Iron Halo',
      oneLineDescription: 'verify-cache-key synthetic entry',
      services: [],
      targetAudience: 'synthetic',
      uniqueSellingPoints: [],
      brandPersonality: [],
      pricePoint: 'mid',
    },
    modelUsed: MODEL,
    promptVersion: 'parse-v1',
    durationMs: 0,
    cachedAt: new Date().toISOString(),
  };
  await writeCache(PARSE_CACHE_DIR, tmpKey, synthetic);
  const readBack = await readCache<ParseCachedEntry>(PARSE_CACHE_DIR, tmpKey);
  const roundTripOk =
    readBack !== null &&
    readBack.profile.businessName === synthetic.profile.businessName &&
    readBack.modelUsed === synthetic.modelUsed &&
    readBack.promptVersion === synthetic.promptVersion;
  // Clean up the tmp entry.
  await unlink(join(PARSE_CACHE_DIR, `${tmpKey}.json`)).catch(() => {
    /* ignore */
  });

  // eslint-disable-next-line no-console
  console.log(`
Cache-key verification (parse)
──────────────────────────────────────────────
  fixture:               ${FIXTURE_PATH}
  hash (parse-v1):       ${keyV1a}
  hash (parse-v1) again: ${keyV1b}
  determinism check:     ${determinismOk ? 'PASS' : 'FAIL'}

  hash (parse-v2):       ${keyV2}
  invalidation check:    ${invalidationOk ? 'PASS' : 'FAIL'}

  round-trip cache I/O:  ${roundTripOk ? 'PASS' : 'FAIL'}
──────────────────────────────────────────────`);

  const allOk = determinismOk && invalidationOk && roundTripOk;
  process.exit(allOk ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error('verify-cache-key: unhandled', err);
  process.exit(2);
});
