import { Hono } from 'hono';
import { InProcessSlowCritic } from './engine/providers/slow-critic.ts';
import type { BackgroundJob, Env } from './env.ts';
import { consequenceRoutes } from './routes/consequences.ts';
import { criticRoutes } from './routes/critic.ts';
import { dialogueRoutes } from './routes/dialogue.ts';
import { factoryRoutes } from './routes/factory.ts';
import { foyerRoutes } from './routes/foyer.ts';
import { healthRoutes } from './routes/health.ts';
import { memoryRoutes } from './routes/memory.ts';
import { roomRoutes } from './routes/rooms.ts';
import { sessionRoutes } from './routes/session.ts';
import { telemetryRoutes } from './routes/telemetry.ts';
import { typographyRoutes } from './routes/typography.ts';
import { logRejection } from './telemetry/critic-notebook.ts';

const app = new Hono<{ Bindings: Env }>();

// Friendly root response — most people hitting :8787 directly meant
// to open the web app at :5173. Give them a nudge instead of 404.
app.get('/', (c) =>
  c.html(`<!doctype html><html><head><meta charset="utf-8" /><title>The Confectory — API</title>
<style>body{background:#1a1410;color:#f6e7c3;font-family:serif;display:grid;place-items:center;height:100vh;margin:0;letter-spacing:.04em;line-height:1.6}main{max-width:32rem;padding:2rem;text-align:center}a{color:#f6c97f}</style>
</head><body><main>
<h1 style="font-style:italic;margin-top:0">The Confectory — API</h1>
<p>You've reached the worker. The guest-facing app lives at
<a href="http://localhost:5173">http://localhost:5173</a>.</p>
<p style="opacity:.6;font-size:.85rem">environment: ${c.env.ENVIRONMENT}</p>
</main></body></html>`),
);

app.route('/health', healthRoutes);
app.route('/session', sessionRoutes);
app.route('/foyer', foyerRoutes);
app.route('/rooms', roomRoutes);
app.route('/factory', factoryRoutes);
app.route('/dialogue', dialogueRoutes);
app.route('/consequences', consequenceRoutes);
app.route('/memory', memoryRoutes);
app.route('/telemetry', telemetryRoutes);
app.route('/critic', criticRoutes);
app.route('/typography', typographyRoutes);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error('unhandled', err);
  return c.json({ error: 'internal_error' }, 500);
});

// §6.2: slow Critic threshold. Anything under this score lands in the
// Critic's Notebook for Recipe Keeper attention. The fast Critic's
// rejection corpus (§15.3) is refreshed on the monthly retraining job.
const SLOW_CRITIC_FLAG_THRESHOLD = 0.6;

export default {
  fetch: app.fetch,
  async queue(batchUnknown: MessageBatch<unknown>, env: Env): Promise<void> {
    const batch = batchUnknown as MessageBatch<BackgroundJob>;
    // §3.2: background consumer. Phase 2 handles the slow Critic queue;
    // summarize_session and asset_processing land later.
    const slowCritic = new InProcessSlowCritic();
    for (const message of batch.messages) {
      try {
        const job = message.body;
        if (job.kind === 'slow_critic_review') {
          const verdict = await slowCritic.review({
            artifact: job.artifact,
            context: {
              shell_id: job.shell_id,
              shell_name: job.shell_name,
              ...(job.character_id ? { character_id: job.character_id } : {}),
              canonical_room_names: job.canonical_room_names,
            },
          });
          if (verdict.score < SLOW_CRITIC_FLAG_THRESHOLD) {
            await logRejection(env.DB, {
              artifact_kind: job.artifact_kind,
              reason: (verdict.tags[0] ?? 'TONE_MISMATCH') as
                | 'OFF_VOICE'
                | 'INCOHERENT'
                | 'BROKEN_CHARACTER'
                | 'INVENTED_FACT'
                | 'BAD_METER'
                | 'TONE_MISMATCH',
              shell_id: job.shell_id,
              ...(job.surface_slot ? { surface_slot: job.surface_slot } : {}),
              attempts: 1,
              artifact_text: job.artifact,
              ...(job.character_id ? { character_id: job.character_id } : {}),
              occurred_at: Date.now(),
            });
          }
        }
        message.ack();
      } catch (err) {
        console.error('queue_handler_failed', err);
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env>;

export { GuestSessionDO } from './durable-objects/guest-session.ts';
export { FactoryStateDO } from './durable-objects/factory-state.ts';
