import type { TelemetryEvent } from '@confectory/shared';

// §16.3: client events → Worker → Analytics Engine. Per-guest signal
// trails also land in D1 so a Recipe Keeper can examine an individual
// session. Phase 1 keeps the writer narrow; aggregation lives in
// queries against the Analytics Engine SQL endpoint.

interface AnalyticsEngineDataset {
  writeDataPoint(point: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

interface D1ForTelemetry {
  prepare(query: string): {
    bind(...values: unknown[]): { run(): Promise<unknown> };
  };
}

export interface TelemetrySinks {
  analytics?: AnalyticsEngineDataset;
  db?: D1ForTelemetry;
}

export async function recordEvent(
  sinks: TelemetrySinks,
  guest_id: string,
  event: TelemetryEvent,
): Promise<void> {
  const occurredAt = event.occurred_at ?? Date.now();
  const labelEntries = Object.entries(event.labels ?? {});

  if (sinks.analytics) {
    sinks.analytics.writeDataPoint({
      indexes: [event.signal],
      blobs: [guest_id, ...labelEntries.flat()],
      doubles: [event.value, occurredAt],
    });
  }

  if (sinks.db) {
    await sinks.db
      .prepare(
        'INSERT INTO telemetry_events (guest_id, signal_name, value_json, occurred_at) VALUES (?, ?, ?, ?)',
      )
      .bind(
        guest_id,
        event.signal,
        JSON.stringify({ value: event.value, labels: event.labels ?? {} }),
        occurredAt,
      )
      .run();
  }
}
