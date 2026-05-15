import type { CollectionConfig } from 'payload';
import { canApprove, canApproveField, canAuthor, canRead } from '../access.ts';

// §4.1: the Shell collection. Authoritative authored definitions.
// The TypeScript schema in packages/shared is the type system of record;
// this collection stores instances of it.
export const Shells: CollectionConfig = {
  slug: 'shells',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'topology', 'approved_by_founder', 'updatedAt'],
  },
  access: {
    read: canRead,
    create: canAuthor,
    update: canAuthor,
    delete: canApprove,
  },
  fields: [
    { name: 'id_slug', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'name_locked',
      type: 'checkbox',
      defaultValue: false,
      access: { update: canApproveField },
    },
    {
      name: 'topology',
      type: 'select',
      required: true,
      options: [
        { label: 'Branching', value: 'branching' },
        { label: 'Cul-de-sac', value: 'cul-de-sac' },
        { label: 'Gate', value: 'gate' },
      ],
    },
    { name: 'traversal_time_floor_seconds', type: 'number', required: true, min: 1 },
    { name: 'target_dwell_seconds', type: 'number', required: true, min: 1 },
    { name: 'dwell_density', type: 'number', required: true, min: 0, max: 1 },
    { name: 'shader_profile', type: 'text', required: true },
    { name: 'mesh_asset', type: 'text', required: true },
    { name: 'ambient_audio_asset', type: 'text' },
    {
      name: 'mood_compatibility',
      type: 'json',
      required: true,
      admin: { description: 'MoodVector — see packages/shared/types/mood.ts.' },
    },
    {
      name: 'announcement',
      type: 'json',
      admin: { description: '{ mode, voice_id?, timing }. See §9.2.' },
    },
    { name: 'doors', type: 'json', admin: { description: 'DoorSlot[].' } },
    { name: 'prop_slots', type: 'json', admin: { description: 'PropSlot[].' } },
    { name: 'generation_hints', type: 'json' },
    {
      name: 'consequence_catalog',
      type: 'relationship',
      relationTo: 'consequence-types',
      hasMany: true,
    },
    { name: 'founder_set_pieces', type: 'array', fields: [{ name: 'set_piece_id', type: 'text' }] },
    {
      name: 'authored_fallback',
      type: 'relationship',
      relationTo: 'authored-fallbacks',
      required: true,
    },
    { name: 'portal_door_variant', type: 'text' },
    {
      name: 'approved_by_founder',
      type: 'checkbox',
      defaultValue: false,
      access: { update: canApproveField },
    },
  ],
};
