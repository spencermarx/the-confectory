import { Hono } from 'hono';
import type { Env } from '../env.ts';

export const healthRoutes = new Hono<{ Bindings: Env }>();

healthRoutes.get('/', (c) =>
  c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT,
    timestamp: Date.now(),
  }),
);
