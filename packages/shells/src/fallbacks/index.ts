import type { AuthoredFallbackId, R2Key, ShellId } from '@confectory/shared';

// §6.4: every Shell ships with a hand-crafted fallback content set. When
// generation fails or the Critic exceeds its retry budget, the engine
// serves the fallback silently. Fallbacks are not generic — they are
// written for each Shell's character.
export interface AuthoredFallback {
  id: AuthoredFallbackId;
  shell_id: ShellId;
  // Pre-written lines the Oompa-Loompas can say in this room.
  dialogue_lines: string[];
  // Pre-composed sign text alternatives (e.g. the room's canonical name
  // plus an evocative subtitle), used when sign generation fails.
  sign_text_alternatives: string[];
  // Pre-selected prop arrangements (slot id → prop id).
  prop_arrangement: Record<string, string>;
  // Pre-rendered surface textures, keyed by surface slot.
  pre_rendered_surfaces: Record<string, R2Key>;
}

const fallbacks = new Map<AuthoredFallbackId, AuthoredFallback>();

function register(fallback: AuthoredFallback): AuthoredFallback {
  if (fallbacks.has(fallback.id)) {
    throw new Error(`Duplicate fallback id: ${fallback.id}`);
  }
  fallbacks.set(fallback.id, fallback);
  return fallback;
}

export const theHushBeforeFallback = register({
  id: 'fallbacks/the-hush-before-default',
  shell_id: 'the-hush-before',
  dialogue_lines: [
    'The room is in one of its quiet moods today.',
    'Step softly. The walls are listening for a different visitor.',
    "Don't mind the curtain — it does that when it's thinking.",
  ],
  sign_text_alternatives: ['The Hush Before', 'The Hush Before — quietly'],
  prop_arrangement: {},
  pre_rendered_surfaces: {
    wallpaper: 'shells/the-hush-before/fallbacks/wallpaper.ktx2',
    curtain: 'shells/the-hush-before/fallbacks/curtain.ktx2',
    rug: 'shells/the-hush-before/fallbacks/rug.ktx2',
  },
});

export const theTreacleDeepFallback = register({
  id: 'fallbacks/the-treacle-deep-default',
  shell_id: 'the-treacle-deep',
  dialogue_lines: [
    "Don't fall in. We've lost good shoes that way.",
    "The treacle has its preferences. It hasn't decided about you yet.",
    'Sit a while. The deep notices who sits.',
  ],
  sign_text_alternatives: ['The Treacle Deep', 'The Treacle Deep — easy now'],
  prop_arrangement: {},
  pre_rendered_surfaces: {
    'pourable-treacle-surface': 'shells/the-treacle-deep/fallbacks/treacle.ktx2',
    wallpaper: 'shells/the-treacle-deep/fallbacks/wallpaper.ktx2',
  },
});

export const theFoundryDoorFallback = register({
  id: 'fallbacks/the-foundry-door-default',
  shell_id: 'the-foundry-door',
  dialogue_lines: [
    'He has been called away. The door knows when he is ready.',
    'Try the latch later. The handle is warm but not hot.',
  ],
  sign_text_alternatives: ['The Foundry Door', 'The Foundry Door — closed for now'],
  prop_arrangement: {},
  pre_rendered_surfaces: {
    'hero-mural': 'shells/the-foundry-door/fallbacks/mural.ktx2',
  },
});

export const theFoyerFallback = register({
  id: 'fallbacks/the-foyer-default',
  shell_id: 'the-foyer',
  dialogue_lines: ["Welcome back. We've kept your seat warm."],
  sign_text_alternatives: ['The Foyer'],
  prop_arrangement: {},
  pre_rendered_surfaces: {},
});

export const theElevatorFallback = register({
  id: 'fallbacks/the-elevator-default',
  shell_id: 'the-elevator',
  dialogue_lines: [
    "It'll be a moment. The Elevator is thinking.",
    "Mind the brass. It's just buffed.",
  ],
  sign_text_alternatives: ['The Elevator'],
  prop_arrangement: {},
  pre_rendered_surfaces: {
    'button-labels': 'shells/the-elevator/fallbacks/buttons.ktx2',
  },
});

export function getFallback(id: AuthoredFallbackId): AuthoredFallback | undefined {
  return fallbacks.get(id);
}

export function listFallbacks(): AuthoredFallback[] {
  return [...fallbacks.values()];
}
