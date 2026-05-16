import type { AppliedConsequence, EventId, Guest, MoodVector, ShellId } from '@confectory/shared';
import type { MemoryProvider } from './providers/memory.ts';

// §7.2: at session end, transient room memory summarizes into:
//   1. A short prose summary (Claude Opus 4.7, slow Critic path).
//   2. Tagged consequence updates (additive to structural memory).
//   3. Updated factory opinion (small delta).
//   4. New episodic memory entries (Vectorize).
// The factory remembers like a host does — gist + emotional weight,
// pruning routine interactions.

export interface SessionEvent {
  event_id: EventId;
  shell_id: ShellId;
  description: string;
  emotional_weight: number;
  occurred_at: number;
  consequence_applied?: AppliedConsequence;
}

export interface SummarizationInput {
  guest: Guest;
  session_events: SessionEvent[];
  factory_mood: MoodVector;
}

export interface SummarizationResult {
  /** Short prose summary that goes into episodic memory. */
  prose_summary: string;
  /** Per-shell highlight lines suitable for memory retrieval. */
  episodic_entries: Array<{ shell_id: ShellId; summary: string; emotional_weight: number }>;
  /** §7.2 step 3: factory_opinion delta. */
  factory_opinion_delta: number;
}

// §7.2: opinionated. We instruct the summarizer (and this in-process
// approximation) to preserve the gist and any moments of consequence
// while pruning routine interactions.
const PRUNE_WEIGHT_THRESHOLD = 0.25;
const OPINION_PER_HEAVY_EVENT = 0.02;

export function shapeSessionSummary(input: SummarizationInput): SummarizationResult {
  const keptEvents = input.session_events.filter(
    (e) => e.emotional_weight >= PRUNE_WEIGHT_THRESHOLD || e.consequence_applied !== undefined,
  );
  const byShell = new Map<ShellId, SessionEvent[]>();
  for (const event of keptEvents) {
    const list = byShell.get(event.shell_id) ?? [];
    list.push(event);
    byShell.set(event.shell_id, list);
  }

  const episodic_entries: SummarizationResult['episodic_entries'] = [];
  for (const [shell_id, events] of byShell.entries()) {
    const weight = events.reduce((sum, e) => sum + e.emotional_weight, 0) / events.length;
    const summary = events.map((e) => e.description).join(' ');
    episodic_entries.push({ shell_id, summary, emotional_weight: weight });
  }

  const factory_opinion_delta =
    keptEvents.reduce((sum, e) => sum + e.emotional_weight * OPINION_PER_HEAVY_EVENT, 0) +
    keptEvents.map((e) => e.consequence_applied).filter((c): c is AppliedConsequence => Boolean(c))
      .length *
      0; // consequence opinion deltas are applied at trigger time (§4.6), not here.

  const prose_summary =
    keptEvents.length === 0
      ? 'A quiet visit. The factory observed nothing worth keeping.'
      : `Visited ${byShell.size} ${byShell.size === 1 ? 'room' : 'rooms'}. ${keptEvents
          .map((e) => e.description)
          .slice(0, 3)
          .join(' ')}`;

  return {
    prose_summary,
    episodic_entries,
    factory_opinion_delta,
  };
}

// §7.2: orchestrates the summarization job. The in-process version
// uses shapeSessionSummary; production wires Claude Opus 4.7 via the
// Anthropic SDK with a `slow Critic` prompt. The output shape is
// identical so the rest of the pipeline is provider-agnostic.
export async function summarizeSession(
  memory: MemoryProvider,
  input: SummarizationInput,
): Promise<SummarizationResult> {
  const shaped = shapeSessionSummary(input);
  for (const entry of shaped.episodic_entries) {
    await memory.store({
      guest_id: input.guest.id,
      shell_id: entry.shell_id,
      summary: entry.summary,
      emotional_weight: entry.emotional_weight,
    });
  }
  return shaped;
}
