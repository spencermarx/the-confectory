import type { Guest, MoodVector } from '@confectory/shared';
import { describe, expect, it } from 'vitest';
import { InProcessMemory } from './providers/memory.ts';
import { type SessionEvent, shapeSessionSummary, summarizeSession } from './summarization.ts';

const guest: Guest = {
  id: 'g',
  session_started_at: 0,
  last_active_at: 0,
  is_anonymous: true,
  current_location: 'foyer',
  ticket_stub: {
    visual_state: 'ticket-stubs/blank.png',
    marks: [],
    last_updated_at: 0,
  },
  consequences: [],
  visited_shell_ids: [],
  factory_opinion: 0,
  oompa_loompa_relationships: {},
  founder_encounters: [],
  respawn_count: 0,
};

const mood: MoodVector = {
  whimsy: 0.5,
  menace: 0.2,
  indulgence: 0.5,
  founder_presence: 0.3,
  consequence_severity: 0.2,
  pace: 0.4,
  oompa_loompa_mischief: 0.3,
  season: 'unseasoned',
};

describe('shapeSessionSummary', () => {
  it('returns the quiet-visit summary when nothing is worth keeping', () => {
    const out = shapeSessionSummary({
      guest,
      factory_mood: mood,
      session_events: [
        {
          event_id: 'e1',
          shell_id: 'the-hush-before',
          description: 'Stood still.',
          emotional_weight: 0.05,
          occurred_at: 0,
        },
      ],
    });
    expect(out.prose_summary).toMatch(/quiet visit/i);
    expect(out.episodic_entries).toHaveLength(0);
  });

  it('keeps heavy events and any event with a consequence', () => {
    const events: SessionEvent[] = [
      {
        event_id: 'e1',
        shell_id: 'the-hush-before',
        description: 'Walked through quietly.',
        emotional_weight: 0.05,
        occurred_at: 0,
      },
      {
        event_id: 'e2',
        shell_id: 'the-hush-before',
        description: 'Took the gum.',
        emotional_weight: 0.1,
        occurred_at: 1,
        consequence_applied: {
          type: 'BLUE_FROM_GUM',
          applied_at: 1,
          applied_in_room_id: 'r1',
          visible_effects: [],
        },
      },
      {
        event_id: 'e3',
        shell_id: 'the-treacle-deep',
        description: 'Lingered at the pool.',
        emotional_weight: 0.6,
        occurred_at: 2,
      },
    ];
    const out = shapeSessionSummary({ guest, factory_mood: mood, session_events: events });
    expect(out.episodic_entries.map((e) => e.shell_id).sort()).toEqual([
      'the-hush-before',
      'the-treacle-deep',
    ]);
    expect(out.prose_summary).toMatch(/2 rooms/);
  });
});

describe('summarizeSession', () => {
  it('persists each episodic entry through the memory provider', async () => {
    const memory = new InProcessMemory();
    await summarizeSession(memory, {
      guest,
      factory_mood: mood,
      session_events: [
        {
          event_id: 'e1',
          shell_id: 'the-treacle-deep',
          description: 'Held the moment longer than expected.',
          emotional_weight: 0.7,
          occurred_at: 0,
        },
      ],
    });
    const recalled = await memory.retrieve({
      guest_id: guest.id,
      query: 'treacle held moment',
      top_k: 3,
    });
    expect(recalled).toHaveLength(1);
    expect(recalled[0]?.shell_id).toBe('the-treacle-deep');
  });
});
