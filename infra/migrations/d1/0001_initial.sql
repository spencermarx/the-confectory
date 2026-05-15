-- §3.4, §7.1: structured per-guest persistence.
-- D1 (SQLite). Strong consistency per guest via the Durable Object,
-- with D1 as the durable read-anywhere store.

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 1,
  session_started_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  current_room_id TEXT,
  current_location TEXT NOT NULL DEFAULT 'foyer',
  factory_opinion REAL NOT NULL DEFAULT 0,
  respawn_count INTEGER NOT NULL DEFAULT 0,
  ticket_stub_visual_state TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guests_user_id ON guests(user_id);
CREATE INDEX IF NOT EXISTS idx_guests_last_active ON guests(last_active_at);

CREATE TABLE IF NOT EXISTS guest_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  shell_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  entered_at INTEGER NOT NULL,
  exited_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_visits_guest ON guest_visits(guest_id, entered_at);
CREATE INDEX IF NOT EXISTS idx_visits_shell ON guest_visits(shell_id);

CREATE TABLE IF NOT EXISTS applied_consequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  consequence_type_id TEXT NOT NULL,
  applied_in_room_id TEXT NOT NULL,
  applied_at INTEGER NOT NULL,
  fades_at INTEGER,
  visible_effects_json TEXT NOT NULL,
  UNIQUE (guest_id, applied_in_room_id, consequence_type_id)
);

CREATE INDEX IF NOT EXISTS idx_consequences_guest ON applied_consequences(guest_id);

CREATE TABLE IF NOT EXISTS ticket_stub_marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  mark_type TEXT NOT NULL,
  source_consequence_id INTEGER REFERENCES applied_consequences(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marks_guest ON ticket_stub_marks(guest_id);

-- §7.1: episodic memory source text (vectors live in Vectorize).
CREATE TABLE IF NOT EXISTS episodic_memories (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  shell_id TEXT,
  summary TEXT NOT NULL,
  emotional_weight REAL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memories_guest ON episodic_memories(guest_id, created_at DESC);

-- §16.3: per-guest telemetry trail.
CREATE TABLE IF NOT EXISTS telemetry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_id TEXT NOT NULL,
  signal_name TEXT NOT NULL,
  value_json TEXT,
  occurred_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_guest ON telemetry_events(guest_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_signal ON telemetry_events(signal_name, occurred_at);
