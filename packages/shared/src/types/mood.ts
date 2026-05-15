import type { HolidayId } from './primitives.ts';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'unseasoned';

export interface MoodVector {
  whimsy: number;
  menace: number;
  indulgence: number;
  founder_presence: number;
  consequence_severity: number;
  pace: number;
  oompa_loompa_mischief: number;
  season: Season;
  holiday?: HolidayId;
}
