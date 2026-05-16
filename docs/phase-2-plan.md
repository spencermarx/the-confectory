# Phase 2 plan

Phase 1 closed with `docs/phase-1-close.md`. Phase 2 picks up the
deferred items from there plus the §22 architect's pushbacks and the
§24 deferred-decisions table. This document is the working plan and
will grow as items land.

## Scope

The Translator was clear that the Founder ranked Phase 1 quality over
Phase 1 scope. Phase 2 inherits the same principle: each item below
ships when it's right, not on a date.

### Engine

- ✅ **Speculative pre-generation** (§5.1 step 6, §5.2) — landed.
- ✅ **Slow Critic at 25% sample** (§22.3, §6.2) — landed.
- ✅ **WorkersAI / Anthropic provider activation** — landed (DO
  constructor swaps providers when `env.AI` is bound; secrets typed
  in `Env` so production deploys can light them up without code
  changes).
- ✅ **Founder interactive via Gemini Live** (§11.1, §22.2) — landed
  as a session-token handoff with §19.1 fallback when the secret
  isn't configured.

### Surfaces

- ✅ **Mood Console** custom React UI inside Payload (§15.3) — landed
  at `/admin/mood-console` with sliders for the §4.7 mood dials,
  season selector, save-status indicator, and live `PUT` to
  `/factory/mood`. The WebSocket fanout (§14.2) propagates the new
  mood to in-flight guest sessions.
- ✅ **Critic's Notebook UI** (§15.3, §6.2) — landed at
  `/admin/critics-notebook` with shell + reason filters over the
  recent-rejections table. Phase 3 adds promotion to fallback and
  negative-example curation.
- ✅ **Telemetry of Wonder** dashboard (§15.3, §16) — landed at
  `/admin/telemetry` with the §16.1 signal catalog, a per-signal
  trail readout, p50/p95 stats, and an inline SVG sparkline. Phase 3
  swaps the trail readout for cross-guest aggregations against
  Analytics Engine.

### Identity

- ✅ **Better-Auth integration** — see "Still open" above (landed).

### World

- ✅ **Co-presence ghosts in the foyer** (§8.5) — landed via the
  §14.2 Hibernation-API WebSocket fanout on FactoryStateDO.

### Still open

- ✅ **Better-Auth integration** for Recipe Keepers (§17.2) — landed.
  `apps/cms/src/auth/` configures a passkey-only Better-Auth instance
  against the same Postgres as Payload; a Payload `AuthStrategy`
  reads the Better-Auth session cookie and constructs the Payload
  user envelope. Email/password is disabled on Users.

### Operations

- ✅ **D1 backfill** for per-guest structural memory (§7.1, §3.4) —
  landed. `apps/api/db/guest-store.ts` mirrors guest + visit +
  consequence + ticket-stub-mark from the DO to D1 via `waitUntil`.
- ✅ **Dial typography preload** (§22.4) — landed.
  `GET /typography/registry` returns the typography→font URL map;
  the foyer emits `<link rel="preload" as="font">` tags on entry.

## Out of scope (deferred again)

These remain Phase 3 or later, per §24 and §22.7:

- Door-likelihood prediction model for speculative pre-gen (§22.1).
- Generative music (§24).
- Real-time mesh generation (§24).
- Multi-cloud workloads (§24).
- Smaller / cheaper models (§22.7, §24).
- Rename events (§24).
- Voice-print identity (§24).
- The Founder's email-the-guest mechanic (§24).
