import { defineShell } from './define-shell.ts';

// A cul-de-sac (§5.4) for Phase 1. The engine spends generously here:
// wider Critic budget, Founder more likely, custom songs more likely.
export default defineShell({
  id: 'the-treacle-deep',
  name: 'The Treacle Deep',
  name_locked: true,
  topology: 'cul-de-sac',
  mood_compatibility: {
    whimsy: 0.4,
    menace: 0.5,
    indulgence: 0.8,
    founder_presence: 0.6,
    consequence_severity: 0.4,
    pace: 0.1,
    oompa_loompa_mischief: 0.3,
    season: 'autumn',
  },
  traversal_time_floor_seconds: 24,
  target_dwell_seconds: 60,
  dwell_density: 0.8,
  mesh_asset: 'shells/the-treacle-deep/mesh.glb',
  ambient_audio_asset: 'shells/the-treacle-deep/ambient.opus',
  shader_profile: 'watercolor-amber',
  sign: {
    style: 'brass-plaque',
    typography: 'serif-display',
    position_offset: { x: -0.6, y: 1.9, z: 0 },
  },
  announcement: {
    mode: 'gramophonic',
    voice_id: 'narrator-old-recording',
    timing: 'after_threshold',
  },
  doors: [
    {
      id: 'back',
      destination_constraints: {},
      feel: 'reluctant',
      visual_style_inherits_destination: false,
    },
  ],
  prop_slots: [],
  generation_hints: {
    surface_generation_targets: ['wallpaper', 'pourable-treacle-surface', 'small-paintings'],
    pre_baked_overrides: {},
  },
  consequence_catalog: ['BLUE_FROM_GUM', 'TREACLE_STAINED'],
  portal_door_variant: 'shells/the-treacle-deep/portal-door.glb',
  founder_set_pieces: [],
  authored_fallback: 'fallbacks/the-treacle-deep-default',
  approved_by_founder: true,
});
