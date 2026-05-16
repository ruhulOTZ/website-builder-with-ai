# CLAUDE.md

Persistent context for Claude Code. Read this first every session before making changes.

## Project: AI Website Builder

An AI-powered multi-page website builder. Users upload a business requirements document (gym, dental clinic, IT firm, ecommerce, etc.) and the system generates a complete, multi-page website tailored to that business — not a template-filler, but genuinely different designs per project.

The core insight: variation lives in layered design dimensions (color palette, typography, layout archetype, component variants, imagery direction, motion, voice). Two gyms with different brand personalities get visibly different sites built from the same component library.

## What This Project Is NOT

- Not a single-page generator. Always multi-page.
- Not a template marketplace. Components have variants; templates do not exist as a concept.
- Not a free-form page builder. Pages are ordered lists of sections. No nested grids or custom positioning.
- Not a CMS. Generated content is denormalized into the site schema, not normalized into content tables.

## Architecture Overview

Two-stage AI pipeline:

1. **Requirements doc → `BusinessProfile`** (extraction, facts only)
2. **`BusinessProfile` → `DesignBrief`** (creative reasoning: archetype, palette, typography, layout, voice)
3. **`DesignBrief` → page list** (architect step)
4. **Per page: section plan → content generation → assembly**
5. **Output: `SiteSchema` JSON, rendered by the renderer**

The renderer takes `SiteSchema` JSON, applies the theme via `ThemeProvider` (CSS variables), and maps `section.type` to components in `packages/components-library`.

## Tech Stack

- **Monorepo:** pnpm + Turborepo
- **Web app (builder UI):** Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui
- **API:** NestJS, TypeScript strict
- **Database:** PostgreSQL 16 + Prisma
- **Auth:** Clerk
- **Cache/queue (later):** Redis 7 (BullMQ planned)
- **File storage:** Cloudflare R2 (dev) → AWS S3 (prod), behind a storage abstraction
- **AI providers:** Gemini (dev free tier), Claude (prod), OpenRouter (fallback) — all behind one interface
- **Validation:** Zod (single source of truth for types and runtime validation)
- **Deployment:** Docker on VPS

## Monorepo Layout

apps/
web/ # Next.js builder UI (dashboard, editor, preview)
api/ # NestJS backend (orchestration, AI calls, jobs)
packages/
shared-types/ # Zod schemas + inferred TS types (DesignBrief, SiteSchema, etc.)
database/ # Prisma client + NestJS DatabaseModule

# - ./client for Next.js singleton

# - ./nest for NestJS DI

ai/ # AI provider abstraction (Gemini, Claude, OpenRouter)
components-library/ # The website builder's component library (Tailwind only, no shadcn)
design-system/ # ThemeProvider, fonts, Tailwind preset
config/ # Shared ESLint, Prettier, TS configs
docker/
docs/
architecture.md
decisions.md

## Critical Architectural Rules

These are non-negotiable. Violations will be reverted.

### 1. Two completely separate design systems

- **`apps/web` (builder UI)**: uses shadcn/ui + Tailwind. This is the dashboard the user interacts with. Consistency is fine.
- **`packages/components-library` (generated websites)**: pure Tailwind v4, no shadcn, no other UI libraries. Variation is the entire point. Never import shadcn into the component library.

### 2. Theme tokens are the only source of styling

Every component in `packages/components-library` reads from CSS variables set by `ThemeProvider`. No hardcoded colors, fonts, spacing, shadows, or radii. If you find yourself writing `bg-red-500` or `text-white` in the component library, stop — use theme tokens like `bg-primary`, `text-foreground`.

### 3. Zod schemas in `packages/shared-types` are the single source of truth

- All TypeScript types are inferred from Zod schemas, never written by hand.
- All API DTOs validated with Zod.
- All AI structured outputs validated with Zod before use.
- All component props typed from Zod schemas.

If a type isn't in `packages/shared-types`, it shouldn't cross a package boundary.

### 4. Components are referenced, not embedded

`SiteSchema` describes "use component X, variant Y, with props Z." The renderer maps `section.type` to a component import. The schema never contains JSX, HTML, CSS, or functions. It is pure JSON-serializable data.

### 5. Sections are flat per page

A page is `Section[]`. No nesting. No containers within containers. If you need a new visual structure, add a new section type or a new variant to an existing one.

### 6. AI provider abstraction is mandatory

Never import the Gemini SDK or Claude SDK directly outside `packages/ai`. Consumers use the `AIProvider` interface. This lets us swap providers per environment.

### 7. Database package has two entry points

- `@repo/database` (or `@repo/database/client`) — Prisma singleton for Next.js and scripts
- `@repo/database/nest` — `DatabaseModule` and `PrismaService` for NestJS DI

Never let NestJS leak into `apps/web` through transitive imports.

### 8. TypeScript strict, no `any`

If you reach for `any`, you've taken a wrong turn. Use `unknown` + narrowing, or improve the schema.

### 9. No features the user didn't ask for

Don't add health endpoints, logging libraries, observability, auth scaffolding, or "nice to have" abstractions unless explicitly requested. Foundation only until told otherwise.

### 10. Schema migrations are coordinated

`DesignBrief` and `SiteSchema` have a `schemaVersion` field. Changes to either require a deliberate version bump and a migration plan. Never change these schemas casually.

