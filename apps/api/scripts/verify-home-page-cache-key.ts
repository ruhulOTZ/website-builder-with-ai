// Verifies the home-page eval cache hashing + read/write round-trip
// without any AI call. Mirrors verify-brief-cache-key.ts but uses the
// home-page cache directory and a Site payload.
//
// Three checks:
//   1. Determinism — same inputs hash to the same key
//   2. Invalidation — changing any input changes the hash
//   3. Round-trip — what we write to the cache reads back identically
//      and parses as a valid Site
//
// The round-trip payload is synthesized from a real DesignBrief fixture
// + briefToThemeTokens + a minimal hand-coded Page. This exercises the
// same Site shape the eval rig will cache without spending an AI call.
// Once a smoke-home-page archive exists we could source from there; for
// now this is self-contained.
//
// Run via `pnpm --filter api eval:cache:verify:home-page`.

import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { type DesignBrief, DesignBriefSchema, type Site, SiteSchema } from '@repo/shared-types';

import { briefToThemeTokens } from '../src/home-page/brief-to-theme';

import { computeCacheKey, readCache, writeCache } from './file-cache';

const FIXTURE_PATH = resolve(
  __dirname,
  '../test/fixtures/requirements/gym-powerlifting-detailed.txt',
);
const BRIEF_PATH = resolve(
  __dirname,
  '../test/fixtures/design-briefs/gym-powerlifting-detailed.json',
);
const PROFILE_PATH = resolve(
  __dirname,
  '../test/fixtures/parsed-profiles/gym-powerlifting-detailed.json',
);
const MODEL = 'gemini-2.5-flash';
const HOME_PAGE_CACHE_DIR = resolve(__dirname, '../test/eval-output/.cache-home-page');

interface HomePageCachedEntry {
  site: Site;
  modelUsed: string;
  promptVersion: string;
  durationMs: number;
  cachedAt: string;
}

/**
 * Synthesize a minimal valid Site from the gym brief snapshot. The
 * round-trip needs a real-shape payload so the verifier exercises the same
 * Site structure the eval rig will store. Only includes a Header so the
 * synthetic stays small; SiteSchema.parse is the validity gate.
 */
async function synthesizeSite(): Promise<Site> {
  const briefRaw = await readFile(BRIEF_PATH, 'utf8');
  const brief: DesignBrief = DesignBriefSchema.parse(JSON.parse(briefRaw));
  const profileRaw = await readFile(PROFILE_PATH, 'utf8');
  const profile = JSON.parse(profileRaw) as { businessName: string; oneLineDescription: string };

  const site: Site = SiteSchema.parse({
    schemaVersion: 1,
    id: `site_verify_${randomUUID()}`,
    designBriefId: 'brief_verify_test',
    metadata: {
      siteName: profile.businessName,
      siteDescription: profile.oneLineDescription,
      locale: 'en',
    },
    theme: briefToThemeTokens(brief),
    navigation: {
      primary: [{ label: 'Home', href: '/', external: false }],
    },
    pages: [
      {
        id: 'page_home',
        slug: '',
        title: 'Home',
        seo: {
          metaTitle: `${profile.businessName} — verify-cache synthetic`,
          metaDescription: 'Synthetic site for cache round-trip verification.',
        },
        sections: [
          {
            id: 'sec_header',
            type: 'header',
            variant: 'logo_left_links_right',
            props: {
              logo: { text: profile.businessName },
              links: [{ label: 'Home', href: '/', external: false }],
            },
          },
        ],
      },
    ],
    generation: {
      generatedAt: new Date().toISOString(),
      model: MODEL,
      promptVersion: 'home-page-v1',
    },
  });
  return site;
}

async function main(): Promise<void> {
  const fixtureContent = await readFile(FIXTURE_PATH, 'utf8');

  const keyV1a = computeCacheKey({
    fixtureContent,
    promptVersion: 'home-page-v1',
    modelName: MODEL,
  });
  const keyV1b = computeCacheKey({
    fixtureContent,
    promptVersion: 'home-page-v1',
    modelName: MODEL,
  });
  const determinismOk = keyV1a === keyV1b;

  const keyV2 = computeCacheKey({
    fixtureContent,
    promptVersion: 'home-page-v2',
    modelName: MODEL,
  });
  const invalidationPromptOk = keyV1a !== keyV2;

  const keyDifferentModel = computeCacheKey({
    fixtureContent,
    promptVersion: 'home-page-v1',
    modelName: 'gemini-2.5-pro',
  });
  const invalidationModelOk = keyV1a !== keyDifferentModel;

  const keyDifferentFixture = computeCacheKey({
    fixtureContent: fixtureContent + '\n# extra line\n',
    promptVersion: 'home-page-v1',
    modelName: MODEL,
  });
  const invalidationContentOk = keyV1a !== keyDifferentFixture;

  // Round-trip with a real-shape Site payload (synthetic but
  // SiteSchema-validated so it matches what the eval rig will cache).
  const site = await synthesizeSite();
  const tmpKey = `__verify_${Date.now().toString(36)}`;
  const synthetic: HomePageCachedEntry = {
    site,
    modelUsed: MODEL,
    promptVersion: 'home-page-v1',
    durationMs: 0,
    cachedAt: new Date().toISOString(),
  };
  await writeCache(HOME_PAGE_CACHE_DIR, tmpKey, synthetic);
  const readBack = await readCache<HomePageCachedEntry>(HOME_PAGE_CACHE_DIR, tmpKey);
  // Validate it parses back through SiteSchema after the JSON round-trip —
  // catches any field that doesn't survive serialization (e.g. dates,
  // undefineds that should be omitted).
  const roundTripOk =
    readBack !== null &&
    SiteSchema.safeParse(readBack.site).success &&
    readBack.site.metadata.siteName === synthetic.site.metadata.siteName &&
    readBack.site.designBriefId === synthetic.site.designBriefId &&
    readBack.modelUsed === synthetic.modelUsed &&
    readBack.promptVersion === synthetic.promptVersion;
  await unlink(join(HOME_PAGE_CACHE_DIR, `${tmpKey}.json`)).catch(() => {
    /* ignore */
  });

  // eslint-disable-next-line no-console
  console.log(`
Cache-key verification (home-page)
──────────────────────────────────────────────
  fixture:                ${FIXTURE_PATH}
  hash (home-page-v1):    ${keyV1a}
  hash (home-page-v1) #2: ${keyV1b}
  determinism check:      ${determinismOk ? 'PASS' : 'FAIL'}

  hash (home-page-v2):    ${keyV2}
  invalidation (prompt):  ${invalidationPromptOk ? 'PASS' : 'FAIL'}

  hash (different model): ${keyDifferentModel}
  invalidation (model):   ${invalidationModelOk ? 'PASS' : 'FAIL'}

  hash (modified doc):    ${keyDifferentFixture}
  invalidation (content): ${invalidationContentOk ? 'PASS' : 'FAIL'}

  round-trip cache I/O:   ${roundTripOk ? 'PASS' : 'FAIL'}
──────────────────────────────────────────────`);

  const allOk =
    determinismOk &&
    invalidationPromptOk &&
    invalidationModelOk &&
    invalidationContentOk &&
    roundTripOk;
  process.exit(allOk ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error('verify-home-page-cache-key: unhandled', err);
  process.exit(2);
});
