# The Confectory

This is the working monorepo for The Confectory. The architecture is specified
in [`arch-t-spec.md`](./arch-t-spec.md). This README documents the current
state of the implementation.

## Status

**Phase 2 in progress.** See [`docs/phase-2-plan.md`](./docs/phase-2-plan.md)
for the working plan; [`docs/phase-1-close.md`](./docs/phase-1-close.md)
summarizes how Phase 1 closed.

Phase 2 so far:

- **Speculative pre-generation** (§5.1 step 6, §5.2). `/settle` kicks
  background pre-gen for the settled destination via `state.waitUntil`;
  `/threshold` returns served-from-cache instantly in the 95% case
  and otherwise falls through to synchronous assembly. On commit,
  every resolved downstream door is pre-generated for the next hop.
  Cache TTL is one minute (§5.2); consumed entries evict on commit
  (§5.3).
- **Slow Critic at 25% sample** (§22.3, §6.2). The Queue consumer in
  the Worker processes `slow_critic_review` jobs; verdicts below 0.6
  land in the Critic's Notebook automatically. `InProcessSlowCritic`
  is the Phase 2 default; `AnthropicSlowCritic` against Claude Opus
  4.7 is wired and ready behind the same `SlowCriticProvider`
  interface (§3.3, §10.4).
- `RoomAssembler` now surfaces an `accepted_artifacts` list alongside
  the `rejected_artifacts` so the DO can sample without re-running
  the generation.
- **WebSocket fanout** (§14.2) from the singleton `FactoryStateDO`
  using the Hibernation API. `GET /factory/subscribe` upgrades the
  client into a session that receives mood updates immediately on
  `PUT /factory/mood` (so the Mood Console takes effect live) and
  foyer co-presence updates whenever a guest enters/leaves.
- **Co-presence ghosts** (§8.5). The per-guest DO publishes its foyer
  presence to the singleton on `/start` and clears it on threshold
  cross. Ghost tokens are SHA-256-derived anonymized ids so the
  fanout can't be used to track guests. The web client renders
  faint capsule silhouettes at deterministic positions around the
  foyer — no interaction, no voice, just witness.
- Client `useFactoryConnection()` maintains the WebSocket with
  exponential backoff and exposes `{ mood, presence, connected }`.

What's in tree from Phase 1:

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

The engine (Week 5-7, §21.3):

- Pure-logic engine helpers in `@confectory/shared`:
  - `resolveDoorDestination()` per §5.2 step 1 (constraint matching with
    topology, mood floors, forbidden ids, `require_consequence` gates).
  - `composeMood()` per §5.2 step 3 (shell × factory × guest blend with
    explicit override path).
- `FoundryProvider` / `CriticProvider` interfaces per §3.3, plus an
  `InProcessFoundry` (deterministic, used as the default in Phase 1),
  a `WorkersAIFoundry` + `WorkersAICritic` scaffold against the Workers
  AI binding, and `AcceptingCritic`/`RejectingCritic` test doubles.
- `criticLoop()` enforces the §6.1 retry budget (1 by default, 3 for
  cul-de-sacs per §5.4) and reports the rejection reason for the slow
  Critic's training corpus (§6.2).
- `RoomAssembler` orchestrates §5.2 end-to-end: door resolution, mood
  composition, prop + OL assignment, signage and surfaces through the
  Critic loop, with §6.4 authored-fallback service on exhaustion.
- Three more authored shells: `the-treacle-deep` (cul-de-sac),
  `the-foundry-door` (gate / set-piece), `the-elevator` (§5.5 budget
  room), each with a hand-written `AuthoredFallback`.
- `POST /rooms/threshold` runs assembly inside `GuestSessionDO` and
  caches the manifest; `GET /rooms/:id/manifest` returns it.
- `GET|PUT /factory/mood` exposes the Mood Console writer path: the
  singleton `FactoryStateDO` accepts partial mood patches that take
  effect on the next room assembly.

Characters (Week 8-10, §21.4):

- `@confectory/characters` package: a `defineOompaLoompa()` helper that
  enforces the 16-dim personality vector taxonomy (frozen at the start
  of Phase 1), a `defineFounder()` singleton guard, a song-template
  library, and a set-piece library.
