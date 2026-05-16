// eval-parse.ts — runs the BusinessProfile parser against every fixture in
// apps/api/test/fixtures/requirements/_index.json and writes the results to
// apps/api/test/eval-output/parse-{timestamp}/ as JSON + an HTML side-by-side
// report.
//
// Iteration loop:
//   1. Edit prompts/parse-v1.ts (or copy to parse-vN.ts and swap the import)
//   2. pnpm --filter @repo/api eval:parse
//   3. open the printed HTML path → scan for regressions / improvements
//
// The "expected domain" in the manifest is an answer key for humans. It is
// NOT a build-failing assertion: some "mismatches" will be the AI being
// defensibly right (the manifest's tricky cases call this out explicitly).
//
// Throttling: GeminiProvider's internal TokenBucket (15 RPM) already paces
// requests. We run fixtures sequentially anyway so the report ordering matches
// the manifest order.
//
// Caching: by default, identical (fixture content + PROMPT_VERSION + model)
// inputs reuse a previously-cached parse result instead of calling the AI
// again. This makes re-opening old reports zero-cost and lets us re-render
// HTML after editing the renderer without burning quota. Bumping
// PROMPT_VERSION (parse-v1 → parse-v2) invalidates the relevant cache
// entries automatically. Pass `--no-cache` to force fresh AI calls for every
// fixture; successful fresh runs still write to the cache.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { AIValidationError } from '@repo/ai';
import { type BusinessProfile } from '@repo/shared-types';

import { AppModule } from '../src/app.module';
import { BusinessProfileParserService } from '../src/business-profile/business-profile-parser.service';

import { renderHtmlReport, type HtmlReportRow } from './eval-parse-report';
import { computeCacheKey, readCache, writeCache } from './file-cache';

/**
 * Parser-specific cache entry shape. The file-cache module is generic;
 * the parser eval owns this type and the `.cache/` directory.
 */
interface ParseCachedEntry {
  profile: BusinessProfile;
  modelUsed: string;
  promptVersion: string;
  durationMs: number;
  cachedAt: string;
}

const PARSE_CACHE_DIR = resolve(__dirname, '../test/eval-output/.cache');

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

interface SummaryRow {
  fixture: string;
  expectedDomain: string;
  actualDomain: string | null;
  match: boolean;
  durationMs: number;
  fromCache: boolean;
  cachedAt?: string;
  error?: string;
  /** Present when the error was an AIValidationError — the model's raw text. */
  rawOutput?: string;
}

const FIXTURE_DIR = resolve(__dirname, '../test/fixtures/requirements');
const OUTPUT_ROOT = resolve(__dirname, '../test/eval-output');

