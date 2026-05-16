import { describe, expect, it } from 'vitest';
import { adaptiveSampleRate, targetBandFor } from './adaptive-sampling.ts';

describe('adaptiveSampleRate', () => {
  it('holds the rate when there is too little signal', () => {
    const out = adaptiveSampleRate({
      trailing_flagged: 2,
      trailing_accepted: 10,
      target_band: targetBandFor('phase_3'),
      current_rate: 0.25,
    });
    expect(out.reason).toBe('insufficient_signal');
    expect(out.next_rate).toBe(0.25);
  });

  it('increases the rate when the flagged rate sits above the target band', () => {
    const out = adaptiveSampleRate({
      trailing_flagged: 30,
      trailing_accepted: 70,
      target_band: targetBandFor('phase_3'),
      current_rate: 0.2,
    });
    expect(out.reason).toBe('above_band');
    expect(out.next_rate).toBeGreaterThan(0.2);
  });

  it('decreases the rate when the flagged rate sits below the target band', () => {
    const out = adaptiveSampleRate({
      trailing_flagged: 2,
      trailing_accepted: 98,
      target_band: targetBandFor('phase_3'),
      current_rate: 0.25,
    });
    expect(out.reason).toBe('below_band');
    expect(out.next_rate).toBeLessThan(0.25);
  });

  it('clamps at the [MIN_RATE, MAX_RATE] floor and ceiling', () => {
    const high = adaptiveSampleRate({
      trailing_flagged: 90,
      trailing_accepted: 10,
      target_band: [0.05, 0.1],
      current_rate: 0.48,
    });
    expect(high.next_rate).toBeLessThanOrEqual(0.5);

    const low = adaptiveSampleRate({
      trailing_flagged: 0,
      trailing_accepted: 200,
      target_band: [0.05, 0.1],
      current_rate: 0.05,
    });
    expect(low.next_rate).toBeGreaterThanOrEqual(0.02);
  });

  it('holds the rate when the flagged rate is exactly in the band', () => {
    const out = adaptiveSampleRate({
      trailing_flagged: 7,
      trailing_accepted: 93,
      target_band: targetBandFor('phase_3'),
      current_rate: 0.18,
    });
    expect(out.reason).toBe('in_band');
    expect(out.next_rate).toBe(0.18);
  });
});

describe('targetBandFor', () => {
  it('matches the §6.3 phase targets', () => {
    expect(targetBandFor('phase_1')).toEqual([0.15, 0.25]);
    expect(targetBandFor('phase_2')).toEqual([0.08, 0.15]);
    expect(targetBandFor('phase_3')).toEqual([0.05, 0.1]);
    expect(targetBandFor('phase_4')).toEqual([0.03, 0.07]);
  });
});
