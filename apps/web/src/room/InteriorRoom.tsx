import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { Sign } from '../foyer/Sign.tsx';
import { TicketStub } from '../foyer/TicketStub.tsx';
import type { AssembledRoom } from '../hooks/use-threshold.ts';

interface InteriorRoomProps {
  manifest: AssembledRoom;
  onReturnToFoyer: () => void;
}

// §5.1: the rendered destination. Phase 1 placeholder geometry —
// a box-shaped room, mood-tinted lighting, the sign on the back wall,
// the resolved props and Oompa-Loompas listed as world-side annotations.
// Real glTF meshes land when the asset pipeline (§3.7) is wired.
export function InteriorRoom({ manifest, onReturnToFoyer }: InteriorRoomProps) {
  const palette = useMemo(() => moodPalette(manifest.mood_at_entry), [manifest.mood_at_entry]);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 1.7, 4.5], fov: 50 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={[palette.fog]} />
          <fog attach="fog" args={[palette.fog, 5, 16]} />
          <ambientLight intensity={0.25} color={palette.ambient} />
          <directionalLight position={[3, 5, 2]} intensity={0.7} color={palette.key} castShadow />
          <pointLight position={[-2, 2, 2]} intensity={0.4} color={palette.accent} distance={6} />
          <RoomShell palette={palette} />
          <Sign position={[0, 2.3, -3.9]} text={manifest.sign_text} />
          {manifest.resolved_props.map((prop, i) => (
            <PropMarker key={prop.prop_slot_id} index={i} label={prop.prop_id} />
          ))}
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.9}
          />
        </Suspense>
      </Canvas>
      <TicketStub />
      <RoomHud manifest={manifest} onReturnToFoyer={onReturnToFoyer} ambient={palette.ambient} />
    </>
  );
}

interface Palette {
  fog: string;
  ambient: string;
  key: string;
  accent: string;
  floor: string;
  wall: string;
}

// §5.2 step 3: the room's mood reaches the renderer. Whimsy warms,
// menace cools, indulgence saturates. Phase 1's stylized watercolor
// pipeline (§13.2) lands later; the palette here is a rough proxy.
function moodPalette(mood: AssembledRoom['mood_at_entry']): Palette {
  const warmth = mood.whimsy * 0.7 + mood.indulgence * 0.3;
  const menace = mood.menace;
  const r = Math.round(40 + warmth * 80 - menace * 20);
  const g = Math.round(30 + warmth * 60 - menace * 20);
  const b = Math.round(25 + (1 - warmth) * 30 - menace * 10);
  const fog = `rgb(${clamp(r * 0.4)}, ${clamp(g * 0.4)}, ${clamp(b * 0.5)})`;
  const ambient = `rgb(${clamp(r * 2)}, ${clamp(g * 1.6)}, ${clamp(b * 1.2)})`;
  const key = `rgb(${clamp(r * 3.3)}, ${clamp(g * 2.8)}, ${clamp(b * 2.0)})`;
  const accent =
    menace > 0.5
      ? `rgb(${clamp(180 + menace * 60)}, ${clamp(40)}, ${clamp(30)})`
      : `rgb(${clamp(180 + warmth * 60)}, ${clamp(120 + warmth * 50)}, ${clamp(80)})`;
  return {
    fog,
    ambient,
    key,
    accent,
    floor: `rgb(${clamp(r * 1.0)}, ${clamp(g * 0.8)}, ${clamp(b * 0.6)})`,
    wall: `rgb(${clamp(r * 1.3)}, ${clamp(g * 1.0)}, ${clamp(b * 0.8)})`,
  };
}

function clamp(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function RoomShell({ palette }: { palette: Palette }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={palette.floor} roughness={0.92} />
      </mesh>
      <mesh position={[0, 2.2, -4]} receiveShadow>
        <planeGeometry args={[10, 4.4]} />
        <meshStandardMaterial color={palette.wall} roughness={0.88} />
      </mesh>
      <mesh position={[-5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4.4]} />
        <meshStandardMaterial color={palette.wall} roughness={0.88} />
      </mesh>
      <mesh position={[5, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4.4]} />
        <meshStandardMaterial color={palette.wall} roughness={0.88} />
      </mesh>
      <mesh position={[0, 4.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={palette.floor} roughness={0.95} />
      </mesh>
    </group>
  );
}

function PropMarker({ index, label }: { index: number; label: string }) {
  // §4.1 prop_slots: Phase 1 markers are simple small spheres at known
  // positions. Real props come from the prop library + the assignment
  // pipeline; this just shows that something landed in the slot.
  const angle = (index / 6) * Math.PI * 2;
  const x = Math.cos(angle) * 1.6;
  const z = Math.sin(angle) * 1.2;
  return (
    <mesh position={[x, 0.4, z]} castShadow>
      <sphereGeometry args={[0.18, 16, 16]} />
      <meshStandardMaterial color="#a06b3a" roughness={0.5} metalness={0.1} />
      <title>{label}</title>
    </mesh>
  );
}

function RoomHud({
  manifest,
  onReturnToFoyer,
  ambient,
}: {
  manifest: AssembledRoom;
  onReturnToFoyer: () => void;
  ambient: string;
}) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          color: '#f6e7c3',
          fontFamily: 'serif',
          fontSize: '0.9rem',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ fontSize: '1.4rem', fontStyle: 'italic' }}>{manifest.sign_text}</div>
        <div style={{ opacity: 0.7, marginTop: '0.25rem' }}>
          mood — whimsy {manifest.mood_at_entry.whimsy.toFixed(2)} · menace{' '}
          {manifest.mood_at_entry.menace.toFixed(2)} · pace {manifest.mood_at_entry.pace.toFixed(2)}
          {manifest.served_from_fallback ? ' · (fallback served)' : ''}
        </div>
        {manifest.oompa_loompa_assignments.length > 0 && (
          <div style={{ opacity: 0.7, marginTop: '0.25rem' }}>
            Oompa-Loompas present: {manifest.oompa_loompa_assignments.join(', ')}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onReturnToFoyer}
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          padding: '0.6rem 1.1rem',
          background: ambient,
          color: '#1a1410',
          border: 'none',
          borderRadius: '2px',
          fontFamily: 'serif',
          fontSize: '0.9rem',
          letterSpacing: '0.05em',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        ← Return to the foyer
      </button>
    </>
  );
}
