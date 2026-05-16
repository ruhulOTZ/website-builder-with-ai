# Architecture

The architecture of the AI website builder. Captures the system shape, the data flow, and the phased roadmap. Read alongside `CLAUDE.md` (operating rules), `decisions.md` (why we chose what we chose), and `prompts.md` (how we work with AI prompts).

## What we are building

A multi-page website builder driven by AI. A user submits a business requirements document for any domain (gym, dental, IT firm, ecommerce, restaurant, etc.). The system produces a complete, multi-page website tailored to that business — not a template-filler, but a genuinely different design per project.

The premise: same component library + different design briefs produces visibly different sites. Layered variation across color, typography, layout, components, imagery, motion, and voice combine combinatorially. This is what separates the system from "AI-generated website" tools that all look the same.

## What we are not building

- Not a single-page generator. Always multi-page.
- Not a template marketplace. Templates do not exist as a first-class concept.
- Not a free-form page builder. Pages are ordered arrays of sections. No nested grids or custom positioning.
- Not a CMS. Generated content is denormalized into the site schema, not normalized into content tables.

## System shape

Three layers, three responsibilities:

**Builder UI (`apps/web`)** — the dashboard the user interacts with. Built with Next.js, shadcn/ui, and Tailwind. Users upload requirements, inspect and edit briefs, preview sites, request regeneration. This is the application's surface.

**API (`apps/api`)** — NestJS backend. Orchestrates AI calls, persists data, handles auth (Clerk), exposes endpoints for the builder UI. The intelligence of the system lives here, in the form of prompts and AI provider calls.

**Component library and renderer (`packages/components-library`, `packages/design-system`)** — the engine that turns `SiteSchema` JSON into rendered HTML. Pure presentational code. Theme-token-driven. No business logic. Two consumers: the builder UI's preview pane, and the eventual export step.

Supporting packages:

- `packages/shared-types` — Zod schemas and inferred TypeScript types. The single source of truth for every data shape that crosses package boundaries.
- `packages/database` — Prisma client with two entry points (singleton for Next.js, NestJS DI module for the API).
- `packages/ai` — AI provider abstraction. Interface plus concrete implementations (currently Gemini; later Anthropic and OpenRouter).
- `packages/config` — shared ESLint, Prettier, and TypeScript configurations.

## Data flow: requirements doc to rendered site

A complete generation passes through five stages. Each stage consumes the previous stage's output and produces a structured artifact.

**Stage 1 — Requirements parsing.**
Input: plain-text requirements doc (later: PDF).
Process: AI extraction prompt. Pure fact extraction, low temperature, no creative reasoning.
Output: `BusinessProfile` (validated by Zod). Business name, domain, services, audience, USPs, price point, contact details.
Persisted: `business_profile_records` table.

**Stage 2 — Design brief generation.**
Input: `BusinessProfile`.
Process: AI creative reasoning prompt. The most important prompt in the system. Maps business signals to design dimensions.
Output: `DesignBrief` (validated by Zod). Brand archetype, six trait scales, color palette, typography pairing, layout archetype, imagery direction, motion personality, voice, recommended page list.
Persisted: `design_briefs` table.

**Stage 3 — Site architecture.**
Input: `DesignBrief.recommendedPages` plus domain conventions.
Process: AI refines the page list with section-level skeletons (which section types each page should include).
Output: page skeletons — page slug, title, purpose, section types in order, without yet specifying content or variants.

**Stage 4 — Per-page content generation.**
Input: page skeleton plus design brief.
Process: For each page, AI selects component variants and generates content (copy, image queries, structured props) for each section. One or more AI calls per page.
Output: fully populated `Page` objects, each containing `Section[]` with concrete props and variants.

**Stage 5 — Site assembly and image resolution.**
Input: design brief plus all generated pages.
Process: Compose into a `Site` object. Resolve image queries to actual URLs (Unsplash API for v1; AI image generation later).
Output: validated `Site` matching `SiteSchema`.
Persisted: `generated_sites` table.

**Render time.**
Input: `Site` plus a chosen `Page`.
Process: `SiteRenderer` wraps the page in `ThemeProvider` (built from `site.theme`), loads fonts via `getFontsForPairing`, walks `page.sections`, and maps each `section.type` to a component in `SECTION_REGISTRY`.
Output: HTML.

The contract between stages is JSON. Every stage's output is JSON-serializable and Zod-validated. No code generation, no JSX strings, no inline CSS — pure data. This is what makes the system editable, exportable, and versionable.

