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

- **Speculative pre-generation** (§5.1 step 6, §5.2). On `/settle` the
  Worker now pre-generates the settled destination; on threshold cross
  it kicks pre-gen for every downstream door of the new room. Phase 3
  layers in the door-likelihood prediction model (§22.1) so we eager-
  gen the top 2 and light-gen the rest.
- **Slow Critic at 25% sample** (§22.3, §6.2). The Queue consumer runs
  the slow Critic on accepted artifacts; anything below 0.6 lands in
  the Critic's Notebook. Tune sample rate downward as confidence grows.
- **WorkersAI / Anthropic provider activation** for production. The
  `FoundryProvider`, `CriticProvider`, `SlowCriticProvider`,
  `TTSProvider`, `VoiceProvider`, and `MemoryProvider` interfaces all
  have production implementations sitting behind them; turning each
  on is a single swap in the DO/Worker constructors.
- **Founder interactive via Gemini Live** (§11.1, §22.2). Wire the
  WebRTC handoff from `/dialogue/founder/interactive` and unblock the
  Foundry-Door scene.

### Surfaces

- **Mood Console custom React UI** inside Payload (§15.3). The writer
  path is live at `PUT /factory/mood`; Phase 2 adds the slider UI,
  scheduler, and live preview.
- **Critic's Notebook UI** inside Payload (§15.3, §6.2). The data
  layer + the slow-Critic queue are wired; Phase 2 adds the reviewer
  interface with promotion to authored library and negative-example
  curation.
- **Telemetry of Wonder dashboard** inside Payload (§15.3, §16). The
  ingestion pipeline exists (Analytics Engine + D1 trail); Phase 2
  adds the D3-based custom charts: Pause heatmap, re-entry rates,
  dwell variance.

### Identity

- **Better-Auth integration** for Recipe Keepers (§17.2). Replace the
  built-in Payload auth shim with passkey-only.

### World

- **Co-presence ghosts in the foyer** (§8.5). The singleton
  FactoryStateDO publishes anonymized presence to a Hibernation API
  WebSocket channel (§14.2); per-guest DOs subscribe and render faint
  semi-transparent figures.

### Operations

- **D1 backfill** for per-guest structural memory (§7.1, §3.4). The
  GuestSessionDO is authoritative in-memory; Phase 2 mirrors the
  structural pieces (visits, consequences, ticket-stub marks) into
  D1 so cross-device account upgrades survive DO eviction.
- **Dial typography preload** (§22.4). Pre-fetch the typography
  registry on foyer entry as a single batched WOFF2 fetch.

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
