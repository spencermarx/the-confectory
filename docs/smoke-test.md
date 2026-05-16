# Smoke test

What you can experience locally with just node + pnpm, no Cloudflare
account, no Postgres, no model API keys.

## One-time setup

```bash
pnpm install
```

## Run it

```bash
pnpm smoke
```

This boots two processes concurrently via Turbo:

- `@confectory/api` — Cloudflare Worker via `wrangler dev --local` on
  port **8787**. Wrangler creates in-memory stand-ins for D1, KV, R2,
  DOs, and Queues. Vectorize and Workers AI bindings are present but
  unused locally (see below).
- `@confectory/web` — Vite dev server on port **5173** with `/api`
  proxied to the Worker.

Open **http://localhost:5173**.

## What works

- **Session boot** (§17.1). On first load the Worker drops an
  encrypted `confectory_guest` cookie and creates a per-guest Durable
  Object.
- **The Sweetwright greets you** (§17.3 in-character consent moment).
  A short line appears as a diegetic subtitle.
- **The Foyer scene** (§8). Placeholder geometry — a dark room with
  the Portal Door on the far wall, the brass dial to its right, the
  ticket stub in the corner. The actual hand-painted foyer mesh is
  authored in Blender per §3.7 and lives in R2; this smoke test uses
  primitive geometry as a stand-in.
- **The brass dial** (§8.2). Click and drag it to rotate. It snaps
  to the nearest shell entry after ~500ms of stillness. The sign and
  name plate update as the needle sweeps.
- **The Resonant Layout** (§8.3). For new guests the dial uses the
  stable visit-order layout; after 10 sessions it switches to the
  recency-weighted resonant ordering.
- **Cross the threshold.** Once the dial settles, an
  *Open the door to …* button appears at the bottom of the screen.
  Click it: the Worker runs the room assembly pipeline (§5.1-§5.2),
  the manifest comes back, and the InteriorRoom scene mounts.
- **Inside a destination room.** The lighting is tinted by the
  room's mood vector (whimsy warms, menace cools, indulgence
  saturates). The sign on the back wall shows the canonical name.
  Resolved props are scattered as little spheres. A HUD shows the
  room's mood and any served-from-fallback note.
- **Return to the foyer.** The bottom-left button takes you back.
- **Speculative pre-generation** (§5.2). When you settle on a name
  the Worker pre-computes that room's manifest in the background.
  On commit the second hop is also pre-generated. Watch the wrangler
  logs to see the cache hits.
- **Slow Critic queue** (§22.3). Every accepted artifact has a
  chance to land in the queue consumer (sample rate starts at 25%).
  The verdicts that score below 0.6 land in the Critic's Notebook.
- **Telemetry** (§16). The Pause emits after 3 seconds of no input.
  Dial-settle time, threshold time, cost-per-session signals all
  write to D1.

## What is intentionally stubbed

- **No real 3D meshes.** `mesh_asset` paths point at R2 keys that
  don't exist locally; the Phase 1 placeholder geometry stands in.
- **No audio.** TTS providers return placeholder R2 URLs; the
  ElevenLabs render is fire-and-forget against a real API key,
  which we don't have locally.
- **Co-presence ghosts need a second window.** Open
  http://localhost:5173 in another browser profile to see the
  faint silhouettes appear in both foyers.
- **Generation is deterministic.** Without an `[ai]` binding that
  reaches a real Cloudflare account, the DO uses the in-process
  providers (`InProcessFoundry`, `AcceptingCritic`,
  `InProcessSlowCritic`). Signs come back as the shell name; OL
  lines come back as `(shell-id · character-id is quiet today.)`.
  This is by design so the smoke test is reproducible.

## CMS (Recipe Keeper console)

Not part of `pnpm smoke` because Payload needs Postgres.

```bash
# 1. Start Postgres (any version; defaults to confectory/confectory on 5432).
# 2. Set DATABASE_URL if it differs from the default.
DATABASE_URL=postgres://localhost:5432/confectory pnpm dev:cms
```

Then visit http://localhost:3000/admin. The Mood Console lives at
`/admin/mood-console`; the Critic's Notebook at
`/admin/critics-notebook`; the Telemetry dashboard at
`/admin/telemetry`. Phase 2 wires Better-Auth (passkey-only); set
`BETTER_AUTH_SECRET` and run the auth migrations before you sign in.

## Known surface gaps to fix later

- The `wrangler.toml` D1 `database_id` and KV `id` are `REPLACE_ME`.
  `wrangler dev` doesn't care; `wrangler deploy` does.
- The Vectorize binding warns on boot — local stand-in isn't
  supported yet. The DO uses `InProcessMemory` in dev so this is
  a warning only.
- The Worker AI binding warns that calls would charge the real
  account. The DO short-circuits to in-process when
  `env.ENVIRONMENT === 'development'`, so no charges happen.
- The smoke test does not yet apply D1 migrations automatically.
  Run `pnpm --filter @confectory/api exec wrangler d1 migrations apply confectory --local`
  once if you want telemetry trails and structural-memory backfill
  to persist.
