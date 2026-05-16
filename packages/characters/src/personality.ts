// §4.4: 16-dim personality vector, hand-tuned per character. The spec
// doesn't enumerate the dimensions, so Phase 1 commits to this taxonomy
// and freezes it for the duration of the build. Changes require a
// content release.
export const PERSONALITY_DIMENSIONS = [
  'warmth',
  'mischief',
  'patience',
  'pride',
  'curiosity',
  'precision',
  'sentimentality',
  'sass',
  'reverence',
  'grudge_holding',
  'extroversion',
  'pessimism',
  'invention',
  'gluttony',
  'wonder',
  'cynicism',
] as const;

export type PersonalityDimension = (typeof PERSONALITY_DIMENSIONS)[number];

export type PersonalityVector = Record<PersonalityDimension, number>;

export function asVector(p: PersonalityVector): number[] {
  return PERSONALITY_DIMENSIONS.map((dim) => p[dim]);
}