## Critical architectural constraints

These are load-bearing and non-negotiable. Violations cause compound problems downstream.

**Two completely separate design systems.** The builder UI uses shadcn/ui + Tailwind. The component library uses Tailwind only. The builder UI is for consistency and speed; the component library is for radical variation. The component library never imports shadcn.

**Theme tokens are the only source of styling.** Every component in `packages/components-library` reads from CSS variables set by `ThemeProvider`. No hardcoded colors, fonts, spacing, radii, or shadows in the component library. The single mechanism by which one library produces many visual identities.

**Zod schemas in `packages/shared-types` are the single source of truth.** All TypeScript types are inferred from Zod, never hand-written. All API DTOs validated with Zod. All AI structured outputs validated with Zod before use. All component props derived from Zod schemas. If a type isn't in `packages/shared-types`, it shouldn't cross a package boundary.

**Components are referenced, not embedded.** `SiteSchema` describes "use component X, variant Y, with props Z." The renderer maps `section.type` to a component import via `SECTION_REGISTRY`. The schema is pure JSON. No JSX, no CSS, no functions.

**Sections are flat per page.** A page is `Section[]`. No nesting. No containers within containers. New visual structures = new section types or new variants of existing ones.

**AI provider abstraction is mandatory.** Service code never imports the Gemini SDK or any other model SDK directly. Consumers depend on the `AIProvider` interface. Provider implementations are wired at the NestJS module level. This lets us swap providers without touching service code.

**Database package has two entry points.** `@repo/database` (or `@repo/database/client`) is the Prisma singleton for Next.js and scripts. `@repo/database/nest` is the NestJS DI module. NestJS must never leak into `apps/web` through transitive imports.

**TypeScript strict, no `any`.** If you reach for `any`, the schema is wrong, not the code.

**Schema migrations are coordinated.** `DesignBrief` and `SiteSchema` carry `schemaVersion: 1`. Changes require a deliberate version bump and an explicit migration plan. The blast radius of these schemas is large.

## Tech stack

Frontend (builder UI):

- Next.js 15 (App Router)
- TypeScript strict
- Tailwind v4 (CSS-first configuration via `@theme`)
- shadcn/ui (builder UI only — never the component library)
- Clerk (authentication)

Backend (API):

- NestJS (TypeScript strict)
- PostgreSQL 16 (Prisma ORM)
- Redis 7 (rate limiting, future BullMQ job queue)
- Clerk JWT verification

AI:

- Direct Gemini API (`@google/genai`) for development — free tier
- AIProvider abstraction allows swapping to OpenRouter or direct Anthropic when budget permits
- Default model: `gemini-2.5-flash`
- Structured outputs via Zod v4 → JSON Schema → Gemini `responseJsonSchema`

Validation:

- Zod v4 (single source of truth for types, runtime validation, JSON Schema generation)

File storage:

- Cloudflare R2 (development)
- AWS S3 (production)
- Storage abstraction layer; consumers never import vendor SDKs directly

Deployment:

- Docker on VPS
- Monorepo: pnpm + Turborepo
- Each app and the database deployed as separate Docker services

Observability (deferred until needed):

- Sentry for error tracking
- Langfuse or Helicone for AI trace inspection
- Structured logging via Pino

## Repository layout

apps/
web/ Next.js builder UI (dashboard, editor, preview)
api/ NestJS backend (orchestration, AI, persistence)
packages/
shared-types/ Zod schemas and inferred TS types
database/ Prisma client and NestJS DatabaseModule
ai/ AI provider abstraction
components-library/ Generated-site components (Tailwind only)
design-system/ ThemeProvider, font loading, Tailwind preset
config/ Shared ESLint, Prettier, TS configs
docker/ Compose files for Postgres, Redis, app images
docs/
architecture.md This file
decisions.md Architectural decisions and rationale
prompts.md Prompt iteration discipline and eval rig
findings-log.md Running log of AI prompt findings

## Phased roadmap

The work is broken into phases. Each phase produces something usable. We do not skip phases for speed.

### Phase 0 — Foundation (complete)

Monorepo scaffold. Tooling. Docker. Database connections. The development environment is solid; you can write code without yak-shaving.

### Phase 1 — Schemas, design system, components, renderer (complete)

