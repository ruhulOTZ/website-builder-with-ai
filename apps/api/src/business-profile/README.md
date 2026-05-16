# business-profile

Extraction pipeline: plain-text business requirements document → validated `BusinessProfile`.

This module is **extraction only**. No creative reasoning, no archetype selection, no design choices — those land in `design-brief` (Phase 2.3). The AI's job here is to read the document and pull out facts.

## What's in here

```
business-profile/
├── prompts/
│   └── parse-v1.ts                  ← the prompt (versioned)
├── dto/
│   └── parse-request.dto.ts         ← Zod body schema for /api/business-profile/parse
├── business-profile-parser.service.ts ← pure extraction service (no DB)
├── business-profile.repository.ts   ← Prisma wrapper, write-only for now
├── business-profile.controller.ts   ← dev-gated POST /api/business-profile/parse
└── business-profile.module.ts
```

## Running the eval rig

The eval rig is the primary way to iterate on the prompt. It runs every fixture in `apps/api/test/fixtures/requirements/_index.json` against the current prompt and produces a side-by-side HTML report.

```bash
# 1. Ensure GEMINI_API_KEY is set in apps/api/.env
# 2. Ensure Postgres is up (the parser service itself doesn't write to DB,
#    but the AppModule includes DatabaseModule on bootstrap, so the DB must
#    be reachable)
docker compose up -d postgres

# 3. Run the rig
pnpm --filter @repo/api eval:parse
```

Output:

- `apps/api/test/eval-output/parse-{ISO_timestamp}/` — one folder per run
- `report.html` inside that folder — open in a browser to scan all results
- `summary.json` — `{ fixture, expectedDomain, actualDomain, match, durationMs, error? }`
- One `{fixture-name}.json` per fixture with the full parsed profile + metadata

Stdout shows pass/fail per fixture plus totals.

## Iterating on the prompt

1. Run the eval once on the current prompt — note the failure modes in `report.html`.
2. Copy `prompts/parse-v1.ts` → `prompts/parse-v2.ts`.
3. Bump `PROMPT_VERSION` inside the new file.
4. Edit the system prompt to address the failure modes.
5. In `business-profile-parser.service.ts`, swap the import:
   ```ts
   import { buildParsePrompt, PROMPT_VERSION } from './prompts/parse-v2';
   ```
6. Re-run `pnpm --filter @repo/api eval:parse`. Open the new report alongside the old one.
7. If v2 is a net improvement, commit. If not, revert the import and try v3.

Why versioned files instead of editing in place: each parsed profile written to the DB carries `promptVersion`, so we can correlate output quality with prompt revisions later. Diffing two `parse-vN.ts` files in git also gives a clean change history of how the prompt evolved.

## Known prompt failure modes

(Filled in as we discover them via the eval rig. Each entry should describe the symptom and the fix in the next prompt version.)

- _Pending first eval read — see this step's final report._

## Manual smoke test

```bash
curl -X POST http://localhost:3001/api/business-profile/parse \
  -H "Content-Type: application/json" \
  -d "$(jq -Rs '{rawText: ., sourceLabel: \"gym-powerlifting-detailed\"}' < apps/api/test/fixtures/requirements/gym-powerlifting-detailed.txt)"
```

Response shape:

```json
{
  "id": "cuid-or-omitted-when-persist-false",
  "profile": { "...": "BusinessProfile" },
  "modelUsed": "gemini-2.5-flash",
  "promptVersion": "parse-v1"
}
```

`persist: true` is the default. Pass `"persist": false` in the body to skip the DB write.

## Production gate

This controller is gated by `NODE_ENV !== 'production'`. Auth lands in Phase 2.5; until then, the parse endpoint is dev-only.
