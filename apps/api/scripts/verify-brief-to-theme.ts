// One-off helper exercising briefToThemeTokens against a real brief.
// Reads the gym-powerlifting brief from the latest brief-v2 eval output,
// runs the mapping, validates the result against ThemeTokensSchema, and
// reports PASS / FAIL. Used once during Phase 3-minimal 1a scaffolding.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { DesignBriefSchema, ThemeTokensSchema } from '@repo/shared-types';

import { briefToThemeTokens } from '../src/home-page/brief-to-theme';

const FIXTURE = resolve(
  __dirname,
  '../test/eval-output/brief-2026-05-15T17-49-13/gym-powerlifting-detailed.json',
);

async function main(): Promise<void> {
  const raw = await readFile(FIXTURE, 'utf8');
  const wrapped = JSON.parse(raw) as { brief: unknown };
  const brief = DesignBriefSchema.parse(wrapped.brief);

  const theme = briefToThemeTokens(brief);
  const validated = ThemeTokensSchema.parse(theme);

  // eslint-disable-next-line no-console
  console.log(`
briefToThemeTokens verification
──────────────────────────────────────────────
  fixture:         ${FIXTURE}
  business:        ${brief.businessProfile.businessName}
  brief.archetype: ${brief.brandArchetype}
  brief.palette:   ${brief.colorPalette.strategy}
  brief.typo:      ${brief.typography}

  theme.colors.primary:    ${validated.colors.primary}
  theme.typography.pairing: ${validated.typography.pairingId}
  theme.typography.heading: ${validated.typography.headingFamily}
  theme.typography.scale:  ${validated.typography.scale}
  theme.radius / shadow:   ${validated.radius} / ${validated.shadow}
  theme.density / motion:  ${validated.density} / ${validated.motion}
  theme.darkMode present:  ${String(validated.darkMode !== undefined)}

  ThemeTokensSchema parse: PASS
──────────────────────────────────────────────`);
}

main().catch((err: unknown) => {
  console.error('verify-brief-to-theme: failed', err);
  process.exit(1);
});
