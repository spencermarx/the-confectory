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
        camera={{ position: [0, 1.7, 5], fov: 55 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#241a13']} />
          <fog attach="fog" args={['#241a13', 12, 30]} />
          {/* §12.3 warm low-key lighting. Lifted from the previous
              near-black levels so the foyer is actually legible. */}
          <ambientLight intensity={0.55} color="#f6e7c3" />
          <directionalLight
            position={[3, 6, 4]}
            intensity={0.9}
            color="#f6e7c3"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-3, 2.4, 0]} intensity={0.55} color="#f6c97f" distance={9} />
          <pointLight position={[3, 2.4, 0]} intensity={0.55} color="#f6c97f" distance={9} />
          <FoyerShell />
          <PortalDoor position={[0, 1.2, -3.9]} />
          <CoPresenceGhosts presence={factory.presence} />
          <Sign position={[-1.8, 2.6, -3.95]} text={aimed?.name ?? ''} />
          <NamePlate
            position={[1.8, 2.4, -3.95]}
            text={aimed?.name ?? '—'}
            {...(aimed?.typography ? { typography: aimed.typography } : {})}
          />
          {entries.length > 0 && (
            <BrassDial
              position={[1.8, 1.3, -3.92]}
              entries={entries}
              onAim={handleAim}
              onSettle={handleSettle}
            />
          )}
          {/* §8.2: orbit + zoom + pan so the guest can look around.
              Phase 3 will swap this for a Rapier character controller
              (§13.4); for Phase 2 smoke-test we lean on drei's helper. */}
          <OrbitControls
            enablePan
            enableZoom
            target={[0, 1.5, -3]}
            minDistance={2}
            maxDistance={10}
            minPolarAngle={Math.PI / 3.2}
            maxPolarAngle={Math.PI / 1.7}
          />
        </Suspense>
      </Canvas>
      <TicketStub />
      <ControlsHint />
      {greeting ? <SubtitleOverlay speaker={greeting.speaker} text={greeting.text} /> : null}
      {settled ? (
        <OpenDoorAffordance name={settled.name} disabled={crossing} onOpen={handleOpenDoor} />
      ) : null}
    </>
  );
}

// §6 diegetic-over-chrome — minimum chrome. A short controls hint
// for the smoke test; it can be styled out later.
function ControlsHint() {
  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#f6e7c3',
        fontFamily: 'serif',
        fontSize: '0.8rem',
        letterSpacing: '0.06em',
        opacity: 0.55,
        pointerEvents: 'none',
        textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        textAlign: 'center',
        lineHeight: 1.5,
      }}
    >
      drag empty space to look — scroll to zoom — right-drag to pan
      <br />
      drag the brass dial to choose a room
    </div>
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

// §8.1: the foyer is hand-authored. Phase 1 placeholder — a boxed-in
// rectangular room with the Portal Wall at -Z, sized so the camera
// can pan/zoom around inside without seeing the void.
function FoyerShell() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#3a2a1c" roughness={0.9} />
      </mesh>
      {/* Back wall (Portal Wall) */}
      <mesh position={[0, 2.5, -4]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#4a3424" roughness={0.85} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-7, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#4a3424" roughness={0.85} />
      </mesh>
      <mesh position={[7, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#4a3424" roughness={0.85} />
      </mesh>
      {/* Front wall (behind the camera) */}
      <mesh position={[0, 2.5, 7]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#4a3424" roughness={0.85} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#2a1f17" roughness={0.95} />
      </mesh>
    </group>
  );
}
