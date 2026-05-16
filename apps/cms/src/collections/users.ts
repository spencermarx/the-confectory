import type { CollectionConfig } from 'payload';
import { betterAuthStrategy } from '../auth/payload-strategy.ts';

// §3.5, §17.2: Recipe Keepers auth via Better-Auth (passkeys). The
// custom strategy reads the Better-Auth session cookie and constructs
// a Payload user envelope. Payload's built-in email/password is
// disabled so the only path in is the passkey flow.
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: true,
    strategies: [betterAuthStrategy],
  },
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
