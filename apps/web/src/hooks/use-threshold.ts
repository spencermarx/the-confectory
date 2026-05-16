interface AssembledRoom {
  shell_id: string;
  mood_at_entry: {
    whimsy: number;
    menace: number;
    indulgence: number;
    founder_presence: number;
    consequence_severity: number;
    pace: number;
    oompa_loompa_mischief: number;
    season: string;
  };
  resolved_doors: Array<{ door_slot_id: string; destination_shell_id: string }>;
  resolved_props: Array<{ prop_slot_id: string; prop_id: string }>;
  oompa_loompa_assignments: string[];
  sign_text: string;
  generated_surfaces: Record<string, string>;
  served_from_fallback: boolean;
}

export interface ThresholdResponse {
  room_id: string;
  manifest: AssembledRoom;
  served_from_cache: boolean;
}

export async function crossThreshold(shell_id: string): Promise<ThresholdResponse> {
  const res = await fetch('/api/rooms/threshold', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ destination_shell_id: shell_id }),
  });
  if (!res.ok) throw new Error(`threshold failed: ${res.status}`);
  return res.json() as Promise<ThresholdResponse>;
}

export type { AssembledRoom };
