import { type DialEntry, resonantLayout } from '@confectory/shared';
import type { ConsequenceTypeId, Guest, GuestLocation, ShellId } from '@confectory/shared';
import {
  type AssembledRoom,
  InProcessMemory,
  RoomAssembler,
  type SessionEvent,
  applyConsequence,
  summarizeSession,
} from '../engine/index.ts';
import { AcceptingCritic, InProcessFoundry } from '../engine/providers/in-process.ts';
import type { MemoryProvider } from '../engine/providers/memory.ts';
import type { Env } from '../env.ts';
import { getShell } from '../shells.ts';

interface StoredState {
  guest: Guest;
  session_count: number;
  pending_settle?: { shell_id: ShellId; at: number };
  current_manifest?: AssembledRoom;
  session_events: SessionEvent[];
  // §5.2: cached speculative pre-generations, keyed by shell_id.
  // TTL of one minute per §5.2; older entries are pruned on read.
  speculative_cache?: Record<ShellId, { manifest: AssembledRoom; cached_at: number }>;
}

interface DialRequestBody {
  available_shell_ids: ShellId[];
}

interface SettleRequestBody {
  shell_id: ShellId;
}

interface ThresholdRequestBody {
  destination_shell_id: ShellId;
  candidate_shell_ids: ShellId[];
}

interface ApplyConsequenceBody {
  type_id: ConsequenceTypeId;
  room_id?: string;
}

interface ObserveEventBody {
  event: Omit<SessionEvent, 'event_id' | 'occurred_at'> & {
    occurred_at?: number;
  };
}

