import type { CollectionConfig } from 'payload';
import { canAuthor, canRead } from '../access.ts';

export const Props: CollectionConfig = {
  slug: 'props',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'tags', 'updatedAt'] },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canAuthor },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'mesh_asset', type: 'text', required: true },
    { name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text' }] },
    { name: 'interactable', type: 'checkbox', defaultValue: false },
    {
      name: 'consequence_on_interact',
      type: 'relationship',
      relationTo: 'consequence-types',
    },
  ],
};
