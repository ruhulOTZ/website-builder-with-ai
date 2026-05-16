// Verifies the brief eval cache hashing + read/write round-trip without
// any AI call. Mirrors verify-cache-key.ts for parser, but uses the brief
// cache directory and a DesignBrief payload.
//
// Run via `pnpm --filter api eval:cache:verify:brief`.

import { readdir, readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { type DesignBrief, DesignBriefSchema } from '@repo/shared-types';

import { computeCacheKey, readCache, writeCache } from './file-cache';

const FIXTURE_PATH = resolve(
  __dirname,
  '../test/fixtures/requirements/gym-powerlifting-detailed.txt',
);
const MODEL = 'gemini-2.5-flash';
const BRIEF_CACHE_DIR = resolve(__dirname, '../test/eval-output/.cache-brief');
const SMOKE_BRIEF_ROOT = resolve(__dirname, '../test/eval-output');

interface BriefCachedEntry {
  brief: DesignBrief;
  modelUsed: string;
  promptVersion: string;
  durationMs: number;
  cachedAt: string;
}

/**
 * Locate the most recent smoke-brief archive and load its DesignBrief.
 * The synthetic round-trip needs a real, schema-valid brief so the
 * verifier exercises the same payload shape the eval rig will store.
 */
async function loadSmokeBrief(): Promise<DesignBrief> {
  const entries = await readdir(SMOKE_BRIEF_ROOT);
  const smokeDirs = entries
    .filter((e) => e.startsWith('smoke-brief-'))
    .sort()
    .reverse();
  if (smokeDirs.length === 0) {
    throw new Error(
      `No smoke-brief archive under ${SMOKE_BRIEF_ROOT}. Run \`pnpm --filter api smoke:brief\` first.`,
    );
  }
  const latest = smokeDirs[0];
  if (latest === undefined) throw new Error('unreachable: filtered array is non-empty');
  const archived = JSON.parse(
    await readFile(join(SMOKE_BRIEF_ROOT, latest, 'brief.json'), 'utf8'),
  ) as { brief: unknown };
  return DesignBriefSchema.parse(archived.brief);
}

async function main(): Promise<void> {
  const fixtureContent = await readFile(FIXTURE_PATH, 'utf8');

  const keyV1a = computeCacheKey({
    fixtureContent,
    promptVersion: 'brief-v1',
    modelName: MODEL,
  });
  const keyV1b = computeCacheKey({
    fixtureContent,
    promptVersion: 'brief-v1',
    modelName: MODEL,
  });
  const determinismOk = keyV1a === keyV1b;

  const keyV2 = computeCacheKey({
    fixtureContent,
    promptVersion: 'brief-v2',
    modelName: MODEL,
  });
  const invalidationOk = keyV1a !== keyV2;

  // Round-trip with a real brief payload (sourced from latest smoke run).
  const realBrief = await loadSmokeBrief();
  const tmpKey = `__verify_${Date.now().toString(36)}`;
  const synthetic: BriefCachedEntry = {
    brief: realBrief,
    modelUsed: MODEL,
    promptVersion: 'brief-v1',
    durationMs: 0,
    cachedAt: new Date().toISOString(),
  };
  await writeCache(BRIEF_CACHE_DIR, tmpKey, synthetic);
  const readBack = await readCache<BriefCachedEntry>(BRIEF_CACHE_DIR, tmpKey);
  const roundTripOk =
    readBack !== null &&
    readBack.brief.businessProfile.businessName === synthetic.brief.businessProfile.businessName &&
    readBack.brief.brandArchetype === synthetic.brief.brandArchetype &&
    readBack.modelUsed === synthetic.modelUsed &&
    readBack.promptVersion === synthetic.promptVersion;
  await unlink(join(BRIEF_CACHE_DIR, `${tmpKey}.json`)).catch(() => {
    /* ignore */
  });

  // eslint-disable-next-line no-console
  console.log(`
Cache-key verification (brief)
──────────────────────────────────────────────
  fixture:               ${FIXTURE_PATH}
  hash (brief-v1):       ${keyV1a}
  hash (brief-v1) again: ${keyV1b}
  determinism check:     ${determinismOk ? 'PASS' : 'FAIL'}

  hash (brief-v2):       ${keyV2}
  invalidation check:    ${invalidationOk ? 'PASS' : 'FAIL'}

  round-trip cache I/O:  ${roundTripOk ? 'PASS' : 'FAIL'}
──────────────────────────────────────────────`);

  const allOk = determinismOk && invalidationOk && roundTripOk;
  process.exit(allOk ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error('verify-brief-cache-key: unhandled', err);
  process.exit(2);
});
