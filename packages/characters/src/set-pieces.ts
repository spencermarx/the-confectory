import type { R2Key, SetPieceId, ShellId } from '@confectory/shared';

// §11.1: set-piece lines are written in advance, generated to audio at
// authoring time, stored in R2, served as static assets. Lowest latency,
// highest quality. Used for the Founder's arrival and other set-pieces.
export interface SetPieceBeat {
  beat_id: string;
  /** Subtitle / text-of-record. Authoritative even when audio plays. */
  text: string;
  /** Pre-rendered audio asset, served from R2. */
  audio_asset: R2Key;
  /** Optional camera or animation cue the client honors. */
  cue?: 'face_guest' | 'walk_in' | 'pause' | 'depart';
  /** Milliseconds the beat takes (used for client subtitle timing). */
  duration_ms: number;
}

export interface SetPiece {
  id: SetPieceId;
  name: string;
  shell_id: ShellId;
  beats: SetPieceBeat[];
}

const setPieces = new Map<SetPieceId, SetPiece>();

function register(piece: SetPiece): SetPiece {
  if (setPieces.has(piece.id)) throw new Error(`Duplicate set-piece id: ${piece.id}`);
  setPieces.set(piece.id, piece);
  return piece;
}

// §8.4, §21.4: the Founder's arrival in the foyer. Phase 1 ships this
// as a pre-rendered set-piece. The interactive Gemini Live path opens
// only behind the Foundry Door (see founder-foundry-door).
export const founderArrival = register({
  id: 'founder-arrival',
  name: 'The Founder Arrives in the Foyer',
  shell_id: 'the-foyer',
  beats: [
    {
      beat_id: 'enter',
      text: 'Ah. There you are.',
      audio_asset: 'set-pieces/founder-arrival/01-there-you-are.opus',
      cue: 'walk_in',
      duration_ms: 1600,
    },
    {
      beat_id: 'recognize',
      text: 'The factory has been waiting. I have been waiting.',
      audio_asset: 'set-pieces/founder-arrival/02-waiting.opus',
      cue: 'face_guest',
      duration_ms: 3200,
    },
    {
      beat_id: 'invite',
      text: 'Come in. Touch nothing you would not have touch you back.',
      audio_asset: 'set-pieces/founder-arrival/03-touch-nothing.opus',
      cue: 'pause',
      duration_ms: 3800,
    },
    {
      beat_id: 'depart',
      text: 'I will be in the lab.',
      audio_asset: 'set-pieces/founder-arrival/04-in-the-lab.opus',
      cue: 'depart',
      duration_ms: 1800,
    },
  ],
});

// §21.4: the Founder's interactive moment is gated behind the Foundry
// Door. A short pre-rendered fanfare hands the conversation over to
// the Gemini Live channel; the apology fallback uses the same beats
// when Live is unavailable (§19.1).
export const founderFoundryDoor = register({
  id: 'founder-foundry-door',
  name: 'The Founder at the Foundry Door',
  shell_id: 'the-foundry-door',
  beats: [
    {
      beat_id: 'opens',
      text: 'Mind your shoes. The floor is warmer through here.',
      audio_asset: 'set-pieces/founder-foundry-door/01-mind-your-shoes.opus',
      cue: 'walk_in',
      duration_ms: 3000,
    },
    {
      beat_id: 'hand-off',
      text: 'Speak up. I can hear better through the gramophone today.',
      audio_asset: 'set-pieces/founder-foundry-door/02-gramophone.opus',
      cue: 'face_guest',
      duration_ms: 3400,
    },
  ],
});

export function getSetPiece(id: SetPieceId): SetPiece | undefined {
  return setPieces.get(id);
}

export function listSetPieces(): SetPiece[] {
  return [...setPieces.values()];
}
