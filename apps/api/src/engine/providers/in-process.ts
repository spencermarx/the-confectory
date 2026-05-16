import type {
  CriticProvider,
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

// Deterministic, dependency-free providers. Used in tests and as the
// default in local `wrangler dev` when Workers AI bindings aren't
// configured. Production swaps these for the WorkersAI/Anthropic ones.

export class InProcessFoundry implements FoundryProvider {
  async generateSign(req: SignRequest): Promise<string> {
    return req.shell_name;
  }

  async assignProps(req: PropAssignmentRequest): Promise<PropAssignment[]> {
    return req.shell.prop_slots.map((slot, i) => ({
      prop_slot_id: slot.id,
      prop_id: slot.allowed_prop_tags[0] ?? `prop-${i}`,
    }));
  }

  async assignOompaLoompas(req: OompaLoompaAssignmentRequest): Promise<string[]> {
    // §10.3: room-assembly model usually places 0-1 OLs depending on mood.
    const count = req.mood.oompa_loompa_mischief > 0.5 ? 1 : 0;
    return req.available_ol_ids.slice(0, count);
  }

  async generateSurface(req: SurfaceRequest): Promise<string> {
    return `generated/${req.shell_id}/${req.surface_slot}/${req.seed}.ktx2`;
  }

  async generateDialogueLine(req: DialogueRequest): Promise<string> {
    return `(${req.shell_id} · ${req.character_id} is quiet today.)`;
  }
}

// A Critic that accepts everything. Useful for tests of the orchestrator
// when we want to bypass rejection logic.
export class AcceptingCritic implements CriticProvider {
  async review(_req: CriticRequest): Promise<CriticVerdict> {
    return { kind: 'accept' };
  }
}

// A test Critic that rejects until a counter expires. Lets unit tests
// drive the retry+fallback path.
export class RejectingCritic implements CriticProvider {
  private remaining: number;
  private readonly reason: CriticVerdict;

  constructor(rejections: number, reason: CriticVerdict = { kind: 'reject', reason: 'OFF_VOICE' }) {
    this.remaining = rejections;
    this.reason = reason;
  }

  async review(_req: CriticRequest): Promise<CriticVerdict> {
    if (this.remaining > 0) {
      this.remaining -= 1;
      return this.reason;
    }
    return { kind: 'accept' };
  }
}
