// Self-contained HTML renderer for the home-page eval rig. Produces a
// single page with:
//   1. A wide side-by-side table at the top — one row per fixture with
//      the variant choices (header, hero, FeatureGrids in order, footer)
//      plus hero headline excerpt. Variety check at a glance.
//   2. Per-fixture cards below — one card per fixture with every section
//      laid out in order: variant chip, generatorNotes, headline/body/CTAs,
//      image queries, item counts. Imagery is rendered as text (the AI
//      emits image queries, not URLs).
//
// Inline <style>, no external dependencies, system font stack.
//
// Design note: generatorNotes are prominently displayed for every section
// — that's the whole point of the new "cite the brief field" rule in
// home-page-v1. The eval reviewer reads them to judge whether variant
// decisions are grounded or post-hoc.

import { type DesignBrief, type Section, type Site } from '@repo/shared-types';

export interface HomePageReportRow {
  fixture: string;
  businessName: string;
  site: Site | null;
  /** The brief that was the input — useful for reviewers comparing the
   * brief's componentPreferences.heroVariantHint against what the AI did. */
  brief: DesignBrief;
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

export function renderHomePageHtmlReport(rows: HomePageReportRow[]): string {
  const generatedAt = new Date().toISOString();
  const success = rows.filter((r) => r.site !== null).length;
  const failed = rows.filter((r) => r.error !== undefined).length;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>home-page eval — ${escapeHtml(generatedAt)}</title>
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
    --accent: #3949ab;
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
  table.sxs th, table.sxs td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
  table.sxs th { background: #f4f4f4; font-weight: 600; position: sticky; top: 0; white-space: nowrap; }
  table.sxs td.fixture { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; white-space: nowrap; }
  table.sxs td.failed { color: var(--bad); }
  table.sxs td.headline { font-style: italic; color: #333; max-width: 260px; }
  .variant-chip { display: inline-block; padding: 2px 6px; background: #eef0fa; color: var(--accent); border-radius: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; }
  .variant-chip + .variant-chip { margin-left: 4px; }
  .hint-mismatch { color: var(--warn); font-weight: 600; }

  /* ---- Section 2: per-fixture cards ---- */
  .card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 22px 26px;
    margin: 0 auto 24px;
    max-width: 980px;
  }
  .card.failed { border-left: 4px solid var(--bad); }
  .card h2 { font-size: 18px; margin: 0 0 4px; font-weight: 600; }
  .card .desc { color: var(--muted); margin: 0 0 8px; font-size: 13px; line-height: 1.4; }
  .card .meta { font-size: 11px; color: var(--muted); margin-bottom: 16px; }
  .card .meta .pill { display: inline-block; padding: 1px 8px; border-radius: 10px; background: #eee; margin-right: 6px; font-weight: 500; }
  .card .meta .pill.cached { background: #e0e0e0; color: var(--muted); }

  .brief-summary { display: grid; grid-template-columns: max-content 1fr; gap: 3px 14px; margin: 0 0 16px; font-size: 12px; padding: 10px 14px; background: #f6f6f6; border-radius: 4px; }
  .brief-summary .label { color: var(--muted); }
  .brief-summary .val { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }

  .seo-block { background: #fafafa; padding: 10px 14px; border-radius: 4px; margin: 8px 0 18px; font-size: 12px; border: 1px solid var(--line); }
  .seo-block .label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-right: 6px; }
  .seo-block .seo-row { margin: 3px 0; }

  .section-block {
    border-left: 3px solid var(--accent);
    background: #fafafa;
    padding: 12px 16px;
    margin: 12px 0;
    border-radius: 0 4px 4px 0;
  }
  .section-block.fail { border-left-color: var(--bad); background: #fdecea; }
  .section-block .stype { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .section-block .svariant { display: inline-block; margin-left: 8px; padding: 2px 8px; background: var(--accent); color: white; border-radius: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; font-weight: 600; }
  .section-block .sid { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; margin-left: 8px; }
  .section-block .gnote { font-style: italic; color: #444; font-size: 12px; margin: 6px 0 10px; padding: 6px 10px; background: white; border-radius: 3px; border-left: 2px solid #c5cae9; }
  .section-block .headline { font-weight: 600; font-size: 15px; margin: 6px 0 2px; }
  .section-block .eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 2px 0; }
  .section-block .body { font-size: 13px; color: #333; margin: 4px 0; line-height: 1.45; }
  .section-block .cta-row { margin: 6px 0; font-size: 12px; }
  .section-block .cta-row .cta { display: inline-block; padding: 2px 8px; background: white; border: 1px solid var(--line); border-radius: 3px; margin-right: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
  .section-block .cta-row .cta .style { color: var(--muted); font-size: 9px; text-transform: uppercase; margin-left: 4px; }
  .section-block .img { font-size: 11px; color: var(--muted); margin: 4px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .section-block .img .ql { color: var(--accent); font-weight: 600; }
  .section-block .items { margin: 6px 0 0; padding: 0; list-style: none; }
  .section-block .items li { padding: 6px 0; border-top: 1px dashed var(--line); font-size: 12px; }
  .section-block .items li .ititle { font-weight: 600; }
  .section-block .items li .ibody { color: #444; }
  .section-block .links-row { font-size: 11px; color: var(--muted); margin: 6px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

  h3.section { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 18px 0 6px; font-weight: 600; }

  .error-block { background: #fdecea; color: #b71c1c; padding: 10px 14px; border-radius: 4px; margin: 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
  .phase-tag { display: inline-block; background: #fdecea; color: #b71c1c; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
</style>
</head>
<body>
<header>
  <h1>Home-page generator — eval report</h1>
  <div class="stats">
    generated ${escapeHtml(generatedAt)} ·
    ${String(rows.length)} fixtures ·
    ${String(success)} successful ·
    ${String(failed)} failed
  </div>
</header>

<h3 class="section">Side-by-side · variant variety check</h3>
<div class="sxs-wrap">
  <table class="sxs">
    <thead>
      <tr>
        <th>Fixture</th>
        <th>Business</th>
        <th>Sections</th>
        <th>Header</th>
        <th>Hero</th>
        <th>FeatureGrids</th>
        <th>Footer</th>
        <th>Hero headline</th>
        <th>Brief hint → Hero</th>
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

function renderTableRow(row: HomePageReportRow): string {
  if (row.site === null) {
    return `<tr>
  <td class="fixture failed">${escapeHtml(row.fixture)}</td>
  <td colspan="8" class="failed">FAILED [${escapeHtml(row.phase ?? 'unknown')}]: ${escapeHtml(row.error ?? 'no message')}</td>
</tr>`;
  }
  const page = row.site.pages[0];
  if (page === undefined) {
    return `<tr>
  <td class="fixture failed">${escapeHtml(row.fixture)}</td>
  <td colspan="8" class="failed">No page in site</td>
</tr>`;
  }
  const sections = page.sections;
  const header = sections.find((s) => s.type === 'header');
  const hero = sections.find((s) => s.type === 'hero');
  const featureGrids = sections.filter((s) => s.type === 'feature_grid');
  const footer = sections.find((s) => s.type === 'footer');

  const fgChips = featureGrids
    .map((s) => `<span class="variant-chip">${escapeHtml(s.variant)}</span>`)
    .join(' ');

  const briefHint = row.brief.componentPreferences.heroVariantHint;
  const heroVariant = hero?.variant;
  const hintCellContent =
    briefHint !== undefined && heroVariant !== undefined
      ? briefHint === heroVariant
        ? `<span class="variant-chip">${escapeHtml(briefHint)}</span> ✓`
        : `<span class="variant-chip">${escapeHtml(briefHint)}</span> → <span class="variant-chip">${escapeHtml(heroVariant)}</span> <span class="hint-mismatch">mismatch</span>`
      : briefHint !== undefined
        ? `<span class="variant-chip">${escapeHtml(briefHint)}</span> (no hero)`
        : '—';

  return `<tr>
  <td class="fixture">${escapeHtml(row.fixture)}</td>
  <td>${escapeHtml(row.businessName)}</td>
  <td>${String(sections.length)}</td>
  <td>${header !== undefined ? `<span class="variant-chip">${escapeHtml(header.variant)}</span>` : '—'}</td>
  <td>${hero !== undefined ? `<span class="variant-chip">${escapeHtml(hero.variant)}</span>` : '—'}</td>
  <td>${fgChips.length > 0 ? fgChips : '—'}</td>
  <td>${footer !== undefined ? `<span class="variant-chip">${escapeHtml(footer.variant)}</span>` : '—'}</td>
  <td class="headline">${escapeHtml(hero?.props.headline ?? '—')}</td>
  <td>${hintCellContent}</td>
</tr>`;
}

function renderCard(row: HomePageReportRow): string {
  if (row.site === null) {
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

  const site = row.site;
  const page = site.pages[0];
  if (page === undefined) {
    return `<section class="card failed">
  <h2>${escapeHtml(row.fixture)}</h2>
  <pre class="error-block">No page in site</pre>
</section>`;
  }

  const cachedBadge = row.fromCache
    ? `<span class="pill cached" title="Cached at ${escapeAttr(row.cachedAt ?? '—')}">cached</span>`
    : '';

  const brief = row.brief;
  const briefSummary = `
    <div class="brief-summary">
      <span class="label">archetype</span><span class="val">${escapeHtml(brief.brandArchetype)}</span>
      <span class="label">layout</span><span class="val">${escapeHtml(brief.layoutArchetype)}</span>
      <span class="label">imagery</span><span class="val">${escapeHtml(brief.imagery)}</span>
      <span class="label">voice</span><span class="val">${escapeHtml(brief.voice)}</span>
      <span class="label">palette</span><span class="val">${escapeHtml(brief.colorPalette.strategy)}</span>
      <span class="label">typography</span><span class="val">${escapeHtml(brief.typography)}</span>
      <span class="label">heroHint</span><span class="val">${escapeHtml(brief.componentPreferences.heroVariantHint ?? '—')}</span>
      <span class="label">voice.headline</span><span class="val">${escapeHtml(brief.voiceExamples?.headline ?? '—')}</span>
      <span class="label">voice.cta</span><span class="val">${escapeHtml(brief.voiceExamples?.cta ?? '—')}</span>
    </div>`;

  const seoBlock = `
    <div class="seo-block">
      <div class="seo-row"><span class="label">title</span>${escapeHtml(page.seo.metaTitle)}</div>
      <div class="seo-row"><span class="label">desc</span>${escapeHtml(page.seo.metaDescription)}</div>
    </div>`;

  const sectionsHtml = page.sections.map(renderSection).join('\n');

  return `<section class="card">
  <h2>${escapeHtml(site.metadata.siteName)}${cachedBadge}</h2>
  <p class="desc">${escapeHtml(site.metadata.siteDescription)}</p>
  <p class="meta">
    <span class="pill">fixture ${escapeHtml(row.fixture)}</span>
    <span class="pill">${row.fromCache ? 'cached' : `${String(row.durationMs)}ms`}</span>
    <span class="pill">${String(page.sections.length)} sections</span>
  </p>

  <h3 class="section">Brief inputs</h3>
  ${briefSummary}

  <h3 class="section">SEO</h3>
  ${seoBlock}

  <h3 class="section">Sections (in order)</h3>
  ${sectionsHtml}
</section>`;
}

function renderSection(s: Section): string {
  const gnote =
    s.generatorNotes !== undefined && s.generatorNotes.length > 0
      ? `<div class="gnote">${escapeHtml(s.generatorNotes)}</div>`
      : '';

  const headerLine = `
    <div>
      <span class="stype">${escapeHtml(s.type)}</span>
      <span class="svariant">${escapeHtml(s.variant)}</span>
      <span class="sid">${escapeHtml(s.id)}</span>
    </div>
    ${gnote}`;

  let body = '';
  switch (s.type) {
    case 'header': {
      const linksHtml = s.props.links
        .map((l) => `${escapeHtml(l.label)} → <code>${escapeHtml(l.href)}</code>`)
        .join(', ');
      const cta = s.props.cta
        ? `<span class="cta">${escapeHtml(s.props.cta.label)} → ${escapeHtml(s.props.cta.href)}<span class="style">${escapeHtml(s.props.cta.style)}</span></span>`
        : '';
      const logoText = s.props.logo.text ?? '(image logo)';
      body = `
        <div class="body"><strong>logo:</strong> ${escapeHtml(logoText)}</div>
        <div class="links-row"><strong>links:</strong> ${linksHtml}</div>
        ${cta ? `<div class="cta-row">${cta}</div>` : ''}`;
      break;
    }
    case 'hero': {
      const eyebrow = s.props.eyebrow
        ? `<div class="eyebrow">${escapeHtml(s.props.eyebrow)}</div>`
        : '';
      const subhead = s.props.subheadline
        ? `<div class="body">${escapeHtml(s.props.subheadline)}</div>`
        : '';
      const ctas = [s.props.primaryCta, s.props.secondaryCta]
        .filter((c): c is NonNullable<typeof c> => c !== undefined)
        .map(
          (c) =>
            `<span class="cta">${escapeHtml(c.label)} → ${escapeHtml(c.href)}<span class="style">${escapeHtml(c.style)}</span></span>`,
        )
        .join('');
      const media = s.props.media;
      const imgLine =
        media?.kind === 'image' && media.image !== undefined
          ? `<div class="img">img: <span class="ql">"${escapeHtml(media.image.query ?? '—')}"</span> · alt: ${escapeHtml(media.image.alt ?? '—')}</div>`
          : media?.kind === 'video' && media.videoUrl !== undefined
            ? `<div class="img">video: ${escapeHtml(media.videoUrl)}</div>`
            : media?.kind === 'none'
              ? `<div class="img">no media</div>`
              : '';
      body = `
        ${eyebrow}
        <div class="headline">${escapeHtml(s.props.headline)}</div>
        ${subhead}
        ${ctas ? `<div class="cta-row">${ctas}</div>` : ''}
        ${imgLine}`;
      break;
    }
    case 'feature_grid': {
      const eyebrow = s.props.eyebrow
        ? `<div class="eyebrow">${escapeHtml(s.props.eyebrow)}</div>`
        : '';
      const headline = s.props.headline
        ? `<div class="headline">${escapeHtml(s.props.headline)}</div>`
        : '';
      const subhead = s.props.subheadline
        ? `<div class="body">${escapeHtml(s.props.subheadline)}</div>`
        : '';
      const itemsHtml = s.props.items
        .map((it) => {
          const img =
            it.image !== undefined
              ? `<div class="img">img: <span class="ql">"${escapeHtml(it.image.query ?? '—')}"</span></div>`
              : '';
          const icon =
            it.icon !== undefined
              ? ` <span class="img">icon: ${escapeHtml(it.icon.set)}/${escapeHtml(it.icon.name)}</span>`
              : '';
          return `<li>
            <div class="ititle">${escapeHtml(it.title)}${icon}</div>
            <div class="ibody">${escapeHtml(it.body)}</div>
            ${img}
          </li>`;
        })
        .join('\n');
      body = `
        ${eyebrow}
        ${headline}
        ${subhead}
        <ul class="items">${itemsHtml}</ul>`;
      break;
    }
    case 'footer': {
      const tagline = s.props.tagline
        ? `<div class="body">${escapeHtml(s.props.tagline)}</div>`
        : '';
      const cols =
        s.props.columns !== undefined && s.props.columns.length > 0
          ? `<div class="links-row"><strong>columns:</strong> ${s.props.columns
              .map((c) => `${escapeHtml(c.title)} (${String(c.links.length)} links)`)
              .join(' · ')}</div>`
          : '';
      const newsletter = s.props.newsletter
        ? `<div class="links-row"><strong>newsletter:</strong> ${escapeHtml(s.props.newsletter.headline)} → ${escapeHtml(s.props.newsletter.cta)}</div>`
        : '';
      const socials =
        s.props.socials !== undefined && Object.keys(s.props.socials).length > 0
          ? `<div class="links-row"><strong>socials:</strong> ${Object.keys(s.props.socials).join(', ')}</div>`
          : '';
      body = `
        ${tagline}
        ${cols}
        ${newsletter}
        ${socials}
        <div class="links-row"><strong>copyright:</strong> ${escapeHtml(s.props.legal.copyright)}</div>`;
      break;
    }
    default: {
      // Other section types aren't in scope for phase 3-minimal, but render
      // a generic placeholder if one slips through so the report doesn't
      // silently swallow it.
      body = `<div class="body">(unrecognized section type for this phase)</div>`;
    }
  }

  return `<div class="section-block">
    ${headerLine}
    ${body}
  </div>`;
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
