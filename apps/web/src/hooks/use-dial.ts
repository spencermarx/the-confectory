import { useQuery } from '@tanstack/react-query';

export interface DialEntry {
  shell_id: string;
  name: string;
  angle: number;
  prominence: number;
  typography: string;
  portal_door_variant?: string;
}

interface DialResponse {
  entries: DialEntry[];
  session_count: number;
}

async function fetchDial(): Promise<DialResponse> {
  const res = await fetch('/api/foyer/dial', { credentials: 'include' });
  if (!res.ok) throw new Error(`dial fetch failed: ${res.status}`);
  return res.json() as Promise<DialResponse>;
}

export function useDial(enabled: boolean) {
  return useQuery({
    queryKey: ['foyer', 'dial'],
    queryFn: fetchDial,
    enabled,
    staleTime: 60_000,
  });
}

export async function settleOnShell(shell_id: string): Promise<void> {
  const res = await fetch('/api/foyer/settle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ shell_id }),
  });
  if (!res.ok) throw new Error(`settle failed: ${res.status}`);
}
