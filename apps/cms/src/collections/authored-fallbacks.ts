import type { CollectionConfig } from 'payload';
import { canAuthor, canRead } from '../access.ts';

// §6.4: every Shell has an authored fallback set. Hand-crafted, per-Shell.
export const AuthoredFallbacks: CollectionConfig = {
  slug: 'authored-fallbacks',
  admin: { useAsTitle: 'name' },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canAuthor },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'dialogue_lines', type: 'array', fields: [{ name: 'text', type: 'textarea' }] },
    { name: 'sign_text_alternatives', type: 'array', fields: [{ name: 'text', type: 'text' }] },
    {
      name: 'prop_arrangements',
      type: 'json',
      admin: { description: 'Pre-selected prop placements for fallback mode.' },
    },
  ],
};
