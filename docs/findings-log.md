# Findings Log

Running log of issues observed during prompt iteration. Inputs to the next prompt version.

## parse-v1 (initial)

Run date: 2026-05-14
Results: 6 successful parses, 4 invalid-JSON errors (cause TBD — likely truncation or markdown fences)

### Findings

1. **[P0] Services include products/categories instead of activities.**
   - Bakery returned `croissants`, `kouign-amann` as services. Those are products.
   - Tutoring returned `SAT prep` and `ACT prep` as services. Those are topic areas, not described programs.
   - Fix in v2: tighten rule to distinguish activities from products/topics.

2. **[P0] pricePoint inferred from category stereotypes.**
   - Gym returned `premium` based on "small, hard cap of 80 members, competitive lifters." No price mentioned in doc.
   - Fix in v2: require explicit textual price evidence. Default to `mid`.

3. **[P1] targetAudience invented when document gives none.**
   - Bakery returned "Local customers in Burlington, Vermont, seeking artisanal baked goods." Document doesn't mention an audience.
   - Fix in v2: fallback to factual restatement, not inferred demographics.

4. **[P2] Empty-string tagline instead of omission.**
   - 6 of 8 profiles returned `tagline: ""` for optional field.
   - Fix in v2: forbid empty strings for optional fields. Omit instead.

5. **[P2] Stray `\n` in extracted strings.**
   - Fix in v2: post-processing step in service, not prompt rule.

### Anti-patterns NOT observed (positive signals)

- No reused content between oneLineDescription and uniqueSellingPoints.
- No invented contact info on sparse fixtures.
- No fabricated services from domain playbooks (other than products-as-services issue).
- brandPersonality extraction grounded in document voice, not category stereotype.

### Eval infrastructure findings

- Gemini free tier: 20 requests/day on gemini-2.5-flash. Burned in one iteration cycle.
- Caching needed in eval rig. Key by (fixture hash, PROMPT_VERSION, model).

## parse-v2

Run date: 2026-05-15
Results: 10/10 successful parses, 10/10 domain match.

### Findings status from parse-v1

1. **[P0] Services as products/topics — Fixed.** Bakery returns `services: []`; tutoring returns a single defensible program entry; no other fixture lists products-as-services.
2. **[P0] pricePoint from stereotypes — Fixed.** Gym now `mid`. All `premium` verdicts backed by explicit textual evidence (e.g. `£45k starting fee`, verbatim "Pricing — premium.", explicit "premium" wording).
3. **[P1] Invented targetAudience — Fixed.** Bakery uses the documented fallback phrasing ("Customers of a small bakery in Burlington, Vermont."). No "seeking artisanal goods" stereotype phrasing in any fixture.
4. **[P2] Empty-string tagline — Fixed.** Optional fields now omitted. Only `ecommerce-fashion-template-brief` carries a `tagline` field, and its value is real.
5. **[P2] Stray `\n` in strings — Fixed mechanically** via `normalizeStrings` post-processor in `business-profile-parser.service.ts`. Code fix, not a prompt rule — robust against future regressions.

### Structural fixes (not prompt changes)

- Truncation: `maxOutputTokens` raised to 8192 at the call site. Cleared all four prior JSON-validation errors (gym, IT consulting, plus two others from the earlier v1 run).
- Eval rig: file-system cache keyed by (fixture content, PROMPT_VERSION, model name) under `apps/api/test/eval-output/.cache/`. 0 cache hits on this run (PROMPT_VERSION bump invalidates everything by design); future re-runs of unchanged prompts will hit cache.
- `rawOutput` and `zodIssues` are captured on every future `AIValidationError`, persisted in per-fixture JSON.

### Items being tracked (not acted on)

