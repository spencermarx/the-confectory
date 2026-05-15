import type { CollectionConfig } from 'payload';
import { canApprove, canAuthor, canRead } from '../access.ts';

// §10.5: versioned prompt templates. Updating creates a new version, never edits.
export const PromptTemplates: CollectionConfig = {
  slug: 'prompt-templates',
  versions: { drafts: false },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'version', 'updatedAt'] },
  access: { read: canRead, create: canAuthor, update: canApprove, delete: canApprove },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'version', type: 'number', required: true, min: 1 },
    {
      name: 'use_case',
      type: 'select',
      required: true,
      options: [
        { label: 'Sign generation', value: 'sign_generation' },
        { label: 'Room assembly', value: 'room_assembly' },
        { label: 'Oompa-Loompa dialogue', value: 'ol_dialogue' },
        { label: 'Founder dialogue', value: 'founder_dialogue' },
        { label: 'Session summarization', value: 'summarization' },
        { label: 'Style Critic (fast)', value: 'critic_fast' },
        { label: 'Style Critic (slow)', value: 'critic_slow' },
        { label: 'Image generation', value: 'image_generation' },
      ],
    },
    { name: 'template', type: 'textarea', required: true },
    { name: 'negative_examples', type: 'array', fields: [{ name: 'text', type: 'textarea' }] },
  ],
};
