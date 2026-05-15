import { type DialEntry, resonantLayout } from '@confectory/shared';
import type { Guest, GuestLocation, ShellId } from '@confectory/shared';
import type { Env } from '../env.ts';

interface StoredState {
  guest: Guest;
  session_count: number;
  pending_settle?: { shell_id: ShellId; at: number };
}

interface DialRequestBody {
  available_shell_ids: ShellId[];
}

interface SettleRequestBody {
  shell_id: ShellId;
}

// §3.2, §5: per-guest Durable Object. Single-writer consistency.
// Phase 1 Week 3-4: session lifecycle, dial state (§8.3), settle intent.
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
      case '/dial':
        return this.handleDial(request);
      case '/settle':
        return this.handleSettle(request);
      default:
        return new Response('not_found', { status: 404 });
    }
  }

  private async handleStart(): Promise<Response> {
    const now = Date.now();
    const existing = await this.state.storage.get<StoredState>('state');

    const stored: StoredState = existing
      ? {
          ...existing,
          guest: { ...existing.guest, last_active_at: now, current_location: 'foyer' },
          session_count: existing.session_count + 1,
        }
      : { guest: this.createGuest(now), session_count: 1 };

    await this.state.storage.put<StoredState>('state', stored);

    return Response.json({
      session_started_at: stored.guest.session_started_at,
      current_location: stored.guest.current_location satisfies GuestLocation,
      respawn_count: stored.guest.respawn_count,
      visit_count: stored.guest.visited_shell_ids.length,
      session_count: stored.session_count,
    });
  }

  private async handleState(): Promise<Response> {
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });
    return Response.json(stored.guest);
  }

  // §8.3: compute the resonant layout server-side. Single-writer DO
  // keeps the layout consistent if the same guest opens the dial twice
  // in close succession.
  private async handleDial(request: Request): Promise<Response> {
    const body = (await request.json()) as DialRequestBody;
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });

    const visitCounts: Record<ShellId, number> = {};
    for (const id of stored.guest.visited_shell_ids) {
      visitCounts[id] = (visitCounts[id] ?? 0) + 1;
    }

    const entries: DialEntry[] = resonantLayout({
      available_shell_ids: body.available_shell_ids,
      visited_shell_ids: stored.guest.visited_shell_ids,
      visit_count_per_shell: visitCounts,
      session_count: stored.session_count,
    });

    return Response.json({ entries, session_count: stored.session_count });
  }

  // §8.2: settle on a name. The Worker uses this signal to begin
  // speculative pre-generation of the target shell. Phase 1 Week 3-4
  // just records the intent; Week 5-7 wires the pre-gen pipeline.
  private async handleSettle(request: Request): Promise<Response> {
    const body = (await request.json()) as SettleRequestBody;
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });

    const next: StoredState = {
      ...stored,
      pending_settle: { shell_id: body.shell_id, at: Date.now() },
    };
    await this.state.storage.put<StoredState>('state', next);
    return Response.json({ pending_settle: next.pending_settle });
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
