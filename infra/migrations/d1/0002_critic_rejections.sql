-- §6.2, §15.3: the Critic's Notebook. Fast Critic rejections land here
-- so the slow Critic + Recipe Keepers can review.

CREATE TABLE IF NOT EXISTS critic_rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_kind TEXT NOT NULL,
  reason TEXT NOT NULL,
  shell_id TEXT NOT NULL,
  surface_slot TEXT,
  attempts INTEGER NOT NULL,
  artifact_text TEXT,
  character_id TEXT,
  occurred_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_critic_rejections_shell ON critic_rejections(shell_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_critic_rejections_reason ON critic_rejections(reason, occurred_at DESC);
