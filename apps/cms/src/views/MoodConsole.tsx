'use client';

import { useEffect, useState } from 'react';
import { apiBase } from './api.ts';

interface MoodVector {
  whimsy: number;
  menace: number;
  indulgence: number;
  founder_presence: number;
  consequence_severity: number;
  pace: number;
  oompa_loompa_mischief: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'unseasoned';
}

const NUMERIC_DIMS: Array<keyof MoodVector> = [
  'whimsy',
  'menace',
  'indulgence',
  'founder_presence',
  'consequence_severity',
  'pace',
  'oompa_loompa_mischief',
];

// §15.3: the Mood Console. Sliders for the mood dials with a live
// preview against the singleton FactoryStateDO. Recipe Keepers set
// the global mood; the next room assembly picks it up immediately
// thanks to the §14.2 WebSocket fanout.
export default function MoodConsole() {
  const [mood, setMood] = useState<MoodVector | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    void fetch(`${apiBase()}/factory/mood`)
      .then((r) => r.json() as Promise<MoodVector>)
      .then((m) => setMood(m))
      .catch(() => setStatus('error'));
  }, []);

  async function patch(partial: Partial<MoodVector>) {
    if (!mood) return;
    const next = { ...mood, ...partial };
    setMood(next);
    setStatus('saving');
    try {
      const res = await fetch(`${apiBase()}/factory/mood`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(partial),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (!mood) return <Frame title="Mood Console">Loading the factory mood…</Frame>;

  return (
    <Frame title="Mood Console">
      <p style={{ color: '#888', marginTop: 0 }}>
        Changes take effect on the next room assembly. Live mood updates fan out over WebSocket to
        every active guest session.
      </p>
      {NUMERIC_DIMS.map((dim) => (
        <label key={dim} style={{ display: 'block', marginBottom: '0.75rem' }}>
          <span style={{ display: 'inline-block', width: '12rem', textTransform: 'capitalize' }}>
            {dim.replace(/_/g, ' ')}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={mood[dim] as number}
            onChange={(e) => patch({ [dim]: Number(e.target.value) } as Partial<MoodVector>)}
            style={{ width: '20rem', verticalAlign: 'middle' }}
          />
          <span style={{ marginLeft: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
            {(mood[dim] as number).toFixed(2)}
          </span>
        </label>
      ))}
      <label style={{ display: 'block', marginTop: '1rem' }}>
        <span style={{ display: 'inline-block', width: '12rem' }}>Season</span>
        <select
          value={mood.season}
          onChange={(e) => patch({ season: e.target.value as MoodVector['season'] })}
        >
          <option value="spring">spring</option>
          <option value="summer">summer</option>
          <option value="autumn">autumn</option>
          <option value="winter">winter</option>
          <option value="unseasoned">unseasoned</option>
        </select>
      </label>
      <SaveStatus status={status} />
    </Frame>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '48rem' }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      {children}
    </div>
  );
}

function SaveStatus({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  const label = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved.' : 'Save failed.';
  const color = status === 'error' ? '#a01010' : '#888';
  return (
    <div style={{ marginTop: '1rem', color, fontStyle: 'italic' }} aria-live="polite">
      {label}
    </div>
  );
}
