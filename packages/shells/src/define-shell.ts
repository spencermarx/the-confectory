import { type Shell, type ShellId, shellSchema } from '@confectory/shared';

export function defineShell(input: unknown): Shell {
  const parsed = shellSchema.parse(input);
  return parsed as Shell;
}

export const shellRegistry = new Map<ShellId, Shell>();

export function registerShells(shells: Shell[]): Map<ShellId, Shell> {
  for (const shell of shells) {
    if (shellRegistry.has(shell.id)) {
      throw new Error(`Duplicate shell id: ${shell.id}`);
    }
    shellRegistry.set(shell.id, shell);
  }
  return shellRegistry;
}
