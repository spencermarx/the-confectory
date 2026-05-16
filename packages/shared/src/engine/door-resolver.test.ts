import { describe, expect, it } from 'vitest';
import type { DoorSlot, Shell } from '../types/shell.ts';
import { resolveDoorDestination } from './door-resolver.ts';

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
    generation_hints: { surface_generation_targets: [], pre_baked_overrides: {} },
    consequence_catalog: [],
    portal_door_variant: 'p.glb',
    founder_set_pieces: [],
    authored_fallback: 'fb',
    approved_by_founder: true,
    ...overrides,
  };
}

const source = makeShell({ id: 'source', topology: 'branching' });

const door: DoorSlot = {
  id: 'd',
  destination_constraints: { allowed_topologies: ['branching', 'cul-de-sac'] },
  feel: 'light',
  visual_style_inherits_destination: false,
};

describe('resolveDoorDestination', () => {
  it('returns the first allowed candidate when no preference order is given', () => {
    const candidates = [
      makeShell({ id: 'gate-only', topology: 'gate' }),
      makeShell({ id: 'branchy', topology: 'branching' }),
    ];
    const out = resolveDoorDestination({
      source_shell: source,
      door,
      candidate_shells: candidates,
      guest_consequences: new Set(),
    });
    expect(out?.id).toBe('branchy');
  });

  it('honors preference_order over default ordering', () => {
    const candidates = [
      makeShell({ id: 'a', topology: 'branching' }),
      makeShell({ id: 'b', topology: 'branching' }),
    ];
    const out = resolveDoorDestination({
      source_shell: source,
      door,
      candidate_shells: candidates,
      guest_consequences: new Set(),
      preference_order: ['b'],
    });
    expect(out?.id).toBe('b');
  });

  it('excludes the source shell so the door does not loop back', () => {
    const candidates = [makeShell({ id: source.id, topology: 'branching' })];
    const out = resolveDoorDestination({
      source_shell: source,
      door,
      candidate_shells: candidates,
      guest_consequences: new Set(),
    });
    expect(out).toBeUndefined();
  });

  it('rejects shells that fail the required_mood_compatibility floor', () => {
    const candidates = [
      makeShell({
        id: 'menacing',
        topology: 'branching',
        mood_compatibility: {
          whimsy: 0.1,
          menace: 0.9,
          indulgence: 0.2,
          founder_presence: 0.1,
          consequence_severity: 0.4,
          pace: 0.3,
          oompa_loompa_mischief: 0.2,
          season: 'autumn',
        },
      }),
    ];
    const out = resolveDoorDestination({
      source_shell: source,
      door: {
        ...door,
        destination_constraints: {
          ...door.destination_constraints,
          required_mood_compatibility: { whimsy: 0.5 },
        },
      },
      candidate_shells: candidates,
      guest_consequences: new Set(),
    });
    expect(out).toBeUndefined();
  });

  it('respects require_consequence on gate doors', () => {
    const gate: DoorSlot = {
      ...door,
      destination_constraints: { require_consequence: 'BLUE_FROM_GUM' },
    };
    const candidates = [makeShell({ id: 'beyond-the-gate', topology: 'gate' })];
    const without = resolveDoorDestination({
      source_shell: source,
      door: gate,
      candidate_shells: candidates,
      guest_consequences: new Set(),
    });
    const withConsequence = resolveDoorDestination({
      source_shell: source,
      door: gate,
      candidate_shells: candidates,
      guest_consequences: new Set(['BLUE_FROM_GUM']),
    });
    expect(without).toBeUndefined();
    expect(withConsequence?.id).toBe('beyond-the-gate');
  });
});
