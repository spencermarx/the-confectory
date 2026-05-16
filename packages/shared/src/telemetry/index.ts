// §16.1: the signals we measure. This catalog is read by the client
// (to know what it's allowed to emit), the Worker (for ingestion-time
// validation), and the Critic's Notebook dashboard.

export type TelemetrySource = 'client' | 'server' | 'derived';

export interface TelemetrySignal {
  name: string;
  description: string;
  collected_via: TelemetrySource;
  /** Unit if the value is numeric. */
  unit?: 'ms' | 's' | 'count' | 'ratio';
  /** §16.2: signals the Translator does NOT want us optimizing for. */
  do_not_optimize?: true;
}

export const TELEMETRY_SIGNALS: readonly TelemetrySignal[] = [
  {
    name: 'threshold_time_ms',
    description: 'Time spent crossing a threshold from door open to fully in room.',
    collected_via: 'client',
    unit: 'ms',
  },
  {
    name: 're_entry',
    description: 'A guest re-entered the factory after at least 24h away.',
    collected_via: 'derived',
    unit: 'count',
  },
  {
    name: 'founder_conversation_depth',
    description: 'Number of turns the guest exchanged with the Founder in one session.',
    collected_via: 'derived',
    unit: 'count',
  },
  {
    name: 'oompa_loompa_speech_volume',
    description: 'Volume of guest-initiated speech to Oompa-Loompas in a session.',
    collected_via: 'client',
    unit: 'count',
  },
  {
    name: 'path_diversity',
    description: 'Distinct shells visited divided by total visits in the session.',
    collected_via: 'derived',
    unit: 'ratio',
  },
  {
    name: 'the_pause',
    description: 'Client emitted after 3s of zero input in a generated space (§16.1).',
    collected_via: 'client',
    unit: 'count',
  },
  {
    name: 'ticket_stub_mark_added',
    description: 'A consequence stamped the ticket stub.',
    collected_via: 'server',
    unit: 'count',
  },
  {
    name: 'foyer_in_room_ratio',
    description: 'Session-level foyer-time vs in-room-time ratio.',
    collected_via: 'derived',
    unit: 'ratio',
  },
  {
    name: 'dial_settle_ms',
    description: 'Time from first dial interaction to threshold cross.',
    collected_via: 'client',
    unit: 'ms',
  },
  {
    name: 'founder_presence_acknowledgment',
    description: "Guest's camera fixated on the Founder for 2+ seconds.",
    collected_via: 'client',
    unit: 'count',
  },
  // §6.2 / §6.4: critic operations. The Critic's Notebook reads these.
  {
    name: 'critic_rejection',
    description: 'Fast Critic rejected an artifact during room assembly.',
    collected_via: 'server',
    unit: 'count',
  },
  {
    name: 'fallback_served',
    description: 'Authored fallback served because the Critic exhausted its retry budget.',
    collected_via: 'server',
    unit: 'count',
  },
] as const;

export type TelemetrySignalName = (typeof TELEMETRY_SIGNALS)[number]['name'];

const NAMES = new Set<string>(TELEMETRY_SIGNALS.map((s) => s.name));

export function isTelemetrySignal(name: string): name is TelemetrySignalName {
  return NAMES.has(name);
}

export interface TelemetryEvent {
  signal: TelemetrySignalName;
  /** Numeric value or count. Default 1 for count-like signals. */
  value: number;
  /** Free-form labels — kept small for Analytics Engine cardinality. */
  labels?: Record<string, string>;
  occurred_at?: number;
}
