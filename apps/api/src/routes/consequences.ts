import { listConsequenceTypes } from '@confectory/shells';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../env.ts';

const GUEST_COOKIE = 'confectory_guest';

export const consequenceRoutes = new Hono<{ Bindings: Env }>();

// §4.6: the consequence catalog. Read-only at runtime.
consequenceRoutes.get('/types', (c) => {
  return c.json({ types: listConsequenceTypes() });
});

// §21.5: apply a consequence to the guest. Idempotent on (guest, room, type).
consequenceRoutes.post('/apply', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);
  const body = await c.req.json();
  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch('https://do/consequence', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
});
