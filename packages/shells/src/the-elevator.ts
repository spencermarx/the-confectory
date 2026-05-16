import { defineShell } from './define-shell.ts';

// §5.5: the Elevator is a special "budget room" — its long traversal time
// is exactly the window during which the engine pre-generates the
// destination. Topology is gate (one in, one out, conditional).
export default defineShell({
  id: 'the-elevator',
  name: 'The Elevator',
  name_locked: true,
  topology: 'gate',
  mood_compatibility: {
    whimsy: 0.6,
    menace: 0.2,
    indulgence: 0.3,
    founder_presence: 0.2,
    consequence_severity: 0.1,
    pace: 0.5,
    oompa_loompa_mischief: 0.4,
    season: 'unseasoned',
  },
  // §5.5: default 30s for unknown destination, scales with complexity (up
  // to 60s for a Founder-set-piece cul-de-sac). The traversal floor is the
  // minimum the engine needs to mask generation.
  traversal_time_floor_seconds: 30,
  target_dwell_seconds: 30,
  dwell_density: 0.9,
  mesh_asset: 'shells/the-elevator/mesh.glb',
  ambient_audio_asset: 'shells/the-elevator/ambient.opus',
  shader_profile: 'watercolor-cool',
  sign: {
    style: 'brass-plaque',
    typography: 'serif-display',
    position_offset: { x: 0, y: 2.1, z: 0 },
  },
  announcement: {
    mode: 'mechanical',
    timing: 'on_entry',
  },
  doors: [
    {
      id: 'in',
      destination_constraints: {},
      feel: 'eager',
      visual_style_inherits_destination: false,
    },
    {
      id: 'out',
      // §8.4: the out button respawns to the foyer.
      destination_constraints: { forbidden_shell_ids: [] },
      feel: 'silent',
      visual_style_inherits_destination: false,
    },
  ],
  prop_slots: [],
  generation_hints: {
    surface_generation_targets: ['button-labels'],
    pre_baked_overrides: {},
  },
  consequence_catalog: [],
  portal_door_variant: 'shells/the-elevator/portal-door.glb',
  founder_set_pieces: [],
  authored_fallback: 'fallbacks/the-elevator-default',
  approved_by_founder: true,
});
