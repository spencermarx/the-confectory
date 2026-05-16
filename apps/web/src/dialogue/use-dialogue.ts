import { useMutation } from '@tanstack/react-query';

export interface OompaLoompaReply {
  text: string;
  voice_id: string;
  served_from_fallback: boolean;
}

export async function speakToOompaLoompa(args: {
  character_id: string;
  shell_id: string;
  prompt_hint?: string;
}): Promise<OompaLoompaReply> {
  const res = await fetch('/api/dialogue/oompa-loompa', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`dialogue failed: ${res.status}`);
  return res.json() as Promise<OompaLoompaReply>;
}

export interface SetPieceBeat {
  beat_id: string;
  text: string;
  audio_asset: string;
  cue?: 'face_guest' | 'walk_in' | 'pause' | 'depart';
  duration_ms: number;
}

export interface FounderSetPiece {
  set_piece_id: string;
  shell_id: string;
  voice_id: string;
  beats: SetPieceBeat[];
}

export async function fetchFounderSetPiece(set_piece_id: string): Promise<FounderSetPiece> {
  const res = await fetch('/api/dialogue/founder/set-piece', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ set_piece_id }),
  });
  if (!res.ok) throw new Error(`founder set-piece failed: ${res.status}`);
  return res.json() as Promise<FounderSetPiece>;
}

export function useOompaLoompaDialogue() {
  return useMutation({ mutationFn: speakToOompaLoompa });
}
