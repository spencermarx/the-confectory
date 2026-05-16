import type { MoodVector, OompaLoompaId, Shell, ShellId } from '@confectory/shared';

// §3.3: the engine talks to model providers through these interfaces.
// Concrete implementations: InProcessFoundry (deterministic, used in tests
// and local dev), WorkersAIFoundry (production edge tier), AnthropicFoundry
// (frontier-tier work like the Founder's dialogue).

export interface SignRequest {
  shell_id: ShellId;
  shell_name: string;
  mood: MoodVector;
}

export interface PropAssignmentRequest {
  shell: Shell;
  mood: MoodVector;
}

export interface PropAssignment {
  prop_slot_id: string;
  prop_id: string;
}

export interface OompaLoompaAssignmentRequest {
  shell_id: ShellId;
  mood: MoodVector;
  available_ol_ids: OompaLoompaId[];
}

export interface SurfaceRequest {
  shell_id: ShellId;
  surface_slot: string;
  mood: MoodVector;
  seed: number;
}

export interface DialogueRequest {
  shell_id: ShellId;
  character_id: string;
  mood: MoodVector;
  prompt_hint?: string;
}

// §3.3: the Foundry provider is everything that produces room content.
// Phase 1 keeps it as a single interface; Phase 2 may split per artifact
// type if individual providers diverge in shape.
export interface FoundryProvider {
  generateSign(req: SignRequest): Promise<string>;
  assignProps(req: PropAssignmentRequest): Promise<PropAssignment[]>;
  assignOompaLoompas(req: OompaLoompaAssignmentRequest): Promise<OompaLoompaId[]>;
  generateSurface(req: SurfaceRequest): Promise<string>;
  generateDialogueLine(req: DialogueRequest): Promise<string>;
}

// §6.1: the fast inline Style Critic.
export type CriticRejection =
  | 'OFF_VOICE'
  | 'INCOHERENT'
  | 'BROKEN_CHARACTER'
  | 'INVENTED_FACT'
  | 'BAD_METER'
  | 'TONE_MISMATCH';

export type CriticVerdict = { kind: 'accept' } | { kind: 'reject'; reason: CriticRejection };

export interface CriticRequest {
  artifact: string;
  context: {
    shell_id: ShellId;
    shell_name: string;
    character_id?: string;
    canonical_room_names: string[];
  };
}

export interface CriticProvider {
  review(req: CriticRequest): Promise<CriticVerdict>;
}
