import type { MoodVector } from '@confectory/shared';
import type { Env } from '../env.ts';

interface FactoryState {
  mood: MoodVector;
  founder_present_in?: string;
  updated_at: number;
}

// §3.2, §15: the global singleton. One DO owns factory-wide mood,
// weather, cross-guest events. Per-guest DOs subscribe via the
// Hibernation WebSocket fanout (§14.2). Phase 1 ships read endpoints
// and a stub mood. Phase 2 adds the Mood Console writer path.
export class FactoryStateDO implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/mood') {
      const factory = await this.load();
      return Response.json(factory.mood);
    }
    return new Response('not_found', { status: 404 });
  }

  private async load(): Promise<FactoryState> {
    const existing = await this.state.storage.get<FactoryState>('state');
    if (existing) return existing;
    const fresh: FactoryState = {
      mood: {
        whimsy: 0.6,
        menace: 0.2,
        indulgence: 0.5,
        founder_presence: 0.3,
        consequence_severity: 0.2,
        pace: 0.4,
        oompa_loompa_mischief: 0.4,
        season: 'unseasoned',
      },
      updated_at: Date.now(),
    };
    await this.state.storage.put<FactoryState>('state', fresh);
    return fresh;
  }
}