Steps 3 through 7. The two core Zod schemas (`DesignBrief`, `SiteSchema`). The design system package (ThemeProvider, fonts, Tailwind preset). The first batch of components (Header, Hero, FeatureGrid, Footer) with all variants. The renderer with `SECTION_REGISTRY`. Three hand-authored sample sites (Forge powerlifting gym, Bloom pediatric dental, Vector IT consulting) proving that one component library produces visibly different sites with different briefs.

End-of-phase gate: the three sample sites are visually distinct and at "real designer made this" quality. Gate passed.

### Phase 2 — AI pipeline

The brain of the system.

**Phase 2.1 — AI provider abstraction and NestJS runtime (complete).**
`AIProvider` interface, `GeminiProvider` concrete implementation, NestJS build configuration resolved, smoke-test endpoint working end-to-end.

**Phase 2.2 — Requirements parser (in progress).**
Plain-text requirements doc → `BusinessProfile`. Sample corpus of 10 fixtures, eval rig with HTML report, parsing service, persistence, API endpoint. Currently on `parse-v1`; iterating to `parse-v2` based on findings in `findings-log.md`.

**Phase 2.3 — Design brief generator.**
`BusinessProfile` → `DesignBrief`. The most important prompt in the system. Iterates against an eval corpus. The output drives every downstream choice.

**Phase 2.4 — Builder UI for parser and brief.**
Upload page, parsed profile inspection and edit, design brief inspection and edit. Wired to API. First UI surface end users would actually see.

**Phase 2.5 — Authentication.**
Clerk on the builder UI and API. Endpoints currently gated by `NODE_ENV` move to proper auth.

### Phase 3 — Site generation

Where the brief becomes a site.

- Site architect: `DesignBrief.recommendedPages` refined into page skeletons with section types.
- Page planner per page: section variant selection based on brief.
- Content generator per section: structured content matching each section's props schema.
- Image resolution via Unsplash API.
- Job orchestration via BullMQ (Redis-backed queue) — full site generation is multi-step and async.
- Live preview as pages complete.

### Phase 4 — Editing, refinement, export

- In-place editing of generated content (text, swap component variants, reorder sections).
- Regenerate single section with feedback.
- Manual asset upload (logo, custom images) flowing into the design brief.
- Versioning — every generation is saved, can roll back.
- Export: download as standalone Next.js project (zip).
- Public preview URLs.

### Phase 5 — Polish and scale prep

- Langfuse or Helicone integration for AI trace observability.
- Sentry for error tracking.
- Prompt caching for cost reduction.
- Rate limiting via Upstash Redis.
- Component library expansion (more section types and variants).
- AI image generation as a paid feature.
- Stripe billing.

### Beyond Phase 5

Custom domains, team collaboration, CMS-style editing, template marketplace, multi-language support, mobile-first design variants, A/B testing of generated sites.

## What is in scope versus out of scope

In scope for the first complete pipeline (through Phase 4):

- Multi-page generation across business domains.
- Visual variety driven by design briefs.
- Editable output.
- Export to standalone Next.js project.
- Single locale (English).
- Plain-text and (later) PDF requirements input.

Out of scope until explicitly decided:

- Multi-language and full i18n.
- E-commerce schemas — products, cart, checkout. A real storefront is a separate concern with its own schema.
- A/B variants per section within a single site.
- CMS-style content normalization across pages.
- AI image generation in the base product (Unsplash first).
- Animation overrides per element (motion is global, set by theme).

## Open architectural questions

These are not yet decided and will be revisited when relevant.

1. **Header and footer as sections versus site-level fields.** Currently they live as sections inside each page, with duplication across pages. If the duplication becomes painful, promote to site-level `header` and `footer` fields in `schemaVersion: 2`.

2. **Page-level theme overrides.** `PageSchema.themeOverride` exists in the schema but is not yet honored by the renderer. Implement when a real use case appears (e.g. a dark landing page within a light site).

3. **Custom-component escape hatch.** If a user wants a section type that doesn't exist in the library, what happens? Options: refuse, allow `rich_text` fallback, allow custom code. No current answer; defer.

4. **Site export format.** Standalone Next.js project (current plan) versus static HTML/CSS versus a custom SSR runtime. Affects bundle size, hosting cost, and edit-after-export workflow.

5. **AI provider per prompt.** Should the design brief generator route to Sonnet while the parser routes to Gemini Flash, even in production? The abstraction supports this; the question is operational. Decide when budget allows experimentation.
