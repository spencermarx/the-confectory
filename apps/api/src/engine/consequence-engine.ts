import type {
  AppliedConsequence,
  ConsequenceType,
  ConsequenceTypeId,
  Guest,
  Mark,
} from '@confectory/shared';
import { getConsequenceType } from '@confectory/shells';

export interface ApplyConsequenceInput {
  guest: Guest;
  type_id: ConsequenceTypeId;
  /** Shell id (room id, but Phase 1 uses shell+timestamp). */
  applied_in_room_id: string;
  now: number;
}

export type ApplyConsequenceResult =
  | { status: 'applied'; guest: Guest; consequence: AppliedConsequence; type: ConsequenceType }
  | { status: 'unknown_type' }
  | { status: 'already_applied'; guest: Guest };

// §4.6, §21.5: applies a consequence to the guest. Updates the
// consequences list, factory opinion, and ticket stub marks. Idempotent
// on (guest, room, type) per §14.3.
export function applyConsequence(input: ApplyConsequenceInput): ApplyConsequenceResult {
  const type = getConsequenceType(input.type_id);
  if (!type) return { status: 'unknown_type' };

  const alreadyApplied = input.guest.consequences.some(
    (c) => c.type === type.id && c.applied_in_room_id === input.applied_in_room_id,
  );
  if (alreadyApplied) return { status: 'already_applied', guest: input.guest };

  const applied: AppliedConsequence = {
    type: type.id,
    applied_at: input.now,
    applied_in_room_id: input.applied_in_room_id,
    visible_effects: type.visible_effects,
  };

  const mark: Mark = {
    type: type.ticket_stub_mark,
    at: input.now,
    source_consequence: type.id,
  };

  const guest: Guest = {
    ...input.guest,
    consequences: [...input.guest.consequences, applied],
    factory_opinion: clamp(input.guest.factory_opinion + type.affects_factory_opinion, -1, 1),
    ticket_stub: {
      ...input.guest.ticket_stub,
      marks: [...input.guest.ticket_stub.marks, mark],
      last_updated_at: input.now,
    },
  };

  return { status: 'applied', guest, consequence: applied, type };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
