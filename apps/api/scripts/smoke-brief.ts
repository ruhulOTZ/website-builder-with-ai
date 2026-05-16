// smoke-brief.ts — single-fixture end-to-end check of the DesignBrief
// generator pipeline. Runs exactly one AI call against the Forge gym profile
// and prints the full result + a one-shot plausibility summary.
//
// Use this once per prompt version before kicking off the full eval rig.
// If the brief looks wrong here, the full eval will burn 10 calls reproducing
// the same problem.
//
// Run via `pnpm --filter api smoke:brief`.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { type BusinessProfile, BusinessProfileSchema, type DesignBrief } from '@repo/shared-types';

import { AppModule } from '../src/app.module';
import { DesignBriefGeneratorService } from '../src/design-brief/design-brief-generator.service';

const PROFILE_PATH = resolve(
  __dirname,
  '../test/fixtures/parsed-profiles/gym-powerlifting-detailed.json',
);
const RAW_DOC_PATH = resolve(
  __dirname,
  '../test/fixtures/requirements/gym-powerlifting-detailed.txt',
);
const OUTPUT_ROOT = resolve(__dirname, '../test/eval-output');

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
    // 'log' is included so the DesignBriefGeneratorService's pre-injection
    // businessProfile debug line is captured. Filters out only debug/verbose.
    logger: ['log', 'error', 'warn'],
  });

  let exitCode = 0;
  try {
    const generator = app.get(DesignBriefGeneratorService);

    // Load + validate the parsed profile snapshot — protects against
    // stale or corrupted snapshots silently degrading the smoke test.
    const profileRaw = await readFile(PROFILE_PATH, 'utf8');
    const profile: BusinessProfile = BusinessProfileSchema.parse(JSON.parse(profileRaw));
    const rawDocumentText = await readFile(RAW_DOC_PATH, 'utf8');

    // eslint-disable-next-line no-console
    console.log(
      `Generating brief for "${profile.businessName}" (${profile.domain}/${profile.domainSpecifier ?? '—'})...`,
    );

    const start = Date.now();
    const result = await generator.generate({
      profile,
      rawDocumentText,
      sourceLabel: 'gym-powerlifting-detailed',
    });
    const durationMs = Date.now() - start;

    const brief: DesignBrief = result.brief;

    // Archive — timestamped folder under eval-output so the smoke run is
    // diff-able against later regenerations.
    const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outDir = join(OUTPUT_ROOT, `smoke-brief-${runId}`);
    await mkdir(outDir, { recursive: true });
    const archived = {
      sourceLabel: 'gym-powerlifting-detailed',
      durationMs,
      modelUsed: result.modelUsed,
      promptVersion: result.promptVersion,
      profile,
      brief,
    };
    await writeFile(join(outDir, 'brief.json'), JSON.stringify(archived, null, 2), 'utf8');

    // eslint-disable-next-line no-console
    console.log(`\n========== FULL BRIEF JSON ==========`);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(brief, null, 2));

    // eslint-disable-next-line no-console
    console.log(`
========== SUMMARY ==========
  business:           ${brief.businessProfile.businessName}
  domain:             ${brief.businessProfile.domain} / ${brief.businessProfile.domainSpecifier ?? '—'}
  brandArchetype:     ${brief.brandArchetype}
  traits:             energy=${String(brief.traits.energy)} formality=${String(brief.traits.formality)} warmth=${String(brief.traits.warmth)} sophistication=${String(brief.traits.sophistication)} trustworthiness=${String(brief.traits.trustworthiness)} novelty=${String(brief.traits.novelty)}
  palette.strategy:   ${brief.colorPalette.strategy}
  palette.primary:    ${brief.colorPalette.primary}
  typography:         ${brief.typography}
  layoutArchetype:    ${brief.layoutArchetype}
  imagery:            ${brief.imagery}
  voice:              ${brief.voice}
  density/radius:     ${brief.density} / ${brief.radius}
  motion / shadow:    ${brief.motion} / ${brief.shadow}
  recommendedPages:   ${brief.recommendedPages.map((p) => `${p.slug}(${p.priority})`).join(', ')}

  duration:           ${String(durationMs)}ms
  model:              ${result.modelUsed}
  prompt:             ${result.promptVersion}
  archived at:        ${join(outDir, 'brief.json')}
=============================`);
  } catch (err) {
    console.error('smoke-brief: fatal error', err);
    exitCode = 1;
  } finally {
    await app.close();
  }
  process.exit(exitCode);
}

main().catch((err: unknown) => {
  console.error('smoke-brief: unhandled', err);
  process.exit(2);
});
