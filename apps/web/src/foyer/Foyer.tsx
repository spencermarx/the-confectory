import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { SubtitleOverlay } from '../dialogue/SubtitleOverlay.tsx';
import { speakToOompaLoompa } from '../dialogue/use-dialogue.ts';
import { type DialEntry, settleOnShell, useDial } from '../hooks/use-dial.ts';
import { useFactoryConnection } from '../hooks/use-factory-connection.ts';
import { type ThresholdResponse, crossThreshold } from '../hooks/use-threshold.ts';
import { emitTelemetry, usePauseDetector } from '../telemetry/use-telemetry.ts';
import { BrassDial } from './BrassDial.tsx';
import { CoPresenceGhosts } from './CoPresenceGhosts.tsx';
import { NamePlate } from './NamePlate.tsx';
import { PortalDoor } from './PortalDoor.tsx';
import { Sign } from './Sign.tsx';
import { TicketStub } from './TicketStub.tsx';
import { useTypographyPreload } from './use-typography-preload.ts';

interface FoyerProps {
  onEntered: (response: ThresholdResponse) => void;
}

// §8: the foyer is the only persistent room. Hand-authored.
// Phase 1 placeholder geometry; the Portal Door + brass dial are
// interactive per §8.2-§8.3.
export function Foyer({ onEntered }: FoyerProps) {
  const dial = useDial(true);
  const entries = dial.data?.entries ?? [];
  const [aimed, setAimed] = useState<DialEntry | null>(null);
  const [settled, setSettled] = useState<DialEntry | null>(null);
  const [greeting, setGreeting] = useState<{ speaker: string; text: string } | null>(null);
  const [crossing, setCrossing] = useState(false);
  // §14.2, §8.5: live mood + foyer co-presence over the singleton's
  // WebSocket fanout.
  const factory = useFactoryConnection();

  const handleAim = useCallback((entry: DialEntry) => setAimed(entry), []);
  const handleSettle = useCallback((entry: DialEntry) => {
    setSettled(entry);
    void settleOnShell(entry.shell_id).catch(() => {
      // Settle is advisory: pre-gen will retry on actual threshold cross.
    });
    // §16.1: dial settle time, measured from page load (good enough
    // for Phase 1's dashboard; Phase 2 ties it to first dial interaction).
    emitTelemetry({
      signal: 'dial_settle_ms',
      value: performance.now(),
      labels: { shell_id: entry.shell_id },
    });
  }, []);

  // §5.1: open the door. POST /rooms/threshold, swap scenes when
  // the manifest comes back.
  const handleOpenDoor = useCallback(async () => {
    if (!settled || crossing) return;
    setCrossing(true);
    try {
      const response = await crossThreshold(settled.shell_id);
      onEntered(response);
    } catch {
      // §19.1: fall silent on error; the dial stays settled so the
      // guest can try again or pick a different room.
    } finally {
      setCrossing(false);
    }
  }, [settled, crossing, onEntered]);

  // §16.1: The Pause. The foyer is a generated-content surface (the
  // dial's resonant layout); 3s of no input emits a Pause event.
  usePauseDetector({ shell: 'the-foyer' });

  // §22.4: pre-load the typography registry so the dial doesn't stall
  // the first time the needle sweeps onto an unfamiliar shell.
  useTypographyPreload();

  // §17.3: the Sweetwright greets the guest in the foyer. This is the
  // consent moment — in-character — and it doubles as the first line a
  // new guest hears from the factory.
  useEffect(() => {
    let cancelled = false;
    speakToOompaLoompa({
      character_id: 'ol-sweetwright',
      shell_id: 'the-foyer',
      prompt_hint: 'A guest has just arrived in the foyer.',
    })
      .then((reply) => {
        if (cancelled) return;
        setGreeting({ speaker: 'The Sweetwright', text: reply.text });
        window.setTimeout(() => {
          if (!cancelled) setGreeting(null);
        }, 7000);
      })
      .catch(() => {
        // Silent: §19.1 says the factory falls silent rather than apologize for itself.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 1.7, 5], fov: 50 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#1a1410']} />
          <fog attach="fog" args={['#1a1410', 6, 18]} />
          <ambientLight intensity={0.15} />
          <directionalLight position={[3, 5, 2]} intensity={0.6} color="#f6e7c3" castShadow />
          <FoyerFloor />
          <PortalWall />
          <PortalDoor position={[0, 1.2, -3.5]} />
          <CoPresenceGhosts presence={factory.presence} />
          <Sign position={[-0.8, 2.4, -3.45]} text={aimed?.name ?? ''} />
          <NamePlate
            position={[1.6, 1.8, -3.45]}
            text={aimed?.name ?? '—'}
            {...(aimed?.typography ? { typography: aimed.typography } : {})}
          />
          {entries.length > 0 && (
            <BrassDial
              position={[1.6, 1.2, -3.4]}
              entries={entries}
              onAim={handleAim}
              onSettle={handleSettle}
            />
          )}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.9}
          />
        </Suspense>
      </Canvas>
      <TicketStub />
      {greeting ? <SubtitleOverlay speaker={greeting.speaker} text={greeting.text} /> : null}
      {settled ? (
        <OpenDoorAffordance name={settled.name} disabled={crossing} onOpen={handleOpenDoor} />
      ) : null}
    </>
  );
}

function OpenDoorAffordance({
  name,
  disabled,
  onOpen,
}: {
  name: string;
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '1.5rem',
        transform: 'translateX(-50%)',
        padding: '0.7rem 1.4rem',
        background: disabled ? '#5a3a2a' : '#b8860b',
        color: '#1a1410',
        border: 'none',
        borderRadius: '2px',
        fontFamily: 'serif',
        fontSize: '1rem',
        letterSpacing: '0.05em',
        cursor: disabled ? 'progress' : 'pointer',
        boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {disabled ? 'Opening…' : `Open the door to ${name}`}
    </button>
  );
}

function FoyerFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#2a1f17" roughness={0.9} />
    </mesh>
  );
}

function PortalWall() {
  return (
    <mesh position={[0, 2, -4]} receiveShadow>
      <planeGeometry args={[12, 6]} />
      <meshStandardMaterial color="#3a2a1c" roughness={0.85} />
    </mesh>
  );
}
