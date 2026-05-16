// eval-brief.ts — runs the DesignBriefGeneratorService against every parsed
// profile snapshot in apps/api/test/fixtures/parsed-profiles/ and writes
// results + HTML report to apps/api/test/eval-output/brief-{timestamp}/.
//
// Iteration loop:
//   1. Edit prompts/brief-vN.ts (or copy and bump PROMPT_VERSION)
//   2. pnpm --filter api eval:brief
//   3. open the printed HTML report — variety table + per-fixture cards
//
// Caching: by default, identical (raw doc text + PROMPT_VERSION + model)
// inputs reuse a previously-cached brief instead of calling the AI again.
// The cache directory is .cache-brief/ — separate from the parser's .cache/
// so the two rigs don't interfere. Pass `--no-cache` to force fresh AI
// calls; successful fresh runs still write to the cache.
//
// Dry-run: pass `--dry-run` to load all 10 profiles and validate them
// against BusinessProfileSchema, then exit without any AI calls. Useful
// for pre-flight checks before burning daily quota.
//
// Throttling: GeminiProvider's internal TokenBucket (15 RPM) paces requests,
// but we also sleep 1500ms between fresh calls as a conservative buffer
// against bursts. Cached fixtures skip the delay.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { NestFactory } from '@nestjs/core';
import { AIValidationError } from '@repo/ai';
import { type BusinessProfile, BusinessProfileSchema, type DesignBrief } from '@repo/shared-types';
import { ZodError } from 'zod';

import { AppModule } from '../src/app.module';
import { DesignBriefGeneratorService } from '../src/design-brief/design-brief-generator.service';

import { renderBriefHtmlReport, type BriefReportRow } from './eval-brief-report';
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

interface BriefCachedEntry {
  brief: DesignBrief;
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
  // Compact dimension summary for fast variety read
  brandArchetype?: string;
  paletteStrategy?: string;
  typography?: string;
  layoutArchetype?: string;
  voice?: string;
  // Error fields
  error?: string;
  phase?: FailurePhase;
}

const FIXTURE_DIR = resolve(__dirname, '../test/fixtures/requirements');
const PROFILE_DIR = resolve(__dirname, '../test/fixtures/parsed-profiles');
const OUTPUT_ROOT = resolve(__dirname, '../test/eval-output');
const BRIEF_CACHE_DIR = resolve(__dirname, '../test/eval-output/.cache-brief');

const FRESH_CALL_THROTTLE_MS = 1500;

