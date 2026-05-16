import type { Guest } from '@confectory/shared';
import { describe, expect, it } from 'vitest';
import { applyConsequence } from './consequence-engine.ts';

function newGuest(): Guest {
  return {
    id: 'g',
    session_started_at: 0,
    last_active_at: 0,
    is_anonymous: true,
    current_location: 'in_room',
    ticket_stub: {
      visual_state: 'ticket-stubs/blank.png',
      marks: [],
      last_updated_at: 0,
    },
    consequences: [],
    visited_shell_ids: ['the-hush-before'],
    factory_opinion: 0,
    oompa_loompa_relationships: {},
    founder_encounters: [],
    respawn_count: 0,
  };
}

describe('applyConsequence', () => {
  it('applies BLUE_FROM_GUM, marks the ticket stub, nudges factory opinion negative', () => {
    const result = applyConsequence({
      guest: newGuest(),
      type_id: 'BLUE_FROM_GUM',
      applied_in_room_id: 'room-1',
      now: 1000,
    });
    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.guest.consequences).toHaveLength(1);
    expect(result.guest.consequences[0]?.type).toBe('BLUE_FROM_GUM');
    expect(result.guest.ticket_stub.marks[0]?.type).toBe('blue-thumbprint');
    expect(result.guest.factory_opinion).toBeCloseTo(-0.05, 5);
    expect(result.guest.ticket_stub.last_updated_at).toBe(1000);
  });

  it('is idempotent on (guest, room, type) per §14.3', () => {
    const first = applyConsequence({
      guest: newGuest(),
      type_id: 'BLUE_FROM_GUM',
      applied_in_room_id: 'room-1',
      now: 1000,
    });
    if (first.status !== 'applied') throw new Error('precondition');
    const second = applyConsequence({
      guest: first.guest,
      type_id: 'BLUE_FROM_GUM',
      applied_in_room_id: 'room-1',
      now: 2000,
    });
    expect(second.status).toBe('already_applied');
    if (second.status !== 'already_applied') return;
    expect(second.guest.consequences).toHaveLength(1);
  });

  it('allows the same consequence type in a different room visit', () => {
    const first = applyConsequence({
      guest: newGuest(),
      type_id: 'BLUE_FROM_GUM',
      applied_in_room_id: 'room-1',
      now: 1000,
    });
    if (first.status !== 'applied') throw new Error('precondition');
    const second = applyConsequence({
      guest: first.guest,
      type_id: 'BLUE_FROM_GUM',
      applied_in_room_id: 'room-2',
      now: 2000,
    });
    expect(second.status).toBe('applied');
  });

  it('rejects unknown consequence types', () => {
    const out = applyConsequence({
      guest: newGuest(),
      type_id: 'NOT_A_REAL_TYPE',
      applied_in_room_id: 'room-1',
      now: 1000,
    });
    expect(out.status).toBe('unknown_type');
  });

  it('clamps factory opinion to [-1, 1]', () => {
    let guest = newGuest();
    guest = { ...guest, factory_opinion: 0.98 };
    const out = applyConsequence({
      guest,
      type_id: 'FOUNDER_INVITED',
      applied_in_room_id: 'room-x',
      now: 0,
    });
    if (out.status !== 'applied') throw new Error('expected applied');
    expect(out.guest.factory_opinion).toBeLessThanOrEqual(1);
    expect(out.guest.factory_opinion).toBeGreaterThan(0.98);
  });
});