## The Two Core Schemas

### `DesignBrief`

The structured output of the AI's analysis of a requirements doc. It encodes the "DNA" of a project:

- `businessProfile` — facts (name, services, audience, location, contact)
- `brandArchetype` — Jungian (hero, caregiver, sage, ...) with rationale
- `traits` — six 1–5 scales (energy, formality, warmth, sophistication, trustworthiness, novelty)
- `colorPalette` — full token set with strategy and rationale
- `typography` — enum picked from a curated pairing list
- `layoutArchetype` — enum (hero_centric, editorial_asymmetric, ...)
- `imagery` — enum (documentary, editorial_lifestyle, ...)
- `density`, `radius`, `shadow`, `motion` — style tokens
- `voice` — copy tone with rationale and optional examples
- `componentPreferences` — soft hints for hero/card/button styles
- `recommendedPages` — initial page list, refined by the architect step

Location: `packages/shared-types/src/design-brief.ts`

### `SiteSchema`

The full website as JSON. The contract between AI generation and rendering.

- `metadata` — site name, locale, favicon
- `theme` — `ThemeTokens` (mirrors design brief style choices)
- `navigation` — primary + footer link structure
- `pages` — ordered, each with SEO and `Section[]`
- `Section` — discriminated union by `type` (header, hero, feature_grid, service_list, about, stats, testimonials, pricing, faq, cta_block, contact, logo_cloud, gallery, team, footer, rich_text), each with its own variant enum
- `generation` — audit (model, prompt version, timestamp)

Location: `packages/shared-types/src/site-schema.ts`

## Working With Claude Code: Operating Rules

### Always

- **Read this file at session start** and any docs referenced for the current task.
- **Work in small, reviewable steps.** One concern per change.
- **Stop at phase boundaries.** Don't barrel ahead into the next phase.
- **Run `pnpm typecheck`, `pnpm lint`, `pnpm format:check` before declaring done.** All green or it's not done.
- **Match existing style.** Don't introduce new patterns when an existing one works.
- **Flag, don't fix, schema concerns.** If `DesignBrief` or `SiteSchema` looks off, raise it; don't silently edit.

### Never

- Add dependencies without flagging them and explaining why.
- Generate fixtures or example data unless asked.
- Refactor "while we're at it." Stay scoped.
- Introduce a UI library, ORM, validation library, or framework not already in this doc.
- Write business logic in `packages/components-library`. Components are presentational only.
- Skip the verification step at end of task.

### When You're Stuck

- Re-read this file.
- Check `docs/architecture.md` and `docs/decisions.md`.
- Ask before guessing. A clarifying question is cheaper than a wrong commit.

## Environment

- Node.js: see `.nvmrc`
- Package manager: pnpm
- OS: development happens on Windows + WSL and on Linux VPS. Don't write shell scripts that only run on one.
- Docker required for Postgres + Redis. `docker compose up -d` starts both.

## Useful Commands

```bash
# Install
pnpm install

# Run all dev servers (web + api)
pnpm dev

# Run checks
pnpm typecheck
pnpm lint
pnpm format:check

# Database
docker compose up -d              # start Postgres + Redis
pnpm --filter @repo/database prisma migrate dev
pnpm --filter @repo/database prisma studio
```

## Current Status

(Update this section as phases complete.)

## Current Status

- [x] Step 1-7: Foundation complete (Turborepo, Docker, schemas, design system, components, renderer, three sample sites)
- [x] Phase 2.1: AI provider abstraction + GeminiProvider + NestJS runtime
- [x] Phase 2.2: Requirements parser (parse-v2). Eval corpus: 10 fixtures, 10/10 domain match.
- [x] Phase 2.3: Design brief generator (brief-v2). 8/10 corpus eval complete; 2 fixtures pending quota reset. Variety distribution: archetype 25% sage (was 50%), layout 12% editorial_asymmetric (was 70%), voice cascade rule validated.
- [x] Phase 2.4a: Project list + new-project flow + paste-requirements form (dev-auth stub; Clerk wired in 2.5).
- [x] Phase 2.4b: Parse-requirements integration; profile inspection/edit UI with classified error states.
- [x] Phase 2.4c: Generate-brief integration with brief inspection/edit UI (archetype badge, trait dots, OKLCH swatches, recommendedPages via useFieldArray).
- [x] Phase 2.4d: Polish — parse proxy regenerate symmetric with brief, single loading messages, prose textarea, Radix Collapsible for accessibility, project rename/delete, "Clear" affordance on optional Selects, next/font-loaded typography preview, status badge ladder with success variant, AlertDialog spinner-flash fix, empty-state copy. Resume-in-progress verified.
- [ ] Phase 2.5: Clerk auth on protected endpoints

## Out of Scope (For Now)

- Multi-language / i18n beyond locale field
- E-commerce schema (products, cart, checkout) — separate concern, not part of `SiteSchema`
- A/B variants per section
- Animation overrides per element (motion is global)
- CMS-style content references
- Custom domains, team collaboration, marketplace, billing
- AI image generation (Unsplash first, AI later)

## Decision Log Pointer

For _why_ we chose specific tools or rejected alternatives, see `docs/decisions.md`. Update that file (not this one) when making architectural decisions.
