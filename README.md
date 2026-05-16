# Website Builder with AI

AI-powered multi-page website builder. Users paste a business requirements doc and the system generates a complete, themed website — not a template filler, but a genuinely different design per project driven by a layered design brief.

## Stack

- **pnpm 10** + **Turborepo 2** monorepo
- **apps/web** — Next.js 15 (App Router, TS strict, Tailwind v4, shadcn/ui dashboard)
- **apps/api** — NestJS 11 (TS strict, AI orchestration)
- **packages/shared-types** — Zod schemas (`BusinessProfile`, `DesignBrief`, `SiteSchema`)
- **packages/database** — Prisma 6 + Postgres 16 (Next.js singleton + NestJS DI module)
- **packages/ai** — provider abstraction (Gemini dev, Claude prod, OpenRouter fallback)
- **packages/components-library** — Tailwind v4 components for generated sites (no shadcn, token-driven)
- **packages/design-system** — `ThemeProvider`, CSS variable tokens, font loaders
- **packages/config** — shared ESLint, Prettier, TypeScript configs

## Requirements

- Node 22 (`.nvmrc`)
- pnpm 10 (`corepack enable && corepack prepare pnpm@10 --activate`)
- Docker (for local Postgres)

## Setup

```powershell
pnpm install
copy .env.example .env        # fill in DATABASE_URL, GEMINI_API_KEY
pnpm db:up                    # start Postgres 16 on :5432
pnpm --filter @repo/database prisma migrate dev
```

## Common scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Run all dev servers (apps/web + apps/api) |
| `pnpm build`        | Build everything                          |
| `pnpm lint`         | ESLint across all workspaces              |
| `pnpm typecheck`    | TypeScript across all workspaces          |
| `pnpm format`       | Prettier write                            |
| `pnpm format:check` | Prettier check                            |
| `pnpm db:up`        | `docker compose up -d postgres`           |
| `pnpm db:down`      | Stop Postgres                             |

## AI pipeline

```
requirements doc
  → BusinessProfile  (extraction, facts only)
  → DesignBrief      (archetype, palette, typography, layout, voice)
  → home page        (sections, content, image queries, navigation)
  → SiteSchema JSON  (rendered by /render/[siteId])
```

All AI calls go through `packages/ai` (`AIProvider` interface). Swap providers by environment without touching application code.

## Project flow (builder UI)

| Status                   | What happens                    |
| ------------------------ | ------------------------------- |
| `DRAFT`                  | Paste requirements              |
| `REQUIREMENTS_SUBMITTED` | Generate business profile       |
| `PROFILE_GENERATED`      | Review / edit profile           |
| `PROFILE_CONFIRMED`      | Generate design brief           |
| `BRIEF_GENERATED`        | Review / edit brief             |
| `BRIEF_CONFIRMED`        | Generate home page              |
| `SITE_GENERATED`         | View rendered site · regenerate |

## Current status

- [x] Turborepo scaffold, shared configs, Docker Postgres
- [x] `BusinessProfile` + `DesignBrief` + `SiteSchema` Zod schemas
- [x] Design system (`ThemeProvider`, CSS tokens, font loaders)
- [x] Component library — Header, Hero, FeatureGrid, Footer section renderers
- [x] AI provider abstraction + Gemini implementation
- [x] Requirements → BusinessProfile pipeline (parse-v2, 10/10 corpus)
- [x] BusinessProfile → DesignBrief pipeline (brief-v2, 8/10 corpus)
- [x] DesignBrief → home page pipeline (home-page-v1)
- [x] Full builder UI — project list, requirements, profile, brief, generation, render
- [x] Public render route (`/render/[siteId]`) with schema-validation gate
- [ ] Clerk auth on protected endpoints (Phase 2.5)
- [ ] Image resolution — Unsplash API replacing placeholder URLs (Phase 3, Step 5)
- [ ] Multi-page generation (Phase 4)
