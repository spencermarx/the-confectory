import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { Env } from '../env.ts';

const GUEST_COOKIE = 'confectory_guest';

export const sessionRoutes = new Hono<{ Bindings: Env }>();

// §8: a guest arrives. Anonymous by default. Encrypted cookie pins them to
// their Durable Object so the factory remembers them across requests.
sessionRoutes.post('/start', async (c) => {
  const existing = getCookie(c, GUEST_COOKIE);
  const guestId = existing ?? crypto.randomUUID();

  if (!existing) {
    setCookie(c, GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT !== 'development',
      sameSite: 'Lax',
      // §17.1: 90 days, renewable on activity.
      maxAge: 60 * 60 * 24 * 90,
      path: '/',
    });
  }

  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch('https://do/start', { method: 'POST' });
  const state = await res.json();

  return c.json({ guest_id: guestId, ...(state as Record<string, unknown>) });
});

sessionRoutes.get('/me', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch('https://do/state');
  return new Response(res.body, { status: res.status, headers: res.headers });
});
