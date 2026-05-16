import type { ResolvedDoor } from '../types/room.ts';
import type { ShellId } from '../types/shell.ts';

// §22.1: rank doors by guest-history-conditioned likelihood of being
// crossed. Phase 3's "first move" against speculative pre-gen cost:
// eager-generate the top-K, light-pre-generate the rest.
//
// The Phase 3 implementation here is a deterministic heuristic that
// blends three signals visible to the DO without an extra model call:
//
//   1. Affinity: doors leading to shells the guest has visited recently
//      score higher (guests rebound through familiar rooms).
//   2. Novelty: doors leading to shells the guest has never visited
//      get a modest boost — first-time visits are high-value.
//   3. Door feel: 'eager' / 'light' doors outrank 'reluctant' /
//      'heavy' doors, all else equal. The Translator's intuition.
//
// Phase 3.1 swaps this for a Workers AI ranker once the catalog has
// enough Phase 1-2 commit history to train against.

export interface DoorLikelihoodInput {
  doors: readonly ResolvedDoor[];
  /** Shell catalog: per-shell metadata the ranker reads. */
  shell_door_feel: Record<string, ResolvedDoorContext>;
  visited_shell_ids: readonly ShellId[];
  visit_count_per_shell: Record<ShellId, number>;
}

export interface ResolvedDoorContext {
  feel: 'heavy' | 'light' | 'reluctant' | 'eager' | 'silent' | 'creaking';
}

export interface RankedDoor {
  door: ResolvedDoor;
  score: number;
}

const FEEL_BIAS: Record<ResolvedDoorContext['feel'], number> = {
  eager: 0.18,
  light: 0.1,
  silent: 0.0,
  creaking: -0.04,
  reluctant: -0.1,
  heavy: -0.12,
};

export function rankDoorsByLikelihood(input: DoorLikelihoodInput): RankedDoor[] {
  const visitedSet = new Set(input.visited_shell_ids);
  const recencyIndex = new Map<ShellId, number>();
  // The most-recent visit gets rank 0, second-most-recent gets 1, etc.
  for (let i = input.visited_shell_ids.length - 1; i >= 0; i--) {
    const id = input.visited_shell_ids[i]!;
    if (!recencyIndex.has(id)) {
      recencyIndex.set(id, input.visited_shell_ids.length - 1 - i);
    }
  }

  return [...input.doors]
    .map((door) => {
      const destId = door.destination_shell_id;
      const visited = visitedSet.has(destId);
      const visitCount = input.visit_count_per_shell[destId] ?? 0;
      const recency = recencyIndex.get(destId);

      // §22.1 affinity: log-scaled count + a recency falloff.
      const affinity =
        (Math.log1p(visitCount) / 4) * (recency === undefined ? 0 : Math.max(0, 1 - recency / 6));

      // Novelty: small fixed bonus for unvisited destinations.
      const novelty = visited ? 0 : 0.15;

      const feel = input.shell_door_feel[destId]?.feel ?? 'silent';
      const feelBias = FEEL_BIAS[feel];

      const score = affinity * 0.6 + novelty + feelBias * 0.4;
      return { door, score };
    })
    .sort((a, b) => b.score - a.score);
}

// §22.1: eager-generate the top K (default 2), light-pre-generate
// the rest. Returns a partition the caller can use to route to the
// right provider.
export interface DoorPlan {
  eager: ResolvedDoor[];
  light: ResolvedDoor[];
}

export function planSpeculation(
  ranked: RankedDoor[],
  options: { eager_top_k?: number } = {},
): DoorPlan {
  const k = options.eager_top_k ?? 2;
  return {
    eager: ranked.slice(0, k).map((r) => r.door),
    light: ranked.slice(k).map((r) => r.door),
  };
}
