import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../env.ts';
import { getShell, listDialShells } from '../shells.ts';

const GUEST_COOKIE = 'confectory_guest';

export const foyerRoutes = new Hono<{ Bindings: Env }>();

// §8.2, §8.3: the dial reflects the resonant layout for this guest.
// We compute it inside the guest's Durable Object so single-writer
// consistency holds, then return decorated entries the client can render.
foyerRoutes.get('/dial', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const dialShells = listDialShells();
  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);

  const res = await stub.fetch('https://do/dial', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      available_shell_ids: dialShells.map((s) => s.id),
    }),
  });
  if (!res.ok) return new Response(res.body, { status: res.status });

  const dial = (await res.json()) as {
    entries: Array<{ shell_id: string; angle: number; prominence: number }>;
    session_count: number;
  };

  const entries = dial.entries.map((entry) => {
    const shell = getShell(entry.shell_id);
    return {
      ...entry,
      name: shell?.name ?? entry.shell_id,
      typography: shell?.sign.typography ?? 'serif-display',
      portal_door_variant: shell?.portal_door_variant,
    };
  });

  return c.json({ entries, session_count: dial.session_count });
});

// §8.2: the guest settles on a name. We kick off speculative pre-gen
// for that shell so the threshold animation has content ready to serve.
foyerRoutes.post('/settle', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const body = (await c.req.json()) as { shell_id?: string };
  if (!body.shell_id) return c.json({ error: 'shell_id_required' }, 400);
  if (!getShell(body.shell_id)) return c.json({ error: 'unknown_shell' }, 404);

  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch('https://do/settle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ shell_id: body.shell_id }),
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
});
