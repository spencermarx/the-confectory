import { defineShell } from './define-shell.ts';

export default defineShell({
  id: 'the-hush-before',
  name: 'The Hush Before',
  name_locked: true,
  topology: 'branching',
  mood_compatibility: {
    whimsy: 0.6,
    menace: 0.3,
    indulgence: 0.5,
    founder_presence: 0.4,
    consequence_severity: 0.2,
    pace: 0.2,
    oompa_loompa_mischief: 0.1,
    season: 'autumn',
  },
  traversal_time_floor_seconds: 18,
  target_dwell_seconds: 35,
  dwell_density: 0.6,
  mesh_asset: 'shells/the-hush-before/mesh.glb',
  ambient_audio_asset: 'shells/the-hush-before/ambient.opus',
  shader_profile: 'watercolor-cool',
  sign: {
    style: 'painted-board',
    typography: 'serif-handwritten-warm',
    position_offset: { x: -0.8, y: 1.8, z: 0 },
  },
  announcement: {
    mode: 'whispered',
    voice_id: 'narrator-low-female',
    timing: 'on_first_step',
  },
  doors: [
    {
      id: 'north',
      destination_constraints: {
        allowed_topologies: ['branching', 'cul-de-sac'],
        required_mood_compatibility: { whimsy: 0.4 },
      },
      feel: 'reluctant',
      visual_style_inherits_destination: false,
    },
    {
      id: 'east',
      destination_constraints: {
        allowed_topologies: ['branching'],
      },
      feel: 'light',
      visual_style_inherits_destination: true,
    },
    {
      id: 'beneath',
      destination_constraints: {
        allowed_topologies: ['cul-de-sac'],
        required_mood_compatibility: { menace: 0.5 },
      },
      feel: 'heavy',
      visual_style_inherits_destination: false,
    },
  ],
  prop_slots: [
    {
      id: 'gum-tray',
      position: { x: 1.2, y: 0.9, z: 0.4 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      allowed_prop_tags: ['gum-tray', 'temptation'],
      interactable: true,
      consequence_on_interact: 'BLUE_FROM_GUM',
    },
  ],
  generation_hints: {
    surface_generation_targets: ['wallpaper', 'curtain', 'rug', 'small-paintings'],
    pre_baked_overrides: {
      'main-window': 'shells/the-hush-before/main-window.ktx2',
    },
  },
  consequence_catalog: ['SMALL_KINDNESS_OBSERVED', 'BLUE_FROM_GUM'],
  portal_door_variant: 'shells/the-hush-before/portal-door.glb',
  founder_set_pieces: [],
  authored_fallback: 'fallbacks/the-hush-before-default',
  approved_by_founder: true,
});
