import type { MarkType, Timestamp } from './primitives.ts';

export type ConsequenceTypeId = string;

export interface VisibleEffect {
  kind: 'tint' | 'overlay' | 'particle' | 'audio_layer' | 'physics_modifier';
  value: string;
  intensity?: number;
}

export interface TriggerPredicate {
  kind: 'on_interact' | 'on_event' | 'on_dialogue' | 'manual';
  prop_slot_id?: string;
  event_id?: string;
}

export interface ConsequenceType {
  id: ConsequenceTypeId;
  name: string;
  trigger_predicate: TriggerPredicate;
  visible_effects: VisibleEffect[];
  oompa_loompa_song_eligible: boolean;
  founder_acknowledges: boolean;
  affects_factory_opinion: number;
  fades: boolean;
  ticket_stub_mark: MarkType;
}

export interface AppliedConsequence {
  type: ConsequenceTypeId;
  applied_at: Timestamp;
  applied_in_room_id: string;
  visible_effects: VisibleEffect[];
  fades_at?: Timestamp;
}
