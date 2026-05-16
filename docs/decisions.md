# Architectural Decisions

Decisions made during conversations that should outlive any single chat.

## Why a component library with variants, not templates

A "template" is a single fixed layout — same design for everyone. Variants are independent dimensions that combine combinatorially (color palette × typography × layout archetype × component variant × imagery × motion × voice). Two businesses with different briefs get genuinely different sites from the same library. This is the entire premise of the product. Templates would make the system samey, which is the trap most AI website builders fall into.

## Why two design systems (shadcn for builder, Tailwind-only for component library)

The builder UI (apps/web) and the generated websites (packages/components-library) serve completely different purposes. The builder needs consistency and speed; shadcn provides that. The generated websites need radical variation; shadcn would lock everything into one design language. The component library never imports shadcn.

## Why theme tokens drive everything

Components in packages/components-library read styling from CSS variables set by ThemeProvider. No hardcoded colors, fonts, spacing, or radii in components. This is what enables per-project visual variety with a single component library.

## Why Zod schemas are the single source of truth

All types derive from Zod. All AI structured outputs validated against Zod. All API DTOs validated with Zod. If a type isn't in packages/shared-types, it shouldn't cross a package boundary.

## Why direct Gemini API for development (not OpenRouter)

OpenRouter free tier requires using weaker models (Llama, DeepSeek) that don't match what we'll ship with. Direct Gemini free tier gives access to 2.5 Flash, a real production model. Prompts tested against Flash mostly translate to Sonnet later. The AIProvider abstraction means we can swap to OpenRouter or direct Anthropic when we have budget — no service code changes.

## Why a section-list page model (not free-form grids)

A page is an ordered array of sections. No nesting, no containers, no custom positioning. This makes AI generation tractable, keeps output consistent, and matches how 90% of marketing sites are actually structured. Webflow-style free-form is a different (much harder) product.

## Why we don't use AI to generate the corpus

The eval corpus must reflect real-world input variety. AI-generated fixtures cluster around AI's idea of variety, which is too uniform. Hand-write the corpus; let AI handle the generation, not the evaluation.

## Why `TYPOGRAPHY_PAIRINGS` lives in `shared-types`, not `design-system`

`packages/design-system` is `"type": "module"` because it imports `next/font/google`, which is ESM-only and Next-specific. The NestJS API runtime is CJS via ts-node and can't `require()` ESM modules. When the home-page generator (Phase 3-minimal) needed the typography pairing data — font-family strings, weights, Google Font names — to derive `Site.theme` from `DesignBrief`, importing from `@repo/design-system` failed with `ERR_REQUIRE_ESM` because the package's index transitively pulls in `next/font/google` even when only data is needed.

The data is conceptually a shared contract: same values flow through the AI prompt (brief generator picks a `TypographyPairing` enum), the home-page generator (mechanical map to `ThemeTokens`), and the renderer (loads the actual fonts). It belongs in `shared-types`, which is for cross-package contracts.

`packages/design-system/src/typography.ts` re-exports from `shared-types` for backward compatibility with `apps/web` imports. The `getFontsForPairing` and `getAllFontVariables` next/font wrappers stay in `design-system` — those are runtime concerns, ESM-bound, web-only.

Future contributors hitting the same ESM/CJS boundary: data lives in `shared-types`, runtime wiring lives in `design-system`. If you need a value from `design-system` outside the renderer, ask whether the value is data or behavior — data goes to `shared-types`.
