import type {
  CriticProvider,
  CriticRejection,
  CriticRequest,
  CriticVerdict,
  DialogueRequest,
  FoundryProvider,
  OompaLoompaAssignmentRequest,
  PropAssignment,
  PropAssignmentRequest,
  SignRequest,
  SurfaceRequest,
} from './types.ts';

// §3.3, §10.3: production-tier providers backed by Cloudflare Workers AI.
// Phase 1 ships the InProcess provider as the default; this implementation
// is wired through the AI binding once the wrangler config has it bound.
//
// The actual model strings come from the Workers AI catalog and may evolve
// across the platform; the interface boundary keeps room assembly stable.

const ROOM_ASSEMBLY_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const SURFACE_IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';
const CRITIC_MODEL = '@cf/meta/llama-3.2-3b-instruct';

interface AiRunner {
  run(model: string, inputs: Record<string, unknown>): Promise<unknown>;
}

export class WorkersAIFoundry implements FoundryProvider {
  constructor(private readonly ai: AiRunner) {}

  async generateSign(req: SignRequest): Promise<string> {
    const out = (await this.ai.run(ROOM_ASSEMBLY_MODEL, {
      messages: [
        { role: 'system', content: 'You generate room signage in The Confectory.' },
        {
          role: 'user',
          content: `Shell: ${req.shell_name}. Mood: ${JSON.stringify(req.mood)}. Output just the sign text.`,
        },
      ],
    })) as { response: string };
    return out.response.trim();
  }

  async assignProps(req: PropAssignmentRequest): Promise<PropAssignment[]> {
    // §5.2 step 4: a generative call ranks which props fit which slots.
    // Phase 1 keeps this trivially deterministic; Week 5-7's last task
    // is to upgrade this to a real LLM call once the slot taxonomy is
    // stable across the Phase 1 shells.
    return req.shell.prop_slots.map((slot) => ({
      prop_slot_id: slot.id,
      prop_id: slot.allowed_prop_tags[0] ?? 'default',
    }));
  }

  async assignOompaLoompas(req: OompaLoompaAssignmentRequest): Promise<string[]> {
    const want = req.mood.oompa_loompa_mischief > 0.5 ? 1 : 0;
    return req.available_ol_ids.slice(0, want);
  }

  async generateSurface(req: SurfaceRequest): Promise<string> {
    const _out = (await this.ai.run(SURFACE_IMAGE_MODEL, {
      prompt: `${req.surface_slot} in The Confectory, mood ${JSON.stringify(req.mood)}.`,
      seed: req.seed,
    })) as { image: string };
    // §12.2: caller writes this to R2 with the content-hash key.
    return `generated/${req.shell_id}/${req.surface_slot}/${req.seed}.ktx2`;
  }

  async generateDialogueLine(req: DialogueRequest): Promise<string> {
    const out = (await this.ai.run(ROOM_ASSEMBLY_MODEL, {
      messages: [
        { role: 'system', content: 'You speak as a character in The Confectory.' },
        {
          role: 'user',
          content: `Shell: ${req.shell_id}. Character: ${req.character_id}. Mood: ${JSON.stringify(req.mood)}. ${req.prompt_hint ?? ''}`,
        },
      ],
    })) as { response: string };
    return out.response.trim();
  }
}

export class WorkersAICritic implements CriticProvider {
  constructor(private readonly ai: AiRunner) {}

  async review(req: CriticRequest): Promise<CriticVerdict> {
    const out = (await this.ai.run(CRITIC_MODEL, {
      messages: [
        {
          role: 'system',
          content: `You enforce The Confectory's voice. Reject with EXACTLY ONE of: OFF_VOICE, INCOHERENT, BROKEN_CHARACTER, INVENTED_FACT, BAD_METER, TONE_MISMATCH. Otherwise reply ACCEPT. Canonical names: ${req.context.canonical_room_names.join(', ')}.`,
        },
        {
          role: 'user',
          content: `Shell: ${req.context.shell_name}. Artifact:\n${req.artifact}`,
        },
      ],
    })) as { response: string };
    return parseVerdict(out.response);
  }
}

const REJECTIONS: readonly CriticRejection[] = [
  'OFF_VOICE',
  'INCOHERENT',
  'BROKEN_CHARACTER',
  'INVENTED_FACT',
  'BAD_METER',
  'TONE_MISMATCH',
];

function parseVerdict(raw: string): CriticVerdict {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.startsWith('ACCEPT')) return { kind: 'accept' };
  for (const reason of REJECTIONS) {
    if (trimmed.includes(reason)) return { kind: 'reject', reason };
  }
  // Defensive: if the Critic returns gibberish, treat it as off-voice so
  // we fall through to the authored library rather than ship bad content.
  return { kind: 'reject', reason: 'OFF_VOICE' };
}