// §3.2, §5: per-guest Durable Object. Single-writer consistency.
// Phase 1 grows over weeks 5-13:
//   - Room assembly on threshold cross (week 5-7).
//   - Consequence apply + factory opinion + ticket stub (week 11-13).
//   - Session end → summarization → episodic memory (week 11-13).
export class GuestSessionDO implements DurableObject {
  private readonly state: DurableObjectState;
  private readonly env: Env;
  private readonly assembler: RoomAssembler;
  // §7.1: episodic memory. Phase 1 keeps a per-DO in-process store; the
  // Worker swaps in VectorizeMemory once the binding is configured.
  private readonly memory: MemoryProvider;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.assembler = new RoomAssembler(new InProcessFoundry(), new AcceptingCritic());
    this.memory = new InProcessMemory();
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
      case '/threshold':
        return this.handleThreshold(request);
      case '/manifest':
        return this.handleManifest(url);
      case '/consequence':
        return this.handleConsequence(request);
      case '/observe':
        return this.handleObserve(request);
      case '/end-session':
        return this.handleEndSession();
      case '/memory':
        return this.handleMemory(url);
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
          session_events: [],
        }
      : {
          guest: this.createGuest(now),
          session_count: 1,
          session_events: [],
        };

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

  // §8.3: compute the resonant layout server-side.
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

  // §8.2, §5.2: settle on a name. Kicks off speculative pre-generation
  // of that destination so the threshold crossing returns instantly.
  private async handleSettle(request: Request): Promise<Response> {
    const body = (await request.json()) as SettleRequestBody;
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });

    const next: StoredState = {
      ...stored,
      pending_settle: { shell_id: body.shell_id, at: Date.now() },
    };
    await this.state.storage.put<StoredState>('state', next);

    // Fire-and-forget pre-gen. The 8s soft budget per §5.2 is enforced
    // by the assembler's per-call latency; if the guest crosses the
    // threshold first, the threshold handler falls through to synchronous
    // assembly. waitUntil keeps the work alive past the response.
    this.state.waitUntil(this.precomputeManifest(body.shell_id).catch(() => {}));

    return Response.json({ pending_settle: next.pending_settle });
  }

  // §5.2: speculative pre-generation. Computes the destination manifest
  // and caches it on the guest. Idempotent: a fresh cache entry shadows
  // any older one for the same shell.
  private async precomputeManifest(shell_id: ShellId): Promise<void> {
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return;
    const destination = getShell(shell_id);
    if (!destination) return;

    const candidates = this.allDialShells();
    const factoryMood = await this.fetchFactoryMood();
    const manifest = await this.assembler.assemble({
      shell: destination,
      guest_id: this.state.id.toString(),
      candidate_shells: candidates,
      factory_mood: factoryMood,
      guest_consequence_severity: this.consequenceSeverity(stored.guest),
      guest_consequences: new Set(stored.guest.consequences.map((c) => c.type)),
      available_ol_ids: Object.keys(stored.guest.oompa_loompa_relationships),
    });

    // Re-read the latest stored state in case other handlers ran while
    // we were assembling. Re-apply the cache delta and write back.
    const latest = (await this.state.storage.get<StoredState>('state')) ?? stored;
    const cache = pruneCache(latest.speculative_cache, Date.now());
    cache[shell_id] = { manifest, cached_at: Date.now() };
    await this.state.storage.put<StoredState>('state', { ...latest, speculative_cache: cache });
  }

  private allDialShells(): NonNullable<ReturnType<typeof getShell>>[] {
    // Loaded lazily — the shell registry is in-memory in Phase 1.
    // Phase 2.1 promotes this into a KV-backed read so Recipe Keeper
    // edits flow without redeploying (§3.4).
    const ids = ['the-hush-before', 'the-treacle-deep', 'the-foundry-door', 'the-elevator'];
    return ids.map((id) => getShell(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  }

  private async fetchFactoryMood(): Promise<ReturnType<typeof JSON.parse>> {
    const factoryId = this.env.FACTORY_STATE.idFromName('global');
    const factoryStub = this.env.FACTORY_STATE.get(factoryId);
    const factoryRes = await factoryStub.fetch('https://do/mood');
    return factoryRes.json();
  }

  // §5.1: threshold crossed. Checks the speculative cache first (§5.2);
  // falls through to synchronous assembly only if the cache misses.
  private async handleThreshold(request: Request): Promise<Response> {
    const body = (await request.json()) as ThresholdRequestBody;
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });

    const destination = getShell(body.destination_shell_id);
    if (!destination) return new Response('unknown_shell', { status: 404 });

    const now = Date.now();
    const cache = pruneCache(stored.speculative_cache, now);
    const cached = cache[destination.id];
    let manifest: AssembledRoom;
    let served_from_cache = false;
    if (cached) {
      manifest = cached.manifest;
      served_from_cache = true;
    } else {
      const candidates = body.candidate_shell_ids
        .map((id) => getShell(id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));
      const factoryMood = await this.fetchFactoryMood();
      manifest = await this.assembler.assemble({
        shell: destination,
        guest_id: this.state.id.toString(),
        candidate_shells: candidates,
        factory_mood: factoryMood,
        guest_consequence_severity: this.consequenceSeverity(stored.guest),
        guest_consequences: new Set(stored.guest.consequences.map((c) => c.type)),
        available_ol_ids: Object.keys(stored.guest.oompa_loompa_relationships),
      });
    }

    // §5.3: commit the destination. Discard the cached entry we just
    // consumed; other speculative entries stay for the 10s grace
    // period the spec calls out (the TTL prune handles eviction).
    delete cache[destination.id];

    const { pending_settle: _settled, ...rest } = stored;
    const next: StoredState = {
      ...rest,
      guest: {
        ...stored.guest,
        last_active_at: now,
        current_location: 'in_room',
        current_room_id: `${this.state.id.toString()}:${destination.id}:${now}`,
        visited_shell_ids: [...stored.guest.visited_shell_ids, destination.id],
      },
      current_manifest: manifest,
      speculative_cache: cache,
    };
    await this.state.storage.put<StoredState>('state', next);

    // §5.1 step 6: as soon as the guest is in the new room, kick off
    // pre-generation of the new room's downstream rooms. Phase 2 fires
    // for each resolved door; Phase 3 (§22.1) layers in the prediction
    // model that ranks door likelihood.
    for (const door of manifest.resolved_doors) {
      this.state.waitUntil(this.precomputeManifest(door.destination_shell_id).catch(() => {}));
    }

    // §22.3, §6.2: slow Critic at 25% sample on accepted artifacts.
    // Skip when served from cache — those artifacts were sampled when
    // the cache entry was originally produced.
    if (!served_from_cache) {
      const canonicalNames = body.candidate_shell_ids
        .map((id) => getShell(id)?.name)
        .filter((n): n is string => Boolean(n));
      for (const artifact of manifest.accepted_artifacts) {
        if (Math.random() >= 0.25) continue;
        this.state.waitUntil(
          this.env.BACKGROUND.send({
            kind: 'slow_critic_review',
            shell_id: destination.id,
            shell_name: destination.name,
            canonical_room_names: canonicalNames,
            artifact: artifact.artifact,
            artifact_kind: artifact.kind,
            ...(artifact.surface_slot ? { surface_slot: artifact.surface_slot } : {}),
          }).catch(() => {}),
        );
      }
    }

    return Response.json({
      room_id: next.guest.current_room_id,
      manifest,
      served_from_cache,
    });
  }

  private async handleManifest(url: URL): Promise<Response> {
    const requested = url.searchParams.get('room_id');
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored?.current_manifest || stored.guest.current_room_id !== requested) {
      return new Response('not_found', { status: 404 });
    }
    return Response.json({
      room_id: stored.guest.current_room_id,
      manifest: stored.current_manifest,
    });
  }

  // §4.6, §21.5: apply a consequence. Updates the guest, the ticket
  // stub, the factory opinion. Logs the event so summarization can
  // preserve it.
  private async handleConsequence(request: Request): Promise<Response> {
    const body = (await request.json()) as ApplyConsequenceBody;
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });
    const roomId = body.room_id ?? stored.guest.current_room_id;
    if (!roomId) return new Response('not_in_room', { status: 400 });

    const result = applyConsequence({
      guest: stored.guest,
      type_id: body.type_id,
      applied_in_room_id: roomId,
      now: Date.now(),
    });

    if (result.status === 'unknown_type') {
      return new Response('unknown_consequence_type', { status: 404 });
    }
    if (result.status === 'already_applied') {
      return Response.json({ status: 'already_applied' });
    }

    const event: SessionEvent = {
      event_id: `evt-${Date.now()}`,
      shell_id: stored.guest.current_room_id?.split(':')[1] ?? 'the-foyer',
      description: `Carried the consequence "${result.type.name}".`,
      emotional_weight: Math.min(1, Math.abs(result.type.affects_factory_opinion) * 10),
      occurred_at: Date.now(),
      consequence_applied: result.consequence,
    };

    const next: StoredState = {
      ...stored,
      guest: result.guest,
      session_events: [...stored.session_events, event],
    };
    await this.state.storage.put<StoredState>('state', next);

    return Response.json({
      status: 'applied',
      consequence: result.consequence,
      visible_effects: result.type.visible_effects,
      ticket_stub: result.guest.ticket_stub,
      factory_opinion: result.guest.factory_opinion,
    });
  }

  // §7.1: observe a transient event. The summarization job (§7.2)
  // decides which ones survive into episodic memory.
  private async handleObserve(request: Request): Promise<Response> {
    const body = (await request.json()) as ObserveEventBody;
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });
    const event: SessionEvent = {
      event_id: `evt-${Date.now()}-${stored.session_events.length}`,
      occurred_at: body.event.occurred_at ?? Date.now(),
      ...body.event,
    };
    const next: StoredState = {
      ...stored,
      session_events: [...stored.session_events, event],
    };
    await this.state.storage.put<StoredState>('state', next);
    return Response.json({ event_id: event.event_id });
  }

  // §7.2: session end. Summarize transient memory into episodic
  // entries; clear the transient buffer.
  private async handleEndSession(): Promise<Response> {
    const stored = await this.state.storage.get<StoredState>('state');
    if (!stored) return new Response('no_session', { status: 404 });

    const factoryId = this.env.FACTORY_STATE.idFromName('global');
    const factoryStub = this.env.FACTORY_STATE.get(factoryId);
    const factoryRes = await factoryStub.fetch('https://do/mood');
    const factoryMood = (await factoryRes.json()) as ReturnType<typeof JSON.parse>;

    const summary = await summarizeSession(this.memory, {
      guest: stored.guest,
      session_events: stored.session_events,
      factory_mood: factoryMood,
    });

    const next: StoredState = {
      ...stored,
      guest: {
        ...stored.guest,
        factory_opinion: clamp(stored.guest.factory_opinion + summary.factory_opinion_delta, -1, 1),
      },
      session_events: [],
    };
    await this.state.storage.put<StoredState>('state', next);

    return Response.json({
      prose_summary: summary.prose_summary,
      episodic_entries: summary.episodic_entries,
      factory_opinion: next.guest.factory_opinion,
    });
  }

  // §7.3: retrieve top-K episodic memories. Dialogue routes pull this
  // into the prompt context (already plumbed in the dialogue path).
  private async handleMemory(url: URL): Promise<Response> {
    const q = url.searchParams.get('q');
    if (!q) return new Response('q_required', { status: 400 });
    const top_k = Number.parseInt(url.searchParams.get('top_k') ?? '3', 10);
    const memories = await this.memory.retrieve({
      guest_id: this.state.id.toString(),
      query: q,
      top_k,
    });
    return Response.json({ memories });
  }

  private consequenceSeverity(guest: Guest): number {
    // §5.2 step 3: blend the guest's consequence state into the mood.
    // Phase 1 uses a count proxy; Phase 2 layers in severity weights.
    return Math.min(1, guest.consequences.length / 5);
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

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// §5.2: speculative cache TTL is one minute. Entries older than that
// are evicted on every read so we never serve a stale mood-conditioned
// manifest.
const SPECULATIVE_TTL_MS = 60_000;

function pruneCache(
  cache: StoredState['speculative_cache'],
  now: number,
): NonNullable<StoredState['speculative_cache']> {
  const next: Record<string, { manifest: AssembledRoom; cached_at: number }> = {};
  if (!cache) return next;
  for (const [id, entry] of Object.entries(cache)) {
    if (now - entry.cached_at <= SPECULATIVE_TTL_MS) {
      next[id] = entry;
    }
  }
  return next;
}
