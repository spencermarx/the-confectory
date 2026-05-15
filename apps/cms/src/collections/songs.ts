import type { CollectionConfig } from 'payload';
import { canAuthor, canRead } from '../access.ts';

export const Songs: CollectionConfig = {
  slug: 'songs',
  admin: { useAsTitle: 'title' },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canAuthor },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'meter', type: 'text' },
    { name: 'template', type: 'textarea' },
    {
      name: 'eligible_consequences',
      type: 'relationship',
      relationTo: 'consequence-types',
      hasMany: true,
    },
    { name: 'audio_asset', type: 'text' },
  ],
};