- One fully-implemented Oompa-Loompa: The Sweetwright (§19.1), with
  role, voice id, personality vector, song meter preferences.
- The Founder singleton with two set-pieces wired:
  `founder-arrival` (foyer) and `founder-foundry-door` (gate to the
  Founder's interactive moment).
- `apps/api/engine/dialogue.ts`: §7.3 prompt builder that injects
  character identity, room context, mood, structural memory, episodic
  memory excerpts, and the canonical name registry (§9.4). Runs every
  dialogue through the Critic with §6.1's retry budget and falls
  through to authored fallbacks on exhaustion.
- `VoiceProvider` and `TTSProvider` interfaces per §3.3, with
  `ElevenLabsTTS`, `GeminiLiveVoice`, and `InProcessTTS` implementations.
- Routes: `POST /dialogue/oompa-loompa`, `POST /dialogue/founder/set-piece`,
  `POST /dialogue/founder/interactive` (Foundry-Door-gated; 503 until
  the Live channel is wired, per §19.1).
- Web: the Sweetwright greets the guest on first foyer entry (§17.3),
  surfaced through a diegetic `SubtitleOverlay`.

Memory and consequence (Week 11-13, §21.5):

- Consequence catalog in `@confectory/shells` (BLUE_FROM_GUM,
  SMALL_KINDNESS_OBSERVED, TREACLE_STAINED, FOUNDER_INVITED), each a
  hand-authored `ConsequenceType` with trigger predicate, visible
  effects, factory-opinion delta, and ticket-stub mark.
- `applyConsequence()` engine: idempotent on (guest, room, type) per
  §14.3; updates the guest's consequence list, ticket-stub marks, and
  factory opinion (clamped to [-1, 1]). 5 tests.
- `the-hush-before` carries a real `gum-tray` prop slot that triggers
  BLUE_FROM_GUM end-to-end.
- `MemoryProvider` interface (§7.1) with `InProcessMemory` for the
  Phase 1 default and `VectorizeMemory` against the Vectorize binding
  + a Workers AI embedder.
- §7.2 session summarization: `shapeSessionSummary()` prunes routine
  interactions (emotional_weight < 0.25) while preserving every event
  with a consequence. `summarizeSession()` orchestrates summarize →
  embed → store. 3 tests.
- `GuestSessionDO` grows: `/consequence` apply, `/observe` transient
  event, `/end-session` summarize, `/memory` retrieve.
- Routes: `GET /consequences/types`, `POST /consequences/apply`,
  `GET /memory/episodic?q=…`, `POST /memory/observe`,
  `POST /memory/end-session`.
- Web: `TicketStub` now surfaces accumulated marks; a small
  `applyConsequence()` client helper closes the loop.

Polish and close (Week 14-16, §21.6-§21.7):

- §16.1 telemetry signal catalog committed in `@confectory/shared`.
- Telemetry ingestion: `POST /telemetry/event` writes to Analytics
  Engine + the per-guest D1 trail (§16.3); `GET /telemetry/trail`
  reads it back. `TELEMETRY` binding configured in wrangler.toml.
- Client telemetry: `usePauseDetector()` emits The Pause (§16.1)
  after 3s of zero input; `useTimer()` measures the dial settle
  and threshold timings.
- Critic's Notebook data layer: `POST /critic/log` records
  rejections, `GET /critic/recent` reads them with shell/reason
  filters (§15.3, §6.2). D1 migration 0002.
- `docs/phase-1-close.md`: Phase 1 close-out doc with the §21.7
  retro, acceptance table against §21.6, and Phase 2 scope
  decisions for §22.

What's deferred to Phase 2:

- The four custom React panels inside Payload (Mood Console,
  Critic's Notebook, Telemetry dashboard, session inspector) —
  scaffolded behind their API surfaces.
- The Founder's interactive Gemini Live channel — gated to
  `the-foundry-door`, returns 503 until the provider is wired.
- WorkersAI / Anthropic provider swap in production (interfaces
  ready, in-process providers are the Phase 1 default).
- Speculative pre-generation prediction model (§22.1) — current
  engine resolves and assembles on threshold cross.

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
