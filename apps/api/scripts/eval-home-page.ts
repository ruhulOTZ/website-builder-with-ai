// eval-home-page.ts — runs the HomePageGeneratorService against every
// (parsed-profile, design-brief) pair available in test/fixtures/ and writes
// results + HTML report to apps/api/test/eval-output/home-page-{timestamp}/.
//
// Iteration loop:
//   1. Edit prompts/home-page-vN.ts (or copy and bump PROMPT_VERSION)
//   2. pnpm --filter api eval:home-page
//   3. open the printed HTML report — variant variety table + per-fixture
//      section breakdowns (variant, headline, body excerpt, image query,
//      generatorNotes)
//
// Caching: by default, identical inputs reuse a previously-cached site
// instead of calling the AI again. The cache key is computed over
// (profile + brief + rawDocText + PROMPT_VERSION + model) so changes to
// any input naturally invalidate. The cache directory is .cache-home-page/
// — separate from the parser's and brief's cache directories so the rigs
// don't interfere. Pass `--no-cache` to force fresh AI calls; successful
// fresh runs still write to the cache.
//
// Dry-run: pass `--dry-run` to load all fixtures and validate them against
// their schemas, then exit without any AI calls. Useful for pre-flight
// checks before burning daily quota.
//
// Inputs:
//   - apps/api/test/fixtures/parsed-profiles/<fixture>.json   (BusinessProfile)
//   - apps/api/test/fixtures/design-briefs/<fixture>.json     (DesignBrief)
//   - apps/api/test/fixtures/requirements/<fixture>.txt       (raw doc text)
//   - apps/api/test/fixtures/requirements/_index.json         (manifest)
//
// Only fixtures with all three present are evaluated. Fixtures missing a
// design-brief snapshot (the 2 that 429'd in the brief eval) are skipped
// with a one-line warning. Run the brief eval first, snapshot the outputs
// to design-briefs/, then re-run this rig.
//
// Throttling: GeminiProvider's internal TokenBucket (15 RPM) paces requests,
// but we also sleep 1500ms between fresh calls as a conservative buffer
// against bursts. Cached fixtures skip the delay.

import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { NestFactory } from '@nestjs/core';
import { AIValidationError } from '@repo/ai';
import {
  type BusinessProfile,
  BusinessProfileSchema,
  type DesignBrief,
  DesignBriefSchema,
  type Site,
} from '@repo/shared-types';
import { ZodError } from 'zod';

import { AppModule } from '../src/app.module';
import { HomePageGeneratorService } from '../src/home-page/home-page-generator.service';

import { renderHomePageHtmlReport, type HomePageReportRow } from './eval-home-page-report';
import { computeCacheKey, readCache, writeCache } from './file-cache';

interface FixtureMeta {
  file: string;
  scenario: string;
  expectedDomain: string;
  expectedDomainSpecifierHint: string | null;
  notable: string;
}

interface Manifest {
  fixtures: FixtureMeta[];
}

interface HomePageCachedEntry {
  site: Site;
  modelUsed: string;
  promptVersion: string;
  durationMs: number;
  cachedAt: string;
}

type FailurePhase = 'ai-generation' | 'post-injection-validation' | 'unknown';

interface SummaryRow {
  fixture: string;
  businessName: string;
  durationMs: number;
  fromCache: boolean;
  cachedAt?: string;
  // Compact variant summary for fast variety read
  sectionCount?: number;
  headerVariant?: string;
  heroVariant?: string;
  featureGridVariants?: string[];
  footerVariant?: string;
  heroHeadline?: string;
  // Error fields
  error?: string;
  phase?: FailurePhase;
}

const FIXTURE_DIR = resolve(__dirname, '../test/fixtures/requirements');
const PROFILE_DIR = resolve(__dirname, '../test/fixtures/parsed-profiles');
const BRIEF_DIR = resolve(__dirname, '../test/fixtures/design-briefs');
const OUTPUT_ROOT = resolve(__dirname, '../test/eval-output');
const HOME_PAGE_CACHE_DIR = resolve(__dirname, '../test/eval-output/.cache-home-page');

const FRESH_CALL_THROTTLE_MS = 1500;

/**
 * The eval-rig's cache key conceptually depends on every input to the AI
 * call. Concatenate them into a single canonical string so the file-cache
 * SHA-256 covers all three. JSON.stringify is deterministic enough here —
 * profile/brief are read from a stable snapshot file, so object-key order
 * is fixed. If we ever start mutating these in-memory before hashing, we'd
 * need a canonicalizer; for now this is sufficient.
 */
