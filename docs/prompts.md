# Prompt Iteration Discipline

How we work with AI prompts in this project.

## Prompt structure

- One file per prompt version: `apps/api/src/<feature>/prompts/<name>-v<N>.ts`
- Each file exports a `PROMPT_VERSION` constant and a `build*Prompt` function
- Service files import the current version's prompt directly. Bumping versions = changing one import + one constant.

## Versioning rule

Never edit an existing prompt version. Copy `parse-v1.ts` → `parse-v2.ts`, change PROMPT_VERSION, edit. Always preserve old versions in the repo. Eval cache keys include PROMPT_VERSION, so old reports remain re-openable.

## Eval rig

Located at `apps/api/scripts/eval-parse.ts` (and similar for future prompts).

What it does:

1. Reads fixtures from `apps/api/test/fixtures/requirements/`
2. Runs each through the current prompt version via the parser service
3. Saves results to `apps/api/test/eval-output/parse-<timestamp>/`
4. Generates an HTML report for side-by-side review

Run: `pnpm --filter api eval:parse`
Skip cache: `pnpm --filter api eval:parse --no-cache`

The brief generator has its own parallel rig at `apps/api/scripts/eval-brief.ts` with the same structure (versioned prompts, cache, per-fixture JSON + HTML report). Run: `pnpm --filter api eval:brief`. Pass `--dry-run` to load + validate all 10 parsed-profile snapshots without making any AI calls — useful for pre-flight checks.

## Eval rig philosophy

The eval rig is dev infrastructure, not a product feature. Users run one document at a time through the API. The eval rig exists for us, to validate that the prompt produces good results across a representative corpus before shipping changes.

## Cache strategy

Cache key: hash of (fixture content + PROMPT_VERSION + model name)
Cache locations (both gitignored):

- Parser: `apps/api/test/eval-output/.cache/`
- Brief generator: `apps/api/test/eval-output/.cache-brief/`

Both rigs use the same underlying `scripts/file-cache.ts` module, parameterized over the cache directory. Bumping PROMPT_VERSION invalidates the entire cache for that prompt — every fixture gets a fresh AI call. This is intentional.

## Caching behavior with non-deterministic AI outputs

The eval rig caches results keyed by `(fixtureContent, promptVersion, modelName)`. This means:

- Bumping `PROMPT_VERSION` invalidates the cache for that prompt (every fixture re-runs).
- For prompts with `temperature > 0` (the brief generator runs at `0.7`), running the same fixture twice produces different outputs in theory, but the cache fixes the first successful result as canonical.
- To explicitly measure variance across runs, pass `--no-cache` and run the eval multiple times. The cache will be overwritten with the most recent run.

This is a deliberate trade-off: cache stability beats variance visibility for iteration loops, where we want to attribute changes in output to changes in prompt, not to model randomness. A dedicated "variance run" mode (run each fixture N times with `--no-cache`) is a future capability — not built yet because we haven't needed to measure run-to-run variance directly.

## Free-tier quota constraint

Gemini 2.5 Flash free tier: 20 requests per day, 15 RPM. Resets midnight Pacific.

A full eval run (10 fixtures) = 10 requests. Two full runs per day max. Cache makes re-opening old reports zero-cost.

If we exhaust quota mid-iteration: wait for daily reset, or upgrade to paid Gemini, or temporarily run a subset.
