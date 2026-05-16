import type { ConsequenceType, ConsequenceTypeId } from '@confectory/shared';

// §4.6: the catalog is hand-authored and frozen at release. New types
// require a content release. The set below is the Phase 1 catalog;
// BLUE_FROM_GUM is the fully-implemented one (§21.5), the rest are
// declared so doors that gate on them can resolve.

const catalog = new Map<ConsequenceTypeId, ConsequenceType>();

function register(type: ConsequenceType): ConsequenceType {
  if (catalog.has(type.id)) throw new Error(`Duplicate consequence type: ${type.id}`);
  catalog.set(type.id, type);
  return type;
}

// §21.5: the gum / blueberry beat. Triggered by interacting with a
// gum prop in the appropriate shell. Persistent visible effect (blue
// tint). Eligible for the Sweetwright's lament (§4.6 → §11.2).
export const BLUE_FROM_GUM = register({
  id: 'BLUE_FROM_GUM',
  name: 'Blue From Gum',
  trigger_predicate: {
    kind: 'on_interact',
    prop_slot_id: 'gum-tray',
  },
  visible_effects: [
    { kind: 'tint', value: '#3b6bd1', intensity: 0.55 },
    { kind: 'audio_layer', value: 'consequence-blue-from-gum.opus' },
  ],
  oompa_loompa_song_eligible: true,
  founder_acknowledges: true,
  affects_factory_opinion: -0.05,
  fades: false,
  ticket_stub_mark: 'blue-thumbprint',
});

export const SMALL_KINDNESS_OBSERVED = register({
  id: 'SMALL_KINDNESS_OBSERVED',
  name: 'A Small Kindness Observed',
  trigger_predicate: { kind: 'on_event' },
  visible_effects: [],
  oompa_loompa_song_eligible: false,
  founder_acknowledges: true,
  affects_factory_opinion: 0.08,
  fades: false,
  ticket_stub_mark: 'small-star',
});

export const TREACLE_STAINED = register({
  id: 'TREACLE_STAINED',
  name: 'Treacle Stained',
  trigger_predicate: { kind: 'on_interact', prop_slot_id: 'treacle-pool' },
  visible_effects: [{ kind: 'tint', value: '#a0762a', intensity: 0.4 }],
  oompa_loompa_song_eligible: false,
  founder_acknowledges: false,
  affects_factory_opinion: -0.02,
  fades: false,
  ticket_stub_mark: 'amber-smudge',
});

export const FOUNDER_INVITED = register({
  id: 'FOUNDER_INVITED',
  name: 'The Founder Invited You',
  trigger_predicate: { kind: 'on_event' },
  visible_effects: [],
  oompa_loompa_song_eligible: false,
  founder_acknowledges: true,
  affects_factory_opinion: 0.15,
  fades: false,
  ticket_stub_mark: 'gold-seal',
});

export function getConsequenceType(id: ConsequenceTypeId): ConsequenceType | undefined {
  return catalog.get(id);
}

export function listConsequenceTypes(): ConsequenceType[] {
  return [...catalog.values()];
}
