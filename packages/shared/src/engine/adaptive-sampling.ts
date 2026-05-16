// §22.3, §6.3: the slow Critic sample rate is a control variable, not
// a fixed property. Phase 2 ran at 25%; Phase 3 tunes the rate against
// the trailing rejection rate so we get enough training signal but
// don't burn frontier-model spend on already-good generations.
//
// §6.3 targets:
//   Phase 1: 15-25% slow Critic flagged
//   Phase 2: 8-15%
//   Phase 3: 5-10%
//   Phase 4: 3-7%
//
// The sample rate moves opposite the flagged rate:
//   - low flagged rate → fast Critic is doing its job, sample less.
//   - high flagged rate → fast Critic is missing things, sample more.
//
// The output is bounded so we always sample something (so we keep
// detecting drift) and never sample more than the previous rate +
// a small step (to avoid spending shocks).

export interface SampleRateInput {
  /** Recent slow-Critic verdicts (Phase 3 reads the trailing 24h). */
  trailing_flagged: number;
  trailing_accepted: number;
  /** §6.3 phase target band — [min, max] flagged rate we want to hit. */
  target_band: readonly [number, number];
  /** Current rate, used to bound the per-tick change. */
  current_rate: number;
}

export interface SampleRateResult {
  next_rate: number;
  reason: string;
  flagged_rate: number;
}

const MIN_RATE = 0.02;
const MAX_RATE = 0.5;
const MAX_STEP = 0.1;

export function adaptiveSampleRate(input: SampleRateInput): SampleRateResult {
  const total = input.trailing_flagged + input.trailing_accepted;
  if (total < 30) {
    // §6.3: too few samples to make a confident move. Hold the rate.
    return {
      next_rate: clamp(input.current_rate, MIN_RATE, MAX_RATE),
      flagged_rate: total === 0 ? 0 : input.trailing_flagged / total,
      reason: 'insufficient_signal',
    };
  }
  const flagged_rate = input.trailing_flagged / total;
  const [lo, hi] = input.target_band;
  let next = input.current_rate;
  let reason = 'in_band';
  if (flagged_rate > hi) {
    // Too many flags slipping through — sample more so the next
    // training cycle has signal.
    next = input.current_rate + MAX_STEP * Math.min(1, (flagged_rate - hi) / hi);
    reason = 'above_band';
  } else if (flagged_rate < lo) {
    // Below band — fast Critic is doing well, ease off spend.
    next = input.current_rate - MAX_STEP * Math.min(1, (lo - flagged_rate) / Math.max(lo, 0.01));
    reason = 'below_band';
  }
  return {
    next_rate: clamp(next, MIN_RATE, MAX_RATE),
    flagged_rate,
    reason,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// §22.3, §6.3: convenience accessor — phase-target band lookup.
export type PhaseBand = 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4';

export function targetBandFor(phase: PhaseBand): readonly [number, number] {
  switch (phase) {
    case 'phase_1':
      return [0.15, 0.25];
    case 'phase_2':
      return [0.08, 0.15];
    case 'phase_3':
      return [0.05, 0.1];
    case 'phase_4':
      return [0.03, 0.07];
  }
}
