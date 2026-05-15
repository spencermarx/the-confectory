import type { ConsequenceTypeId } from './consequence.ts';
import type { MoodVector } from './mood.ts';
import type {
  AuthoredFallbackId,
  Quaternion,
  R2Key,
  SetPieceId,
  ShaderProfileId,
  SurfaceSlot,
  Timestamp,
  TypographyId,
  UserId,
  Vec3,
} from './primitives.ts';

export type ShellId = string;

export type Topology = 'branching' | 'cul-de-sac' | 'gate';

export type DoorFeel = 'heavy' | 'light' | 'reluctant' | 'eager' | 'silent' | 'creaking';

export type AnnouncementMode =
  | 'whispered'
  | 'spoken'
  | 'sung'
  | 'silent'
  | 'mechanical'
  | 'gramophonic'
  | 'choral';

export type AnnouncementTiming = 'on_entry' | 'on_first_step' | 'after_threshold' | 'on_sign_seen';

export interface DoorSlot {
  id: string;
  destination_constraints: {
    allowed_topologies?: Topology[];
    forbidden_shell_ids?: ShellId[];
    required_mood_compatibility?: Partial<MoodVector>;
    require_consequence?: ConsequenceTypeId;
  };
  feel: DoorFeel;
  visual_style_inherits_destination: boolean;
}

export interface PropSlot {
  id: string;
  position: Vec3;
  rotation: Quaternion;
  allowed_prop_tags: string[];
  interactable: boolean;
  consequence_on_interact?: ConsequenceTypeId;
}

export interface Shell {
  id: ShellId;
  name: string;
  name_locked: boolean;
  topology: Topology;
  mood_compatibility: MoodVector;
  traversal_time_floor_seconds: number;
  target_dwell_seconds: number;
  dwell_density: number;
  mesh_asset: R2Key;
  ambient_audio_asset: R2Key;
  shader_profile: ShaderProfileId;
  sign: {
    style: string;
    typography: TypographyId;
    position_offset: Vec3;
  };
  announcement: {
    mode: AnnouncementMode;
    voice_id?: string;
    timing: AnnouncementTiming;
  };
  doors: DoorSlot[];
  prop_slots: PropSlot[];
  generation_hints: {
    surface_generation_targets: SurfaceSlot[];
    pre_baked_overrides: Partial<Record<SurfaceSlot, R2Key>>;
  };
  consequence_catalog: ConsequenceTypeId[];
  portal_door_variant: R2Key;
  founder_set_pieces: SetPieceId[];
  authored_fallback: AuthoredFallbackId;
  created_by?: UserId;
  created_at?: Timestamp;
  approved_by_founder: boolean;
}
