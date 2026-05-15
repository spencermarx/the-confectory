import type { CollectionConfig } from 'payload';
import { canAuthor, canRead } from '../access.ts';

export const HolidayEvents: CollectionConfig = {
  slug: 'holiday-events',
  admin: { useAsTitle: 'name' },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canAuthor },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'mood_overrides', type: 'json' },
    { name: 'starts_at', type: 'date', required: true },
    { name: 'ends_at', type: 'date', required: true },
  ],
};
