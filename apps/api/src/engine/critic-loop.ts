import type { CriticProvider, CriticRejection, CriticRequest } from './providers/types.ts';

export interface CriticAcceptance {
  status: 'accepted';
  artifact: string;
  attempts: number;
}

export interface CriticExhausted {
  status: 'exhausted';
  reason: CriticRejection;
  attempts: number;
}

export type CriticOutcome = CriticAcceptance | CriticExhausted;

export interface CriticLoopOptions {
  // §6.1: 1 retry by default. Cul-de-sacs get up to 3 (§5.4).
  retry_budget?: number;
}

// Runs a generator through the fast Critic with a bounded retry budget.
// On exhaustion the caller is expected to fall back to authored content
// (§6.4) — the loop does not handle fallback itself, so the caller can
// log what was rejected for the slow Critic's training corpus (§6.2).
export async function criticLoop(
  critic: CriticProvider,
  generate: (attempt: number) => Promise<string>,
  context: CriticRequest['context'],
  options: CriticLoopOptions = {},
): Promise<CriticOutcome> {
  const retryBudget = options.retry_budget ?? 1;
  let attempts = 0;
  let lastReason: CriticRejection = 'OFF_VOICE';
  while (attempts <= retryBudget) {
    attempts += 1;
    const artifact = await generate(attempts);
    const verdict = await critic.review({ artifact, context });
    if (verdict.kind === 'accept') {
      return { status: 'accepted', artifact, attempts };
    }
    lastReason = verdict.reason;
  }
  return { status: 'exhausted', reason: lastReason, attempts };
}
