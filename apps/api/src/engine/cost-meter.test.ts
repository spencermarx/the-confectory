import { describe, expect, it } from 'vitest';
import { combineCosts, estimateCallCost } from './cost-meter.ts';

describe('cost-meter', () => {
  it('returns a positive estimate for each known call kind', () => {
    expect(estimateCallCost('edge_room_assembly')).toBeGreaterThan(0);
    expect(estimateCallCost('frontier_founder')).toBeGreaterThan(
      estimateCallCost('edge_room_assembly'),
    );
  });

  it('treats pre-rendered set-piece TTS as zero runtime cost', () => {
    expect(estimateCallCost('tts_set_piece')).toBe(0);
  });

  it('combines costs across kinds, multiplying by call counts', () => {
    const breakdown = combineCosts([
      { kind: 'edge_room_assembly', calls: 2 },
      { kind: 'edge_critic', calls: 4 },
      { kind: 'frontier_founder' },
    ]);
    const expected =
      2 * estimateCallCost('edge_room_assembly') +
      4 * estimateCallCost('edge_critic') +
      estimateCallCost('frontier_founder');
    expect(breakdown.total_cents).toBeCloseTo(expected, 5);
    expect(breakdown.by_kind.edge_critic).toBeCloseTo(4 * estimateCallCost('edge_critic'), 5);
  });
});
