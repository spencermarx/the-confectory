import type { MoodVector } from '@confectory/shared';
import type { Env } from '../env.ts';

interface FactoryState {
  mood: MoodVector;
  founder_present_in?: string;
  updated_at: number;
}

const DEFAULT_MOOD: MoodVector = {
  whimsy: 0.6,
  menace: 0.2,
  indulgence: 0.5,
  founder_presence: 0.3,
  consequence_severity: 0.2,
  pace: 0.4,
  oompa_loompa_mischief: 0.4,
  season: 'unseasoned',
};

// §3.2, §15: the global singleton. One DO owns factory-wide mood,
// weather, cross-guest events. Phase 1 (Week 5-7) wires the Mood
// Console writer path through PUT /mood; Phase 2 adds the WebSocket
// fanout to per-guest DOs (§14.2).
export class FactoryStateDO implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/mood' && request.method === 'GET') {
      const factory = await this.load();
      return Response.json(factory.mood);
    }
    if (url.pathname === '/mood' && request.method === 'PUT') {
      const factory = await this.load();
      const patch = (await request.json()) as Partial<MoodVector>;
      const merged: FactoryState = {
        ...factory,
        mood: { ...factory.mood, ...patch },
        updated_at: Date.now(),
      };
      await this.state.storage.put<FactoryState>('state', merged);
      return Response.json(merged.mood);
    }
    return new Response('not_found', { status: 404 });
  }

  private async load(): Promise<FactoryState> {
    const existing = await this.state.storage.get<FactoryState>('state');
    if (existing) return existing;
    const fresh: FactoryState = { mood: DEFAULT_MOOD, updated_at: Date.now() };
    await this.state.storage.put<FactoryState>('state', fresh);
    return fresh;
  }
}
