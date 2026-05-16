import { describe, expect, it } from 'vitest';
import type { ResolvedDoor } from '../types/room.ts';
import { planSpeculation, rankDoorsByLikelihood } from './door-likelihood.ts';

function door(id: string, destination_shell_id: string): ResolvedDoor {
  return {
    door_slot_id: id,
    destination_shell_id,
    destination_pre_generation_state: 'pending',
  };
}

describe('rankDoorsByLikelihood', () => {
  it('ranks a heavily-visited destination above an untouched one when feels match', () => {
    const ranked = rankDoorsByLikelihood({
      doors: [door('a', 'familiar'), door('b', 'untouched')],
      shell_door_feel: {
        familiar: { feel: 'light' },
        untouched: { feel: 'light' },
      },
      visited_shell_ids: ['familiar', 'familiar', 'familiar'],
      visit_count_per_shell: { familiar: 3 },
    });
    expect(ranked[0]?.door.destination_shell_id).toBe('familiar');
  });

  it('still ranks an unvisited destination ahead of a long-ago-visited one', () => {
    // Recency falloff plus the novelty bonus should win here.
    const ranked = rankDoorsByLikelihood({
      doors: [door('a', 'long-ago'), door('b', 'untouched')],
      shell_door_feel: {
        'long-ago': { feel: 'light' },
        untouched: { feel: 'light' },
      },
      // 'long-ago' is the 8th-most-recent — past the recency window.
      visited_shell_ids: [
        'long-ago',
        'other',
        'other',
        'other',
        'other',
        'other',
        'other',
        'other',
      ],
      visit_count_per_shell: { 'long-ago': 1, other: 7 },
    });
    expect(ranked[0]?.door.destination_shell_id).toBe('untouched');
  });

  it('uses door feel as a tie-breaker when affinity is equal', () => {
    const ranked = rankDoorsByLikelihood({
      doors: [door('eager', 'a'), door('reluctant', 'b')],
      shell_door_feel: {
        a: { feel: 'eager' },
        b: { feel: 'reluctant' },
      },
      visited_shell_ids: [],
      visit_count_per_shell: {},
    });
    expect(ranked[0]?.door.destination_shell_id).toBe('a');
  });
});

describe('planSpeculation', () => {
  it('partitions ranked doors into eager (top K) and light (rest)', () => {
    const plan = planSpeculation(
      [
        { door: door('a', 'a'), score: 0.9 },
        { door: door('b', 'b'), score: 0.5 },
        { door: door('c', 'c'), score: 0.2 },
        { door: door('d', 'd'), score: 0.1 },
      ],
      { eager_top_k: 2 },
    );
    expect(plan.eager.map((d) => d.destination_shell_id)).toEqual(['a', 'b']);
    expect(plan.light.map((d) => d.destination_shell_id)).toEqual(['c', 'd']);
  });

  it('defaults eager_top_k to 2', () => {
    const plan = planSpeculation([
      { door: door('a', 'a'), score: 0.9 },
      { door: door('b', 'b'), score: 0.5 },
      { door: door('c', 'c'), score: 0.2 },
    ]);
    expect(plan.eager).toHaveLength(2);
    expect(plan.light).toHaveLength(1);
  });
});
