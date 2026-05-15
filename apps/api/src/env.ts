export interface Env {
  GUEST_SESSION: DurableObjectNamespace;
  FACTORY_STATE: DurableObjectNamespace;
  DB: D1Database;
  SHELLS_KV: KVNamespace;
  ASSETS: R2Bucket;
  MEMORY: VectorizeIndex;
  BACKGROUND: Queue<BackgroundJob>;
  ENVIRONMENT: 'development' | 'preview' | 'production';
}

export type BackgroundJob =
  | { kind: 'summarize_session'; guest_id: string }
  | { kind: 'slow_critic_review'; artifact_id: string }
  | { kind: 'asset_processing'; r2_key: string };
