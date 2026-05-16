# Backlog

Items deferred to a later phase. Each entry: short title, context, why-deferred, target phase.

## Eval rig: name AIRateLimitError / AIQuotaExhaustedError failures

**Context.** The eval rigs (`scripts/eval-parse.ts`, `scripts/eval-brief.ts`) catch failures in three buckets: `AIValidationError` → `ai-generation`, `ZodError` → `post-injection-validation`, everything else → `unknown`. During the brief-v2 corpus eval (2026-05-15), two fixtures failed because Gemini's free-tier daily quota was exhausted (`AIQuotaExhaustedError` / underlying HTTP 429). Those fell through to the `unknown` bucket, which is correct behavior but a missed naming opportunity — the failure shape is well-defined and the eval reviewer should be able to distinguish "the AI hit a rate / quota wall" from "we don't know what happened."

**Fix.** Add explicit catch arms in both eval rigs:

```ts
if (err instanceof AIQuotaExhaustedError) {
  // ... phase: 'provider-quota'
}
if (err instanceof AIRateLimitError) {
  // ... phase: 'provider-rate-limit'
}
```

Update the `FailurePhase` union in `scripts/eval-brief.ts` (and matching summary types) to include the new phases. Wire them through to the HTML report so the per-fixture failure card shows `phase: provider-quota` instead of `phase: unknown`.

**Why deferred.** The brief-v2 eval was unblocked by the cache (the 8 successful fixtures didn't need to re-run), so the un-named phase didn't slow review. The fix is mechanical, not learned. Target phase 2.5 (auth / cleanup pass).

## Lazy GoogleGenAI client construction

**Context.** `AiModule` constructs the `GoogleGenAI` client at NestJS module-instantiation time. When `GEMINI_API_KEY` is empty (the post-eval hygiene state), the SDK prints `API key should be set when using the Gemini API.` to stdout twice per process bootstrap — once for each AppModule load (eval rigs, smoke tests). The warning is harmless for cached / dry-run paths that never call the AI, but it's noisy and could mask a real misconfiguration.

**Fix.** Move provider construction inside `generateText` / `generateStructured` on first call, instead of in the module constructor. Throw a clear error if the key is still empty at call time.

**Why deferred.** No functional impact; just cosmetic noise during dev iteration. Target phase 2.5.

## Phase 2.5 — proxy forwards Clerk JWT to NestJS

**Context.** The Next.js → NestJS proxy at `/api/projects/[id]/parse` and `/api/projects/[id]/brief` does not forward any auth credential. Today this works because the NestJS endpoints are `NODE_ENV !== 'production'`-gated, not auth-gated. The web-side `requireUserId()` returns a hard-coded dev stub, and `BusinessProfileRecord.userId` / `DesignBriefRecord.userId` end up null (the NestJS controllers don't accept a userId parameter from the request body).

**Fix.** Three pieces:

1. Web proxy reads the Clerk session token (`auth().getToken()` from `@clerk/nextjs/server`) and sends it as `Authorization: Bearer <jwt>`.
2. NestJS adds JWT-verification middleware (Clerk JWKS), extracts the verified user ID, attaches it to the request.
3. The NestJS controllers (`business-profile`, `design-brief`) pull the userId from the verified request and persist it on the record. Remove the `NODE_ENV !== 'production'` gate.

The proxy seam is already in place — Phase 2.5 fills it in. This is the real work of Phase 2.5 alongside replacing `requireUserId()` in the web app.

**Why deferred.** Dev environment doesn't need it; Phase 2.5 owns the full auth migration.

## Screenshot-tool-friendly mode for the brief form

**Context.** During 2.4c and 2.4d capture, the MCP preview screenshot tool stalled on the brief form page. The page mounts ~22 Radix Select primitives + 16 inline-styled OKLCH swatches + a typography preview with inline fontFamily — some combination of those plus Sonner's body-mounted Toaster overloaded the screenshot pipeline. Eval, fill, click, and console_logs all worked normally; only `preview_screenshot` was stuck. Restarting the web preview server didn't recover it.

**Fix.** Optional query-string flag (`?capture=1`) that:

- Unmounts the Sonner Toaster portal
- Closes any open Radix Select dropdowns

Pure tooling affordance — has no impact on real users. Low priority; only matters if we want screenshots from automated capture pipelines for documentation.

**Why deferred.** Real browsers render the page fine. The DOM-eval verification we use is rigorous enough to substitute for screenshots when needed.

## Drag-to-reorder for recommendedPages

**Context.** `brief-form.tsx`'s recommendedPages array uses `useFieldArray` for add/remove but not reorder. The user can remove a page and re-add it at the end, but can't drag-to-reorder.

**Fix.** Wire `react-hook-form`'s `useFieldArray.move(from, to)` to a drag handle on each row. Requires a dnd library (e.g. `@dnd-kit/core`) or a lightweight HTML5 drag implementation.

**Why deferred.** Nice-to-have, not blocking. The brief generator's `recommendedPages` priority field already encodes hierarchy; ordering within priority tiers is a Phase 3+ concern.

## In-page TOC for the long brief form

**Context.** The brief form has 10 vertically-stacked sections. Long form, no nav. A user editing "Recommended pages" has to scroll past archetype, traits, palette, typography, layout, imagery, style tokens, voice, components to get there.

**Fix.** Sticky in-page TOC on the right (desktop only), or sticky section headers that collapse. Standard form-with-many-sections pattern.

**Why deferred.** Only painful at scale; for the current 10-section form it's mostly fine. Revisit if section count grows or eval feedback flags it.
