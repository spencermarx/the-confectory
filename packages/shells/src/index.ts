export { defineShell, registerShells, shellRegistry } from './define-shell.ts';
export { default as foyer } from './foyer.ts';
export { default as theElevator } from './the-elevator.ts';
export { default as theFoundryDoor } from './the-foundry-door.ts';
export { default as theHushBefore } from './the-hush-before.ts';
export { default as theTreacleDeep } from './the-treacle-deep.ts';
export * from './fallbacks/index.ts';

import { registerShells } from './define-shell.ts';
import foyer from './foyer.ts';
import theElevator from './the-elevator.ts';
import theFoundryDoor from './the-foundry-door.ts';
import theHushBefore from './the-hush-before.ts';
import theTreacleDeep from './the-treacle-deep.ts';

export const phase1Shells = registerShells([
  foyer,
  theHushBefore,
  theTreacleDeep,
  theFoundryDoor,
  theElevator,
]);
