import type { CollectionConfig } from 'payload';
import { canApprove, canAuthor, canRead } from '../access.ts';

// §12.3: the visual style guide. Versioned.
export const StyleGuide: CollectionConfig = {
  slug: 'style-guide',
  versions: { drafts: true },
  admin: { useAsTitle: 'version_label' },
  access: { read: canRead, create: canApprove, update: canAuthor, delete: canApprove },
  fields: [
    { name: 'version_label', type: 'text', required: true },
    { name: 'palette_per_mood', type: 'json', required: true },
    { name: 'reference_images', type: 'array', fields: [{ name: 'asset_url', type: 'text' }] },
    {
      name: 'forbidden_styles',
      type: 'array',
      fields: [{ name: 'description', type: 'text' }],
    },
    {
      name: 'approved_references',
      type: 'array',
      fields: [{ name: 'description', type: 'text' }],
    },
  ],
};
