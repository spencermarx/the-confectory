import type { Shell, ShellId } from '@confectory/shared';
import { phase1Shells } from '@confectory/shells';

// Server-side view of the authored shell catalog. Phase 1 reads from the
// in-memory @confectory/shells registry. Phase 2 layers in KV-backed
// publish/promote (§3.4) so Recipe Keepers can update shell metadata
// without redeploying the Worker.
export function getShell(id: ShellId): Shell | undefined {
  return phase1Shells.get(id);
}

export function listShells(): Shell[] {
  return [...phase1Shells.values()];
}

export function getNameRegistry(): Record<ShellId, string> {
  const out: Record<ShellId, string> = {};
  for (const shell of phase1Shells.values()) {
    out[shell.id] = shell.name;
  }
  return out;
}

const FOYER_ID = 'the-foyer';

// §8.3: the foyer is reachable via respawn, not via the dial.
export function listDialShells(): Shell[] {
  return listShells().filter((s) => s.id !== FOYER_ID);
}
