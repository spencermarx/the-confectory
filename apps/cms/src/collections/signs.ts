import type { CollectionConfig } from 'payload';
import { canAuthor, canRead } from '../access.ts';

// §9.3, §9.5: sign + typography library.
export const Signs: CollectionConfig = {
  slug: 'signs',
  admin: { useAsTitle: 'name' },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canAuthor },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'style', type: 'text', required: true },
    { name: 'typography_id', type: 'text', required: true },
    { name: 'font_asset_url', type: 'text' },
  ],
};
