import type { Guest } from '@confectory/shared';
import { describe, expect, it } from 'vitest';
import { recordConsequence, recordMark, recordVisit, upsertGuest } from './guest-store.ts';

interface Captured {
  query: string;
  args: unknown[];
}

function mockD1(capture: Captured[]) {
  return {
    prepare(query: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async run() {
              capture.push({ query, args });
            },
          };
        },
      };
    },
  };
}

const guest: Guest = {
  id: 'g',
  session_started_at: 100,
  last_active_at: 200,
  is_anonymous: true,
  current_location: 'in_room',
  current_room_id: 'g:the-hush-before:200',
  ticket_stub: {
    visual_state: 'ticket-stubs/blank.png',
    marks: [],
    last_updated_at: 200,
  },
  consequences: [],
  visited_shell_ids: [],
  factory_opinion: 0,
  oompa_loompa_relationships: {},
  founder_encounters: [],
  respawn_count: 0,
};

describe('guest-store', () => {
  it('upserts the guest with the live state vector', async () => {
    const cap: Captured[] = [];
    await upsertGuest(mockD1(cap), guest, 300);
    expect(cap).toHaveLength(1);
    expect(cap[0]?.query).toMatch(/INSERT INTO guests/);
    expect(cap[0]?.args[0]).toBe('g');
    expect(cap[0]?.args[2]).toBe(1); // anonymous → 1
    expect(cap[0]?.args[5]).toBe('g:the-hush-before:200');
  });

  it('records a visit row', async () => {
    const cap: Captured[] = [];
    await recordVisit(mockD1(cap), 'g', 'the-hush-before', 'room-1', 500);
    expect(cap[0]?.query).toMatch(/INSERT INTO guest_visits/);
    expect(cap[0]?.args).toEqual(['g', 'the-hush-before', 'room-1', 500]);
  });

  it('records a consequence with the visible_effects JSON', async () => {
    const cap: Captured[] = [];
    await recordConsequence(mockD1(cap), 'g', {
      type: 'BLUE_FROM_GUM',
      applied_at: 500,
      applied_in_room_id: 'room-1',
      visible_effects: [{ kind: 'tint', value: '#3b6bd1' }],
    });
    expect(cap[0]?.query).toMatch(/INSERT INTO applied_consequences/);
    expect(cap[0]?.args[1]).toBe('BLUE_FROM_GUM');
    expect(JSON.parse(cap[0]?.args[5] as string)).toEqual([{ kind: 'tint', value: '#3b6bd1' }]);
  });

  it('records a ticket stub mark', async () => {
    const cap: Captured[] = [];
    await recordMark(mockD1(cap), 'g', { type: 'blue-thumbprint', at: 500 });
    expect(cap[0]?.query).toMatch(/INSERT INTO ticket_stub_marks/);
    expect(cap[0]?.args).toEqual(['g', 'blue-thumbprint', 500]);
  });
});
