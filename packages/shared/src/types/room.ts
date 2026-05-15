import type { OompaLoompaId } from './character.ts';
import type { GuestId } from './guest.ts';
import type { MoodVector } from './mood.ts';
import type { EventId, R2Key, SurfaceSlot, Timestamp } from './primitives.ts';
import type { ShellId } from './shell.ts';

export type GenerationState = 'pending' | 'in_progress' | 'ready' | 'failed';

export interface ResolvedDoor {
  door_slot_id: string;
  destination_shell_id: ShellId;
  destination_pre_generation_state: GenerationState;
  destination_room_id?: string;
}

export interface ResolvedProp {
  prop_slot_id: string;
  prop_id: string;
  texture_variations?: Record<string, R2Key>;
}

export type GeneratedSurface = R2Key | 'pre_baked' | 'pending';

export interface Room {
  id: string;
  guest_id: GuestId;
  shell_id: ShellId;
  entered_at: Timestamp;
  last_seen_at: Timestamp;
  mood_at_entry: MoodVector;
  resolved_doors: ResolvedDoor[];
  resolved_props: ResolvedProp[];
  generated_surfaces: Partial<Record<SurfaceSlot, GeneratedSurface>>;
  generated_signs: Record<string, R2Key>;
  oompa_loompa_assignments: OompaLoompaId[];
  observed_events: EventId[];
}
