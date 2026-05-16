import type { RejectedArtifact } from '../engine/index.ts';

// §6.2, §15.3: the Critic's Notebook. The fast Critic's rejections
// (plus the slow Critic's later annotations) land here and surface in
// the Recipe Keeper's review UI. Phase 1 stores ring-buffer-style in
// D1; Phase 2 layers in the slow Critic's annotations.

interface D1ForCritic {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      all<T>(): Promise<{ results: T[] }>;
    };
  };
  exec?(query: string): Promise<unknown>;
}

export interface CriticLogEntry {
  artifact_kind: RejectedArtifact['kind'];
  reason: RejectedArtifact['reason'];
  shell_id: string;
  surface_slot?: string;
  attempts: number;
  artifact_text?: string;
  character_id?: string;
  occurred_at: number;
}

// §15.2: the rejection_corpus collection in Payload mirrors this shape.
// Phase 1 uses a dedicated D1 table for low-latency Worker writes;
// Phase 2 copies/indexes the rows into Payload via a background job.
const SCHEMA = `CREATE TABLE IF NOT EXISTS critic_rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_kind TEXT NOT NULL,
  reason TEXT NOT NULL,
  shell_id TEXT NOT NULL,
  surface_slot TEXT,
  attempts INTEGER NOT NULL,
  artifact_text TEXT,
  character_id TEXT,
  occurred_at INTEGER NOT NULL
);`;

export async function ensureCriticTable(db: D1ForCritic): Promise<void> {
  if (typeof db.exec === 'function') {
    await db.exec(SCHEMA);
  }
}

export async function logRejection(db: D1ForCritic, entry: CriticLogEntry): Promise<void> {
  await db
    .prepare(
      `INSERT INTO critic_rejections
      (artifact_kind, reason, shell_id, surface_slot, attempts, artifact_text, character_id, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      entry.artifact_kind,
      entry.reason,
      entry.shell_id,
      entry.surface_slot ?? null,
      entry.attempts,
      entry.artifact_text ?? null,
      entry.character_id ?? null,
      entry.occurred_at,
    )
    .run();
}

export async function recentRejections(
  db: D1ForCritic,
  options: { limit?: number; shell_id?: string; reason?: string } = {},
): Promise<CriticLogEntry[]> {
  const limit = Math.min(options.limit ?? 50, 200);
  const filters: string[] = [];
  const args: unknown[] = [];
  if (options.shell_id) {
    filters.push('shell_id = ?');
    args.push(options.shell_id);
  }
  if (options.reason) {
    filters.push('reason = ?');
    args.push(options.reason);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const query = `SELECT artifact_kind, reason, shell_id, surface_slot, attempts, artifact_text, character_id, occurred_at FROM critic_rejections ${where} ORDER BY occurred_at DESC LIMIT ?`;
  args.push(limit);
  const result = await db
    .prepare(query)
    .bind(...args)
    .all<CriticLogEntry>();
  return result.results;
}
