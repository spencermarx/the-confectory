import { useEffect, useRef, useState } from 'react';

interface MoodVector {
  whimsy: number;
  menace: number;
  indulgence: number;
  founder_presence: number;
  consequence_severity: number;
  pace: number;
  oompa_loompa_mischief: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'unseasoned';
  holiday?: string;
}

interface Presence {
  ghost_token: string;
}

interface FactoryConnectionState {
  mood: MoodVector | null;
  presence: Presence[];
  connected: boolean;
}

type ServerMessage = { type: 'mood'; mood: MoodVector } | { type: 'presence'; foyer: Presence[] };

// §14.2: per-guest socket to the singleton FactoryStateDO. Provides
// live mood updates (so the Mood Console takes effect immediately)
// and foyer co-presence (§8.5).
export function useFactoryConnection(): FactoryConnectionState {
  const [state, setState] = useState<FactoryConnectionState>({
    mood: null,
    presence: [],
    connected: false,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);

  useEffect(() => {
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      const url = new URL('/api/factory/subscribe', window.location.href);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        backoffRef.current = 1000;
        setState((prev) => ({ ...prev, connected: true }));
      });
      ws.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage;
          if (msg.type === 'mood') {
            setState((prev) => ({ ...prev, mood: msg.mood }));
          } else if (msg.type === 'presence') {
            setState((prev) => ({ ...prev, presence: msg.foyer }));
          }
        } catch {
          // Drop malformed frames silently.
        }
      });
      ws.addEventListener('close', () => {
        setState((prev) => ({ ...prev, connected: false }));
        if (cancelled) return;
        const delay = Math.min(backoffRef.current, 30_000);
        backoffRef.current = Math.min(delay * 2, 30_000);
        window.setTimeout(connect, delay);
      });
      ws.addEventListener('error', () => {
        ws.close();
      });
    };

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return state;
}
