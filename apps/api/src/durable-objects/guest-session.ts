import type { Guest, GuestLocation } from '@confectory/shared';
import type { Env } from '../env.ts';

interface StoredState {
  guest: Guest;
}

// §3.2, §5: per-guest Durable Object. Single-writer consistency.
// Phase 1: just enough to track session lifecycle and current location.
// Phase 2 layers in room assembly, speculative pre-generation, memory.
export class GuestSessionDO implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/start':
        return this.handleStart();
      case '/state':
        return this.handleState();
      default:
        return new Response('not_found', { status: 404 });
    }
  }

  private async handleStart(): Promise<Response> {
    const now = Date.now();
    const existing = await this.state.storage.get<StoredState>('state');

    const guest: Guest = existing?.guest
      ? { ...existing.guest, last_active_at: now, current_location: 'foyer' }
      : this.createGuest(now);

    await this.state.storage.put<StoredState>('state', { guest });

    return Response.json({
      session_started_at: guest.session_started_at,
      current_location: guest.current_location satisfies GuestLocation,
      respawn_count: guest.respawn_count,
      visit_count: guest.visited_shell_ids.length,
    });
  }

  private async handleState(): Promise<Response> {
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });
    return Response.json(stored.guest);
  }

  private createGuest(now: number): Guest {
    return {
      id: this.state.id.toString(),
      session_started_at: now,
      last_active_at: now,
      is_anonymous: true,
      current_location: 'foyer',
      ticket_stub: {
        visual_state: 'ticket-stubs/blank.png',
        marks: [],
        last_updated_at: now,
      },
      consequences: [],
      visited_shell_ids: [],
      factory_opinion: 0,
      oompa_loompa_relationships: {},
      founder_encounters: [],
      respawn_count: 0,
    };
  }
}
