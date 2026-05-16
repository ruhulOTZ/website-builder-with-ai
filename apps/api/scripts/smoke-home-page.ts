// smoke-home-page.ts — single-fixture end-to-end check of the home-page
// generator pipeline. Runs exactly one AI call against the Iron Halo
// (gym-powerlifting-detailed) profile + brief and prints the full result
// plus a one-shot plausibility summary.
//
// Use this once per prompt version before kicking off the full eval rig.
// If the home page looks wrong here, the full eval will burn 8 calls
// reproducing the same problem.
//
// Always runs fresh — smoke is not cached. The eval rig is the right
// place for caching; smoke exists to exercise the AI call.
//
// Run via `pnpm --filter api smoke:home-page`.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import {
  type BusinessProfile,
  BusinessProfileSchema,
  type DesignBrief,
  DesignBriefSchema,
  type Site,
} from '@repo/shared-types';

import { AppModule } from '../src/app.module';
import { HomePageGeneratorService } from '../src/home-page/home-page-generator.service';

const FIXTURE_NAME = 'gym-powerlifting-detailed';
const PROFILE_PATH = resolve(__dirname, `../test/fixtures/parsed-profiles/${FIXTURE_NAME}.json`);
const BRIEF_PATH = resolve(__dirname, `../test/fixtures/design-briefs/${FIXTURE_NAME}.json`);
const RAW_DOC_PATH = resolve(__dirname, `../test/fixtures/requirements/${FIXTURE_NAME}.txt`);
const OUTPUT_ROOT = resolve(__dirname, '../test/eval-output');

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
    // 'log' is included so the HomePageGeneratorService's pre-injection
    // debug line (if any) is captured. Filters out only debug/verbose.
    logger: ['log', 'error', 'warn'],
  });

  let exitCode = 0;
  try {
    const generator = app.get(HomePageGeneratorService);

    // Load + validate every input — protects against stale or corrupted
    // snapshots silently degrading the smoke test.
    const profileRaw = await readFile(PROFILE_PATH, 'utf8');
    const profile: BusinessProfile = BusinessProfileSchema.parse(JSON.parse(profileRaw));
    const briefRaw = await readFile(BRIEF_PATH, 'utf8');
    const brief: DesignBrief = DesignBriefSchema.parse(JSON.parse(briefRaw));
    const rawDocumentText = await readFile(RAW_DOC_PATH, 'utf8');

    // eslint-disable-next-line no-console
    console.log(
      `Generating home page for "${profile.businessName}" (${profile.domain}/${profile.domainSpecifier ?? '—'})...`,
    );

    const start = Date.now();
    const result = await generator.generate({
      profile,
      brief,
      designBriefId: `brief_smoke_${FIXTURE_NAME}`,
      rawDocumentText,
      sourceLabel: FIXTURE_NAME,
    });
    const durationMs = Date.now() - start;

    const site: Site = result.site;

    // Archive — timestamped folder under eval-output so the smoke run is
    // diff-able against later regenerations.
    const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outDir = join(OUTPUT_ROOT, `smoke-home-page-${runId}`);
    await mkdir(outDir, { recursive: true });
    const archived = {
      sourceLabel: FIXTURE_NAME,
      durationMs,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
      profile,
      brief,
      site,
    };
    await writeFile(join(outDir, 'site.json'), JSON.stringify(archived, null, 2), 'utf8');

    // eslint-disable-next-line no-console
    console.log(`\n========== FULL SITE JSON ==========`);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(site, null, 2));

    const page = site.pages[0];
    if (page === undefined) {
      throw new Error('No page in site');
    }
    const sections = page.sections;
    const header = sections.find((s) => s.type === 'header');
    const hero = sections.find((s) => s.type === 'hero');
    const featureGrids = sections.filter((s) => s.type === 'feature_grid');
    const footer = sections.find((s) => s.type === 'footer');

    const heroMediaKind =
      hero?.props.media?.kind ?? (hero?.props.media === undefined ? '(no media field)' : '—');
    const heroPrimaryCta = hero?.props.primaryCta?.label ?? '—';

    const featuresLines = featureGrids
      .map((fg, i) => {
        const idx = i + 1;
        return `  featuresGrid_${String(idx)}.variant:    ${fg.variant}
  featuresGrid_${String(idx)}.headline:   ${fg.props.headline ?? '—'}
  featuresGrid_${String(idx)}.items:      ${String(fg.props.items.length)}`;
      })
      .join('\n');

    const sequence = sections
      .map((s) => `${s.type}.${s.variant}`)
      .map((s, i) => (i === 0 ? s : `→ ${s}`))
      .join(' ');

    const navLabels = site.navigation.primary.map((l) => l.label).join(', ');

    // eslint-disable-next-line no-console
    console.log(`
========== SUMMARY ==========
  business:           ${site.metadata.siteName}
  brandArchetype:     ${brief.brandArchetype}
  section count:      ${String(sections.length)}
  section sequence:   ${sequence}

  header.variant:     ${header?.variant ?? '—'}
  hero.variant:       ${hero?.variant ?? '—'}
  hero.headline:      ${hero?.props.headline ?? '—'}
  hero.eyebrow:       ${hero?.props.eyebrow ?? '—'}
  hero.subheadline:   ${hero?.props.subheadline ?? '—'}
  hero.primaryCta:    ${heroPrimaryCta}
  hero.media kind:    ${heroMediaKind}

${featuresLines}

  footer.variant:     ${footer?.variant ?? '—'}
  footer.copyright:   ${footer?.props.legal.copyright ?? '—'}

  nav links:          [${navLabels}]

  seo.metaTitle:      ${page.seo.metaTitle}  (len ${String(page.seo.metaTitle.length)})
  seo.metaDescription:${page.seo.metaDescription}  (len ${String(page.seo.metaDescription.length)})

  brief.heroHint:     ${brief.componentPreferences.heroVariantHint ?? '—'}
  brief.voice.headline: ${brief.voiceExamples?.headline ?? '—'}
  brief.voice.cta:      ${brief.voiceExamples?.cta ?? '—'}

  duration:           ${String(durationMs)}ms
  model:              ${result.modelUsed}
  prompt:             ${result.promptVersion}
  archived at:        ${join(outDir, 'site.json')}
=============================`);
  } catch (err) {
    console.error('smoke-home-page: fatal error', err);
    exitCode = 1;
  } finally {
    await app.close();
  }
  process.exit(exitCode);
}

main().catch((err: unknown) => {
  console.error('smoke-home-page: unhandled', err);
  process.exit(2);
});
