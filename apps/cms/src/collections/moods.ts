import type { CollectionConfig } from 'payload';
import { canAuthor, canRead } from '../access.ts';

// §15.3: saved Mood configurations for the Mood Console.
export const Moods: CollectionConfig = {
  slug: 'moods',
  admin: { useAsTitle: 'name' },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canAuthor },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'vector', type: 'json', required: true },
    { name: 'notes', type: 'textarea' },
  ],
};
