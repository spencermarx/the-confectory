import { defineFounder } from './define.ts';
import { founderArrival, founderFoundryDoor } from './set-pieces.ts';

// §4.5: there is one Founder. He is a singleton.
// §11.1: voice_id is the Professional Voice Clone on ElevenLabs.
export const founder = defineFounder({
  base_mood: {
    whimsy: 0.55,
    menace: 0.4,
    indulgence: 0.6,
    founder_presence: 1.0,
    consequence_severity: 0.35,
    pace: 0.3,
    oompa_loompa_mischief: 0.2,
    season: 'unseasoned',
  },
  voice_id: 'elevenlabs/voice_founder_v1',
  schedule: [
    {
      id: 'foyer-arrival-on-first-visit',
      shell_filter: ['the-foyer'],
      min_session_visits: 1,
      probability: 0.15,
    },
    {
      id: 'foyer-arrival-after-respawn',
      shell_filter: ['the-foyer'],
      min_session_visits: 2,
      probability: 0.35,
    },
    {
      id: 'foundry-door-set-piece',
      shell_filter: ['the-foundry-door'],
      mood_filter: { founder_presence: 0.7 },
      probability: 0.6,
    },
  ],
  set_pieces: [
    {
      id: founderArrival.id,
      name: founderArrival.name,
      shell_id: founderArrival.shell_id,
      audio_assets: founderArrival.beats.map((b) => b.audio_asset),
    },
    {
      id: founderFoundryDoor.id,
      name: founderFoundryDoor.name,
      shell_id: founderFoundryDoor.shell_id,
      audio_assets: founderFoundryDoor.beats.map((b) => b.audio_asset),
    },
  ],
  improvisation_budget_per_session: 3,
});
