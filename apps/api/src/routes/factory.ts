import { partialMoodVectorSchema } from '@confectory/shared';
import { Hono } from 'hono';
import type { Env } from '../env.ts';

export const factoryRoutes = new Hono<{ Bindings: Env }>();

const FACTORY_SINGLETON = 'global';

// §15.3: the Mood Console. Reads and writes the global factory mood.
// "Real-time updates: changing the Console immediately affects new room
// generations." The singleton DO is the writer; read endpoints are
// served from there too so guests see the same world.
factoryRoutes.get('/mood', async (c) => {
  const id = c.env.FACTORY_STATE.idFromName(FACTORY_SINGLETON);
  const stub = c.env.FACTORY_STATE.get(id);
  const res = await stub.fetch('https://do/mood');
  return new Response(res.body, { status: res.status, headers: res.headers });
});

// §14.2: WebSocket subscribe. Clients get an immediate snapshot of
// the mood and foyer co-presence, then live updates as they happen.
factoryRoutes.get('/subscribe', async (c) => {
  if (c.req.header('upgrade') !== 'websocket') {
    return c.json({ error: 'expected_websocket_upgrade' }, 426);
  }
  const id = c.env.FACTORY_STATE.idFromName(FACTORY_SINGLETON);
  const stub = c.env.FACTORY_STATE.get(id);
  return stub.fetch('https://do/subscribe', {
    headers: { upgrade: 'websocket' },
  });
});

factoryRoutes.put('/mood', async (c) => {
  // Phase 1: any authenticated caller can write; Phase 2 layers in
  // Better-Auth (§17.2) so only Recipe Keepers / the Founder can.
  const body = await c.req.json();
  const parsed = partialMoodVectorSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_mood', issues: parsed.error.issues }, 400);
  }

  const id = c.env.FACTORY_STATE.idFromName(FACTORY_SINGLETON);
  const stub = c.env.FACTORY_STATE.get(id);
  const res = await stub.fetch('https://do/mood', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
});
