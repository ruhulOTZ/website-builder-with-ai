// verify-generation-roundtrip.ts — deterministic verification of the
// narrow→wide invariant for the home-page generator. No AI call.
//
// What it proves:
//   1. A plausible Iron Halo Page (hand-built using ONLY the narrow
//      AI-surface schemas) parses cleanly against HomePageGenerationSchema.
//      This is the AI seam — the contract between the prompt and the
//      structured-output system.
//   2. After the service's post-AI enrichment (server-injected
//      schemaVersion, id, designBriefId, metadata, theme, navigation,
//      generation), the merged Site parses cleanly against canonical
//      SiteSchema. This is the storage seam.
//
// If either parse fails, the script exits non-zero with a description of
// what failed. This must pass before any AI call — it catches drift
// between narrow and canonical schemas (e.g. someone adds a required
// field to canonical without updating the AI surface).
//
// Run via `pnpm --filter api verify:generation-roundtrip`.

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  type BusinessProfile,
  BusinessProfileSchema,
  type DesignBrief,
  DesignBriefSchema,
  type Site,
  SiteSchema,
} from '@repo/shared-types';
import { type ZodError } from 'zod';

import { briefToThemeTokens } from '../src/home-page/brief-to-theme';
import {
  HomePageGenerationSchema,
  type HomePageGenerationOutput,
} from '../src/home-page/generation-schemas/home-page-v1';

const PROFILE_PATH = resolve(
  __dirname,
  '../test/fixtures/parsed-profiles/gym-powerlifting-detailed.json',
);
const BRIEF_PATH = resolve(
  __dirname,
  '../test/fixtures/design-briefs/gym-powerlifting-detailed.json',
);

/**
 * Hand-built plausible Iron Halo home page using ONLY the narrow
 * AI-surface schemas. Mirrors what we expect the AI to emit: 5 sections
 * (Header, Hero, 2 FeatureGrids with different variants, Footer),
 * grounded content, ImageRef with query+alt only, no socials, no
 * focalPoint, no array bounds violated. This is the shape we promise the
 * model can produce.
 */
