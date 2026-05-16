import type { ConsequenceTypeId, OompaLoompaId } from '@confectory/shared';

// §4.4, §11.2: songs are text-first (generated through the Critic) then
// passed to ElevenLabs for TTS. Templates carry the meter and the
// consequence trigger that calls them up.
export type SongMeter = 'dactylic-tetrameter' | 'iambic-pentameter' | 'trochaic-trimeter';

export interface SongTemplate {
  id: string;
  meter: SongMeter;
  // The OL who can sing this song. Empty = any.
  performer_ids: OompaLoompaId[];
  // §4.6: songs trigger on specific consequences.
  eligible_consequences: ConsequenceTypeId[];
  // Authored skeleton. The dialogue generator fills in references to the
  // guest's specific consequence.
  template: string;
}

const songs = new Map<string, SongTemplate>();

function register(song: SongTemplate): SongTemplate {
  if (songs.has(song.id)) throw new Error(`Duplicate song id: ${song.id}`);
  songs.set(song.id, song);
  return song;
}

export const blueFromGumLament = register({
  id: 'song-blue-from-gum',
  meter: 'dactylic-tetrameter',
  performer_ids: ['ol-sweetwright'],
  eligible_consequences: ['BLUE_FROM_GUM'],
  template: `A guest of the factory chewed what they shouldn't have chewed.
The blue is a colour you wear when you wouldn't be schooled.
We told you. We tell them. We tell ourselves too.
The treacle remembers. So does the blue.`,
});

export function getSong(id: string): SongTemplate | undefined {
  return songs.get(id);
}

export function eligibleSongsFor(consequence: ConsequenceTypeId): SongTemplate[] {
  return [...songs.values()].filter((s) => s.eligible_consequences.includes(consequence));
}
