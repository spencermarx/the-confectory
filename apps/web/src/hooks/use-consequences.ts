interface ApplyConsequenceArgs {
  type_id: string;
  room_id?: string;
}

interface ApplyConsequenceResult {
  status: 'applied' | 'already_applied';
  consequence?: { type: string; applied_at: number };
  visible_effects?: Array<{ kind: string; value: string; intensity?: number }>;
  ticket_stub?: { marks: Array<{ type: string; at: number }> };
  factory_opinion?: number;
}

export async function applyConsequence(
  args: ApplyConsequenceArgs,
): Promise<ApplyConsequenceResult> {
  const res = await fetch('/api/consequences/apply', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`apply_consequence_failed:${res.status}`);
  return res.json() as Promise<ApplyConsequenceResult>;
}

export async function endSession(): Promise<{
  prose_summary: string;
  factory_opinion: number;
}> {
  const res = await fetch('/api/memory/end-session', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`end_session_failed:${res.status}`);
  return res.json() as Promise<{ prose_summary: string; factory_opinion: number }>;
}