1. **Bakery USP derivation** borders on soft inference ("Focused menu of artisanal baked goods"). Defensible under rule 7's "derive from claims made explicitly in the text" clause, but on the boundary. Within tolerance; revisit if the pattern recurs in parse-v3 or production.
2. **Tutoring services entry** is a boundary case — another run might produce `[]`. Both answers defensible. No action.
3. **`wellness-studio` `domainSpecifier` capitalization** inconsistent with other fixtures (sentence-case vs. lowercase). Cosmetic.

### Decisions made in review

- Keep `BusinessProfile.targetAudience` fallback wording mechanical and conservative. Audience shaping is the responsibility of `DesignBrief` generation, not `BusinessProfile` extraction. The pipeline's value comes from this separation: extraction → reasoning. Inventing audiences here would have the brief generator building on hallucinations.
- Temperature stays at `0.2`. Move to `0` only if determinism becomes a production concern.
- Keep `parse-v1.ts` in the repo alongside `parse-v2.ts`. Never edit a prompt version in place — copy → bump → swap import.

### Status

parse-v2 accepted. Phase 2.2 closed. Moving to Phase 2.3 (design brief generator).

## brief-v1

Run date: 2026-05-15
Results: 10/10 successful parses, zero AI-output errors.

### Findings

1. **[P0] Variety collapse** — 5/10 sage archetype, 6/10 cool_premium palette, 7/10 editorial_asymmetric layout, 6/10 editorial_lifestyle imagery. Root cause: model defaults to "sophisticated professional" attractor whenever input has any expertise signal. Variety mandate in v1 didn't catch second-order collapse.
2. **[P0] Fashion (SaltHouse) misclassified as B2B sage.** Model read "discerning"/"considered" as academic-expertise vocabulary instead of fashion-aesthetic vocabulary.
3. **[P1] Cascade rule failure on Open Stand** — `explorer` archetype paired with `expert_authoritative` voice because one service (IV drips) demanded medical authority. Voice should cascade from brand-level archetype, not from individual service categories.
4. **[P2] Cardinal Hill (real estate) got sage + warm_earth** — defensible but unusual combo. Track as borderline; not a fix priority.

### Strengths preserved (do not break in v2)

- Rationale grounding: every rationale across 10 fixtures references specific profile content. Strongest behavior in v1.
- Obvious-fit cases land correctly: pediatric dental → caregiver/pastel_soft/warm_friendly; powerlifting gym → outlaw/neon_dark/anton.
- All 10 fixtures returned validated briefs with no JSON or schema errors.
- Domain-specific page lists (no "Home/About/Services/Contact" defaults).
- `businessProfile` injection rule landed cleanly. Verified post-eval with a single instrumented smoke call (1 AI call, gym fixture) after fixing the logger filter on `eval-brief.ts` and `smoke-brief.ts` to include `'log'`. The pre-injection log line reads `pre-injection businessProfile: empty {} (correct)`.

### Tracked, not acted on

- Two-phase failure tagging (`ai-generation` / `post-injection-validation`) un-exercised because zero failures. Inherits from parser eval rig where the same shape was exercised against parse-v1's truncation errors.

### Decisions for brief-v2

- Add explicit anti-collapse rule for sage/cool_premium/editorial_asymmetric/editorial_lifestyle attractor (the "sophisticated professional" default).
- Add domain-vocabulary anchors for fashion, hospitality, retail to prevent expertise-vocabulary confusion ("considered" / "discerning" in a fashion context describe aesthetic discipline, not academic credentialing).
- Strengthen voice cascade rule with explicit anti-override clause (voice cascades from brand archetype + personality, not from any individual service category — even when the service implies authority).
- Add layout-diversity rule naming `editorial_asymmetric` as a collapsing default and pointing at `classic_corporate`, `minimal_typographic`, `split_screen`, `grid_showcase`, `storytelling_scroll`, `immersive_visual` as domain-appropriate alternatives.
- Do not modify rationale-grounding rules — they're working.

## brief-v2

Run date: 2026-05-15
Results: 8 of 10 successful. 2 fixtures (`realestate-buyer-agency-detailed`, `design-studio-mixed-voice`) blocked by Gemini free-tier daily quota; deferred to opportunistic completion. Cache preserves the 8 successes; resume costs 2 AI calls.

