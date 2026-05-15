import { describe, expect, it } from 'vitest';
import { nearestEntry, resonantLayout } from './resonant-layout.ts';

describe('resonantLayout', () => {
  it('uses a stable visit-order layout for new guests (<10 sessions)', () => {
    const out = resonantLayout({
      available_shell_ids: ['a', 'b', 'c', 'd'],
      visited_shell_ids: ['b', 'a'],
      visit_count_per_shell: { a: 1, b: 1 },
      session_count: 2,
    });
    expect(out.map((e) => e.shell_id)).toEqual(['a', 'b', 'c', 'd']);
    expect(out[0]?.prominence).toBeGreaterThan(out[3]?.prominence ?? 1);
  });

  it('switches to resonant ordering once the guest is past the new-guest window', () => {
    const out = resonantLayout({
      available_shell_ids: ['a', 'b', 'c', 'd'],
      visited_shell_ids: ['c', 'd', 'a', 'a', 'c'],
      visit_count_per_shell: { a: 2, c: 2, d: 1 },
      session_count: 12,
    });
    // The most-recent visit was 'c', followed by 'a'. They should outrank
    // 'b' (never visited) and 'd' (visited once, long ago in the list).
    const order = out.map((e) => e.shell_id);
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('b'));
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
  });

  it('respects factory nudges by boosting nudged shells', () => {
    const out = resonantLayout({
      available_shell_ids: ['a', 'b', 'c'],
      visited_shell_ids: ['c', 'c', 'c'],
      visit_count_per_shell: { c: 3 },
      session_count: 50,
      nudge_toward: new Set(['b']),
    });
    expect(out[0]?.shell_id).toBe('b');
  });
});

describe('nearestEntry', () => {
  const entries = [
    { shell_id: 'top', angle: 0, prominence: 1 },
    { shell_id: 'right', angle: Math.PI / 2, prominence: 0.6 },
    { shell_id: 'bottom', angle: Math.PI, prominence: 0.3 },
    { shell_id: 'left', angle: (3 * Math.PI) / 2, prominence: 0.1 },
  ];

  it('finds the entry whose angle is closest, wrapping around', () => {
    expect(nearestEntry(entries, 0.1)?.shell_id).toBe('top');
    expect(nearestEntry(entries, Math.PI / 2 + 0.05)?.shell_id).toBe('right');
    expect(nearestEntry(entries, 2 * Math.PI - 0.05)?.shell_id).toBe('top');
  });
});
