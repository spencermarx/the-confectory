import type { MoodVector } from '../types/mood.ts';
import type { DoorSlot, Shell, ShellId } from '../types/shell.ts';

export interface DoorResolverInput {
  source_shell: Shell;
  door: DoorSlot;
  candidate_shells: Shell[];
  guest_consequences: ReadonlySet<string>;
  /** Shells the engine prefers to surface for this guest (e.g. unvisited). */
  preference_order?: readonly ShellId[];
  /** Source shell is implicitly forbidden so the guest doesn't loop back. */
  exclude_shell_ids?: ReadonlySet<ShellId>;
}

// §5.2 step 1: resolve a door's destination using DoorSlot.destination_constraints.
// Returns the first candidate that satisfies every constraint, biased by
// the preference order if provided.
export function resolveDoorDestination(input: DoorResolverInput): Shell | undefined {
  const excluded = new Set<ShellId>(input.exclude_shell_ids ?? []);
  excluded.add(input.source_shell.id);
  const allowed = input.candidate_shells.filter((shell) =>
    isAllowed(shell, input.door, input.guest_consequences, excluded),
  );
  if (allowed.length === 0) return undefined;

  const preference = input.preference_order ?? [];
  for (const shell_id of preference) {
    const match = allowed.find((s) => s.id === shell_id);
    if (match) return match;
  }
  return allowed[0];
}

function isAllowed(
  shell: Shell,
  door: DoorSlot,
  guestConsequences: ReadonlySet<string>,
  excluded: ReadonlySet<ShellId>,
): boolean {
  if (excluded.has(shell.id)) return false;
  const c = door.destination_constraints;
  if (c.allowed_topologies && !c.allowed_topologies.includes(shell.topology)) return false;
  if (c.forbidden_shell_ids?.includes(shell.id)) return false;
  if (c.require_consequence && !guestConsequences.has(c.require_consequence)) return false;
  if (c.required_mood_compatibility) {
    for (const [key, min] of Object.entries(c.required_mood_compatibility)) {
      if (typeof min !== 'number') continue;
      const value = shell.mood_compatibility[key as keyof MoodVector];
      if (typeof value !== 'number') return false;
      if (value < min) return false;
    }
  }
  return true;
}
