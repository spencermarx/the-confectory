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
  // §3.3, §10.3: Workers AI binding. Optional in Phase 2 — when bound,
  // the Worker swaps the in-process providers for WorkersAI ones.
  AI?: Ai;
  // §11.1, §22.2: Gemini Live secrets. Optional — when missing the
  // Founder's interactive scene falls through to the set-piece library
  // per §19.1.
  GEMINI_LIVE_TOKEN?: string;
  GEMINI_LIVE_ENDPOINT?: string;
  // §10.4: Anthropic API secret for the slow Critic and Founder
  // frontier work. Optional; absence keeps the InProcess providers
  // active.
  ANTHROPIC_API_KEY?: string;
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
