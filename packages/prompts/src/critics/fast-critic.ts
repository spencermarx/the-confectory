import { definePrompt } from '../template.ts';

export interface FastCriticInput {
  artifact: string;
  context: {
    shell_name: string;
    character_name?: string;
    canonical_room_names: string[];
  };
}

// §6.1: the fast inline Critic. Rejects with a fixed reason set.
export const fastCriticTemplate = definePrompt<FastCriticInput>({
  name: 'critic.fast',
  version: 1,
  render: ({ artifact, context }) => ({
    system: `You enforce The Confectory's voice. Review the artifact below.
Reject with EXACTLY ONE of:
  OFF_VOICE, INCOHERENT, BROKEN_CHARACTER, INVENTED_FACT, BAD_METER, TONE_MISMATCH
Otherwise reply ACCEPT. No prose.

Canonical room names (do not invent others): ${context.canonical_room_names.join(', ')}.`,
    user: `Shell: ${context.shell_name}
${context.character_name ? `Character: ${context.character_name}\n` : ''}Artifact:
${artifact}`,
  }),
});
