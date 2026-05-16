// home-page-v1 — narrow AI-surface schema for the home-page generator.
//
// Why a separate schema (not just PageSchema):
//   Phase 3-minimal ships only 4 section types (Header, Hero, FeatureGrid,
//   Footer). The canonical SectionSchema in shared-types is a 16-branch
//   discriminated union covering every section the renderer supports. When
//   passed to Gemini as a structured-output constraint, the 16-branch
//   automaton exceeds Gemini's `too many states for serving` budget and
//   the API rejects the call with HTTP 400 before any token is generated.
//
//   The fix is structural, not a tuning issue: we hand the AI a narrower
//   schema that only allows the section types this phase actually ships.
//   The model's surface matches the prompt's promised vocabulary; Gemini's
//   constraint automaton stays well inside budget; the canonical
//   SiteSchema is untouched.
//
// Two-schema discipline:
//   - Narrow at the AI seam: HomePageGenerationSchema (this file). Limits
//     what the model is allowed to emit.
//   - Wide at the storage seam: SiteSchema (in shared-types, applied in
//     home-page-generator.service after server-side injection). Validates
//     the final merged Site, including theme/navigation/metadata fields
//     the AI never saw.
//   Any output that satisfies the narrow schema is by construction valid
//   under the wide schema — the narrow schema is a strict subset.
//
// Versioning:
//   This file's GENERATION_SCHEMA_VERSION must move in lockstep with the
//   PROMPT_VERSION in prompts/home-page-v1.ts. When the prompt evolves to
//   v2 and (e.g.) opens the section pool to include `about` or `cta_block`,
//   copy this file to home-page-v2.ts and add those branches there.
//
// Iterating: copy this file to home-page-vN.ts, bump
// GENERATION_SCHEMA_VERSION, swap the import in
// home-page-generator.service.ts.

import {
  FeatureGridSectionSchema,
  FooterSectionSchema,
  HeaderSectionSchema,
  HeroSectionSchema,
  PageSchema,
} from '@repo/shared-types';
import { z } from 'zod';

export const HomePageGenerationSchema = PageSchema.extend({
  sections: z
    .array(
      z.discriminatedUnion('type', [
        HeaderSectionSchema,
        HeroSectionSchema,
        FeatureGridSectionSchema,
        FooterSectionSchema,
      ]),
    )
    .min(1),
});

export type HomePageGenerationOutput = z.infer<typeof HomePageGenerationSchema>;

export const GENERATION_SCHEMA_VERSION = 'home-page-v1';
