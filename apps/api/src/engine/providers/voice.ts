import type { MoodVector } from '@confectory/shared';

// §3.3: VoiceProvider for realtime voice (Gemini Live), TTSProvider for
// pre-rendered + reactive TTS (ElevenLabs). Both isolated behind the
// interface so we can swap implementations.

export interface TtsRequest {
  text: string;
  voice_id: string;
  mood: MoodVector;
}

export interface TtsResult {
  /** R2 key or signed URL of the rendered audio. */
  audio_url: string;
  duration_ms?: number;
  /** Stable hash key the caller uses for caching (§11.2). */
  cache_key: string;
}

export interface TTSProvider {
  synthesize(req: TtsRequest): Promise<TtsResult>;
}

export interface VoiceSessionRequest {
  voice_id: string;
  system_instruction: string;
  /** R2 keys of prior audio the model should hear for continuity. */
  context_audio?: string[];
}

export interface VoiceSession {
  /** WebRTC offer the client uses to open the channel. */
  sdp_offer: string;
  /** ICE candidates to use. */
  ice_servers: Array<{ urls: string }>;
  /** Provider-specific session token. */
  session_token: string;
  expires_at: number;
}

export interface VoiceProvider {
  startSession(req: VoiceSessionRequest): Promise<VoiceSession>;
}

// ---- Implementations: ElevenLabs Turbo v3 (§11.2) and Gemini Live (§11.1).

interface ElevenLabsClient {
  textToSpeech(args: { voice_id: string; text: string }): Promise<{
    audio: ArrayBuffer;
    request_id: string;
  }>;
}

export class ElevenLabsTTS implements TTSProvider {
  constructor(private readonly client: ElevenLabsClient) {}

  async synthesize(req: TtsRequest): Promise<TtsResult> {
    const out = await this.client.textToSpeech({
      voice_id: req.voice_id,
      text: req.text,
    });
    const key = await cacheKey(req);
    // Phase 1: the caller is expected to write the buffer to R2 and
    // return the resulting URL. We surface the key so caching keeps the
    // §11.2 invariant: same line × same guest = single render.
    return {
      audio_url: `r2://tts/${key}.opus`,
      cache_key: key,
    };
  }
}

export class GeminiLiveVoice implements VoiceProvider {
  constructor(
    private readonly endpoint: string,
    private readonly token: string,
  ) {}

  async startSession(req: VoiceSessionRequest): Promise<VoiceSession> {
    const res = await fetch(`${this.endpoint}/live:start`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        voice_id: req.voice_id,
        system_instruction: req.system_instruction,
        context_audio: req.context_audio,
      }),
    });
    if (!res.ok) throw new Error(`gemini_live_start_failed:${res.status}`);
    return (await res.json()) as VoiceSession;
  }
}

// Deterministic TTS for local dev / tests.
export class InProcessTTS implements TTSProvider {
  async synthesize(req: TtsRequest): Promise<TtsResult> {
    const key = await cacheKey(req);
    return { audio_url: `inproc://tts/${key}.opus`, cache_key: key };
  }
}

async function cacheKey(req: TtsRequest): Promise<string> {
  // §11.2: cache at the line level. Key = hash(voice_id, text, mood).
  const data = new TextEncoder().encode(
    JSON.stringify({ voice_id: req.voice_id, text: req.text, mood: req.mood }),
  );
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
