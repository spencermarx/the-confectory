import { TELEMETRY_SIGNALS, type TelemetryEvent, isTelemetrySignal } from '@confectory/shared';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../env.ts';
import { recordEvent } from '../telemetry/recorder.ts';

const GUEST_COOKIE = 'confectory_guest';

export const telemetryRoutes = new Hono<{ Bindings: Env }>();

// §16.1: the signal catalog. Read by the client to know what it can emit.
telemetryRoutes.get('/signals', (c) => c.json({ signals: TELEMETRY_SIGNALS }));

// §16.3: ingest a client event. The Worker writes to Analytics Engine
// (high-volume, low-cardinality) and a per-guest D1 trail (so a Recipe
// Keeper can examine an individual session, §16.3).
telemetryRoutes.post('/event', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);
  const body = (await c.req.json()) as Partial<TelemetryEvent>;
  if (!body.signal || !isTelemetrySignal(body.signal)) {
    return c.json({ error: 'unknown_signal' }, 400);
  }
  if (typeof body.value !== 'number') {
    return c.json({ error: 'value_required' }, 400);
  }
  await recordEvent({ analytics: c.env.TELEMETRY, db: c.env.DB }, guestId, {
    signal: body.signal,
    value: body.value,
    ...(body.labels ? { labels: body.labels } : {}),
    ...(body.occurred_at !== undefined ? { occurred_at: body.occurred_at } : {}),
  });
  return c.json({ ok: true });
});

// §15.3: simple per-guest signal trail readout for the dashboard MVP.
telemetryRoutes.get('/trail', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);
  const signal = c.req.query('signal');
  const limit = Math.min(Number.parseInt(c.req.query('limit') ?? '50', 10), 500);
  let query =
    'SELECT signal_name, value_json, occurred_at FROM telemetry_events WHERE guest_id = ?';
  const args: unknown[] = [guestId];
  if (signal) {
    query += ' AND signal_name = ?';
    args.push(signal);
  }
  query += ' ORDER BY occurred_at DESC LIMIT ?';
  args.push(limit);
  const result = await c.env.DB.prepare(query)
    .bind(...args)
    .all<{ signal_name: string; value_json: string; occurred_at: number }>();
  return c.json({ events: result.results });
});
