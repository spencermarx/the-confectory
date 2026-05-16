import { Hono } from 'hono';
import type { Env } from './env.ts';
import { consequenceRoutes } from './routes/consequences.ts';
import { dialogueRoutes } from './routes/dialogue.ts';
import { factoryRoutes } from './routes/factory.ts';
import { foyerRoutes } from './routes/foyer.ts';
import { healthRoutes } from './routes/health.ts';
import { memoryRoutes } from './routes/memory.ts';
import { roomRoutes } from './routes/rooms.ts';
import { sessionRoutes } from './routes/session.ts';

const app = new Hono<{ Bindings: Env }>();

app.route('/health', healthRoutes);
app.route('/session', sessionRoutes);
app.route('/foyer', foyerRoutes);
app.route('/rooms', roomRoutes);
app.route('/factory', factoryRoutes);
app.route('/dialogue', dialogueRoutes);
app.route('/consequences', consequenceRoutes);
app.route('/memory', memoryRoutes);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((err, c) => {
  console.error('unhandled', err);
  return c.json({ error: 'internal_error' }, 500);
});

export default {
  fetch: app.fetch,
  async queue(_batch: MessageBatch, _env: Env): Promise<void> {
    // §3.2: background consumer. Phase 1 wires in slow Critic + summarization.
  },
} satisfies ExportedHandler<Env>;

export { GuestSessionDO } from './durable-objects/guest-session.ts';
export { FactoryStateDO } from './durable-objects/factory-state.ts';
