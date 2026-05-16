export interface Env {
  GUEST_SESSION: DurableObjectNamespace;
  FACTORY_STATE: DurableObjectNamespace;
  DB: D1Database;
  SHELLS_KV: KVNamespace;
  ASSETS: R2Bucket;
  MEMORY: VectorizeIndex;
  BACKGROUND: Queue<BackgroundJob>;
  // §16.3: Analytics Engine dataset for high-volume telemetry.
  TELEMETRY: AnalyticsEngineDataset;
  ENVIRONMENT: 'development' | 'preview' | 'production';
}

export type BackgroundJob =
  | { kind: 'summarize_session'; guest_id: string }
  | {
      kind: 'slow_critic_review';
      shell_id: string;
      shell_name: string;
      character_id?: string;
      canonical_room_names: string[];
      artifact: string;
      artifact_kind: 'sign' | 'surface' | 'dialogue';
      surface_slot?: string;
    }
  | { kind: 'asset_processing'; r2_key: string };
