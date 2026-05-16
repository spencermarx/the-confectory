import type { MoodVector } from '../types/mood.ts';

export interface MoodComposerInput {
  shell_compatibility: MoodVector;
  factory_mood: MoodVector;
  /** Guest's accumulated consequence severity, 0..1. */
  guest_consequence_severity: number;
  /** Recipe Keeper override applied on top of everything else. */
  override?: Partial<MoodVector>;
}

const NUMERIC_KEYS = [
  'whimsy',
  'menace',
  'indulgence',
  'founder_presence',
  'consequence_severity',
  'pace',
  'oompa_loompa_mischief',
] as const satisfies readonly (keyof MoodVector)[];

// §5.2 step 3: compose a mood vector for an upcoming room.
// Blend of: shell compatibility (50%) + factory mood (30%) + guest state (20%),
// plus an explicit override on top.
export function composeMood(input: MoodComposerInput): MoodVector {
  const guest = guestMood(input.guest_consequence_severity);
  const composed: MoodVector = {
    ...input.factory_mood,
    season: input.shell_compatibility.season,
    ...(input.shell_compatibility.holiday !== undefined
      ? { holiday: input.shell_compatibility.holiday }
      : input.factory_mood.holiday !== undefined
        ? { holiday: input.factory_mood.holiday }
        : {}),
  };
  for (const key of NUMERIC_KEYS) {
    composed[key] = clamp01(
      input.shell_compatibility[key] * 0.5 + input.factory_mood[key] * 0.3 + guest[key] * 0.2,
    );
  }
  if (input.override) {
    for (const key of NUMERIC_KEYS) {
      const v = input.override[key];
      if (typeof v === 'number') composed[key] = clamp01(v);
    }
    if (input.override.season) composed.season = input.override.season;
    if (input.override.holiday !== undefined) composed.holiday = input.override.holiday;
  }
  return composed;
}

function guestMood(severity: number): Pick<MoodVector, (typeof NUMERIC_KEYS)[number]> {
  // A guest with heavy consequences slows the pace, lowers whimsy, raises menace.
  const s = clamp01(severity);
  return {
    whimsy: 1 - s * 0.5,
    menace: s,
    indulgence: 0.5 - s * 0.2,
    founder_presence: 0.3 + s * 0.4,
    consequence_severity: s,
    pace: 0.5 - s * 0.3,
    oompa_loompa_mischief: 0.5,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
