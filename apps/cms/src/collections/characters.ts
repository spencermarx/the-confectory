import type { CollectionConfig } from 'payload';
import { canApprove, canAuthor, canRead } from '../access.ts';

// §4.4, §4.5: Oompa-Loompas + the Founder (singleton row).
export const Characters: CollectionConfig = {
  slug: 'characters',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'role', 'retired'],
  },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canApprove },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Oompa-Loompa', value: 'oompa_loompa' },
        { label: 'The Founder', value: 'founder' },
      ],
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Inventor', value: 'inventor' },
        { label: 'Chocolatier', value: 'chocolatier' },
        { label: 'Gardener', value: 'gardener' },
        { label: 'Usher', value: 'usher' },
        { label: 'Singer', value: 'singer' },
        { label: 'Machinist', value: 'machinist' },
        { label: 'Archivist', value: 'archivist' },
      ],
    },
    { name: 'voice_id', type: 'text', required: true },
    { name: 'personality_vector', type: 'json' },
    { name: 'vendetta_list', type: 'relationship', relationTo: 'characters', hasMany: true },
    { name: 'is_universally_disliked', type: 'checkbox', defaultValue: false },
    { name: 'retired', type: 'checkbox', defaultValue: false },
  ],
};
