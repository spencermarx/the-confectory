import { z } from 'zod';

export const vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const quaternionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  w: z.number(),
});

export const r2KeySchema = z.string().min(1);
export const timestampSchema = z.number().int().nonnegative();
