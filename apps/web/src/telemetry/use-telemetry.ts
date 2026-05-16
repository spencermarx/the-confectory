import { useEffect, useRef } from 'react';

interface TelemetryPayload {
  signal: string;
  value: number;
  labels?: Record<string, string>;
  occurred_at?: number;
}

// Fire-and-forget. The Worker handles validation and persistence.
// Uses sendBeacon when available so events survive a tab close (§16.3).
export function emitTelemetry(event: TelemetryPayload): void {
  const payload = JSON.stringify(event);
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/telemetry/event', blob);
    return;
  }
  void fetch('/api/telemetry/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

// §16.1: The Pause. Client emits after 3s of zero input in a
// generated space. "Zero input" = no pointer move, no key press,
// no scroll.
const PAUSE_THRESHOLD_MS = 3000;

export function usePauseDetector(labels: Record<string, string>): void {
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  useEffect(() => {
    let timer = window.setTimeout(emit, PAUSE_THRESHOLD_MS);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(emit, PAUSE_THRESHOLD_MS);
    };
    function emit() {
      emitTelemetry({ signal: 'the_pause', value: 1, labels: labelsRef.current });
    }
    window.addEventListener('pointermove', reset, { passive: true });
    window.addEventListener('keydown', reset, { passive: true });
    window.addEventListener('wheel', reset, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('wheel', reset);
    };
  }, []);
}

// Tracks elapsed wall-time between an arbitrary start signal and a
// matching stop signal. Used by the dial settle and threshold timers.
export function useTimer(): {
  start: () => void;
  stop: (signal: string, labels?: Record<string, string>) => void;
} {
  const startRef = useRef<number | null>(null);
  return {
    start: () => {
      startRef.current = performance.now();
    },
    stop: (signal, labels) => {
      if (startRef.current === null) return;
      const value = performance.now() - startRef.current;
      startRef.current = null;
      emitTelemetry({ signal, value, ...(labels ? { labels } : {}) });
    },
  };
}
