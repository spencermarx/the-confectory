# Phase 1 close

This document captures the state of The Confectory at the close of Phase 1
and the architect's notes going into the Founder demo (§21.7). It is the
working counterpart to the build sequence in arch-t-spec §21.

## What ships in Phase 1

The demoable seed per arch-t-spec §21.1-§21.6:

- **The foyer** (§8). Hand-authored scene; Portal Door with a brass
  resonant-layout dial (§8.2-§8.3); typography-aware name plate; sign;
  diegetic ticket stub with mark accumulation.
- **Five canonical shells**: `the-foyer` (gate), `the-hush-before`
  (branching, with a `gum-tray` prop slot), `the-treacle-deep`
  (cul-de-sac), `the-foundry-door` (gate / Founder set-piece),
  `the-elevator` (§5.5 budget room). Each ships with a hand-authored
  fallback (§6.4).
- **The engine** (§5). Room assembly orchestrates door resolution →
  mood composition → prop and Oompa-Loompa assignment → sign and
  surface generation through the fast Critic's retry budget → §6.4
  authored fallback on exhaustion.
- **The fast Style Critic** (§6.1) with the 1-retry budget for
  branching shells and the widened 3-retry budget for cul-de-sacs
  (§5.4). Rejections are written to the Critic's Notebook.
- **One Oompa-Loompa**: The Sweetwright (§19.1), fully implemented —
  16-dim personality vector, role, voice id, song-meter preferences,
  authored greeting + interaction lines.
- **The Founder**, singleton with the cloned voice id and two
  pre-rendered set-pieces: `founder-arrival` (in the foyer) and
  `founder-foundry-door` (the gate to the interactive moment).
  Interactive mode is gated to `the-foundry-door`; it returns 503
  until the Gemini Live provider is wired, falling through to the
  set-piece library per §19.1.
- **Memory** (§7). Per-guest structural state in D1 + the
  GuestSessionDO; episodic memory through a `MemoryProvider`
  interface (Phase 1 default = in-process; production swaps to
  Vectorize + a Workers AI embedder). Session summarization (§7.2)
  prunes routine events and preserves anything carrying a consequence.
- **One consequence fully implemented**: BLUE_FROM_GUM (§21.5).
  Triggered by interacting with the `gum-tray` prop in
  `the-hush-before`; idempotent on (guest, room, type) per §14.3;
  updates the consequence list, the ticket stub marks, and the
  factory opinion vector.
- **The Mood Console** writer path (§15.3). `PUT /factory/mood`
  patches the singleton FactoryStateDO; the next room assembly picks
  up the new mood. The custom React panel inside Payload is deferred
  to Phase 2.
- **Telemetry of Wonder** ingestion (§16.1). Twelve named signals
  in the catalog. The client emits The Pause, the dial settle time,
  and threshold-related signals; the Worker fans them out to
  Analytics Engine and a per-guest D1 trail.
- **Recipe Keeper console** scaffolded as Payload 3.x with all
  §15.2 collections + §15.4 RBAC roles. The Critic's Notebook and
  Mood Console custom React surfaces are deferred to Phase 2.

## Acceptance against §21.6 / §18.1

| Phase 1 acceptance criterion              | Status                                  |
|-------------------------------------------|-----------------------------------------|
| Foyer, three rooms, Founder arrival, OL   | ✅ (5 shells incl. foyer + elevator)    |
| One consequence wired                     | ✅ BLUE_FROM_GUM                        |
| Mood Console affecting generation         | ✅ via API; UI panel deferred to Phase 2|
| Critic's Notebook MVP                     | 🟡 data layer ✅; UI deferred to Phase 2|
| Telemetry of Wonder dashboard MVP         | 🟡 ingestion ✅; dashboard UI in Phase 2|
| Phase 1 latency budgets (§18.1)           | Pending instrumented run on edge.       |

## What we deliberately deferred

Per the architect's principle that we ship Phase 1 quality, not Phase 1
scope: the four custom React panels that live inside Payload (Mood
Console, Critic's Notebook, Telemetry dashboard, plus the planned
session inspector) are scaffolded behind their API surfaces but the
plugin UI ships in Phase 2. The Founder's interactive Gemini Live
channel is gated and returns 503 until the provider is configured.
Generation today uses the InProcessFoundry / AcceptingCritic — the
WorkersAI and Anthropic implementations exist in code and swap in
behind the same interfaces once the API tokens land.

## Decisions for Phase 2 scope (§22)

- **Speculative pre-generation cap** (§22.1). Phase 2 should land the
  prediction model that ranks door likelihood and only fully
  pre-generates the top-2 doors. The interface boundary in
  `RoomAssembler.resolveDoors()` already isolates this.
- **Slow Critic subsampling** (§22.3). Phase 2 turns the slow Critic
  on at 25% coverage; the queue handler stub is in place.
- **Co-presence in the foyer** (§8.5). Founder approval required;
  the WebSocket fanout pattern is documented in §14.2.
- **Better-Auth integration** for Recipe Keepers (§17.2). Phase 1
  uses Payload's built-in auth as a temporary shim.
- **Wonka-likeness review** (§22.6). Before the Founder demo goes
  public, legal review of the "might be Wonka" surface area.

## Operational notes

- The room assembler defaults to `InProcessFoundry` /
  `AcceptingCritic`. To enable production generation, bind `AI` in
  wrangler.toml and swap the providers in the `GuestSessionDO`
  constructor — the swap is a single-line change behind the
  `FoundryProvider` interface.
- The Vectorize binding name is `MEMORY`. Until the index is
  provisioned, the DO uses an in-process memory store; episodic
  recall works in dev but does not survive DO eviction.
- The Analytics Engine dataset is `confectory_telemetry`. Dashboards
  read it from the SQL endpoint; the per-guest trail in D1 is the
  authoritative store for in-session inspection (§16.3).

The Translator has the design. I have the build. The Founder has the
vision. The Style Critic has the taste. Phase 1 holds those four lines.

— The Architect
