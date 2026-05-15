import { defineShell } from './define-shell.ts';

// §8.1: the foyer is hand-authored. No generation in it.
// We still represent it as a Shell so the registry has a canonical entry
// and the Portal Door can resolve "current room = foyer".
export default defineShell({
  id: 'the-foyer',
  name: 'The Foyer',
  name_locked: true,
  topology: 'gate',
  mood_compatibility: {
    whimsy: 0.5,
    menace: 0.1,
    indulgence: 0.4,
    founder_presence: 0.3,
    consequence_severity: 0.0,
    pace: 0.1,
    oompa_loompa_mischief: 0.2,
    season: 'unseasoned',
  },
  traversal_time_floor_seconds: 20,
  target_dwell_seconds: 90,
  dwell_density: 0.7,
  mesh_asset: 'shells/the-foyer/mesh.glb',
  ambient_audio_asset: 'shells/the-foyer/ambient.opus',
  shader_profile: 'watercolor-warm',
  sign: {
    style: 'brass-plaque',
    typography: 'serif-display',
    position_offset: { x: 0, y: 2.4, z: 0 },
  },
  announcement: {
    mode: 'silent',
    timing: 'on_entry',
  },
  doors: [
    {
      id: 'portal',
      destination_constraints: {},
      feel: 'eager',
      visual_style_inherits_destination: true,
    },
    {
      id: 'entry',
      destination_constraints: {},
      feel: 'light',
      visual_style_inherits_destination: false,
    },
  ],
  prop_slots: [],
  generation_hints: {
    surface_generation_targets: [],
    pre_baked_overrides: {},
  },
  consequence_catalog: [],
  portal_door_variant: 'shells/the-foyer/portal-door.glb',
  founder_set_pieces: ['founder-arrival'],
  authored_fallback: 'fallbacks/the-foyer-default',
  approved_by_founder: true,
});
