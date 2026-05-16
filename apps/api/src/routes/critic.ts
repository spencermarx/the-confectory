import { type PhaseBand, adaptiveSampleRate, targetBandFor } from '@confectory/shared';
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

// §22.3, §6.3: recompute the adaptive slow-Critic sample rate from
// the trailing Critic's Notebook stats and publish it to the
// singleton FactoryStateDO. Phase 3 calls this from an ops cron;
// Phase 4 may schedule it via cron triggers in the Worker.
criticRoutes.post('/retune', async (c) => {
  const phase = (c.req.query('phase') as PhaseBand | null) ?? 'phase_3';
  const entries = await recentRejections(c.env.DB, { limit: 200 });
  const trailing_flagged = entries.length;
  // Approximate the accepted denominator from the per-guest visit
  // count over the same window — Phase 3 will switch to an
  // Analytics Engine count once that pipeline is queryable.
  const acceptedRow = (await c.env.DB.prepare(
    'SELECT COUNT(*) AS n FROM guest_visits WHERE entered_at > ?',
  )
    .bind(Date.now() - 24 * 60 * 60 * 1000)
    .all<{ n: number }>()) as unknown as { results: Array<{ n: number }> };
  const trailing_accepted = Math.max(0, (acceptedRow.results[0]?.n ?? 0) - trailing_flagged);

  const factoryId = c.env.FACTORY_STATE.idFromName('global');
  const factoryStub = c.env.FACTORY_STATE.get(factoryId);
  const currentRes = await factoryStub.fetch('https://do/sample-rate');
  const current = ((await currentRes.json()) as { rate: number }).rate;
  const result = adaptiveSampleRate({
    trailing_flagged,
    trailing_accepted,
    target_band: targetBandFor(phase),
    current_rate: current,
  });
  await factoryStub.fetch('https://do/sample-rate', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rate: result.next_rate }),
  });
  return c.json({
    next_rate: result.next_rate,
    flagged_rate: result.flagged_rate,
    reason: result.reason,
    sample_window: { trailing_flagged, trailing_accepted },
  });
});