async function main(): Promise<void> {
  const noCache = process.argv.includes('--no-cache');

  // eslint-disable-next-line no-console
  console.log(
    `Bootstrapping NestJS application context...${noCache ? ' (--no-cache: ignoring cache reads)' : ''}`,
  );
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
    logger: ['error', 'warn'],
  });
  let exitCode = 0;
  try {
    const parser = app.get(BusinessProfileParserService);

    const manifestRaw = await readFile(join(FIXTURE_DIR, '_index.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw) as Manifest;

    const runId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = join(OUTPUT_ROOT, `parse-${runId}`);
    await mkdir(outputDir, { recursive: true });

    // eslint-disable-next-line no-console
    console.log(`Running ${String(manifest.fixtures.length)} fixtures → ${outputDir}\n`);

    const summary: SummaryRow[] = [];
    const reportRows: HtmlReportRow[] = [];

    let cachedCount = 0;
    let freshCount = 0;
    let aiCallsMade = 0;
    let freshDurationTotal = 0;

    const wallStart = Date.now();
    for (const fixture of manifest.fixtures) {
      const rawText = await readFile(join(FIXTURE_DIR, fixture.file), 'utf8');
      const cacheKey = computeCacheKey({
        fixtureContent: rawText,
        promptVersion: parser.promptVersion,
        modelName: parser.model,
      });

      let profile: BusinessProfile | null = null;
      let error: string | undefined;
      let rawOutput: string | undefined;
      let zodIssues: unknown;
      let modelUsed = '';
      let promptVersion = '';
      let durationMs = 0;
      let fromCache = false;
      let cachedAt: string | undefined;

      // Cache read path — short-circuit before the AI call.
      const cached = noCache ? null : await readCache<ParseCachedEntry>(PARSE_CACHE_DIR, cacheKey);
      if (cached !== null) {
        profile = cached.profile;
        modelUsed = cached.modelUsed;
        promptVersion = cached.promptVersion;
        durationMs = 0; // cache hits don't have meaningful latency
        fromCache = true;
        cachedAt = cached.cachedAt;
        cachedCount += 1;
      } else {
        // Fresh AI call.
        const fixtureStart = Date.now();
        try {
          const result = await parser.parse({ rawText, sourceLabel: fixture.file });
          profile = result.profile;
          modelUsed = result.modelUsed;
          promptVersion = result.promptVersion;
          durationMs = Date.now() - fixtureStart;

          // Cache only successful parses. Errors should always re-run.
          const entry: ParseCachedEntry = {
            profile: result.profile,
            modelUsed: result.modelUsed,
            promptVersion: result.promptVersion,
            durationMs,
            cachedAt: new Date().toISOString(),
          };
          await writeCache(PARSE_CACHE_DIR, cacheKey, entry);
        } catch (err) {
          durationMs = Date.now() - fixtureStart;
          error = err instanceof Error ? err.message : String(err);
          if (err instanceof AIValidationError) {
            rawOutput = err.rawOutput;
            zodIssues = err.zodIssues;
          }
        }
        freshCount += 1;
        aiCallsMade += 1;
        freshDurationTotal += durationMs;
      }

      const actualDomain = profile?.domain ?? null;
      const match = actualDomain === fixture.expectedDomain;

      summary.push({
        fixture: fixture.file,
        expectedDomain: fixture.expectedDomain,
        actualDomain,
        match,
        durationMs,
        fromCache,
        ...(cachedAt !== undefined ? { cachedAt } : {}),
        ...(error !== undefined ? { error } : {}),
        ...(rawOutput !== undefined ? { rawOutput } : {}),
      });

      reportRows.push({
        fixture,
        rawText,
        profile,
        durationMs,
        match,
        fromCache,
        ...(cachedAt !== undefined ? { cachedAt } : {}),
        ...(error !== undefined ? { error } : {}),
        modelUsed,
        promptVersion,
      });

      // Per-fixture JSON file (everything needed to re-inspect this single run).
      const perFixturePath = join(outputDir, fixture.file.replace(/\.txt$/, '.json'));
      await writeFile(
        perFixturePath,
        JSON.stringify(
          {
            fixture,
            durationMs,
            fromCache,
            cachedAt: cachedAt ?? null,
            modelUsed,
            promptVersion,
            profile,
            error: error ?? null,
            // Only present on AIValidationError; otherwise null.
            rawOutput: rawOutput ?? null,
            zodIssues: zodIssues ?? null,
          },
          null,
          2,
        ),
        'utf8',
      );

      const status = error !== undefined ? '✗' : match ? '✓' : '~';
      const sourceTag = fromCache
        ? `[cached, 0ms]`
        : error !== undefined
          ? `[fresh, error: ${error.slice(0, 80)}]`
          : `[fresh, ${String(durationMs)}ms]`;
      // eslint-disable-next-line no-console
      console.log(`  ${status}  ${fixture.file.padEnd(48)} ${sourceTag}`);
    }
    const wallMs = Date.now() - wallStart;

    await writeFile(join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
    await writeFile(join(outputDir, 'report.html'), renderHtmlReport(reportRows), 'utf8');

    const matchedCount = summary.filter((s) => s.match).length;
    const erroredCount = summary.filter((s) => s.error !== undefined).length;
    const avgFreshMs = freshCount > 0 ? Math.round(freshDurationTotal / freshCount) : 0;

    // eslint-disable-next-line no-console
    console.log(`
─────────────────────────────────────────────
  fixtures:        ${String(summary.length)}
  domain match:    ${String(matchedCount)} / ${String(summary.length)}
  errors:          ${String(erroredCount)}
  cached / fresh:  ${String(cachedCount)} / ${String(freshCount)}
  AI calls made:   ${String(aiCallsMade)}
  wall time:       ${String(wallMs)}ms
  avg per fresh:   ${String(avgFreshMs)}ms${freshCount === 0 ? ' (no fresh runs)' : ''}
  output dir:      ${outputDir}
  HTML report:     ${join(outputDir, 'report.html')}
─────────────────────────────────────────────`);

    if (erroredCount > 0) {
      // Errors are findings, not failures — but the eval rig should still
      // exit nonzero when calls outright failed (network, schema validation),
      // so CI / scripted runs can spot it.
      exitCode = 1;
    }
  } catch (err) {
    console.error('eval-parse: fatal error', err);
    exitCode = 2;
  } finally {
    await app.close();
  }
  process.exit(exitCode);
}

main().catch((err: unknown) => {
  console.error('eval-parse: unhandled', err);
  process.exit(2);
});
