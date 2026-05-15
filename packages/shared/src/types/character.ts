import type { MoodVector } from './mood.ts';
import type { MeterId, SetPieceId } from './primitives.ts';
import type { ShellId } from './shell.ts';

export type OompaLoompaId = string;

export type OompaLoompaRole =
  | 'inventor'
  | 'chocolatier'
  | 'gardener'
  | 'usher'
  | 'singer'
  | 'machinist'
  | 'archivist';

export interface OompaLoompa {
  id: OompaLoompaId;
  name: string;
  personality_vector: number[];
  role: OompaLoompaRole;
  vendetta_list: OompaLoompaId[];
  default_room_id?: ShellId;
  voice_id: string;
  song_meter_preferences: MeterId[];
  is_universally_disliked: boolean;
  retired: boolean;
}

export interface AppearanceRule {
  id: string;
  shell_filter?: ShellId[];
  mood_filter?: Partial<MoodVector>;
  min_session_visits?: number;
  probability: number;
}

export interface SetPiece {
  id: SetPieceId;
  name: string;
  shell_id?: ShellId;
  audio_assets: string[];
  dialogue_template?: string;
}

export interface Founder {
  base_mood: MoodVector;
  voice_id: string;
  current_location?: ShellId;
  schedule: AppearanceRule[];
  set_pieces: SetPiece[];
  improvisation_budget_per_session: number;
}
