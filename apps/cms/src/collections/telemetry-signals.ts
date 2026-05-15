import type { CollectionConfig } from 'payload';
import { canApprove, canRead } from '../access.ts';

// §16.1: definitions of what we measure. Read-mostly. Editing requires Founder/Architect.
export const TelemetrySignals: CollectionConfig = {
  slug: 'telemetry-signals',
  admin: { useAsTitle: 'name' },
  access: { read: canRead, create: canApprove, update: canApprove, delete: canApprove },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'collected_via',
      type: 'select',
      required: true,
      options: [
        { label: 'Client event', value: 'client' },
        { label: 'Server event', value: 'server' },
        { label: 'Derived (Analytics Engine query)', value: 'derived' },
      ],
    },
    { name: 'opt_in_only', type: 'checkbox', defaultValue: false },
  ],
};
