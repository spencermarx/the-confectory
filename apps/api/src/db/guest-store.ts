import type { AppliedConsequence, Guest, Mark, ShellId } from '@confectory/shared';

// §3.4, §7.1: structural memory in D1. The DO is the single-writer
// source of truth in flight; this module mirrors the durable bits so
// they survive DO eviction and so a Recipe Keeper can inspect a guest
// directly via the database.

interface D1Store {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
    };
  };
  batch?(statements: unknown[]): Promise<unknown>;
}

const UPSERT_GUEST = `INSERT INTO guests
  (id, user_id, is_anonymous, session_started_at, last_active_at,
   current_room_id, current_location, factory_opinion, respawn_count,
   ticket_stub_visual_state, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    user_id = excluded.user_id,
    is_anonymous = excluded.is_anonymous,
    last_active_at = excluded.last_active_at,
    current_room_id = excluded.current_room_id,
    current_location = excluded.current_location,
    factory_opinion = excluded.factory_opinion,
    respawn_count = excluded.respawn_count,
    ticket_stub_visual_state = excluded.ticket_stub_visual_state,
    updated_at = excluded.updated_at`;

export async function upsertGuest(db: D1Store, guest: Guest, now: number): Promise<void> {
  await db
    .prepare(UPSERT_GUEST)
    .bind(
      guest.id,
      guest.user_id ?? null,
      guest.is_anonymous ? 1 : 0,
      guest.session_started_at,
      guest.last_active_at,
      guest.current_room_id ?? null,
      guest.current_location,
      guest.factory_opinion,
      guest.respawn_count,
      guest.ticket_stub.visual_state,
      guest.session_started_at,
      now,
    )
    .run();
}

export async function recordVisit(
  db: D1Store,
  guest_id: string,
  shell_id: ShellId,
  room_id: string,
  entered_at: number,
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO guest_visits (guest_id, shell_id, room_id, entered_at) VALUES (?, ?, ?, ?)',
    )
    .bind(guest_id, shell_id, room_id, entered_at)
    .run();
}

export async function recordConsequence(
  db: D1Store,
  guest_id: string,
  consequence: AppliedConsequence,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO applied_consequences
        (guest_id, consequence_type_id, applied_in_room_id, applied_at, fades_at, visible_effects_json)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(guest_id, applied_in_room_id, consequence_type_id) DO NOTHING`,
    )
    .bind(
      guest_id,
      consequence.type,
      consequence.applied_in_room_id,
      consequence.applied_at,
      consequence.fades_at ?? null,
      JSON.stringify(consequence.visible_effects),
    )
    .run();
}

export async function recordMark(db: D1Store, guest_id: string, mark: Mark): Promise<void> {
  await db
    .prepare('INSERT INTO ticket_stub_marks (guest_id, mark_type, created_at) VALUES (?, ?, ?)')
    .bind(guest_id, mark.type, mark.at)
    .run();
}
