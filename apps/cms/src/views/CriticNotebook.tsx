'use client';

import { useEffect, useState } from 'react';
import { apiBase } from './api.ts';

interface CriticEntry {
  artifact_kind: 'sign' | 'surface' | 'dialogue';
  reason: string;
  shell_id: string;
  surface_slot?: string;
  attempts: number;
  artifact_text?: string;
  character_id?: string;
  occurred_at: number;
}

const REASONS = [
  '',
  'OFF_VOICE',
  'INCOHERENT',
  'BROKEN_CHARACTER',
  'INVENTED_FACT',
  'BAD_METER',
  'TONE_MISMATCH',
];

// §15.3, §6.2: the Critic's Notebook. The reviewer interface for
// recent rejections: fast Critic rejections inline plus the slow
// Critic's annotations once Phase 2's queue starts populating
// flagged scores. Phase 3 layers in "promote to fallback" and
// "add as negative example".
export default function CriticNotebook() {
  const [entries, setEntries] = useState<CriticEntry[] | null>(null);
  const [filterShell, setFilterShell] = useState('');
  const [filterReason, setFilterReason] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterShell) params.set('shell_id', filterShell);
    if (filterReason) params.set('reason', filterReason);
    params.set('limit', '100');
    void fetch(`${apiBase()}/critic/recent?${params.toString()}`)
      .then((r) => r.json() as Promise<{ entries: CriticEntry[] }>)
      .then((data) => setEntries(data.entries))
      .catch(() => setEntries([]));
  }, [filterShell, filterReason]);

  return (
    <div style={{ padding: '2rem', maxWidth: '64rem' }}>
      <h1 style={{ marginTop: 0 }}>Critic's Notebook</h1>
      <p style={{ color: '#888', marginTop: 0 }}>
        The most recent rejections from the fast Critic and from the slow Critic's offline review
        (§6.2).
      </p>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          Shell:&nbsp;
          <input
            type="text"
            value={filterShell}
            onChange={(e) => setFilterShell(e.target.value)}
            placeholder="(any)"
          />
        </label>
        <label>
          Reason:&nbsp;
          <select value={filterReason} onChange={(e) => setFilterReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r || 'any'} value={r}>
                {r || '(any)'}
              </option>
            ))}
          </select>
        </label>
      </div>
      {entries === null ? (
        <p>Loading…</p>
      ) : entries.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#888' }}>The Critic has nothing to report.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>
              <th style={{ padding: '0.5rem 0.25rem' }}>When</th>
              <th>Shell</th>
              <th>Kind</th>
              <th>Reason</th>
              <th>Attempts</th>
              <th>Excerpt</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={`${entry.occurred_at}-${i}`} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '0.5rem 0.25rem', whiteSpace: 'nowrap' }}>
                  {new Date(entry.occurred_at).toLocaleString()}
                </td>
                <td>
                  {entry.shell_id}
                  {entry.surface_slot ? ` · ${entry.surface_slot}` : ''}
                </td>
                <td>{entry.artifact_kind}</td>
                <td style={{ fontVariant: 'all-small-caps' }}>{entry.reason}</td>
                <td>{entry.attempts}</td>
                <td style={{ maxWidth: '24rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.artifact_text?.slice(0, 160) ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
