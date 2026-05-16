import { describe, expect, it } from 'vitest';
import type { MoodVector } from '../types/mood.ts';
import { composeMood } from './mood-composer.ts';

const neutral: MoodVector = {
  whimsy: 0.5,
  menace: 0.5,
  indulgence: 0.5,
  founder_presence: 0.5,
  consequence_severity: 0.5,
  pace: 0.5,
  oompa_loompa_mischief: 0.5,
  season: 'unseasoned',
};

describe('composeMood', () => {
  it('returns values in [0,1]', () => {
    const out = composeMood({
      shell_compatibility: { ...neutral, whimsy: 1 },
      factory_mood: { ...neutral, whimsy: 1 },
      guest_consequence_severity: 1,
    });
    for (const v of Object.values(out)) {
      if (typeof v === 'number') {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('uses the shell compatibility season, not the factory season', () => {
    const out = composeMood({
      shell_compatibility: { ...neutral, season: 'autumn' },
      factory_mood: { ...neutral, season: 'winter' },
      guest_consequence_severity: 0,
    });
    expect(out.season).toBe('autumn');
  });

  it('lets explicit overrides win over the blend', () => {
    const out = composeMood({
      shell_compatibility: { ...neutral, whimsy: 0.1 },
      factory_mood: { ...neutral, whimsy: 0.1 },
      guest_consequence_severity: 0,
      override: { whimsy: 0.95 },
    });
    expect(out.whimsy).toBeCloseTo(0.95, 5);
  });

  it('raises menace and lowers pace for a heavily-consequenced guest', () => {
    const low = composeMood({
      shell_compatibility: neutral,
      factory_mood: neutral,
      guest_consequence_severity: 0,
    });
    const high = composeMood({
      shell_compatibility: neutral,
      factory_mood: neutral,
      guest_consequence_severity: 1,
    });
    expect(high.menace).toBeGreaterThan(low.menace);
    expect(high.pace).toBeLessThan(low.pace);
    expect(high.founder_presence).toBeGreaterThan(low.founder_presence);
  });
});
