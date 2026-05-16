import { defineOompaLoompa } from '../define.ts';

// §21.4: one Oompa-Loompa, fully implemented. The Sweetwright is the OL
// the architect's spec already names in §19.1 ("a Sweetwright says he's
// been called away"). Role: chocolatier-foreman, the OL the foyer
// trusts to greet a guest and to apologize when the Founder is absent.
export default defineOompaLoompa({
  id: 'ol-sweetwright',
  name: 'The Sweetwright',
  personality_vector: {
    warmth: 0.8,
    mischief: 0.2,
    patience: 0.9,
    pride: 0.7,
    curiosity: 0.5,
    precision: 0.85,
    sentimentality: 0.65,
    sass: 0.3,
    reverence: 0.9,
    grudge_holding: 0.15,
    extroversion: 0.55,
    pessimism: 0.2,
    invention: 0.6,
    gluttony: 0.35,
    wonder: 0.7,
    cynicism: 0.1,
  },
  role: 'chocolatier',
  vendetta_list: [],
  default_room_id: 'the-foyer',
  voice_id: 'elevenlabs/voice_sweetwright_v1',
  song_meter_preferences: ['dactylic-tetrameter', 'iambic-pentameter'],
  is_universally_disliked: false,
  retired: false,
});
