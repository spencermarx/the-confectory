import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

interface SessionResponse {
  guest_id: string;
  session_started_at: number;
  current_location: 'foyer' | 'elevator' | 'in_room' | 'in_threshold';
  respawn_count: number;
  visit_count: number;
}

async function startSession(): Promise<SessionResponse> {
  const res = await fetch('/api/session/start', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`session start failed: ${res.status}`);
  return res.json() as Promise<SessionResponse>;
}

export function useStartSession() {
  const mutation = useMutation({ mutationFn: startSession });
  const { mutate } = mutation;
  // Guests start exactly once per page load.
  useEffect(() => {
    mutate();
  }, [mutate]);
  return mutation;
}
