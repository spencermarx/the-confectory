import { theSweetwright } from '@confectory/characters';
import type { MoodVector } from '@confectory/shared';
import { describe, expect, it } from 'vitest';
import {
  type DialogueContext,
  generateOompaLoompaLine,
  renderOompaLoompaPrompt,
} from './dialogue.ts';
import { AcceptingCritic, InProcessFoundry, RejectingCritic } from './providers/in-process.ts';

const mood: MoodVector = {
  whimsy: 0.6,
  menace: 0.2,
  indulgence: 0.5,
  founder_presence: 0.3,
  consequence_severity: 0.2,
  pace: 0.4,
  oompa_loompa_mischief: 0.4,
  season: 'unseasoned',
};

function makeContext(over: Partial<DialogueContext> = {}): DialogueContext {
  return {
    character: theSweetwright,
    shell_id: 'the-hush-before',
    shell_name: 'The Hush Before',
    mood,
    canonical_room_names: ['The Hush Before', 'The Treacle Deep', 'The Foundry Door'],
    consequences: [],
    factory_opinion: 0,
    visit_count: 1,
    episodic_memories: [],
    ...over,
  };
}

describe('renderOompaLoompaPrompt', () => {
  it('injects canonical room names so the model cannot invent rooms', () => {
    const out = renderOompaLoompaPrompt(makeContext());
    expect(out.system).toContain('The Hush Before');
    expect(out.system).toContain('The Treacle Deep');
    expect(out.system).toContain('The Foundry Door');
  });

  it('surfaces guest consequences when present', () => {
    const out = renderOompaLoompaPrompt(makeContext({ consequences: ['BLUE_FROM_GUM'] }));
    expect(out.user).toContain('BLUE_FROM_GUM');
  });

  it('includes episodic memories when retrieved', () => {
    const out = renderOompaLoompaPrompt(
      makeContext({ episodic_memories: ['You stayed long in the cul-de-sac.'] }),
    );
    expect(out.user).toContain('You stayed long in the cul-de-sac.');
  });

  it('keeps the system header reminding the model never to name the Founder', () => {
    const out = renderOompaLoompaPrompt(makeContext());
    expect(out.system).toMatch(/never name the founder/i);
  });
});

describe('generateOompaLoompaLine', () => {
  it('returns the foundry line when the Critic accepts', async () => {
    const result = await generateOompaLoompaLine(
      new InProcessFoundry(),
      new AcceptingCritic(),
      makeContext(),
    );
    expect(result.served_from_fallback).toBe(false);
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('falls back to the authored line when the Critic exhausts its retries', async () => {
    const result = await generateOompaLoompaLine(
      new InProcessFoundry(),
      new RejectingCritic(99),
      makeContext(),
      { retry_budget: 1, fallback_line: 'The Sweetwright nods, says nothing.' },
    );
    expect(result.served_from_fallback).toBe(true);
    expect(result.text).toBe('The Sweetwright nods, says nothing.');
    expect(result.rejected?.reason).toBe('OFF_VOICE');
  });
});
