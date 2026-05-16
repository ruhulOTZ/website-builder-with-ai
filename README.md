# Website Builder with AI

AI-powered multi-page website builder. Turborepo monorepo with a Next.js 15 dashboard, NestJS API, and a token-driven component library used for generated sites.

## Stack

- **pnpm 10** + **Turborepo 2** monorepo
- **apps/web** — Next.js 15 (App Router, TS strict, Tailwind v4, shadcn/ui for dashboard)
- **apps/api** — NestJS 11 (TS strict)
- **packages/shared-types** — Zod schemas
- **packages/database** — Prisma 6 + Postgres client wrapper
- **packages/ai** — provider abstraction (interface only at this step)
- **packages/components-library** — Tailwind v4 components for generated sites (no shadcn, token-driven)
- **packages/design-system** — theme tokens, `DesignSystemProvider`, font loaders
- **packages/config** — shared ESLint, Prettier, TypeScript configs

## Requirements

- Node 22 (`.nvmrc`)
- pnpm 10 (`corepack enable && corepack prepare pnpm@10 --activate`)
- Docker (for local Postgres)

## Setup

```powershell
pnpm install
copy .env.example .env       # then edit values as needed
pnpm db:up                   # start Postgres 16 on :5432
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

## Step 1 status

This commit is the scaffold only — no apps have been started yet. See the plan in `~/.claude/plans/` for the staged rollout.