function buildPlausibleNarrowPage(): unknown {
  return {
    id: 'page_home',
    slug: '',
    title: 'Home',
    seo: {
      metaTitle: 'Iron Halo — Powerlifting and strongman gym, Salford',
      metaDescription:
        'Mandatory coaching from IPF cat-2 coaches. Open floor for serious lifters only — apply for membership.',
    },
    sections: [
      {
        id: 'sec_header',
        type: 'header',
        variant: 'logo_left_cta_right',
        generatorNotes:
          'Picked logo_left_cta_right because brief.brandArchetype is hero and layoutArchetype is hero_centric — Iron Halo wants applicants to feel the urgency.',
        props: {
          logo: { text: 'Iron Halo' },
          links: [
            { label: 'About', href: '/about', external: false },
            { label: 'Coaches', href: '/coaches', external: false },
            { label: 'Membership', href: '/membership', external: false },
            { label: 'Contact', href: '/contact', external: false },
          ],
        },
      },
      {
        id: 'sec_hero',
        type: 'hero',
        variant: 'centered_text_over_image',
        generatorNotes:
          'Picked centered_text_over_image because brief.componentPreferences.heroVariantHint named this variant and brief.imagery is documentary_photography.',
        props: {
          eyebrow: 'POWERLIFTING · STRONGMAN · STRENGTH',
          headline: 'Train where lifters train.',
          subheadline:
            'Mandatory coaching from IPF cat-2 and BWL level 3 coaches. Open floor for serious lifters only — no waitlist for non-aligned applicants.',
          primaryCta: {
            label: 'Apply for membership',
            href: '/membership',
            style: 'primary',
            external: false,
          },
          secondaryCta: {
            label: 'Meet the coaches',
            href: '/coaches',
            style: 'secondary',
            external: false,
          },
          media: {
            kind: 'image',
            image: {
              query: 'powerlifter mid-deadlift dark gym dramatic',
              alt: 'Powerlifter pulling a heavy deadlift in a dimly lit gym.',
            },
          },
        },
      },
      {
        id: 'sec_features_1',
        type: 'feature_grid',
        variant: '3_col_icon_top',
        generatorNotes:
          'Picked 3_col_icon_top because the items are short principle statements; the prompt says this is the most common choice and visual rhythm prefers it after a centered image Hero.',
        props: {
          eyebrow: 'WHAT MAKES THE FLOOR WORK',
          headline: 'A floor built for the lift, not the look.',
          items: [
            {
              icon: { set: 'lucide', name: 'shield-check' },
              title: 'Mandatory coaching',
              body: 'Every member trains with a coach. IPF cat-2 and BWL level 3 certified.',
            },
            {
              icon: { set: 'lucide', name: 'users' },
              title: 'Open floor, no queues',
              body: 'Member cap means racks, platforms, and competition gear are available when you need them.',
            },
            {
              icon: { set: 'lucide', name: 'trophy' },
              title: 'Sponsored athletes',
              body: 'Three current British record holders train here. Compete or just lift; both are home.',
            },
          ],
        },
      },
      {
        id: 'sec_features_2',
        type: 'feature_grid',
        variant: 'alternating_rows',
        generatorNotes:
          'Picked alternating_rows because the equipment story deserves visual weight and the variety rule forbids reusing 3_col_icon_top from sec_features_1.',
        props: {
          eyebrow: 'EQUIPMENT',
          headline: 'The kit you need, in the quantities you need.',
          items: [
            {
              image: {
                query: 'eleiko competition platform deadlift bar weight plates',
                alt: 'Eleiko competition platforms with calibrated plates ready for use.',
              },
              title: 'Six Eleiko platforms',
              body: 'Three competition, three training. Calibrated plates on every platform; no shared queueing.',
            },
            {
              image: {
                query: 'strongman log press atlas stone tire flip',
                alt: 'Strongman equipment laid out: log, atlas stones, and tyres.',
              },
              title: 'Full strongman setup',
              body: 'Log, axle, atlas stones to 150kg, yoke, farmer’s handles, four tyres. Programmed weekly.',
            },
          ],
        },
      },
      {
        id: 'sec_footer',
        type: 'footer',
        variant: 'minimal_centered',
        generatorNotes:
          'Picked minimal_centered because brief.brandArchetype is hero — restrained footer keeps the focus on the membership CTA upstream.',
        props: {
          logo: { text: 'Iron Halo' },
          tagline: 'Powerlifting and strongman gym, Salford.',
          legal: {
            copyright: '© 2026 Iron Halo. All rights reserved.',
            links: [
              { label: 'Privacy', href: '/privacy', external: false },
              { label: 'Terms', href: '/terms', external: false },
            ],
          },
        },
      },
    ],
  };
}

interface CheckResult {
  ok: boolean;
  detail: string;
}

