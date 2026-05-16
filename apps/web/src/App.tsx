import { useCallback, useState } from 'react';
import { Foyer } from './foyer/Foyer.tsx';
import { useStartSession } from './hooks/use-session.ts';
import type { ThresholdResponse } from './hooks/use-threshold.ts';
import { InteriorRoom } from './room/InteriorRoom.tsx';

export function App() {
  const session = useStartSession();
  const [room, setRoom] = useState<ThresholdResponse | null>(null);

  const handleEntered = useCallback((response: ThresholdResponse) => {
    setRoom(response);
  }, []);
  const handleReturnToFoyer = useCallback(() => {
    setRoom(null);
  }, []);

  if (session.isPending) {
    return <Loading message="The factory is opening for you." />;
  }
  if (session.isError) {
    return <Loading message="The doors are stuck. Try again." />;
  }

  if (room) {
    return <InteriorRoom manifest={room.manifest} onReturnToFoyer={handleReturnToFoyer} />;
  }
  return <Foyer onEntered={handleEntered} />;
}

function Loading({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        color: '#f6e7c3',
        fontFamily: 'serif',
        fontSize: '1.2rem',
        letterSpacing: '0.04em',
      }}
    >
      {message}
    </div>
  );
}