async function main(): Promise<void> {
  const noCache = process.argv.includes('--no-cache');
  const dryRun = process.argv.includes('--dry-run');

  // eslint-disable-next-line no-console
  console.log(
    `Bootstrapping NestJS application context...${noCache ? ' (--no-cache)' : ''}${dryRun ? ' (--dry-run: NO AI CALLS)' : ''}`,
  );
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
    // 'log' is included so the DesignBriefGeneratorService's pre-injection
    // businessProfile debug line is captured. Filters out only debug/verbose.
    logger: ['log', 'error', 'warn'],
  });
  let exitCode = 0;
  try {
    const generator = app.get(DesignBriefGeneratorService);

    const manifestRaw = await readFile(join(FIXTURE_DIR, '_index.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw) as Manifest;

    // Pre-flight: load + validate every parsed-profile snapshot. Catches
    // snapshot drift before we spend AI calls.
    const fixtures: {
      meta: FixtureMeta;
      profile: BusinessProfile;
      rawDocText: string;
    }[] = [];
    for (const meta of manifest.fixtures) {
      const profilePath = join(PROFILE_DIR, meta.file.replace(/\.txt$/, '.json'));
      const docPath = join(FIXTURE_DIR, meta.file);
      const profileRaw = await readFile(profilePath, 'utf8');
      const profile = BusinessProfileSchema.parse(JSON.parse(profileRaw));
      const rawDocText = await readFile(docPath, 'utf8');
      fixtures.push({ meta, profile, rawDocText });
    }
    // eslint-disable-next-line no-console
    console.log(`Loaded + validated ${String(fixtures.length)} parsed-profile snapshots.`);

    if (dryRun) {
      // eslint-disable-next-line no-console
      console.log('Dry run complete. No AI calls made. Exiting.');
      return;
    }

    const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = join(OUTPUT_ROOT, `brief-${runId}`);
    await mkdir(outputDir, { recursive: true });

    // eslint-disable-next-line no-console
    console.log(`Running ${String(fixtures.length)} fixtures → ${outputDir}\n`);

    const summary: SummaryRow[] = [];
    const reportRows: BriefReportRow[] = [];

    let cachedCount = 0;
    let freshCount = 0;
    let aiCallsMade = 0;
    let freshDurationTotal = 0;

    const wallStart = Date.now();
    let isFirstFresh = true;
    for (const { meta, profile, rawDocText } of fixtures) {
      const cacheKey = computeCacheKey({
        fixtureContent: rawDocText,
        promptVersion: generator.promptVersion,
        modelName: generator.model,
      });

      let brief: DesignBrief | null = null;
      let error: string | undefined;
      let phase: FailurePhase | undefined;
      let rawOutput: string | undefined;
      let zodIssues: unknown;
      let modelUsed = '';
      let promptVersion = '';
      let durationMs = 0;
      let fromCache = false;
      let cachedAt: string | undefined;

      const cached = noCache ? null : await readCache<BriefCachedEntry>(BRIEF_CACHE_DIR, cacheKey);
      if (cached !== null) {
        brief = cached.brief;
        modelUsed = cached.modelUsed;
        promptVersion = cached.promptVersion;
        durationMs = 0;
        fromCache = true;
        cachedAt = cached.cachedAt;
        cachedCount += 1;
      } else {
        // Conservative inter-call throttle, on top of provider rate limiter.
        if (!isFirstFresh) {
          await sleep(FRESH_CALL_THROTTLE_MS);
        }
        isFirstFresh = false;

        const fixtureStart = Date.now();
        try {
          const result = await generator.generate({
            profile,
            rawDocumentText: rawDocText,
            sourceLabel: meta.file,
          });
          brief = result.brief;
          modelUsed = result.modelUsed;
          promptVersion = result.promptVersion;
          durationMs = Date.now() - fixtureStart;

          const entry: BriefCachedEntry = {
            brief: result.brief,
            modelUsed: result.modelUsed,
            promptVersion: result.promptVersion,
            durationMs,
            cachedAt: new Date().toISOString(),
          };
          await writeCache(BRIEF_CACHE_DIR, cacheKey, entry);
        } catch (err) {
          durationMs = Date.now() - fixtureStart;
          // Two-stage validation seam means two failure shapes are possible.
          // Tag each so the reviewer knows where to look.
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

      const businessName = brief?.businessProfile.businessName ?? profile.businessName;

      const row: SummaryRow = {
        fixture: meta.file,
        businessName,
        durationMs,
        fromCache,
        ...(cachedAt !== undefined ? { cachedAt } : {}),
        ...(brief !== null
          ? {
              brandArchetype: brief.brandArchetype,
              paletteStrategy: brief.colorPalette.strategy,
              typography: brief.typography,
              layoutArchetype: brief.layoutArchetype,
              voice: brief.voice,
            }
          : {}),
        ...(error !== undefined ? { error } : {}),
        ...(phase !== undefined ? { phase } : {}),
      };
      summary.push(row);

      reportRows.push({
        fixture: meta.file,
        businessName,
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
            brief,
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
          : `[fresh, ${String(durationMs)}ms, ${brief?.brandArchetype ?? '—'}/${brief?.colorPalette.strategy ?? '—'}]`;
      // eslint-disable-next-line no-console
      console.log(`  ${status}  ${meta.file.padEnd(48)} ${sourceTag}`);
    }
    const wallMs = Date.now() - wallStart;

    await writeFile(join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
    await writeFile(join(outputDir, 'report.html'), renderBriefHtmlReport(reportRows), 'utf8');

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
    console.error('eval-brief: fatal error', err);
    exitCode = 2;
  } finally {
    await app.close();
  }
  process.exit(exitCode);
}

main().catch((err: unknown) => {
  console.error('eval-brief: unhandled', err);
  process.exit(2);
});
