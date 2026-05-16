'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiBase } from './api.ts';

interface Signal {
  name: string;
  description: string;
  collected_via: 'client' | 'server' | 'derived';
  unit?: 'ms' | 's' | 'count' | 'ratio';
}

interface TrailEvent {
  signal_name: string;
  value_json: string;
  occurred_at: number;
}

// §15.3, §16: the Telemetry of Wonder dashboard MVP. Phase 2 ships
// the catalog browser + a per-signal trail readout against the
// Worker's /telemetry/trail endpoint (which reads the per-guest D1
// trail per §16.3). The richer D3 visualizations land later — Pause
// heatmap, re-entry rates, dwell variance.
export default function TelemetryDashboard() {
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [events, setEvents] = useState<TrailEvent[] | null>(null);

  useEffect(() => {
    void fetch(`${apiBase()}/telemetry/signals`)
      .then((r) => r.json() as Promise<{ signals: Signal[] }>)
      .then((data) => {
        setSignals(data.signals);
        if (data.signals[0]) setSelected(data.signals[0].name);
      })
      .catch(() => setSignals([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    void fetch(`${apiBase()}/telemetry/trail?signal=${encodeURIComponent(selected)}&limit=200`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ events: TrailEvent[] }>) : { events: [] }))
      .then((data) => setEvents(data.events))
      .catch(() => setEvents([]));
  }, [selected]);

  const stats = useMemo(() => computeStats(events ?? []), [events]);

  return (
    <div style={{ padding: '2rem', maxWidth: '64rem' }}>
      <h1 style={{ marginTop: 0 }}>Telemetry of Wonder</h1>
      <p style={{ color: '#888', marginTop: 0 }}>
        The §16.1 signal catalog and the per-guest trail. Phase 3 layers in the cross-guest
        aggregations against Analytics Engine.
      </p>
      {!signals ? (
        <p>Loading catalog…</p>
      ) : (
        <>
          <label>
            Signal:&nbsp;
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {signals.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {(() => {
            const found = signals.find((s) => s.name === selected);
            return found ? <SignalDetail signal={found} /> : null;
          })()}
          {events ? <StatsBlock count={events.length} stats={stats} /> : <p>Loading trail…</p>}
          <Sparkline events={events ?? []} />
        </>
      )}
    </div>
  );
}

function SignalDetail({ signal }: { signal: Signal }) {
  return (
    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#1a1410', color: '#f6e7c3' }}>
      <div style={{ fontStyle: 'italic' }}>{signal.description}</div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#bda77b' }}>
        collected via: {signal.collected_via}
        {signal.unit ? ` · unit: ${signal.unit}` : ''}
      </div>
    </div>
  );
}

interface Stats {
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
}

function computeStats(events: TrailEvent[]): Stats | null {
  if (events.length === 0) return null;
  const values: number[] = [];
  for (const e of events) {
    try {
      const parsed = JSON.parse(e.value_json) as { value: number };
      if (typeof parsed.value === 'number') values.push(parsed.value);
    } catch {
      // skip malformed rows
    }
  }
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  const idx = (q: number) => values[Math.min(values.length - 1, Math.floor(q * values.length))]!;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return {
    min: values[0]!,
    max: values[values.length - 1]!,
    mean,
    p50: idx(0.5),
    p95: idx(0.95),
  };
}

function StatsBlock({ count, stats }: { count: number; stats: Stats | null }) {
  return (
    <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
      <Stat label="events" value={count.toString()} />
      {stats ? (
        <>
          <Stat label="p50" value={stats.p50.toFixed(2)} />
          <Stat label="p95" value={stats.p95.toFixed(2)} />
          <Stat label="mean" value={stats.mean.toFixed(2)} />
          <Stat label="min" value={stats.min.toFixed(2)} />
          <Stat label="max" value={stats.max.toFixed(2)} />
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#888' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function Sparkline({ events }: { events: TrailEvent[] }) {
  if (events.length === 0) return null;
  const width = 600;
  const height = 80;
  const ordered = [...events].sort((a, b) => a.occurred_at - b.occurred_at);
  const values: number[] = ordered.map((e) => {
    try {
      const parsed = JSON.parse(e.value_json) as { value: number };
      return typeof parsed.value === 'number' ? parsed.value : 0;
    } catch {
      return 0;
    }
  });
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      width={width}
      height={height}
      style={{ marginTop: '1rem', background: '#1a1410', display: 'block' }}
      role="img"
      aria-label="Signal trend"
    >
      <polyline points={points} fill="none" stroke="#f6c97f" strokeWidth={1.5} />
    </svg>
  );
}
