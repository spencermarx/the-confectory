import { describe, expect, it } from 'vitest';
import { InProcessSlowCritic } from './slow-critic.ts';

describe('InProcessSlowCritic', () => {
  const critic = new InProcessSlowCritic();
  const context = {
    shell_id: 'the-hush-before',
    shell_name: 'The Hush Before',
    canonical_room_names: ['The Hush Before', 'The Treacle Deep'],
  };

  it('scores a concise on-voice artifact near the upper band', async () => {
    const v = await critic.review({
      artifact: 'The Hush Before stays quiet today.',
      context,
    });
    expect(v.score).toBeGreaterThan(0.6);
    expect(v.tags).toContain('mentions_canonical_room');
  });

  it('flags an empty artifact', async () => {
    const v = await critic.review({ artifact: '   ', context });
    expect(v.score).toBe(0);
    expect(v.tags).toContain('empty');
  });

  it('penalizes long-winded artifacts so they fall below the flag threshold', async () => {
    const long = 'A'.repeat(4000);
    const v = await critic.review({ artifact: long, context });
    expect(v.score).toBeLessThan(0.6);
  });
});
