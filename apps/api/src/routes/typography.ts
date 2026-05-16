import { Hono } from 'hono';
import type { Env } from '../env.ts';
import { listShells } from '../shells.ts';

export const typographyRoutes = new Hono<{ Bindings: Env }>();

// §22.4: dial typography pre-loading on foyer entry. Returns the
// typography registry as a single batched response so the client can
// fetch every WOFF2 the dial might display in one round trip. At
// Phase 1 scale (~200 shells × ~20KB/font) this is ~4MB, which the
// architect's note flags as acceptable.
typographyRoutes.get('/registry', (c) => {
  const seen = new Map<string, { font_url: string; used_by_shells: string[] }>();
  for (const shell of listShells()) {
    const id = shell.sign.typography;
    const existing = seen.get(id);
    if (existing) {
      existing.used_by_shells.push(shell.id);
      continue;
    }
    // Phase 2 maps the typography id to its R2 asset URL. The
    // production map lives in a TYPOGRAPHY_KV namespace; here we
    // synthesize a stable convention so the client cache key matches.
    seen.set(id, {
      font_url: `/api/typography/font/${encodeURIComponent(id)}.woff2`,
      used_by_shells: [shell.id],
    });
  }
  return c.json({
    typography: [...seen.entries()].map(([id, value]) => ({ id, ...value })),
  });
});
