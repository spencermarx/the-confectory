import { z } from 'zod';
import { moodVectorSchema, partialMoodVectorSchema } from './mood.ts';
import { quaternionSchema, r2KeySchema, vec3Schema } from './primitives.ts';

export const topologySchema = z.enum(['branching', 'cul-de-sac', 'gate']);

export const doorFeelSchema = z.enum([
  'heavy',
  'light',
  'reluctant',
  'eager',
  'silent',
  'creaking',
]);

export const announcementModeSchema = z.enum([
  'whispered',
  'spoken',
  'sung',
  'silent',
  'mechanical',
  'gramophonic',
  'choral',
]);

export const announcementTimingSchema = z.enum([
  'on_entry',
  'on_first_step',
  'after_threshold',
  'on_sign_seen',
]);

export const doorSlotSchema = z.object({
  id: z.string().min(1),
  destination_constraints: z.object({
    allowed_topologies: z.array(topologySchema).optional(),
    forbidden_shell_ids: z.array(z.string()).optional(),
    required_mood_compatibility: partialMoodVectorSchema.optional(),
    require_consequence: z.string().optional(),
  }),
  feel: doorFeelSchema,
  visual_style_inherits_destination: z.boolean(),
});

export const propSlotSchema = z.object({
  id: z.string().min(1),
  position: vec3Schema,
  rotation: quaternionSchema,
  allowed_prop_tags: z.array(z.string()),
  interactable: z.boolean(),
  consequence_on_interact: z.string().optional(),
});

export const shellSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, 'shell id must be kebab-case slug'),
    name: z.string().min(1),
    name_locked: z.boolean(),
    topology: topologySchema,
    mood_compatibility: moodVectorSchema,
    traversal_time_floor_seconds: z.number().positive(),
    target_dwell_seconds: z.number().positive(),
    dwell_density: z.number().min(0).max(1),
    mesh_asset: r2KeySchema,
    ambient_audio_asset: r2KeySchema,
    shader_profile: z.string().min(1),
    sign: z.object({
      style: z.string().min(1),
      typography: z.string().min(1),
      position_offset: vec3Schema,
    }),
    announcement: z.object({
      mode: announcementModeSchema,
      voice_id: z.string().optional(),
      timing: announcementTimingSchema,
    }),
    doors: z.array(doorSlotSchema).min(1).max(4),
    prop_slots: z.array(propSlotSchema),
    generation_hints: z.object({
      surface_generation_targets: z.array(z.string()),
      pre_baked_overrides: z.record(z.string(), r2KeySchema),
    }),
    consequence_catalog: z.array(z.string()),
    portal_door_variant: r2KeySchema,
    founder_set_pieces: z.array(z.string()),
    authored_fallback: z.string().min(1),
    approved_by_founder: z.boolean(),
  })
  .superRefine((shell, ctx) => {
    // §4.1: door count varies by topology.
    const { topology, doors } = shell;
    const expected: Record<typeof topology, [number, number]> = {
      branching: [2, 4],
      'cul-de-sac': [1, 1],
      gate: [2, 2],
    };
    const [min, max] = expected[topology];
    if (doors.length < min || doors.length > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['doors'],
        message: `${topology} shells must have ${min === max ? min : `${min}-${max}`} doors, got ${doors.length}`,
      });
    }
  });

export type ShellInput = z.input<typeof shellSchema>;
