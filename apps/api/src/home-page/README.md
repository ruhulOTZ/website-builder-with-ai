# home-page

Generation pipeline: validated `BusinessProfile` + validated `DesignBrief` → validated `Site` containing a single home `Page`.

This module is **structural + creative reasoning**: the model selects which section types to include, picks the variant for each, and writes the actual content (headlines, body copy, CTAs, image queries). The design DNA — palette, typography, density, motion — is locked in by the brief and propagated to `Site.theme` mechanically by the service. The AI does not get to revisit those.

Phase 3-minimal: home page only. Phase 3-full adds the architect step (page list refinement) and multi-page generation.

## What's in here

```
home-page/
├── prompts/
│   └── home-page-v1.ts                ← the prompt (versioned)
├── dto/
│   └── generate-request.dto.ts        ← Zod body schema for /api/home-page/generate
├── brief-to-theme.ts                  ← DesignBrief → ThemeTokens (mechanical map)
├── home-page-generator.service.ts     ← AI call + site assembly + validation
├── home-page.repository.ts            ← Prisma wrapper, write-only for now
├── home-page.controller.ts            ← dev-gated POST /api/home-page/generate
└── home-page.module.ts
```

## How the service assembles the Site

The AI emits a `Page` object — sections, variants, content, image queries. Everything else (`schemaVersion`, `id`, `designBriefId`, `metadata`, `theme`, `navigation`, `generation`) is constructed server-side and merged before a single `SiteSchema.parse(merged)` validation:

1. **`metadata`** is derived from the input profile (`businessName` → `siteName`; `oneLineDescription` → `siteDescription`).
2. **`theme`** is derived from the input brief via `briefToThemeTokens()`. This is a 1:1 mapping — colors, typography pairing, density, radius, shadow, motion all transfer mechanically. No AI involvement.
3. **`navigation.primary`** is derived from the AI-emitted Header section's `links`. The two stay in sync by construction (approach 1 from the Phase 3-minimal orientation: AI emits Header links directly; service derives navigation from them).
4. **`generation`** is the audit stamp — `generatedAt`, `model`, `promptVersion`, optional `jobId`. Never AI-emitted.

`SiteSchema.parse(merged)` is the single validation gate covering both the AI's content and the service's derivations.

## Running the eval rig

(Phase 3 sub-step 1c lands the eval rig; the README will update with paths once it ships.)

```bash
# 1. Ensure GEMINI_API_KEY is set in apps/api/.env
# 2. Ensure Postgres is up
docker compose up -d postgres

# 3. Run the rig
pnpm --filter api eval:home-page
```

## Iterating on the prompt

Same versioned-prompts pattern as `business-profile` and `design-brief`:

1. Run the eval on the current prompt — review variety, fit, coherence in the HTML report.
2. Copy `prompts/home-page-v1.ts` → `prompts/home-page-v2.ts`.
3. Bump `PROMPT_VERSION` inside the new file.
4. Edit the system prompt to address findings.
5. In `home-page-generator.service.ts`, swap the import to `./prompts/home-page-v2`.
6. Re-run the eval. Open the new report alongside the old one.

Never edit a shipped version in place — each persisted site carries `promptVersion` in audit metadata, and we want the history to be diffable in git.

## Why temperature is 0.6

Between brief (`0.7`) and parser (`0.2`). The home-page prompt does three things that pull in opposite directions:

- **Variant choice** benefits from creative variety (lean higher).
- **Content generation** benefits from creative variety (lean higher).
- **Structural correctness** — discriminated-union section types, enum-only variant strings, image-query format — benefits from tighter sampling (lean lower).

`0.6` is the empirical balance: creative enough that headlines aren't generic, tight enough that the model doesn't drift outside the enum surface. Move lower in v2 only if the eval shows headline collapse; move higher only if structural validity holds and variety is too tight.

## Manual smoke test

```bash
curl -X POST http://localhost:3001/api/home-page/generate \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --argjson p "$(cat apps/api/test/fixtures/parsed-profiles/gym-powerlifting-detailed.json)" \
    --argjson b "$(cat apps/api/test/fixtures/design-briefs/gym-powerlifting-detailed.json)" \
    --arg id "test-brief-id" \
    --rawfile r apps/api/test/fixtures/requirements/gym-powerlifting-detailed.txt \
    '{profile: $p, brief: $b, designBriefId: $id, rawDocumentText: $r, sourceLabel: "gym-powerlifting-detailed"}')"
```

Response shape:

```json
{
  "id": "cuid-or-omitted-when-persist-false",
  "site": { "...": "Site (one home page)" },
  "modelUsed": "gemini-2.5-flash",
  "promptVersion": "home-page-v1"
}
```

`persist: true` is the default. Pass `"persist": false` in the body to skip the DB write.

## Production gate

This controller is gated by `NODE_ENV !== 'production'`. Auth lands in Phase 2.5; until then, the generate endpoint is dev-only.
