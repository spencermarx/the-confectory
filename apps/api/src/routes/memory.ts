import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../env.ts';

const GUEST_COOKIE = 'confectory_guest';

export const memoryRoutes = new Hono<{ Bindings: Env }>();

// §7.3: top-K episodic memories for the current guest, scored by
// similarity to `q` (the caller composes the current room+mood).
memoryRoutes.get('/episodic', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);
  const q = c.req.query('q');
  if (!q) return c.json({ error: 'q_required' }, 400);
  const topK = c.req.query('top_k') ?? '3';
  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch(
    `https://do/memory?q=${encodeURIComponent(q)}&top_k=${encodeURIComponent(topK)}`,
  );
  return new Response(res.body, { status: res.status, headers: res.headers });
});

// §7.1: observe a transient event the summarizer should consider.
memoryRoutes.post('/observe', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);
  const body = await c.req.json();
  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch('https://do/observe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
});

// §7.2: end the session. Triggers summarization; clears transient memory.
memoryRoutes.post('/end-session', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);
  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch('https://do/end-session', { method: 'POST' });
  return new Response(res.body, { status: res.status, headers: res.headers });
});
