import type { MoodVector, OompaLoompa, ShellId } from '@confectory/shared';
import { criticLoop } from './critic-loop.ts';
import type { CriticProvider, CriticRejection, FoundryProvider } from './providers/types.ts';

export interface DialogueContext {
  // §7.3: every dialogue prompt is built from these pieces.
  character: OompaLoompa;
  shell_id: ShellId;
  shell_name: string;
  mood: MoodVector;
  // §7.3 / §9.4: canonical room names so the model can refer to them
  // without inventing one (and so the Critic can reject inventions).
  canonical_room_names: string[];
  // §7.3: structural memory excerpts.
  consequences: string[];
  factory_opinion: number;
  visit_count: number;
  // §7.3: top-K episodic memories (already retrieved by the caller).
  episodic_memories: string[];
  // §10.5: a curated negative-examples block.
  negative_examples?: string[];
  // What the guest just did / said.
  prompt_hint?: string;
}

export interface DialogueResult {
  text: string;
  served_from_fallback: boolean;
  // §6.2: feeds the slow Critic corpus.
  rejected: { reason: CriticRejection; attempts: number } | undefined;
}

export interface DialogueOptions {
  // §6.1: budget is 1 retry; cul-de-sacs get 3 (§5.4) but dialogue is
  // not topology-specific so the caller passes in the room's budget.
  retry_budget?: number;
  // Authored fallback line drawn from §6.4's library.
  fallback_line?: string;
}

// §10.5: typed, versioned template. Phase 1 has it inlined here; once
// the engine learns more, it migrates to packages/prompts.
export function renderOompaLoompaPrompt(ctx: DialogueContext): {
  system: string;
  user: string;
} {
  const lines: string[] = [];
  lines.push(`You are ${ctx.character.name}, an Oompa-Loompa in The Confectory.`);
  lines.push(`Role: ${ctx.character.role}.`);
  lines.push('Speak in The Confectory voice. Never break character. Never name the Founder.');
  lines.push(
    `Canonical room names (use exactly, do not invent others): ${ctx.canonical_room_names.join(', ')}.`,
  );
  if (ctx.negative_examples?.length) {
    lines.push('Avoid the following kinds of phrasing:');
    for (const ex of ctx.negative_examples) lines.push(`  - ${ex}`);
  }
  lines.push('Reply in 1-3 sentences. Fall silent if you would have nothing to say.');

  const user: string[] = [];
  user.push(`Room: ${ctx.shell_name} (${ctx.shell_id}).`);
  user.push(
    `Mood: whimsy=${ctx.mood.whimsy.toFixed(2)}, menace=${ctx.mood.menace.toFixed(2)}, pace=${ctx.mood.pace.toFixed(2)}, founder_presence=${ctx.mood.founder_presence.toFixed(2)}.`,
  );
  user.push(`Guest: visits=${ctx.visit_count}, factory_opinion=${ctx.factory_opinion.toFixed(2)}.`);
  if (ctx.consequences.length) {
    user.push(`Consequences carried: ${ctx.consequences.join(', ')}.`);
  }
  if (ctx.episodic_memories.length) {
    user.push('Memories the factory associates with this guest:');
    for (const m of ctx.episodic_memories) user.push(`  · ${m}`);
  }
  if (ctx.prompt_hint) user.push(`What just happened: ${ctx.prompt_hint}`);
  user.push('What do you say?');

  return { system: lines.join('\n'), user: user.join('\n') };
}

export async function generateOompaLoompaLine(
  foundry: FoundryProvider,
  critic: CriticProvider,
  ctx: DialogueContext,
  options: DialogueOptions = {},
): Promise<DialogueResult> {
  const outcome = await criticLoop(
    critic,
    () =>
      foundry.generateDialogueLine({
        shell_id: ctx.shell_id,
        character_id: ctx.character.id,
        mood: ctx.mood,
        prompt_hint: ctx.prompt_hint ?? '',
      }),
    {
      shell_id: ctx.shell_id,
      shell_name: ctx.shell_name,
      character_id: ctx.character.id,
      canonical_room_names: ctx.canonical_room_names,
    },
    options.retry_budget !== undefined ? { retry_budget: options.retry_budget } : {},
  );
  if (outcome.status === 'accepted') {
    return { text: outcome.artifact, served_from_fallback: false, rejected: undefined };
  }
  return {
    text: options.fallback_line ?? `(${ctx.character.name} pauses, says nothing.)`,
    served_from_fallback: true,
    rejected: { reason: outcome.reason, attempts: outcome.attempts },
  };
}
