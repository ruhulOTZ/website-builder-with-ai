import { type BusinessProfile } from '@repo/shared-types';

export interface HtmlReportRow {
  fixture: {
    file: string;
    scenario: string;
    expectedDomain: string;
    expectedDomainSpecifierHint: string | null;
    notable: string;
  };
  rawText: string;
  profile: BusinessProfile | null;
  durationMs: number;
  match: boolean;
  error?: string;
  modelUsed: string;
  promptVersion: string;
  fromCache: boolean;
  /** ISO timestamp of original cache write — only meaningful when fromCache. */
  cachedAt?: string;
}

/**
 * Render a no-frills side-by-side HTML report. Plain HTML, minimal CSS, raw
 * <pre> blocks for JSON. The point is: open in browser, scan all rows at once.
 */
export function renderHtmlReport(rows: HtmlReportRow[]): string {
  const generatedAt = new Date().toISOString();
  const matched = rows.filter((r) => r.match).length;
  const errored = rows.filter((r) => r.error !== undefined).length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>parse eval — ${escapeHtml(generatedAt)}</title>
<style>
  body { font: 14px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 0; padding: 24px 32px; background: #fafafa; color: #1a1a1a; }
  header { margin-bottom: 24px; }
  header h1 { font-size: 18px; margin: 0 0 4px; font-weight: 600; }
  header .stats { color: #555; }
  .row { background: #fff; border: 1px solid #ddd; border-left: 4px solid #ddd; margin-bottom: 16px; padding: 14px 18px; border-radius: 4px; }
  .row.match { border-left-color: #2e7d32; }
  .row.mismatch { border-left-color: #b58105; }
  .row.error { border-left-color: #c62828; background: #fffafa; }
  .row h2 { font-size: 14px; margin: 0 0 8px; font-weight: 600; }
  .meta { color: #555; margin: 0 0 10px; font-size: 12px; }
  .meta .pill { display: inline-block; padding: 1px 8px; border-radius: 10px; background: #eee; margin-right: 6px; font-weight: 500; }
  .meta .pill.expected { background: #e8f0fe; color: #174ea6; }
  .meta .pill.actual.match { background: #e6f4ea; color: #1b5e20; }
  .meta .pill.actual.mismatch { background: #fff4e5; color: #8b5a00; }
  .meta .pill.actual.error { background: #fdecea; color: #b71c1c; }
  .row h2 .cached-badge { display: inline-block; margin-left: 8px; padding: 1px 7px; border-radius: 8px; background: #e0e0e0; color: #555; font-size: 10px; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; vertical-align: 2px; cursor: help; }
  .grid { display: grid; grid-template-columns: minmax(320px, 1fr) minmax(420px, 1.5fr); gap: 16px; }
  .grid h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #666; margin: 0 0 6px; font-weight: 600; }
  pre { background: #f5f5f5; border: 1px solid #e5e5e5; padding: 10px 12px; border-radius: 3px; white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 12px; max-height: 540px; overflow: auto; }
  .notable { background: #fffde7; padding: 8px 10px; border-radius: 3px; margin-bottom: 10px; font-size: 12px; color: #555; }
  .error-block { background: #fdecea; color: #b71c1c; padding: 10px; border-radius: 3px; margin: 0; white-space: pre-wrap; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>BusinessProfile parser — eval report</h1>
  <div class="stats">
    generated ${escapeHtml(generatedAt)} ·
    ${String(rows.length)} fixtures ·
    ${String(matched)} domain matches ·
    ${String(errored)} errors
  </div>
</header>
${rows.map(renderRow).join('\n')}
</body>
</html>`;
}

function renderRow(row: HtmlReportRow): string {
  const rowClass = row.error !== undefined ? 'error' : row.match ? 'match' : 'mismatch';
  const actualDomain = row.profile?.domain ?? '—';
  const actualClass = row.error !== undefined ? 'error' : row.match ? 'match' : 'mismatch';

  const cachedBadge = row.fromCache
    ? `<span class="cached-badge" title="Cached at ${escapeHtml(row.cachedAt ?? '—')}">cached</span>`
    : '';

  return `<section class="row ${rowClass}">
  <h2>${escapeHtml(row.fixture.file)}${cachedBadge}</h2>
  <p class="meta">
    <span class="pill">${row.fromCache ? 'cached' : `${String(row.durationMs)}ms`}</span>
    <span class="pill">model ${escapeHtml(row.modelUsed || '—')}</span>
    <span class="pill">prompt ${escapeHtml(row.promptVersion || '—')}</span>
    <span class="pill expected">expected: ${escapeHtml(row.fixture.expectedDomain)}</span>
    <span class="pill actual ${actualClass}">actual: ${escapeHtml(actualDomain)}</span>
  </p>
  <p class="notable"><strong>Scenario:</strong> ${escapeHtml(row.fixture.scenario)}<br /><strong>Notable:</strong> ${escapeHtml(row.fixture.notable)}</p>
  ${
    row.error !== undefined
      ? `<pre class="error-block">${escapeHtml(row.error)}</pre>`
      : `<div class="grid">
    <div>
      <h3>Raw input</h3>
      <pre>${escapeHtml(row.rawText)}</pre>
    </div>
    <div>
      <h3>Parsed profile</h3>
      <pre>${escapeHtml(JSON.stringify(row.profile, null, 2))}</pre>
    </div>
  </div>`
  }
</section>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
