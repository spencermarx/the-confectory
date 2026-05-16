import type { MoodVector, Shell } from '@confectory/shared';
import { describe, expect, it } from 'vitest';
import { AcceptingCritic, InProcessFoundry, RejectingCritic } from './providers/in-process.ts';
import { RoomAssembler } from './room-assembler.ts';

function makeShell(overrides: Partial<Shell> & Pick<Shell, 'id' | 'topology'>): Shell {
  return {
    name: overrides.id,
    name_locked: false,
    mood_compatibility: {
      whimsy: 0.5,
      menace: 0.2,
      indulgence: 0.5,
      founder_presence: 0.3,
      consequence_severity: 0.2,
      pace: 0.4,
      oompa_loompa_mischief: 0.3,
      season: 'unseasoned',
    },
    traversal_time_floor_seconds: 15,
    target_dwell_seconds: 30,
    dwell_density: 0.5,
    mesh_asset: 'm.glb',
    ambient_audio_asset: 'a.opus',
    shader_profile: 'watercolor',
    sign: {
      style: 'painted-board',
      typography: 'serif',
      position_offset: { x: 0, y: 0, z: 0 },
    },
    announcement: { mode: 'silent', timing: 'on_entry' },
    doors: [],
    prop_slots: [],
    generation_hints: {
      surface_generation_targets: ['wallpaper'],
      pre_baked_overrides: {},
    },
    consequence_catalog: [],
    portal_door_variant: 'p.glb',
    founder_set_pieces: [],
    authored_fallback: 'fallbacks/the-hush-before-default',
    approved_by_founder: true,
    ...overrides,
  };
}

const factoryMood: MoodVector = {
  whimsy: 0.6,
  menace: 0.2,
  indulgence: 0.5,
  founder_presence: 0.3,
  consequence_severity: 0.2,
  pace: 0.4,
  oompa_loompa_mischief: 0.4,
  season: 'unseasoned',
};

describe('RoomAssembler', () => {
  it('assembles a room from the in-process foundry through an accepting Critic', async () => {
    const shell = makeShell({ id: 'the-hush-before', topology: 'branching' });
    const assembler = new RoomAssembler(new InProcessFoundry(), new AcceptingCritic());
    const result = await assembler.assemble({
      shell,
      guest_id: 'g1',
      candidate_shells: [shell],
      factory_mood: factoryMood,
      guest_consequence_severity: 0,
      guest_consequences: new Set(),
      available_ol_ids: ['ol-1'],
    });
    expect(result.sign_text).toBe(shell.name);
    expect(result.generated_surfaces.wallpaper).toMatch(/^generated\/the-hush-before\/wallpaper/);
    expect(result.served_from_fallback).toBe(false);
    expect(result.rejected_artifacts).toHaveLength(0);
  });

  it('retries once on rejection for a branching shell and accepts the retry', async () => {
    const shell = makeShell({ id: 'the-hush-before', topology: 'branching' });
    const assembler = new RoomAssembler(new InProcessFoundry(), new RejectingCritic(1));
    const result = await assembler.assemble({
      shell,
      guest_id: 'g1',
      candidate_shells: [shell],
      factory_mood: factoryMood,
      guest_consequence_severity: 0,
      guest_consequences: new Set(),
      available_ol_ids: [],
    });
    expect(result.served_from_fallback).toBe(false);
  });

  it('falls back to authored content when the retry budget is exhausted', async () => {
    const shell = makeShell({ id: 'the-hush-before', topology: 'branching' });
    const assembler = new RoomAssembler(new InProcessFoundry(), new RejectingCritic(99));
    const result = await assembler.assemble({
      shell,
      guest_id: 'g1',
      candidate_shells: [shell],
      factory_mood: factoryMood,
      guest_consequence_severity: 0,
      guest_consequences: new Set(),
      available_ol_ids: [],
    });
    expect(result.served_from_fallback).toBe(true);
    expect(result.rejected_artifacts.length).toBeGreaterThan(0);
    // sign falls back to the authored alternative
    expect(result.sign_text).toBe('The Hush Before');
  });

  it('widens the retry budget for cul-de-sacs per §5.4', async () => {
    const shell = makeShell({ id: 'the-treacle-deep', topology: 'cul-de-sac' });
    // 3 rejections would exhaust the branching budget but not the cul-de-sac one.
    const assembler = new RoomAssembler(new InProcessFoundry(), new RejectingCritic(3));
    const result = await assembler.assemble({
      shell,
      guest_id: 'g1',
      candidate_shells: [shell],
      factory_mood: factoryMood,
      guest_consequence_severity: 0,
      guest_consequences: new Set(),
      available_ol_ids: [],
    });
    expect(result.served_from_fallback).toBe(false);
  });
});
