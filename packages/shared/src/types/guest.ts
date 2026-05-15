import type { OompaLoompaId } from './character.ts';
import type { AppliedConsequence } from './consequence.ts';
import type { R2Key, Timestamp, UserId } from './primitives.ts';
import type { ShellId } from './shell.ts';

export type GuestId = string;

export type GuestLocation = 'foyer' | 'elevator' | 'in_room' | 'in_threshold';

export interface Relationship {
  affinity: number;
  encounters: number;
  last_encountered_at?: Timestamp;
}

export interface FounderEncounter {
  id: string;
  at: Timestamp;
  room_id: string;
  kind: 'set_piece' | 'interactive' | 'glimpse';
  set_piece_id?: string;
}

export interface Mark {
  type: string;
  at: Timestamp;
  source_consequence?: string;
}

export interface TicketStub {
  visual_state: R2Key;
  marks: Mark[];
  last_updated_at: Timestamp;
}

export interface Guest {
  id: GuestId;
  session_started_at: Timestamp;
  last_active_at: Timestamp;
  is_anonymous: boolean;
  user_id?: UserId;
  current_room_id?: string;
  current_location: GuestLocation;
  ticket_stub: TicketStub;
  consequences: AppliedConsequence[];
  visited_shell_ids: ShellId[];
  factory_opinion: number;
  oompa_loompa_relationships: Record<OompaLoompaId, Relationship>;
  founder_encounters: FounderEncounter[];
  respawn_count: number;
}
