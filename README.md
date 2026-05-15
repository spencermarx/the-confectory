# The Confectory

This is the working monorepo for The Confectory. The architecture is specified
in [`arch-t-spec.md`](./arch-t-spec.md). This README documents the current
state of the implementation.

## Status

**Phase 1, Weeks 1-4 (§21.1-§21.2).** What's in tree:

Foundations (Week 1-2, §21.1):

- Monorepo scaffolding: pnpm workspaces + Turborepo (§20.1).
- `@confectory/shared`: typed domain model from §4 + zod schemas that
  enforce §4 invariants (e.g. door count by topology).
- `@confectory/shells`: `defineShell()`, the §23 sample, a foyer entry.
- `@confectory/prompts`: typed `PromptTemplate<T>` (§10.5), voice
  header, fast Critic template (§6.1).
- `@confectory/style-guide`: machine-readable counterpart to §12.3.
- `@confectory/cli`: `confectory-shell validate-all` for CI (§20.2).
- `apps/api`: Hono Worker (§3.2) with `GuestSessionDO` (§5) and
  `FactoryStateDO` singleton; wrangler binds D1, KV, R2, Vectorize,
  Queues per §3.4.
- `apps/web`: Vite + React 19 + R3F 9 with a foyer scene (§8).
- `apps/cms`: Payload 3.x with all §15.2 collections and §15.4 RBAC.
- `infra/migrations/d1/0001_initial.sql` (§3.4, §7.1, §16.3).
- GitHub Actions CI: lint, typecheck, test, shell validation.

The foyer (Week 3-4, §21.2):

- Resonant dial layout (§8.3) in `@confectory/shared`, with the new-guest
  stable-layout window for the first 10 sessions, and factory nudges
  that override recency.
- Brass dial (§8.2): 3D click-and-drag rotation, inertia + decay,
  500ms settle detection, tick marks per shell entry.
- The sign (§9.3) and a name plate (§9.5) that render the currently-
  aimed-at room's name in its signature typography.
- Diegetic ticket stub in the corner of the screen (§8.4).
- `/foyer/dial` returns the resonant layout for this guest, computed in
  the guest's Durable Object; `/foyer/settle` records the settle intent
  that drives speculative pre-generation in Week 5-7.

Not yet built (later Phase 1):

- Room assembly pipeline, speculative pre-generation, fast Style Critic
  in flight (§5, §6.1) — week 5-7.
- The Founder set-piece, the first Oompa-Loompa (§11) — week 8-10.
- Episodic memory + summarization (§7) — week 11-13.
- Telemetry of Wonder, Critic's Notebook, Mood Console UIs (§15.3, §16)
  — week 14-15.

## Layout

```
apps/
  web/                 # Vite + React 19 + R3F (the guest experience)
  api/                 # Cloudflare Worker (Hono) + Durable Objects
  cms/                 # Payload CMS + Postgres
packages/
  shared/              # Types, zod schemas, shared utilities
  shells/              # Canonical shell library (defineShell())
  prompts/             # Typed, versioned prompt templates
  style-guide/         # Machine-readable visual style guide
  cli/                 # confectory-shell tooling
infra/
  migrations/d1/       # D1 (SQLite) migrations
arch-t-spec.md         # The Architect's technical specification
```

## Local development

```bash
pnpm install

# Run everything in dev (web, api, cms) with Turbo:
pnpm dev

# Or run individually:
pnpm --filter @confectory/web dev
pnpm --filter @confectory/api dev
pnpm --filter @confectory/cms dev

# Check the tree:
pnpm lint
pnpm typecheck
pnpm test
pnpm shells:validate
```

The CMS expects a Postgres database. Set `DATABASE_URL` and
`PAYLOAD_SECRET` in `apps/cms/.env`.

The API expects Cloudflare bindings configured in `apps/api/wrangler.toml`.
For local dev, `wrangler dev` provisions in-memory stand-ins for D1, KV,
R2, Vectorize, and the Durable Objects.

## Principles

The §1 directives are tie-breakers. When they conflict, the Founder is.
