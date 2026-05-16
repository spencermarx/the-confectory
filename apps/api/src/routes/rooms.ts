import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../env.ts';
import { getShell, listDialShells } from '../shells.ts';

const GUEST_COOKIE = 'confectory_guest';

export const roomRoutes = new Hono<{ Bindings: Env }>();

// §5.1: threshold crossed. The DO commits the destination room, runs
// (or fetches the cached result of) room assembly, and returns the
// manifest the client uses to mount the scene.
roomRoutes.post('/threshold', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const body = (await c.req.json()) as { destination_shell_id?: string };
  const destinationId = body.destination_shell_id;
  if (!destinationId) return c.json({ error: 'destination_required' }, 400);
  const destination = getShell(destinationId);
  if (!destination) return c.json({ error: 'unknown_shell' }, 404);

  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch('https://do/threshold', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      destination_shell_id: destinationId,
      candidate_shell_ids: listDialShells().map((s) => s.id),
    }),
  });
  return new Response(res.body, { status: res.status, headers: res.headers });
});

// §5.1: a manifest endpoint the client polls if it hit a "pending"
// generation state on threshold cross.
roomRoutes.get('/:room_id/manifest', async (c) => {
  const guestId = getCookie(c, GUEST_COOKIE);
  if (!guestId) return c.json({ error: 'no_session' }, 401);

  const id = c.env.GUEST_SESSION.idFromName(guestId);
  const stub = c.env.GUEST_SESSION.get(id);
  const res = await stub.fetch(
    `https://do/manifest?room_id=${encodeURIComponent(c.req.param('room_id'))}`,
  );
  return new Response(res.body, { status: res.status, headers: res.headers });
});
