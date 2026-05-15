export { defineShell, registerShells, shellRegistry } from './define-shell.ts';
export { default as theHushBefore } from './the-hush-before.ts';
export { default as foyer } from './foyer.ts';

import { registerShells } from './define-shell.ts';
import foyer from './foyer.ts';
import theHushBefore from './the-hush-before.ts';

export const phase1Shells = registerShells([foyer, theHushBefore]);
