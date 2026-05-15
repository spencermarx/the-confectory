import type { CollectionConfig } from 'payload';
import { canAuthor, canRead } from '../access.ts';

// §6.2: slow Critic output feeds this. Used to retrain the fast Critic monthly.
export const RejectionCorpus: CollectionConfig = {
  slug: 'rejection-corpus',
  admin: { defaultColumns: ['reason', 'shell', 'created_at'] },
  access: { read: canRead, create: canAuthor, update: canAuthor, delete: canAuthor },
  fields: [
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: [
        { label: 'Off voice', value: 'OFF_VOICE' },
        { label: 'Incoherent', value: 'INCOHERENT' },
        { label: 'Broken character', value: 'BROKEN_CHARACTER' },
        { label: 'Invented fact', value: 'INVENTED_FACT' },
        { label: 'Bad meter', value: 'BAD_METER' },
        { label: 'Tone mismatch', value: 'TONE_MISMATCH' },
      ],
    },
    { name: 'shell', type: 'relationship', relationTo: 'shells' },
    { name: 'character', type: 'relationship', relationTo: 'characters' },
    { name: 'artifact_text', type: 'textarea' },
    { name: 'artifact_asset_url', type: 'text' },
    { name: 'critic_notes', type: 'textarea' },
    { name: 'slow_critic_score', type: 'number', min: 0, max: 1 },
    { name: 'promoted_to_fallback', type: 'checkbox', defaultValue: false },
  ],
};
