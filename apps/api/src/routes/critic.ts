import { Hono } from 'hono';
import type { Env } from '../env.ts';
import { logRejection, recentRejections } from '../telemetry/critic-notebook.ts';

export const criticRoutes = new Hono<{ Bindings: Env }>();

// §15.3: the Critic's Notebook MVP. Phase 1 keeps the writer simple
// (the room assembler will fan-out into it once the rejection list is
// surfaced through the threshold response).

interface LogBody {
  artifact_kind: 'sign' | 'surface' | 'dialogue';
  reason: string;
  shell_id: string;
  surface_slot?: string;
  attempts: number;
  artifact_text?: string;
  character_id?: string;
}

criticRoutes.post('/log', async (c) => {
  const body = (await c.req.json()) as LogBody;
  await logRejection(c.env.DB, {
    artifact_kind: body.artifact_kind,
    reason: body.reason as
      | 'OFF_VOICE'
      | 'INCOHERENT'
      | 'BROKEN_CHARACTER'
      | 'INVENTED_FACT'
      | 'BAD_METER'
      | 'TONE_MISMATCH',
    shell_id: body.shell_id,
    ...(body.surface_slot ? { surface_slot: body.surface_slot } : {}),
    attempts: body.attempts,
    ...(body.artifact_text ? { artifact_text: body.artifact_text } : {}),
    ...(body.character_id ? { character_id: body.character_id } : {}),
    occurred_at: Date.now(),
  });
  return c.json({ ok: true });
});

criticRoutes.get('/recent', async (c) => {
  const limit = Number.parseInt(c.req.query('limit') ?? '50', 10);
  const shell_id = c.req.query('shell_id');
  const reason = c.req.query('reason');
  const entries = await recentRejections(c.env.DB, {
    limit,
    ...(shell_id ? { shell_id } : {}),
    ...(reason ? { reason } : {}),
  });
  return c.json({ entries });
});
