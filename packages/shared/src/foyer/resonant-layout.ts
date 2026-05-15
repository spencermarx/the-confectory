import type { ShellId } from '../types/shell.ts';

// §8.3: the resonant layout orders names by current relevance to this guest.
// Recently-visited rooms surface near the needle's resting position; long-
// forgotten ones drift to harder-to-find positions.
//
// For guests in their first 10 sessions, the layout is more stable: visit
// order, most-recent-near-top. This gives them a chance to learn the
// geography before it starts shifting under them (§8.3).

export interface DialEntry {
  shell_id: ShellId;
  /** Angle in radians around the dial. 0 is at the needle's resting position. */
  angle: number;
  /** 0..1: how easy this room is to reach (1 = right at the needle). */
  prominence: number;
}

export interface ResonantLayoutInput {
  available_shell_ids: ShellId[];
  visited_shell_ids: ShellId[];
  visit_count_per_shell: Record<ShellId, number>;
  session_count: number;
  /** Optional factory override: nudge specific rooms toward the needle. */
  nudge_toward?: Set<ShellId>;
}

const NEW_GUEST_SESSION_THRESHOLD = 10;
const TAU = Math.PI * 2;

export function resonantLayout(input: ResonantLayoutInput): DialEntry[] {
  const stable = input.session_count < NEW_GUEST_SESSION_THRESHOLD;
  return stable ? stableLayout(input) : resonantOrdering(input);
}

function stableLayout(input: ResonantLayoutInput): DialEntry[] {
  // Visit-order, most-recent-near-top. Unvisited rooms appended in
  // their canonical (available_shell_ids) order.
  const visited = [...input.visited_shell_ids].reverse();
  const seen = new Set(visited);
  const unvisited = input.available_shell_ids.filter((id) => !seen.has(id));
  const ordered = [...visited, ...unvisited];
  return ordered.map((shell_id, index) => ({
    shell_id,
    angle: (index / ordered.length) * TAU,
    prominence: 1 - index / ordered.length,
  }));
}

function resonantOrdering(input: ResonantLayoutInput): DialEntry[] {
  // Phase 1 implementation of resonance: score each room by (recency,
  // visit count, factory nudge). Higher score = closer to needle.
  const scored = input.available_shell_ids.map((shell_id) => ({
    shell_id,
    score: scoreShell(shell_id, input),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map(({ shell_id }, index) => ({
    shell_id,
    angle: (index / scored.length) * TAU,
    prominence: 1 - index / scored.length,
  }));
}

function scoreShell(shell_id: ShellId, input: ResonantLayoutInput): number {
  // §8.3: the factory can override the layout. A nudge is decisive —
  // nudged shells always lead, regardless of recency.
  if (input.nudge_toward?.has(shell_id)) return Number.POSITIVE_INFINITY;
  const visitCount = input.visit_count_per_shell[shell_id] ?? 0;
  const recencyRank = input.visited_shell_ids.lastIndexOf(shell_id);
  // recencyRank: -1 if never visited, otherwise position in the visit list.
  // Higher rank = more recent. Normalize against list length.
  const recency =
    recencyRank === -1 ? 0 : (recencyRank + 1) / Math.max(1, input.visited_shell_ids.length);
  const familiarity = Math.log1p(visitCount) / 4;
  return recency * 0.6 + familiarity * 0.2;
}

export function nearestEntry(entries: readonly DialEntry[], angle: number): DialEntry | undefined {
  if (entries.length === 0) return undefined;
  const normalized = ((angle % TAU) + TAU) % TAU;
  let best = entries[0]!;
  let bestDistance = angularDistance(best.angle, normalized);
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i]!;
    const distance = angularDistance(entry.angle, normalized);
    if (distance < bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  }
  return best;
}

function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % TAU;
  return d > Math.PI ? TAU - d : d;
}
