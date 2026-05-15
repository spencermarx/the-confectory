import type { CollectionConfig } from 'payload';

// §3.5, §17.2: Recipe Keepers auth via Better-Auth (passkeys).
// Phase 1 of the CMS uses Payload's built-in auth as the temporary
// shim while Better-Auth integration lands. Replaced before launch.
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'recipe_keeper',
      options: [
        { label: 'Recipe Keeper', value: 'recipe_keeper' },
        { label: 'Founder', value: 'founder' },
        { label: 'Architect', value: 'architect' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    { name: 'display_name', type: 'text' },
  ],
};
