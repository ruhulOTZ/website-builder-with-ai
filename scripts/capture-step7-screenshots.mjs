// One-off: capture six screenshots of /sites/{forge,bloom,vector} at
// 1280x900 (above the fold) and 375x812 (mobile above the fold).
// Output: docs/step-7-screenshots/{site}-{viewport}.png
//
// Usage: pnpm dev (in another shell), then `node scripts/capture-step7-screenshots.mjs`.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT_DIR = resolve(process.cwd(), 'docs/step-7-screenshots');

const SITES = [
  { slug: 'forge', path: '/sites/forge' },
  { slug: 'bloom', path: '/sites/bloom' },
  { slug: 'vector', path: '/sites/vector' },
];

const VIEWPORTS = [
  { name: '1280', width: 1280, height: 900 },
  { name: '375', width: 375, height: 812 },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const site of SITES) {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        const url = `${BASE_URL}${site.path}`;
        process.stdout.write(`  ${site.slug} @ ${vp.width}x${vp.height} ... `);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        // Belt + braces: also wait for fonts.
        await page.evaluate(() => document.fonts.ready);
        // Above-the-fold capture (not full page).
        const outPath = resolve(OUT_DIR, `${site.slug}-${vp.name}.png`);
        await page.screenshot({ path: outPath, fullPage: false });
        process.stdout.write(`saved ${outPath}\n`);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
