// §18.3: per-session cost SLO. The architect's note: "Cost-per-guest-
// session p95 must remain under $0.40 at steady state (Phase 3+).
// Phase 1 will burn 3-5x that during the speculative pre-generation
// phase before the engine learns to prune."
//
// The cost meter is a small estimator that runs alongside generation
// and emits cents-per-call to the telemetry pipeline. Estimates are
// based on Workers AI / Anthropic / ElevenLabs published list prices
// at the time of writing; they're documented constants so a Recipe
// Keeper can tune them when the providers retune their pricing.

export type CostKind =
  | 'edge_room_assembly'
  | 'edge_critic'
  | 'edge_image'
  | 'frontier_founder'
  | 'frontier_slow_critic'
  | 'frontier_summarization'
  | 'tts_oompa_loompa'
  | 'tts_set_piece';

// Rough cents-per-call estimates (Phase 3 starting point). Source:
//   §3.3, §10.3, §10.4, §11.1, §11.2.
// These are intentionally inlined here so the meter is dependency-
// free and any update is a single commit.
const COST_TABLE_CENTS: Record<CostKind, number> = {
  edge_room_assembly: 0.4,
  edge_critic: 0.06,
  edge_image: 0.18,
  frontier_founder: 2.5,
  frontier_slow_critic: 1.0,
  frontier_summarization: 0.8,
  tts_oompa_loompa: 0.15,
  tts_set_piece: 0.0, // pre-rendered, charged at authoring time
};

export function estimateCallCost(kind: CostKind): number {
  return COST_TABLE_CENTS[kind];
}

export interface CostBreakdown {
  total_cents: number;
  by_kind: Partial<Record<CostKind, number>>;
}

export function combineCosts(entries: Array<{ kind: CostKind; calls?: number }>): CostBreakdown {
  const by_kind: Partial<Record<CostKind, number>> = {};
  let total = 0;
  for (const entry of entries) {
    const calls = entry.calls ?? 1;
    const cents = COST_TABLE_CENTS[entry.kind] * calls;
    by_kind[entry.kind] = (by_kind[entry.kind] ?? 0) + cents;
    total += cents;
  }
  return { total_cents: total, by_kind };
}
