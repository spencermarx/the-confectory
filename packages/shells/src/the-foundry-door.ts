import { defineShell } from './define-shell.ts';

// The Founder set-piece shell (§21.4). Phase 1's third room. A gate
// shell with the Founder's arrival behind it.
export default defineShell({
  id: 'the-foundry-door',
  name: 'The Foundry Door',
  name_locked: true,
  topology: 'gate',
  mood_compatibility: {
    whimsy: 0.7,
    menace: 0.4,
    indulgence: 0.6,
    founder_presence: 0.95,
    consequence_severity: 0.3,
    pace: 0.3,
    oompa_loompa_mischief: 0.2,
    season: 'unseasoned',
  },
  traversal_time_floor_seconds: 30,
  target_dwell_seconds: 80,
  dwell_density: 0.5,
  mesh_asset: 'shells/the-foundry-door/mesh.glb',
  ambient_audio_asset: 'shells/the-foundry-door/ambient.opus',
  shader_profile: 'watercolor-warm',
  sign: {
    style: 'painted-board',
    typography: 'serif-display',
    position_offset: { x: 0, y: 2.2, z: 0 },
  },
  announcement: {
    mode: 'spoken',
    voice_id: 'narrator-low-male',
    timing: 'on_first_step',
  },
  doors: [
    {
      id: 'back',
      destination_constraints: {},
      feel: 'light',
      visual_style_inherits_destination: false,
    },
    {
      id: 'beyond',
      destination_constraints: { require_consequence: 'FOUNDER_INVITED' },
      feel: 'heavy',
      visual_style_inherits_destination: true,
    },
  ],
  prop_slots: [],
  generation_hints: {
    surface_generation_targets: ['hero-mural'],
    pre_baked_overrides: { 'main-door': 'shells/the-foundry-door/main-door.ktx2' },
  },
  consequence_catalog: ['FOUNDER_INVITED'],
  portal_door_variant: 'shells/the-foundry-door/portal-door.glb',
  founder_set_pieces: ['founder-arrival'],
  authored_fallback: 'fallbacks/the-foundry-door-default',
  approved_by_founder: true,
});