function cacheFixtureContent(
  profile: BusinessProfile,
  brief: DesignBrief,
  rawDocumentText: string,
): string {
  return [JSON.stringify(profile), JSON.stringify(brief), rawDocumentText].join('\n---\n');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const noCache = process.argv.includes('--no-cache');
  const dryRun = process.argv.includes('--dry-run');

  // eslint-disable-next-line no-console
  console.log(
    `Bootstrapping NestJS application context...${noCache ? ' (--no-cache)' : ''}${dryRun ? ' (--dry-run: NO AI CALLS)' : ''}`,
  );
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
    logger: ['log', 'error', 'warn'],
  });
  let exitCode = 0;
  try {
    const generator = app.get(HomePageGeneratorService);

    const manifestRaw = await readFile(join(FIXTURE_DIR, '_index.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw) as Manifest;

    // Pre-flight: load + validate (profile, brief, rawDoc) for every fixture
    // where all three are present. Catches snapshot drift before AI calls.
    const fixtures: {
      meta: FixtureMeta;
      profile: BusinessProfile;
      brief: DesignBrief;
      rawDocText: string;
    }[] = [];
    const skipped: { file: string; reason: string }[] = [];
    for (const meta of manifest.fixtures) {
      const profilePath = join(PROFILE_DIR, meta.file.replace(/\.txt$/, '.json'));
      const briefPath = join(BRIEF_DIR, meta.file.replace(/\.txt$/, '.json'));
      const docPath = join(FIXTURE_DIR, meta.file);

      if (!(await fileExists(briefPath))) {
        skipped.push({ file: meta.file, reason: 'no design-brief snapshot' });
        continue;
      }

      const profileRaw = await readFile(profilePath, 'utf8');
      const briefRaw = await readFile(briefPath, 'utf8');
      const profile = BusinessProfileSchema.parse(JSON.parse(profileRaw));
      const brief = DesignBriefSchema.parse(JSON.parse(briefRaw));
      const rawDocText = await readFile(docPath, 'utf8');
      fixtures.push({ meta, profile, brief, rawDocText });
    }
    // eslint-disable-next-line no-console
    console.log(
      `Loaded + validated ${String(fixtures.length)} (profile, brief, doc) snapshots.${skipped.length > 0 ? ` Skipped ${String(skipped.length)}.` : ''}`,
    );
    for (const s of skipped) {
      // eslint-disable-next-line no-console
      console.log(`  skip: ${s.file} (${s.reason})`);
    }

    if (dryRun) {
      // eslint-disable-next-line no-console
      console.log('Dry run complete. No AI calls made. Exiting.');
      return;
    }

    const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = join(OUTPUT_ROOT, `home-page-${runId}`);
    await mkdir(outputDir, { recursive: true });

    // eslint-disable-next-line no-console
    console.log(`Running ${String(fixtures.length)} fixtures → ${outputDir}\n`);

    const summary: SummaryRow[] = [];
    const reportRows: HomePageReportRow[] = [];

    let cachedCount = 0;
    let freshCount = 0;
    let aiCallsMade = 0;
    let freshDurationTotal = 0;

    const wallStart = Date.now();
    let isFirstFresh = true;
    for (const { meta, profile, brief, rawDocText } of fixtures) {
      // The cache key folds every input that affects the AI output. The
      // designBriefId field is NOT part of the cache key — it's a stamp
      // injected post-AI, so changing it doesn't change what the model
      // saw. We use a fixed synthetic designBriefId for eval determinism.
      const cacheKey = computeCacheKey({
        fixtureContent: cacheFixtureContent(profile, brief, rawDocText),
        promptVersion: generator.promptVersion,
        modelName: generator.model,
      });

      let site: Site | null = null;
      let error: string | undefined;
      let phase: FailurePhase | undefined;
      let rawOutput: string | undefined;
      let zodIssues: unknown;
      let modelUsed = '';
      let promptVersion = '';
      let durationMs = 0;
      let fromCache = false;
      let cachedAt: string | undefined;

      const cached = noCache
        ? null
        : await readCache<HomePageCachedEntry>(HOME_PAGE_CACHE_DIR, cacheKey);
      if (cached !== null) {
        site = cached.site;
        modelUsed = cached.modelUsed;
        promptVersion = cached.promptVersion;
        durationMs = 0;
        fromCache = true;
        cachedAt = cached.cachedAt;
        cachedCount += 1;
      } else {
        if (!isFirstFresh) {
          await sleep(FRESH_CALL_THROTTLE_MS);
        }
        isFirstFresh = false;

        const fixtureStart = Date.now();
        try {
          const result = await generator.generate({
            profile,
            brief,
            // Synthetic, deterministic id — eval runs aren't persisted to
            // the DB and we want the stamped value to be stable across
            // runs of the same fixture so output diffs are clean.
            designBriefId: `brief_eval_${meta.file.replace(/\.txt$/, '')}`,
            rawDocumentText: rawDocText,
            sourceLabel: meta.file,
          });
          site = result.site;
          modelUsed = result.modelUsed;
          promptVersion = result.promptVersion;
          durationMs = Date.now() - fixtureStart;

          const entry: HomePageCachedEntry = {
            site: result.site,
            modelUsed: result.modelUsed,
            promptVersion: result.promptVersion,
            durationMs,
            cachedAt: new Date().toISOString(),
          };
          await writeCache(HOME_PAGE_CACHE_DIR, cacheKey, entry);
        } catch (err) {
          durationMs = Date.now() - fixtureStart;
          if (err instanceof AIValidationError) {
            error = err.message;
            phase = 'ai-generation';
            rawOutput = err.rawOutput;
            zodIssues = err.zodIssues;
          } else if (err instanceof ZodError) {
            error = err.message;
            phase = 'post-injection-validation';
            zodIssues = err.issues;
          } else {
            error = err instanceof Error ? err.message : String(err);
            phase = 'unknown';
          }
        }
        freshCount += 1;
        aiCallsMade += 1;
        freshDurationTotal += durationMs;
      }

      const businessName = site?.metadata.siteName ?? profile.businessName;

      // Extract a compact variant summary for the side-by-side table.
      const page = site?.pages[0];
      const sections = page?.sections ?? [];
      const headerSection = sections.find((s) => s.type === 'header');
      const heroSection = sections.find((s) => s.type === 'hero');
      const featureGridSections = sections.filter((s) => s.type === 'feature_grid');
      const footerSection = sections.find((s) => s.type === 'footer');

      const row: SummaryRow = {
        fixture: meta.file,
        businessName,
        durationMs,
        fromCache,
        ...(cachedAt !== undefined ? { cachedAt } : {}),
        ...(site !== null
          ? {
              sectionCount: sections.length,
              ...(headerSection !== undefined ? { headerVariant: headerSection.variant } : {}),
              ...(heroSection !== undefined ? { heroVariant: heroSection.variant } : {}),
              ...(featureGridSections.length > 0
                ? { featureGridVariants: featureGridSections.map((s) => s.variant) }
                : {}),
              ...(footerSection !== undefined ? { footerVariant: footerSection.variant } : {}),
              ...(heroSection !== undefined ? { heroHeadline: heroSection.props.headline } : {}),
            }
          : {}),
        ...(error !== undefined ? { error } : {}),
        ...(phase !== undefined ? { phase } : {}),
      };
      summary.push(row);

      reportRows.push({
        fixture: meta.file,
        businessName,
        site,
        brief,
        durationMs,
        fromCache,
        ...(cachedAt !== undefined ? { cachedAt } : {}),
        ...(error !== undefined ? { error } : {}),
        ...(phase !== undefined ? { phase } : {}),
        ...(rawOutput !== undefined ? { rawOutput } : {}),
        ...(zodIssues !== undefined ? { zodIssues } : {}),
      });

      const perFixturePath = join(outputDir, meta.file.replace(/\.txt$/, '.json'));
      await writeFile(
        perFixturePath,
        JSON.stringify(
          {
            fixture: meta,
            durationMs,
            fromCache,
            cachedAt: cachedAt ?? null,
            modelUsed,
            promptVersion,
            site,
            error: error ?? null,
            phase: phase ?? null,
            rawOutput: rawOutput ?? null,
            zodIssues: zodIssues ?? null,
          },
          null,
          2,
        ),
        'utf8',
      );

      const status = error !== undefined ? '✗' : '✓';
      const sourceTag = fromCache
        ? `[cached, 0ms]`
        : error !== undefined
          ? `[fresh, ${phase ?? 'unknown'}: ${error.slice(0, 80)}]`
          : `[fresh, ${String(durationMs)}ms, ${String(sections.length)} sections, hero=${heroSection?.variant ?? '—'}]`;
      // eslint-disable-next-line no-console
      console.log(`  ${status}  ${meta.file.padEnd(48)} ${sourceTag}`);
    }
    const wallMs = Date.now() - wallStart;

    await writeFile(join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
    await writeFile(join(outputDir, 'report.html'), renderHomePageHtmlReport(reportRows), 'utf8');

    const successCount = summary.filter((s) => s.error === undefined).length;
    const failedCount = summary.filter((s) => s.error !== undefined).length;
    const avgFreshMs = freshCount > 0 ? Math.round(freshDurationTotal / freshCount) : 0;

    // eslint-disable-next-line no-console
    console.log(`
─────────────────────────────────────────────
  fixtures:        ${String(summary.length)}
  successful:      ${String(successCount)}
  failed:          ${String(failedCount)}
  cached / fresh:  ${String(cachedCount)} / ${String(freshCount)}
  AI calls made:   ${String(aiCallsMade)}
  wall time:       ${String(wallMs)}ms
  avg per fresh:   ${String(avgFreshMs)}ms${freshCount === 0 ? ' (no fresh runs)' : ''}
  output dir:      ${outputDir}
  HTML report:     ${join(outputDir, 'report.html')}
─────────────────────────────────────────────`);

    if (failedCount > 0) {
      exitCode = 1;
    }
  } catch (err) {
    console.error('eval-home-page: fatal error', err);
    exitCode = 2;
  } finally {
    await app.close();
  }
  process.exit(exitCode);
}

main().catch((err: unknown) => {
  console.error('eval-home-page: unhandled', err);
  process.exit(2);
});
