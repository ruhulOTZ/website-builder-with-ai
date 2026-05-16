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

## Phase 2.4d — regenerate-while-confirmed reverts to PROFILE_GENERATED

**Context.** `app/api/projects/[id]/parse/route.ts` currently preserves `PROFILE_CONFIRMED` across a regenerate call (the `nextStatus` ternary keeps a confirmed project confirmed even when its content was replaced). That's defensible — the user's intent to keep moving forward is honored — but it means a confirmed status can point at content the user has never reviewed.

**Fix.** Drop the ternary. Regenerate always sets `status: 'PROFILE_GENERATED'`, regardless of prior status. Confirmation is a property of the specific content; new content means it must be re-confirmed.

```ts
// before
const nextStatus =
  project.status === 'PROFILE_CONFIRMED' ? 'PROFILE_CONFIRMED' : 'PROFILE_GENERATED';
// after
const nextStatus = 'PROFILE_GENERATED';
```

(The brief proxy in 2.4c already adopted this rule up-front — its `status` is unconditionally `BRIEF_GENERATED` on regenerate.)

**Why deferred.** Edge-case correctness; no immediate user impact. Target Phase 2.4d polish.

## Phase 2.4d — collapsible section accessibility

**Context.** The profile form's Location/Contact sections collapse via a plain `<button>` + state toggle. Aria semantics are minimal (no `aria-expanded` / `aria-controls`). DOM queries surface the section header + chevron text as a single mashed string (e.g. `"LocationExpand"`).

**Fix.** Swap to a proper `Collapsible` component (Radix `@radix-ui/react-collapsible` via shadcn) or hand-wire `aria-expanded` + `aria-controls` on the existing buttons.

**Why deferred.** Functional today; accessibility/QoL polish.

## Phase 2.4d — paste-requirements textarea: switch from mono to default sans

**Context.** The DRAFT-state paste form uses `font-mono` on the textarea. Defensible (signals "raw input surface") but cold for prose. Users are pasting business narratives, not code.

**Fix.** Drop the `font-mono` class on the textarea. Default sans is the right reading surface for prose.

**Why deferred.** Cosmetic. Target Phase 2.4d.

## Phase 2.4d — AlertDialog → regenerate spinner flash

**Context.** When the user confirms regenerate in the AlertDialog, the dialog closes immediately and the form's regenerate button enters its `Regenerating…` spinner state. Both are correct, but the dialog-close animation overlaps with the spinner mount, producing a brief jitter on fast networks.

**Fix.** Either disable the dialog close animation, or call `setSaving('regenerate')` synchronously before the dialog closes so the spinner state is already mounted when the dialog unmounts.

**Why deferred.** Cosmetic. Target Phase 2.4d.

## Phase 2.4d — project deletion and rename UI

**Context.** The PATCH `/api/projects/[id]` endpoint already accepts `name` for renaming; no UI affordance exists. No DELETE endpoint or UI either.

**Fix.** Add an Edit dialog on the project detail page header for renaming. Add a Delete confirmation dialog with a soft-delete or hard-delete decision (recommend hard for now — Project rows are cheap and dev-only).

**Why deferred.** 2.4d polish.

## Phase 2.4d — status badge variant ladder review

**Context.** `lib/project-status.ts` defines `STATUS_VARIANT` as a deliberate tiering: `outline` (empty) → `secondary` (in-flight) → `default` (confirmed milestone). Reads consistently across the lifecycle, but could benefit from a fourth tier (e.g. success-colored) for `COMPLETED` once site generation lands in Phase 3.

**Fix.** Add a `success` variant to the `Badge` component if needed, and re-tier on COMPLETED. Otherwise leave the current map intentional.

**Why deferred.** Minor visual polish. Target Phase 2.4d.

## Phase 2.4d — drop progressive loading labels

**Context.** `GenerateProfileButton` cycles three labels every 2.5s while the parse runs ("Reading your requirements…" → "Extracting business details…" → "Validating the result…"). The underlying request is a single POST; the labels are cosmetic. Real parse latency runs 20–25s, so the third label sits on screen for ~15s after the cycle completes, which contradicts the implied progress.

**Fix.** Replace with a single static message: "Generating profile…" + spinner. Honest about the operation being opaque.

The 2.4c brief-generation button will inherit this lesson — start with a single loading message, no cycling.

**Why deferred.** Cosmetic. The current implementation works; the question is taste. Target Phase 2.4d.

## Phase 2.5 — proxy forwards Clerk JWT to NestJS

**Context.** The Next.js → NestJS proxy at `/api/projects/[id]/parse` does not forward any auth credential. Today this works because the NestJS endpoint is `NODE_ENV !== 'production'`-gated, not auth-gated. The web-side `requireUserId()` returns a hard-coded dev stub, and `BusinessProfileRecord.userId` ends up null (the NestJS controller doesn't accept a userId parameter from the request body).

**Fix.** Three pieces:

1. Web proxy reads the Clerk session token (`auth().getToken()` from `@clerk/nextjs/server`) and sends it as `Authorization: Bearer <jwt>`.
2. NestJS adds JWT-verification middleware (Clerk JWKS), extracts the verified user ID, attaches it to the request.
3. The NestJS controllers (`business-profile`, `design-brief`) pull the userId from the verified request and persist it on the record. Remove the `NODE_ENV !== 'production'` gate.

The proxy seam is already in place — Phase 2.5 fills it in. This is the real work of Phase 2.5 alongside replacing `requireUserId()` in the web app.

**Why deferred.** Dev environment doesn't need it; Phase 2.5 owns the full auth migration.
