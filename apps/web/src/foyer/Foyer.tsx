import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback, useState } from 'react';
import { type DialEntry, settleOnShell, useDial } from '../hooks/use-dial.ts';
import { BrassDial } from './BrassDial.tsx';
import { NamePlate } from './NamePlate.tsx';
import { PortalDoor } from './PortalDoor.tsx';
import { Sign } from './Sign.tsx';
import { TicketStub } from './TicketStub.tsx';

// §8: the foyer is the only persistent room. Hand-authored.
// Phase 1 placeholder geometry; the Portal Door + brass dial are
// interactive per §8.2-§8.3.
export function Foyer() {
  const dial = useDial(true);
  const entries = dial.data?.entries ?? [];
  const [aimed, setAimed] = useState<DialEntry | null>(null);

  const handleAim = useCallback((entry: DialEntry) => setAimed(entry), []);
  const handleSettle = useCallback((entry: DialEntry) => {
    void settleOnShell(entry.shell_id).catch(() => {
      // Settle is advisory: pre-gen will retry on actual threshold cross.
    });
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
    </>
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
