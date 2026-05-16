import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { type AIProvider } from '@repo/ai';
import { type BusinessProfile, type DesignBrief, type Site, SiteSchema } from '@repo/shared-types';

import { AI_PROVIDER } from '../ai/ai.tokens';
import { normalizeStrings } from '../shared/normalize-strings';

import { briefToThemeTokens } from './brief-to-theme';
// Two-schema discipline:
//   - Narrow at the AI seam: HomePageGenerationSchema only allows the 4
//     section types this phase ships. Keeps Gemini's structured-output
//     constraint automaton inside its "too many states" budget — see the
//     generation-schemas/home-page-v1.ts header for the failure mode.
//   - Wide at the storage seam: SiteSchema.parse(merged) below validates
//     the final merged Site. Any narrow-schema output is by construction
//     valid under the wide schema, so SiteSchema.parse covers both the
//     AI's content and the service-side injections in one gate.
import {
  GENERATION_SCHEMA_VERSION,
  HomePageGenerationSchema,
  type HomePageGenerationOutput,
} from './generation-schemas/home-page-v1';
import { resolveImageRefs } from './image-resolution';
import { buildHomePagePrompt, PROMPT_VERSION } from './prompts/home-page-v1';

const MODEL = 'gemini-2.5-flash';
// Between brief (0.7) and parser (0.2). Creative reasoning for headlines /
// variant choices, but with structural constraints (section discriminated
// union, enum-only variant values) that benefit from a tighter sampling.
const TEMPERATURE = 0.6;
// 24576 — the Page output is significantly larger than a brief. 4–6
// sections, each with content + variant choice + image queries + optional
// generatorNotes. Brief was 16384 and that proved tight on long fixtures.
const MAX_OUTPUT_TOKENS = 24576;

/**
 * The AI emits a Page object. We post-construct the full Site:
 *   - inject `schemaVersion`, `id`, `designBriefId`
 *   - derive `metadata` from the input profile
 *   - derive `theme` from the input brief (mechanical map)
 *   - derive `navigation.primary` from the header section's `links`
 *   - stamp `generation` (audit fields)
 * Then validate the merged result against canonical SiteSchema. The order
 * of derivation matters: SiteSchema.parse(merged) is the single validation
 * gate covering everything we emit.
 *
 * Keeping the AI's creative surface to just the Page (sections, variants,
 * content, image queries) means the schemas align cleanly: SiteSchema.parse
 * catches any drift on either side.
 */
const GenerationSchema = HomePageGenerationSchema;
type GenerationOutput = HomePageGenerationOutput;

export interface GenerateInput {
  profile: BusinessProfile;
  brief: DesignBrief;
  /** The brief's persisted ID. Stamped on the generated Site for audit. */
  designBriefId: string;
  rawDocumentText?: string;
  sourceLabel?: string;
}

export interface GenerateResult {
  site: Site;
  modelUsed: string;
  promptVersion: string;
}

@Injectable()
export class HomePageGeneratorService {
  private readonly logger = new Logger(HomePageGeneratorService.name);

  /** Read-only identifiers exposed for cache keying / introspection. */
  readonly model: string = MODEL;
  readonly promptVersion: string = PROMPT_VERSION;

  constructor(@Inject(AI_PROVIDER) private readonly ai: AIProvider) {}

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const { system, user } = buildHomePagePrompt({
      profile: input.profile,
      brief: input.brief,
      ...(input.rawDocumentText !== undefined ? { rawDocumentText: input.rawDocumentText } : {}),
    });

    this.logger.log(
      `Generating home page (source=${input.sourceLabel ?? 'unlabeled'}, business=${input.profile.businessName}, prompt=${PROMPT_VERSION}, generation-schema=${GENERATION_SCHEMA_VERSION})`,
    );

    // Generate the Page. The AI does not see the schemas for theme,
    // metadata, navigation, or generation — those are server-injected.
    const page: GenerationOutput = await this.ai.generateStructured(GenerationSchema, user, {
      model: MODEL,
      system,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    // Derive navigation from the Header section's links (approach 1 per
    // the orientation review: AI emits Header.props.links directly, we
    // derive Site.navigation.primary from those so the two stay in sync
    // by construction). If the AI didn't emit a Header section (unusual,
    // would fail SiteSchema below anyway), fall back to brief's
    // recommendedPages so the navigation is at least populated.
    const headerSection = page.sections.find((s) => s.type === 'header');
    const navigationPrimary =
      headerSection !== undefined
        ? headerSection.props.links.map((l) => ({
            label: l.label,
            href: l.href,
            external: l.external,
          }))
        : input.brief.recommendedPages.map((p) => ({
            label: p.title,
            href: `/${p.slug}`,
            external: false,
          }));

    // The site object is typed as `unknown` here because the narrow
    // HomePageGenerationOutput's Page is a strict subset of the canonical
    // Page (it omits seo.noIndex, ogImage, canonicalPath, themeOverride,
    // and other fields with canonical defaults). SiteSchema.parse below
    // applies those defaults during parsing, so the validated result is a
    // canonical `Site`. Going through `unknown` avoids fighting the type
    // checker over fields the parser will set.
    const siteInput: unknown = {
      schemaVersion: 1,
      id: `site_${randomUUID()}`,
      designBriefId: input.designBriefId,
      metadata: {
        siteName: input.profile.businessName,
        siteDescription: input.profile.oneLineDescription,
        locale: 'en',
      },
      theme: briefToThemeTokens(input.brief),
      navigation: {
        primary: navigationPrimary,
      },
      pages: [page],
      generation: {
        generatedAt: new Date().toISOString(),
        model: MODEL,
        promptVersion: PROMPT_VERSION,
      },
    };

    // Single validation gate — covers everything: AI's Page content + the
    // service-derived theme/navigation/metadata + canonical-schema defaults
    // (e.g. seo.noIndex=false, link.external=false). If the AI emitted a
    // bad variant enum or the derivation slipped, this throws ZodError
    // and the eval rig tags it `phase: 'post-injection-validation'`.
    const validated: Site = SiteSchema.parse(siteInput);

    // Post-AI enrichment: populate ImageRef.url from query strings via
    // Unsplash Source API. Pure function — no network call at this point;
    // the URL is a redirect that resolves at render time in the browser.
    // Runs after SiteSchema.parse so all fields are typed; no re-validation
    // needed (we only add strings to existing optional url fields).
    const withImages: Site = resolveImageRefs(validated);

    return {
      site: normalizeStrings(withImages),
      modelUsed: MODEL,
      promptVersion: PROMPT_VERSION,
    };
  }
}
