# The Confectory

This is the working monorepo for The Confectory. The architecture is specified
in [`arch-t-spec.md`](./arch-t-spec.md). This README documents the current
state of the implementation.

## Status

**Phase 1, Week 1-2 foundations (§21.1).** What's in tree:

- Monorepo scaffolding: pnpm workspaces + Turborepo (§20.1).
- `@confectory/shared`: typed domain model from §4 (Shell, Room, Guest,
  Oompa-Loompa, Founder, Consequence, MoodVector) + zod schemas that
  enforce the §4 invariants (e.g. door count by topology).
- `@confectory/shells`: `defineShell()` helper, the canonical sample
  from §23 (`the-hush-before`), and a foyer registry entry (§8).
- `@confectory/prompts`: typed, versioned `PromptTemplate<T>` per §10.5,
  with the voice header and the fast Critic template (§6.1).
- `@confectory/style-guide`: machine-readable counterpart to §12.3.
- `@confectory/cli`: `confectory-shell validate-all` for CI (§20.2).
- `apps/api`: Hono Worker (§3.2) with `GuestSessionDO` (§5) and
  `FactoryStateDO` singleton (§3.2), wrangler.toml binding D1, KV, R2,
  Vectorize, Queues.
- `apps/web`: Vite + React 19 + R3F shell, a placeholder Foyer scene
  (§8) and a session-start hook.
- `apps/cms`: Payload 3.x with the §15.2 collections wired up and the
  §15.4 RBAC roles.
- `infra/migrations/d1/0001_initial.sql`: initial schema for guests,
  visits, consequences, ticket-stub marks, episodic-memory source text,
  per-guest telemetry trail (§3.4, §7.1, §16.3).
- GitHub Actions CI: lint, typecheck, test, shell validation.

Not yet built (later Phase 1 weeks):

- Brass dial mechanics and resonant layout (§8.2, §8.3) — week 3-4.
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
