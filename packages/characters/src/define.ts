import type { Founder, OompaLoompa, OompaLoompaId } from '@confectory/shared';
import { type PersonalityVector, asVector } from './personality.ts';

export interface OompaLoompaDefinition extends Omit<OompaLoompa, 'personality_vector'> {
  personality_vector: PersonalityVector;
}

export function defineOompaLoompa(def: OompaLoompaDefinition): OompaLoompa {
  return Object.freeze({
    ...def,
    personality_vector: asVector(def.personality_vector),
  });
}

export const characterRegistry = new Map<OompaLoompaId, OompaLoompa>();

export function registerOompaLoompas(characters: OompaLoompa[]): Map<OompaLoompaId, OompaLoompa> {
  for (const ol of characters) {
    if (characterRegistry.has(ol.id)) {
      throw new Error(`Duplicate Oompa-Loompa id: ${ol.id}`);
    }
    characterRegistry.set(ol.id, ol);
  }
  return characterRegistry;
}

let founderSingleton: Founder | undefined;

export function defineFounder(founder: Founder): Founder {
  if (founderSingleton) {
    throw new Error('The Founder is a singleton (§4.5); defineFounder() called twice.');
  }
  founderSingleton = Object.freeze({ ...founder });
  return founderSingleton;
}

export function getFounder(): Founder {
  if (!founderSingleton) throw new Error('The Founder has not been defined.');
  return founderSingleton;
}
