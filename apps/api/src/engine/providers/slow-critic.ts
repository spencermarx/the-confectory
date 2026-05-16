import type { ShellId } from '@confectory/shared';

// §6.2, §22.3: the slow Critic. Runs asynchronously on accepted
// generations via Cloudflare Queues with a generous latency budget
// (minutes are fine). Larger model than the fast Critic; produces a
// 0..1 quality score and tags. Used to retrain the fast Critic and
// surface low-quality runs in the Critic's Notebook (§15.3).

export interface SlowCriticInput {
  artifact: string;
  context: {
    shell_id: ShellId;
    shell_name: string;
    character_id?: string;
    canonical_room_names: string[];
  };
}

export interface SlowCriticVerdict {
  // 0 = unusable, 1 = exemplary.
  score: number;
  tags: string[];
  notes?: string;
}

export interface SlowCriticProvider {
  review(req: SlowCriticInput): Promise<SlowCriticVerdict>;
}

// ---- Deterministic implementation (default + tests).
// Scores by overlap between the artifact and the canonical room
// names; rough proxy for "off voice" / "incoherent".
export class InProcessSlowCritic implements SlowCriticProvider {
  async review(req: SlowCriticInput): Promise<SlowCriticVerdict> {
    const artifact = req.artifact.toLowerCase();
    const mentionsValidRoom = req.context.canonical_room_names.some((n) =>
      artifact.includes(n.toLowerCase()),
    );
    const tags: string[] = [];
    if (!artifact.trim()) tags.push('empty');
    if (mentionsValidRoom) tags.push('mentions_canonical_room');
    // Heuristic: longer artifacts score lower (we want concise voice).
    const lengthPenalty = Math.min(0.3, artifact.length / 4000);
    const baseScore = artifact.trim() ? 0.85 - lengthPenalty : 0;
    return { score: Math.max(0, Math.min(1, baseScore)), tags };
  }
}

// ---- Anthropic Claude Opus 4.7 implementation (production).
// §3.3, §10.4: the slow Critic uses Claude Opus 4.7 via Anthropic's
// Messages API. The Worker holds the API key in a secret binding;
// this class is a thin wrapper that emits a strict JSON shape and
// degrades gracefully on parse failure.
interface AnthropicMessagesClient {
  create(args: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: 'user'; content: string }>;
  }): Promise<{ content: Array<{ type: string; text?: string }> }>;
}

const SLOW_CRITIC_MODEL = 'claude-opus-4-7';

export class AnthropicSlowCritic implements SlowCriticProvider {
  constructor(private readonly client: AnthropicMessagesClient) {}

  async review(req: SlowCriticInput): Promise<SlowCriticVerdict> {
    const resp = await this.client.create({
      model: SLOW_CRITIC_MODEL,
      max_tokens: 256,
      system: `You score artifacts against The Confectory's voice. Reply with strict JSON: {"score": 0..1, "tags": string[], "notes": string?}. Canonical names: ${req.context.canonical_room_names.join(', ')}.`,
      messages: [
        {
          role: 'user',
          content: `Shell: ${req.context.shell_name}.${req.context.character_id ? ` Character: ${req.context.character_id}.` : ''}\nArtifact:\n${req.artifact}`,
        },
      ],
    });
    const text = resp.content.map((c) => (c.type === 'text' ? (c.text ?? '') : '')).join('');
    try {
      const parsed = JSON.parse(text) as Partial<SlowCriticVerdict>;
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        ...(parsed.notes ? { notes: parsed.notes } : {}),
      };
    } catch {
      return { score: 0, tags: ['parse_failure'] };
    }
  }
}
