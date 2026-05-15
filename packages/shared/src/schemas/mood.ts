import { z } from 'zod';

export const seasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter', 'unseasoned']);

const unit = z.number().min(0).max(1);

export const moodVectorSchema = z.object({
  whimsy: unit,
  menace: unit,
  indulgence: unit,
  founder_presence: unit,
  consequence_severity: unit,
  pace: unit,
  oompa_loompa_mischief: unit,
  season: seasonSchema,
  holiday: z.string().optional(),
});

export const partialMoodVectorSchema = moodVectorSchema.partial();