function fmtZodError(err: ZodError): string {
  return err.issues
    .slice(0, 10)
    .map((i) => `    - [${i.path.join('.')}] ${i.message}`)
    .join('\n');
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('verify-generation-roundtrip — no AI calls\n');

  // ── Step 1: narrow-schema parse (the AI seam) ────────────────────
  const candidate = buildPlausibleNarrowPage();
  let narrowParsed: HomePageGenerationOutput | null = null;
  const narrowResult: CheckResult = (() => {
    const result = HomePageGenerationSchema.safeParse(candidate);
    if (result.success) {
      narrowParsed = result.data;
      return {
        ok: true,
        detail: `parsed ${String(result.data.sections.length)} sections (${result.data.sections.map((s) => s.type).join(', ')})`,
      };
    }
    return { ok: false, detail: fmtZodError(result.error) };
  })();

  // eslint-disable-next-line no-console
  console.log(
    `[1/2] AI-surface parse (HomePageGenerationSchema):  ${narrowResult.ok ? 'PASS' : 'FAIL'}`,
  );
  // eslint-disable-next-line no-console
  console.log(`      ${narrowResult.detail}`);

  if (!narrowResult.ok || narrowParsed === null) {
    console.error(
      '\nCannot proceed to storage-seam check — the candidate Page does not satisfy the narrow schema. Fix the candidate or the AI-surface schema and re-run.',
    );
    process.exit(1);
  }

  // ── Step 2: apply post-AI enrichment as the service does ─────────
  // Load real profile + brief snapshots so the enrichment is realistic.
  const profile: BusinessProfile = BusinessProfileSchema.parse(
    JSON.parse(await readFile(PROFILE_PATH, 'utf8')),
  );
  const brief: DesignBrief = DesignBriefSchema.parse(
    JSON.parse(await readFile(BRIEF_PATH, 'utf8')),
  );

  // The service's enrichment surface (mirrors home-page-generator.service.ts):
  //   - schemaVersion, id, designBriefId: stamped
  //   - metadata: derived from input profile
  //   - theme: derived from input brief via briefToThemeTokens
  //   - navigation.primary: derived from Header section's links
  //   - pages: [the AI's Page]
  //   - generation: audit metadata
  // ImageRef enrichment (e.g. resolving Unsplash URLs) is NOT part of the
  // generator — that's a separate downstream stage. Canonical ImageRef
  // accepts `{ query, alt }` because `url`/`focalPoint`/`credit` are
  // optional. So we pass the narrow Page through verbatim.
  const headerSection = narrowParsed.sections.find((s) => s.type === 'header');
  const navigationPrimary =
    headerSection !== undefined
      ? headerSection.props.links.map((l) => ({
          label: l.label,
          href: l.href,
          external: l.external,
        }))
      : brief.recommendedPages.map((p) => ({
          label: p.title,
          href: `/${p.slug}`,
          external: false,
        }));

  const siteInput: unknown = {
    schemaVersion: 1,
    id: `site_${randomUUID()}`,
    designBriefId: 'brief_verify_roundtrip',
    metadata: {
      siteName: profile.businessName,
      siteDescription: profile.oneLineDescription,
      locale: 'en',
    },
    theme: briefToThemeTokens(brief),
    navigation: { primary: navigationPrimary },
    pages: [narrowParsed],
    generation: {
      generatedAt: new Date().toISOString(),
      model: 'gemini-2.5-flash',
      promptVersion: 'home-page-v1',
    },
  };

  let storageParsed: Site | null = null;
  const storageResult: CheckResult = (() => {
    const result = SiteSchema.safeParse(siteInput);
    if (result.success) {
      storageParsed = result.data;
      return {
        ok: true,
        detail: `parsed Site for "${result.data.metadata.siteName}" — ${String(result.data.pages.length)} page(s), ${String(result.data.pages[0]?.sections.length ?? 0)} sections, theme.colors.primary=${result.data.theme.colors.primary}`,
      };
    }
    return { ok: false, detail: fmtZodError(result.error) };
  })();

  // eslint-disable-next-line no-console
  console.log(
    `[2/2] Post-enrichment parse (canonical SiteSchema): ${storageResult.ok ? 'PASS' : 'FAIL'}`,
  );
  // eslint-disable-next-line no-console
  console.log(`      ${storageResult.detail}`);

  const allOk = narrowResult.ok && storageResult.ok && storageParsed !== null;

  // eslint-disable-next-line no-console
  console.log(`\n${'─'.repeat(46)}`);
  // eslint-disable-next-line no-console
  console.log(`  invariant:  narrow ⊂ wide`);
  // eslint-disable-next-line no-console
  console.log(
    `  result:     ${allOk ? 'PASS — safe to call AI' : 'FAIL — fix before any AI call'}`,
  );
  // eslint-disable-next-line no-console
  console.log('─'.repeat(46));

  process.exit(allOk ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error('verify-generation-roundtrip: unhandled', err);
  process.exit(2);
});
