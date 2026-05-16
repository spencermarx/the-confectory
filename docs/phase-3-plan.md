# Phase 3 plan

Phase 2 closed with every item from `docs/phase-2-plan.md` ticked.
Phase 3 picks up the §22 cost / quality optimizations, the §24
Phase 3 deferrals, and the carryover items the architect's notes
flag as "later".

## Scope

### Cost and quality

- **Door-likelihood prediction model** (§22.1). Today every
  resolved downstream door is fully pre-generated on threshold
  commit, which is wasteful (4x compute at a branching shell).
  Phase 3 lands a small predictor that ranks doors by guest-history-
  conditioned likelihood, then eager-generates the top 2 and
  light-pre-generates the others. The predictor is in-process and
  deterministic for tests; production swaps to a small Workers AI
  model.
- **Slow Critic subsample tuning** (§22.3). Phase 2 set the sample
  at 25%; Phase 3 reads the Critic's Notebook for the trailing 30
  days, computes the slow-Critic agreement rate, and tunes the
  sample down toward §6.3's Phase 3 targets (5-10%).
- **Cheaper models behind the same providers** (§22.7). Llama 3.1
  8B for room assembly at the edge; subsample Slow Critic further;
  pre-bake more surfaces; consider OSS TTS for Oompa-Loompas.
- **Cost-per-session SLO** (§18.3). Phase 3 should hit <$0.40 p95
  cost-per-guest-session at steady state.

### World

- **Co-presence beyond the foyer** (§8.5 follow-on). Phase 2 ships
  ghosts in the foyer only; Phase 3 considers extending to a few
  in-world meeting points (the Treacle Deep, the Foundry Door
  antechamber).
- **The Founder email-the-guest mechanic** (§24). When the guest
  gives the Founder the means, in character, the Founder may write.
- **Voice-print identity** (§24). Stable voice-print enrollment per
  session so the Founder recognizes a returning guest by voice.

### Memory and content

- **Rename events** (§24 carryover, Phase 4 in the spec but worth
  Phase 3 design). Rooms renaming globally on consequence, with
  the sign + announcement assets regenerated and cache invalidated
  per §9.3.
- **Generative music** (§24, §11.3). Suno-class background music
  generation, reconsidered per §11.3 Phase 3 review.

## Out of scope (still later)

- Real-time mesh generation (§24, Phase 4).
- Multi-cloud / specialty AWS workloads (§24, Phase 4).
- Smell, taste cues (§24, indefinite).

## Sequencing

Phase 3 opens with the door-likelihood predictor since it's the
architect's first cost-optimization step in §22.1. After that:
slow-Critic sample tuning, then the cost-per-session SLO pass,
then co-presence extension and the Founder's email mechanic.
