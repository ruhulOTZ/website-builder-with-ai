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
