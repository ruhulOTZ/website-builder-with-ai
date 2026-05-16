# design-brief

Generation pipeline: validated `BusinessProfile` → validated `DesignBrief`.

This module is **creative reasoning**, not extraction. The model picks an archetype, palette, typography, layout, voice — design choices grounded in the facts that the parser pulled out. Where `business-profile` is conservative ("never invent"), `design-brief` is opinionated by design ("two different businesses should produce two visibly different briefs"). The two-stage split is deliberate: downstream content generation builds on a stable factual foundation, then on creative choices made once and recorded.

## What's in here

```
design-brief/
├── prompts/
│   └── brief-v1.ts                   ← the prompt (versioned)
├── dto/
│   └── generate-request.dto.ts       ← Zod body schema for /api/design-brief/generate
├── design-brief-generator.service.ts ← pure generation service (no DB)
├── design-brief.repository.ts        ← Prisma wrapper, write-only for now
├── design-brief.controller.ts        ← dev-gated POST /api/design-brief/generate
└── design-brief.module.ts
```

## How the service handles the `businessProfile` round-trip

`DesignBriefSchema.businessProfile` is the full `BusinessProfileSchema`. Naively, the AI would have to copy the input profile (~1500 tokens) back into its output. We avoid that:

1. The service uses a **`GenerationSchema`** for the AI call — `DesignBriefSchema.omit({ businessProfile: true }).extend({ businessProfile: z.unknown().optional() })`.
2. The prompt instructs the model to emit `businessProfile: {}` — a trivial placeholder.
3. After the AI call, the service **injects** the input profile into the response and validates the merged object against the canonical `DesignBriefSchema`.

Saves output tokens and eliminates paraphrasing drift. See Phase 2.3a review thread for the decision.

## Running the eval rig

The eval rig is the primary way to iterate on the prompt. It runs every parsed profile in `apps/api/test/fixtures/parsed-profiles/*.json` against the current brief prompt and produces an HTML report with side-by-side variety comparison plus per-fixture cards (color swatches, archetype, traits, etc.).

```bash
# 1. Ensure GEMINI_API_KEY is set in apps/api/.env
# 2. Ensure Postgres is up (the service doesn't write to DB, but AppModule
#    includes DatabaseModule on bootstrap)
docker compose up -d postgres

# 3. Run the rig
pnpm --filter api eval:brief
```

Output:

- `apps/api/test/eval-output/brief-{ISO_timestamp}/` — one folder per run
- `report.html` inside that folder — open in a browser; renders OKLCH swatches and side-by-side variety table
- `summary.json` — per-fixture metadata
- One `{fixture-name}.json` per fixture with the full brief + audit fields

## Iterating on the prompt

1. Run the eval on the current prompt — review variety, fit, coherence, rationale specificity.
2. Copy `prompts/brief-v1.ts` → `prompts/brief-v2.ts`.
3. Bump `PROMPT_VERSION` inside the new file.
4. Edit the system prompt to address findings.
5. In `design-brief-generator.service.ts`, swap the import:
   ```ts
   import { buildBriefPrompt, PROMPT_VERSION } from './prompts/brief-v2';
   ```
6. Re-run `pnpm --filter api eval:brief`. Open the new report alongside the old.
7. If v2 is a net improvement, commit. If not, revert the import and try v3.

Why versioned files instead of editing in place: each persisted brief carries `promptVersion` in audit metadata, so we can correlate quality with prompt revisions. Diffing two `brief-vN.ts` files in git gives a clean change history.

## Why temperature is 0.7 (not 0.2)

The parser uses `temperature: 0.2` — extraction benefits from determinism. The brief generator uses `temperature: 0.7` — creative reasoning benefits from variety, and we want distinct businesses to produce distinct briefs. Don't lower it without first ruling out cache + prompt issues; non-distinctive output is more often a prompt problem than a temperature problem.

## Known prompt failure modes

(Filled in as we discover them via the eval rig.)

- _Pending first eval read — brief-v1 not yet authored._

## Manual smoke test

```bash
curl -X POST http://localhost:3001/api/design-brief/generate \
  -H "Content-Type: application/json" \
  -d "$(jq -n --argjson p "$(cat apps/api/test/fixtures/parsed-profiles/gym-powerlifting-detailed.json)" \
    --rawfile r apps/api/test/fixtures/requirements/gym-powerlifting-detailed.txt \
    '{profile: $p, rawDocumentText: $r, sourceLabel: "gym-powerlifting-detailed"}')"
```

Response shape:

```json
{
  "id": "cuid-or-omitted-when-persist-false",
  "brief": { "...": "DesignBrief" },
  "modelUsed": "gemini-2.5-flash",
  "promptVersion": "brief-v1"
}
```

`persist: true` is the default. Pass `"persist": false` in the body to skip the DB write.

## Production gate

This controller is gated by `NODE_ENV !== 'production'`. Auth lands in Phase 2.5; until then, the generate endpoint is dev-only.
