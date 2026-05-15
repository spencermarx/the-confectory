import { describe, expect, it } from 'vitest';
import { shellSchema } from './shell.ts';

const baseShell = {
  id: 'test-shell',
  name: 'Test Shell',
  name_locked: false,
  topology: 'branching' as const,
  mood_compatibility: {
    whimsy: 0.5,
    menace: 0.1,
    indulgence: 0.5,
    founder_presence: 0.2,
    consequence_severity: 0.1,
    pace: 0.3,
    oompa_loompa_mischief: 0.2,
    season: 'spring' as const,
  },
  traversal_time_floor_seconds: 12,
  target_dwell_seconds: 25,
  dwell_density: 0.5,
  mesh_asset: 'm.glb',
  ambient_audio_asset: 'a.opus',
  shader_profile: 'watercolor',
  sign: {
    style: 'painted-board',
    typography: 'serif',
    position_offset: { x: 0, y: 1, z: 0 },
  },
  announcement: { mode: 'spoken' as const, timing: 'on_entry' as const },
  doors: [
    {
      id: 'a',
      destination_constraints: {},
      feel: 'light' as const,
      visual_style_inherits_destination: false,
    },
    {
      id: 'b',
      destination_constraints: {},
      feel: 'light' as const,
      visual_style_inherits_destination: false,
    },
  ],
  prop_slots: [],
  generation_hints: { surface_generation_targets: [], pre_baked_overrides: {} },
  consequence_catalog: [],
  portal_door_variant: 'p.glb',
  founder_set_pieces: [],
  authored_fallback: 'fb',
  approved_by_founder: false,
};

describe('shellSchema', () => {
  it('accepts a valid branching shell with 2 doors', () => {
    expect(shellSchema.safeParse(baseShell).success).toBe(true);
  });

  it('rejects a cul-de-sac with multiple doors', () => {
    const bad = { ...baseShell, topology: 'cul-de-sac' as const };
    const result = shellSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('rejects non-slug ids', () => {
    const bad = { ...baseShell, id: 'Bad Id With Spaces' };
    expect(shellSchema.safeParse(bad).success).toBe(false);
  });
});
