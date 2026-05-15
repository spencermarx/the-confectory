import { Foyer } from './foyer/Foyer.tsx';
import { useStartSession } from './hooks/use-session.ts';

export function App() {
  const session = useStartSession();

  if (session.isPending) {
    return <Loading message="The factory is opening for you." />;
  }
  if (session.isError) {
    return <Loading message="The doors are stuck. Try again." />;
  }

  return <Foyer />;
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
