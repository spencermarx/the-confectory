import {
  type MoodVector,
  type OompaLoompaId,
  type ResolvedDoor,
  type Shell,
  type ShellId,
  type SurfaceSlot,
  composeMood,
  resolveDoorDestination,
} from '@confectory/shared';
import { getFallback } from '@confectory/shells';
import { criticLoop } from './critic-loop.ts';
import type {
  CriticProvider,
  CriticRejection,
  FoundryProvider,
  PropAssignment,
} from './providers/types.ts';

export interface RoomAssemblyInput {
  shell: Shell;
  guest_id: string;
  source_shell?: Shell;
  candidate_shells: Shell[];
  factory_mood: MoodVector;
  guest_consequence_severity: number;
  guest_consequences: ReadonlySet<string>;
  available_ol_ids: OompaLoompaId[];
  factory_mood_override?: Partial<MoodVector>;
  preference_order?: readonly ShellId[];
}

export interface AssembledRoom {
  shell_id: ShellId;
  mood_at_entry: MoodVector;
  resolved_doors: ResolvedDoor[];
  resolved_props: PropAssignment[];
  oompa_loompa_assignments: OompaLoompaId[];
  sign_text: string;
  generated_surfaces: Record<SurfaceSlot, string>;
  rejected_artifacts: RejectedArtifact[];
  served_from_fallback: boolean;
}

export interface RejectedArtifact {
  // §6.2: feeds the slow Critic's training corpus.
  kind: 'sign' | 'surface' | 'dialogue';
  reason: CriticRejection;
  shell_id: ShellId;
  surface_slot?: string;
  attempts: number;
}

export interface RoomAssemblerOptions {
  // §5.4: cul-de-sacs get a wider Critic budget (up to 3 retries).
  retry_budget_branching?: number;
  retry_budget_cul_de_sac?: number;
}

const HASH_SEED = 2166136261;

export class RoomAssembler {
  constructor(
    private readonly foundry: FoundryProvider,
    private readonly critic: CriticProvider,
    private readonly options: RoomAssemblerOptions = {},
  ) {}

  // §5.2 implementation. Resolves downstream doors, composes the mood,
  // calls generation through the Critic, falls back to authored content
  // when the retry budget is exhausted.
  async assemble(input: RoomAssemblyInput): Promise<AssembledRoom> {
    const mood = composeMood({
      shell_compatibility: input.shell.mood_compatibility,
      factory_mood: input.factory_mood,
      guest_consequence_severity: input.guest_consequence_severity,
      ...(input.factory_mood_override ? { override: input.factory_mood_override } : {}),
    });

    const resolvedDoors = this.resolveDoors(input);
    const props = await this.foundry.assignProps({ shell: input.shell, mood });
    const oompaLoompas = await this.foundry.assignOompaLoompas({
      shell_id: input.shell.id,
      mood,
      available_ol_ids: input.available_ol_ids,
    });

    const rejected: RejectedArtifact[] = [];
    const fallback = getFallback(input.shell.authored_fallback);
    const canonicalNames = input.candidate_shells.map((s) => s.name);
    const retryBudget = this.retryBudgetFor(input.shell);

    const signOutcome = await criticLoop(
      this.critic,
      () =>
        this.foundry.generateSign({
          shell_id: input.shell.id,
          shell_name: input.shell.name,
          mood,
        }),
      {
        shell_id: input.shell.id,
        shell_name: input.shell.name,
        canonical_room_names: canonicalNames,
      },
      { retry_budget: retryBudget },
    );

    let signText: string;
    let servedFromFallback = false;
    if (signOutcome.status === 'accepted') {
      signText = signOutcome.artifact;
    } else {
      rejected.push({
        kind: 'sign',
        reason: signOutcome.reason,
        shell_id: input.shell.id,
        attempts: signOutcome.attempts,
      });
      // §6.4: serve the fallback silently.
      signText = fallback?.sign_text_alternatives[0] ?? input.shell.name;
      servedFromFallback = true;
    }

    const surfaces: Record<SurfaceSlot, string> = {};
    for (const slot of input.shell.generation_hints.surface_generation_targets) {
      const preBaked = input.shell.generation_hints.pre_baked_overrides[slot];
      if (preBaked) {
        surfaces[slot] = preBaked;
        continue;
      }
      const seed = deterministicSeed(input.shell.id, slot, input.guest_id);
      const outcome = await criticLoop(
        this.critic,
        () =>
          this.foundry.generateSurface({
            shell_id: input.shell.id,
            surface_slot: slot,
            mood,
            seed,
          }),
        {
          shell_id: input.shell.id,
          shell_name: input.shell.name,
          canonical_room_names: canonicalNames,
        },
        { retry_budget: retryBudget },
      );
      if (outcome.status === 'accepted') {
        surfaces[slot] = outcome.artifact;
      } else {
        rejected.push({
          kind: 'surface',
          reason: outcome.reason,
          shell_id: input.shell.id,
          surface_slot: slot,
          attempts: outcome.attempts,
        });
        const fallbackSurface = fallback?.pre_rendered_surfaces[slot];
        if (fallbackSurface) {
          surfaces[slot] = fallbackSurface;
          servedFromFallback = true;
        }
      }
    }

    return {
      shell_id: input.shell.id,
      mood_at_entry: mood,
      resolved_doors: resolvedDoors,
      resolved_props: props,
      oompa_loompa_assignments: oompaLoompas,
      sign_text: signText,
      generated_surfaces: surfaces,
      rejected_artifacts: rejected,
      served_from_fallback: servedFromFallback,
    };
  }

  private resolveDoors(input: RoomAssemblyInput): ResolvedDoor[] {
    const resolved: ResolvedDoor[] = [];
    const excluded = new Set<ShellId>();
    for (const door of input.shell.doors) {
      const destination = resolveDoorDestination({
        source_shell: input.shell,
        door,
        candidate_shells: input.candidate_shells,
        guest_consequences: input.guest_consequences,
        exclude_shell_ids: excluded,
        ...(input.preference_order ? { preference_order: input.preference_order } : {}),
      });
      if (destination) {
        excluded.add(destination.id);
        resolved.push({
          door_slot_id: door.id,
          destination_shell_id: destination.id,
          destination_pre_generation_state: 'pending',
        });
      }
    }
    return resolved;
  }

  private retryBudgetFor(shell: Shell): number {
    if (shell.topology === 'cul-de-sac') {
      return this.options.retry_budget_cul_de_sac ?? 3;
    }
    return this.options.retry_budget_branching ?? 1;
  }
}

function deterministicSeed(shell_id: string, surface: string, guest_id: string): number {
  // FNV-1a, 32-bit. Stable across runs; §12.2 wants seed = hash(shell, mood,
  // guest, surface). Mood is folded in by the caller composing it into the
  // prompt, so the hash here covers shell+surface+guest deterministically.
  let h = HASH_SEED;
  for (const s of [shell_id, '|', surface, '|', guest_id]) {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}
