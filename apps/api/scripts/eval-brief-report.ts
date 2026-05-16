// Self-contained HTML renderer for the brief eval rig. Produces a single
// page with:
//   1. A wide side-by-side table at the top — one row per fixture, columns
//      for the high-leverage choices. Scrolls horizontally if needed; this
//      is the variety check.
//   2. Per-fixture cards below — one card per fixture with full palette
//      swatches, traits, recommendedPages, every rationale.
//
// Inline <style>, no external dependencies, system font stack. Readable on
// a normal laptop screen.

import { type DesignBrief } from '@repo/shared-types';

export interface BriefReportRow {
  fixture: string;
  /** Business name copied out for convenience; same as brief?.businessProfile.businessName. */
  businessName: string;
  brief: DesignBrief | null;
  durationMs: number;
  fromCache: boolean;
  cachedAt?: string;
  /** When set, the AI call or post-injection validation failed. */
  error?: string;
  /** Which seam the error came from. */
  phase?: 'ai-generation' | 'post-injection-validation' | 'unknown';
  /** Raw AI text when the failure surfaced inside generateStructured. */
  rawOutput?: string;
  /** Zod issues array — shape depends on failure phase. */
  zodIssues?: unknown;
}

export function renderBriefHtmlReport(rows: BriefReportRow[]): string {
  const generatedAt = new Date().toISOString();
  const success = rows.filter((r) => r.brief !== null).length;
  const failed = rows.filter((r) => r.error !== undefined).length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>brief eval — ${escapeHtml(generatedAt)}</title>
<style>
  :root {
    --bg: #fafafa;
    --ink: #1a1a1a;
    --muted: #555;
    --line: #e2e2e2;
    --card: #fff;
    --good: #2e7d32;
    --warn: #b58105;
    --bad: #c62828;
  }
  body {
    font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
    margin: 0;
    padding: 28px 32px 64px;
    background: var(--bg);
    color: var(--ink);
  }
  header { margin-bottom: 28px; }
  header h1 { font-size: 18px; margin: 0 0 4px; font-weight: 600; }
  header .stats { color: var(--muted); font-size: 13px; }

  /* ---- Section 1: side-by-side table ---- */
  .sxs-wrap { overflow-x: auto; margin-bottom: 40px; border: 1px solid var(--line); border-radius: 6px; background: var(--card); }
  table.sxs { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.sxs th, table.sxs td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; white-space: nowrap; }
  table.sxs th { background: #f4f4f4; font-weight: 600; position: sticky; top: 0; }
  table.sxs td.fixture { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
  table.sxs td.failed { color: var(--bad); }
  .traits-mini { display: inline-flex; gap: 2px; vertical-align: middle; }
  .traits-mini .dot { width: 6px; height: 14px; border-radius: 1px; background: #ddd; }
  .traits-mini .dot.on { background: var(--ink); }
  .swatch-row { display: inline-flex; gap: 2px; vertical-align: middle; }
  .swatch-row .sw { width: 16px; height: 16px; border: 1px solid #ccc; border-radius: 2px; }

  /* ---- Section 2: per-fixture cards ---- */
  .card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 22px 26px;
    margin: 0 auto 24px;
    max-width: 900px;
  }
  .card.failed { border-left: 4px solid var(--bad); }
  .card h2 { font-size: 18px; margin: 0 0 4px; font-weight: 600; }
  .card .desc { color: var(--muted); margin: 0 0 16px; font-size: 13px; line-height: 1.4; }
  .card .meta { font-size: 11px; color: var(--muted); margin-bottom: 14px; }
  .card .meta .pill { display: inline-block; padding: 1px 8px; border-radius: 10px; background: #eee; margin-right: 6px; font-weight: 500; }
  .card .meta .pill.cached { background: #e0e0e0; color: var(--muted); }

  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--ink);
    color: var(--bg);
    margin-bottom: 6px;
  }
  .rationale { font-style: italic; color: #444; font-size: 13px; line-height: 1.5; margin: 4px 0 16px; }

  .traits { display: grid; grid-template-columns: max-content 1fr; gap: 4px 14px; margin: 8px 0 18px; font-size: 12px; }
  .traits .label { color: var(--muted); }
  .traits .scale { display: inline-flex; gap: 3px; align-items: center; }
  .traits .scale .dot { width: 10px; height: 18px; border-radius: 2px; background: #ddd; }
  .traits .scale .dot.on { background: var(--ink); }

  .palette { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin: 8px 0; }
  .palette .pcell { font-size: 11px; }
  .palette .pcell .pswatch { width: 100%; height: 48px; border-radius: 4px; border: 1px solid var(--line); }
  .palette .pcell .plabel { display: block; margin: 4px 0 2px; font-weight: 600; color: var(--ink); }
  .palette .pcell .pval { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--muted); font-size: 10px; }

  .style-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px 18px; margin: 12px 0; font-size: 13px; }
  .style-grid .skey { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
  .style-grid .sval { font-weight: 600; }
  .style-grid .srationale { font-style: italic; color: #444; font-size: 12px; margin-top: 2px; }

  .voice-block { background: #f6f6f6; padding: 10px 14px; border-radius: 4px; margin: 8px 0 14px; font-size: 13px; }
  .voice-block .ve-row { margin: 3px 0; }
  .voice-block .ve-row .label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-right: 6px; }

  .pages { list-style: none; padding: 0; margin: 8px 0 0; }
  .pages li { padding: 6px 0; border-bottom: 1px dashed var(--line); font-size: 13px; }
  .pages li:last-child { border-bottom: none; }
  .pages .slug { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--ink); font-weight: 600; }
  .pages .title { color: var(--ink); margin: 0 6px; }
  .pages .prio { font-size: 10px; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
  .pages .prio.primary { background: #e6f4ea; color: #1b5e20; }
  .pages .prio.secondary { background: #e8f0fe; color: #174ea6; }
  .pages .prio.optional { background: #f0f0f0; color: var(--muted); }
  .pages .purpose { display: block; font-style: italic; color: #555; font-size: 12px; margin-top: 2px; }

  h3.section { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 18px 0 6px; font-weight: 600; }

  .error-block { background: #fdecea; color: #b71c1c; padding: 10px 14px; border-radius: 4px; margin: 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
  .phase-tag { display: inline-block; background: #fdecea; color: #b71c1c; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
</style>
</head>
<body>
<header>
  <h1>DesignBrief generator — eval report</h1>
  <div class="stats">
    generated ${escapeHtml(generatedAt)} ·
    ${String(rows.length)} fixtures ·
    ${String(success)} successful ·
    ${String(failed)} failed
  </div>
</header>

<h3 class="section">Side-by-side · variety check</h3>
<div class="sxs-wrap">
  <table class="sxs">
    <thead>
      <tr>
        <th>Fixture</th>
        <th>Business</th>
        <th>Archetype</th>
        <th>Traits<br/><span style="font-weight:400; color:var(--muted)">e/f/w/s/t/n</span></th>
        <th>Palette</th>
        <th>Swatches</th>
        <th>Typography</th>
        <th>Layout</th>
        <th>Imagery</th>
        <th>Voice</th>
        <th>Pages</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(renderTableRow).join('\n')}
    </tbody>
  </table>
</div>

<h3 class="section">Per-fixture detail</h3>
${rows.map(renderCard).join('\n')}
</body>
</html>`;
}

function renderTableRow(row: BriefReportRow): string {
  if (row.brief === null) {
    return `<tr>
  <td class="fixture failed">${escapeHtml(row.fixture)}</td>
  <td colspan="10" class="failed">FAILED [${escapeHtml(row.phase ?? 'unknown')}]: ${escapeHtml(row.error ?? 'no message')}</td>
</tr>`;
  }
  const b = row.brief;
  const t = b.traits;
  const tnums = [t.energy, t.formality, t.warmth, t.sophistication, t.trustworthiness, t.novelty];
  const traitsHtml = tnums.map((n) => renderMiniScale(n)).join(' ');
  const swatches = [
    b.colorPalette.primary,
    b.colorPalette.secondary,
    b.colorPalette.accent,
    b.colorPalette.background,
  ];
  const swatchesHtml = `<span class="swatch-row">${swatches
    .map(
      (c) =>
        `<span class="sw" style="background: ${escapeAttr(c)}" title="${escapeAttr(c)}"></span>`,
    )
    .join('')}</span>`;
  const firstPages = b.recommendedPages
    .slice(0, 3)
    .map((p) => p.slug)
    .join(', ');
  const pagesSummary = `${String(b.recommendedPages.length)} (${escapeHtml(firstPages)})`;
  return `<tr>
  <td class="fixture">${escapeHtml(row.fixture)}</td>
  <td>${escapeHtml(row.businessName)}</td>
  <td>${escapeHtml(b.brandArchetype)}</td>
  <td>${traitsHtml}</td>
  <td>${escapeHtml(b.colorPalette.strategy)}</td>
  <td>${swatchesHtml}</td>
  <td>${escapeHtml(b.typography)}</td>
  <td>${escapeHtml(b.layoutArchetype)}</td>
  <td>${escapeHtml(b.imagery)}</td>
  <td>${escapeHtml(b.voice)}</td>
  <td>${pagesSummary}</td>
</tr>`;
}

function renderMiniScale(n: number): string {
  const dots = [1, 2, 3, 4, 5]
    .map((i) => `<span class="dot${i <= n ? ' on' : ''}"></span>`)
    .join('');
  return `<span class="traits-mini" title="${String(n)}/5">${dots}</span>`;
}

function renderCard(row: BriefReportRow): string {
  if (row.brief === null) {
    return `<section class="card failed">
  <h2>${escapeHtml(row.fixture)}</h2>
  <p class="meta">
    <span class="pill">${row.fromCache ? 'cached' : `${String(row.durationMs)}ms`}</span>
  </p>
  <div class="phase-tag">phase: ${escapeHtml(row.phase ?? 'unknown')}</div>
  <pre class="error-block">${escapeHtml(row.error ?? 'no error message')}</pre>
  ${
    row.rawOutput !== undefined
      ? `<h3 class="section">Raw model output (last 2000 chars)</h3>
  <pre class="error-block">${escapeHtml(row.rawOutput.slice(-2000))}</pre>`
      : ''
  }
  ${
    row.zodIssues !== undefined
      ? `<h3 class="section">Zod issues</h3>
  <pre class="error-block">${escapeHtml(JSON.stringify(row.zodIssues, null, 2))}</pre>`
      : ''
  }
</section>`;
  }

  const b = row.brief;
  const t = b.traits;
  const cp = b.colorPalette;
  const cachedBadge = row.fromCache
    ? `<span class="pill cached" title="Cached at ${escapeAttr(row.cachedAt ?? '—')}">cached</span>`
    : '';

  const traitsHtml = [
    ['energy', t.energy],
    ['formality', t.formality],
    ['warmth', t.warmth],
    ['sophistication', t.sophistication],
    ['trustworthiness', t.trustworthiness],
    ['novelty', t.novelty],
  ]
    .map(
      ([label, n]) =>
        `<span class="label">${escapeHtml(String(label))}</span><span class="scale">${[1, 2, 3, 4, 5].map((i) => `<span class="dot${i <= (n as number) ? ' on' : ''}"></span>`).join('')} <span style="color:var(--muted);margin-left:6px">${String(n)}</span></span>`,
    )
    .join('\n');

  const paletteCells: [string, string][] = [
    ['primary', cp.primary],
    ['secondary', cp.secondary],
    ['accent', cp.accent],
    ['background', cp.background],
    ['surface', cp.surface],
    ['foreground', cp.foreground],
    ['mutedForeground', cp.mutedForeground],
    ['border', cp.border],
    ['success', cp.success],
    ['warning', cp.warning],
    ['danger', cp.danger],
  ];
  const paletteHtml = paletteCells
    .map(
      ([label, val]) =>
        `<div class="pcell">
      <div class="pswatch" style="background: ${escapeAttr(val)}"></div>
      <span class="plabel">${escapeHtml(label)}</span>
      <span class="pval">${escapeHtml(val)}</span>
    </div>`,
    )
    .join('\n');

  const voiceExamplesHtml =
    b.voiceExamples !== undefined
      ? `<div class="voice-block">
    ${b.voiceExamples.headline !== undefined ? `<div class="ve-row"><span class="label">headline</span>${escapeHtml(b.voiceExamples.headline)}</div>` : ''}
    ${b.voiceExamples.cta !== undefined ? `<div class="ve-row"><span class="label">cta</span>${escapeHtml(b.voiceExamples.cta)}</div>` : ''}
    ${b.voiceExamples.microcopy !== undefined ? `<div class="ve-row"><span class="label">microcopy</span>${escapeHtml(b.voiceExamples.microcopy)}</div>` : ''}
  </div>`
      : '';

  const cp_ = b.componentPreferences;
  const cpEntries: [string, string][] = [];
  if (cp_.heroVariantHint !== undefined) cpEntries.push(['hero', cp_.heroVariantHint]);
  if (cp_.cardStyleHint !== undefined) cpEntries.push(['card', cp_.cardStyleHint]);
  if (cp_.buttonStyleHint !== undefined) cpEntries.push(['button', cp_.buttonStyleHint]);
  const componentPrefsHtml =
    cpEntries.length > 0
      ? `<h3 class="section">Component preferences</h3>
  <div class="style-grid">
    ${cpEntries
      .map(
        ([k, v]) =>
          `<div><span class="skey">${escapeHtml(k)}</span><br/><span class="sval">${escapeHtml(v)}</span></div>`,
      )
      .join('')}
  </div>`
      : '';

  return `<section class="card">
  <h2>${escapeHtml(b.businessProfile.businessName)}${cachedBadge}</h2>
  <p class="desc">${escapeHtml(b.businessProfile.oneLineDescription)}</p>
  <p class="meta">
    <span class="pill">fixture ${escapeHtml(row.fixture)}</span>
    <span class="pill">${row.fromCache ? 'cached' : `${String(row.durationMs)}ms`}</span>
  </p>

  <div class="badge">${escapeHtml(b.brandArchetype)}</div>
  <p class="rationale">${escapeHtml(b.brandArchetypeRationale)}</p>

  <h3 class="section">Traits</h3>
  <div class="traits">
    ${traitsHtml}
  </div>

  <h3 class="section">Color palette · ${escapeHtml(cp.strategy)}</h3>
  <div class="palette">
    ${paletteHtml}
  </div>
  <p class="rationale">${escapeHtml(b.colorPaletteRationale)}</p>

  <h3 class="section">Typography · ${escapeHtml(b.typography)}</h3>
  <p class="rationale">${escapeHtml(b.typographyRationale)}</p>

  <h3 class="section">Layout · ${escapeHtml(b.layoutArchetype)}</h3>
  <p class="rationale">${escapeHtml(b.layoutArchetypeRationale)}</p>

  <h3 class="section">Imagery · ${escapeHtml(b.imagery)}</h3>
  <p class="rationale">${escapeHtml(b.imageryRationale)}</p>

  <h3 class="section">Style tokens</h3>
  <div class="style-grid">
    <div><span class="skey">density</span><br/><span class="sval">${escapeHtml(b.density)}</span></div>
    <div><span class="skey">radius</span><br/><span class="sval">${escapeHtml(b.radius)}</span></div>
    <div><span class="skey">shadow</span><br/><span class="sval">${escapeHtml(b.shadow)}</span></div>
    <div><span class="skey">motion</span><br/><span class="sval">${escapeHtml(b.motion)}</span></div>
  </div>

  <h3 class="section">Voice · ${escapeHtml(b.voice)}</h3>
  <p class="rationale">${escapeHtml(b.voiceRationale)}</p>
  ${voiceExamplesHtml}

  ${componentPrefsHtml}

  <h3 class="section">Recommended pages (${String(b.recommendedPages.length)})</h3>
  <ul class="pages">
    ${b.recommendedPages
      .map(
        (p) =>
          `<li>
        <span class="slug">${escapeHtml(p.slug)}</span>
        <span class="title">· ${escapeHtml(p.title)}</span>
        <span class="prio ${escapeAttr(p.priority)}">${escapeHtml(p.priority)}</span>
        <span class="purpose">${escapeHtml(p.purpose)}</span>
      </li>`,
      )
      .join('\n')}
  </ul>
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

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
