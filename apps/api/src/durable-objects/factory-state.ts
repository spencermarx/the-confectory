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

interface PresenceState {
  guest_id: string;
  // §8.5: Phase 2 ships co-presence only in the foyer. Other locations
  // come later and are filtered out of the broadcast.
  location: 'foyer' | 'elsewhere';
  ghost_token: string;
  updated_at: number;
}

type ServerMessage =
  | { type: 'mood'; mood: MoodVector }
  | { type: 'presence'; foyer: Array<{ ghost_token: string }> };

type ClientMessage =
  | { type: 'enter_foyer'; guest_id: string; ghost_token: string }
  | { type: 'leave_foyer'; guest_id: string }
  | { type: 'hello' };

// §3.2, §15, §14.2: the global singleton. Owns factory-wide mood,
// presence, and the Hibernation API WebSocket fanout. Per-guest DOs
// publish presence updates via fetch; clients subscribe to mood and
// foyer co-presence via /factory/subscribe.
export class FactoryStateDO implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/subscribe') {
      return this.handleSubscribe(request);
    }

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
      // §15.3: "Real-time updates: changing the Console immediately
      // affects new room generations." Broadcast the new mood to all
      // connected subscribers.
      this.broadcast({ type: 'mood', mood: merged.mood });
      return Response.json(merged.mood);
    }

    if (url.pathname === '/presence' && request.method === 'POST') {
      const body = (await request.json()) as PresenceState;
      await this.state.storage.put<PresenceState>(`presence:${body.guest_id}`, {
        ...body,
        updated_at: Date.now(),
      });
      await this.broadcastPresence();
      return Response.json({ ok: true });
    }

    return new Response('not_found', { status: 404 });
  }

  // §14.2: Hibernation API. acceptWebSocket so the DO can sleep while
  // sockets remain open, and so the platform handles fan-in.
  private async handleSubscribe(request: Request): Promise<Response> {
    if (request.headers.get('upgrade') !== 'websocket') {
      return new Response('expected_websocket_upgrade', { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.state.acceptWebSocket(server);
    // Push the current state immediately so the subscriber doesn't have
    // to round-trip a separate GET.
    const factory = await this.load();
    server.send(JSON.stringify({ type: 'mood', mood: factory.mood } satisfies ServerMessage));
    const foyer = await this.foyerPresence();
    server.send(JSON.stringify({ type: 'presence', foyer } satisfies ServerMessage));
    return new Response(null, { status: 101, webSocket: client });
  }

  // §14.2: Hibernation API handlers. These execute when a hibernating
  // DO is woken by a socket event.
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }
    if (parsed.type === 'enter_foyer') {
      await this.state.storage.put<PresenceState>(`presence:${parsed.guest_id}`, {
        guest_id: parsed.guest_id,
        location: 'foyer',
        ghost_token: parsed.ghost_token,
        updated_at: Date.now(),
      });
      await this.broadcastPresence();
    } else if (parsed.type === 'leave_foyer') {
      await this.state.storage.delete(`presence:${parsed.guest_id}`);
      await this.broadcastPresence();
    }
    // hello messages are no-ops; they keep the socket alive across
    // hibernation cycles.
    void ws;
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    // The Hibernation API doesn't tell us which guest owned this socket
    // (we don't tag), so presence rows expire passively via the
    // 5-minute prune below.
    void ws;
  }

  async webSocketError(_ws: WebSocket, _err: unknown): Promise<void> {}

  private async load(): Promise<FactoryState> {
    const existing = await this.state.storage.get<FactoryState>('state');
    if (existing) return existing;
    const fresh: FactoryState = { mood: DEFAULT_MOOD, updated_at: Date.now() };
    await this.state.storage.put<FactoryState>('state', fresh);
    return fresh;
  }

  private async foyerPresence(): Promise<Array<{ ghost_token: string }>> {
    // 5-minute presence window — anything older is assumed gone.
    const cutoff = Date.now() - 5 * 60 * 1000;
    const map = await this.state.storage.list<PresenceState>({ prefix: 'presence:' });
    const foyer: Array<{ ghost_token: string }> = [];
    for (const value of map.values()) {
      if (value.location !== 'foyer') continue;
      if (value.updated_at < cutoff) continue;
      foyer.push({ ghost_token: value.ghost_token });
    }
    return foyer;
  }

  private async broadcastPresence(): Promise<void> {
    const foyer = await this.foyerPresence();
    this.broadcast({ type: 'presence', foyer });
  }

  private broadcast(message: ServerMessage): void {
    const payload = JSON.stringify(message);
    for (const ws of this.state.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        // Best-effort. Closed/erroring sockets are reaped by the platform.
      }
    }
  }
}