### Variety distribution (over 8 successful fixtures)

| Dimension       | v1 (10 fixtures)              | v2 (8 fixtures)               | Change                                                       |
| --------------- | ----------------------------- | ----------------------------- | ------------------------------------------------------------ |
| brandArchetype  | sage ×5 (50%)                 | sage ×2 (25%)                 | Strong improvement                                           |
| paletteStrategy | cool_premium ×6 (60%)         | cool_premium ×4 (50%)         | Moderate; lagging dimension                                  |
| typography      | fraunces_inter ×4 (40%)       | fraunces_inter ×3 (37%)       | Steady                                                       |
| layoutArchetype | editorial_asymmetric ×7 (70%) | editorial_asymmetric ×1 (12%) | Dramatic improvement                                         |
| imagery         | editorial_lifestyle ×6 (60%)  | editorial_lifestyle ×3 (37%)  | Strong improvement                                           |
| voice           | confident_direct ×5 (50%)     | confident_direct ×3 (37%)     | Improvement; warm_friendly and minimal_understated appearing |

### Watched-case verdicts

- **SaltHouse** (fashion): sage → ruler. Voice expert_authoritative → minimal_understated. **Fixed.** The headline v1 failure.
- **Open Stand voice**: expert_authoritative → warm_friendly (cascade rule fired explicitly in rationale, with verbatim "even with medical services" framing). **Fixed.**
- **Open Stand archetype**: explorer → caregiver. Voice fix more valuable than archetype regression; net-positive.
- **North Yardley**: sage preserved. Anti-collapse rule did not overcorrect. Layout editorial_asymmetric → minimal_typographic (incidental improvement).
- **Greene & Tova**: sage → everyman. Significant improvement — caught "direct, plain English, no Latin" / "more like a tech blog than a law firm" framing.
- **Catalyst**: sage unchanged. The tutoring-is-caregiver hint from change #1 did not fire. Defensible (founders' "former teachers" credentialing is the differentiator); tracked.
- **Iron Halo**: outlaw → hero. Same prompt smoke-tested as outlaw an hour earlier; attributable to temperature variance (0.7).
- **Bloom**: caregiver preserved.
- **Hearth**: everyman → creator. Defensible alternative read of the partner-run/hand-crafted profile.

### Borderline coherence note

Greene & Tova: everyman + cool_premium. Defensible as "approachable expert" (a law firm explicitly trying to sound like a tech blog) but the archetype-palette tension is real — everyman usually pairs with warm_earth or minimal_neutral. Track if it recurs.

### Strengths preserved

- Rationale grounding (v1's strongest property) preserved across all 8 fixtures. Spot-checked Hearth and Greene & Tova; both quote verbatim profile/doc content.
- businessProfile injection rule (emit `{}`) preserved — 8 of 8 verified via debug log (`pre-injection businessProfile: empty {} (correct)`).
- No JSON validation errors, no Zod schema errors in the 8 successful calls.

### Tracked, not acted on

- Provider-quota (429) errors tag as `phase: "unknown"` in eval catch block because `AIQuotaExhaustedError` falls outside the `AIValidationError` / `ZodError` arms. Add explicit catch arm with `phase: "provider-quota"`. See `docs/backlog.md`.
- Lazy `GoogleGenAI` client construction to silence the bootstrap warning when API key is absent. See `docs/backlog.md`.
- Cardinal Hill and Quartermass Studio eval data pending quota reset. Cache will protect the 8 successes when the eval re-runs.

### Decision

Phase 2.3 closed. brief-v2 is the production prompt going forward. brief-v3 deferred — remaining issues (cool_premium 50%, Catalyst sage, Iron Halo non-determinism) are within natural temperature variance and edge-case ambiguity, not prompt deficits. Better to learn from real usage than over-tune against this specific corpus.
