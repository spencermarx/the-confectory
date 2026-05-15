import type { CollectionConfig } from 'payload';
import { canApprove, canAuthor, canRead } from '../access.ts';

// §4.6: catalog is hand-authored and frozen at release.
export const ConsequenceTypes: CollectionConfig = {
  slug: 'consequence-types',
  admin: { useAsTitle: 'name' },
  access: { read: canRead, create: canApprove, update: canAuthor, delete: canApprove },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'trigger_predicate', type: 'json', required: true },
    { name: 'visible_effects', type: 'json' },
    { name: 'oompa_loompa_song_eligible', type: 'checkbox', defaultValue: false },
    { name: 'founder_acknowledges', type: 'checkbox', defaultValue: false },
    { name: 'affects_factory_opinion', type: 'number', defaultValue: 0, min: -1, max: 1 },
    { name: 'fades', type: 'checkbox', defaultValue: false },
    { name: 'ticket_stub_mark', type: 'text' },
  ],
};
