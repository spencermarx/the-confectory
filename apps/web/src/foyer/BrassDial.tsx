import { nearestEntry } from '@confectory/shared';
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { type Group, Vector2 } from 'three';
import type { DialEntry } from '../hooks/use-dial.ts';

interface BrassDialProps {
  position: [number, number, number];
  entries: readonly DialEntry[];
  onSettle: (entry: DialEntry) => void;
  onAim: (entry: DialEntry) => void;
}

const DRAG_SCALE = 4;
const INERTIA_DECAY = 0.92;
const MIN_VELOCITY = 0.001;
const SETTLE_DELAY_MS = 500;

// §8.2: a brass dial. Click-and-drag rotates it; the needle settles on
// a name. Resistance and inertia are modeled here in JS for Phase 1
// (the spec calls for Rapier, but the dial's motion is 1-DOF and a
// simple integrator is enough at this complexity).
export function BrassDial({ position, entries, onSettle, onAim }: BrassDialProps) {
  const groupRef = useRef<Group>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const dragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const lastAimedShellRef = useRef<string | null>(null);
  const [, forceRender] = useState(0);
  const { size } = useThree();

  useEffect(() => () => clearSettleTimer(settleTimerRef), []);

  const scheduleSettle = () => {
    clearSettleTimer(settleTimerRef);
    settleTimerRef.current = window.setTimeout(() => {
      const entry = nearestEntry(entries, -angleRef.current);
      if (entry) onSettle(entry as DialEntry);
    }, SETTLE_DELAY_MS);
  };

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (dragRef.current === null && Math.abs(velocityRef.current) > MIN_VELOCITY) {
      angleRef.current += velocityRef.current * delta * 60;
      velocityRef.current *= INERTIA_DECAY;
      if (Math.abs(velocityRef.current) <= MIN_VELOCITY) {
        velocityRef.current = 0;
        scheduleSettle();
      }
    }

    group.rotation.z = angleRef.current;

    const aimed = nearestEntry(entries, -angleRef.current);
    if (aimed && aimed.shell_id !== lastAimedShellRef.current) {
      lastAimedShellRef.current = aimed.shell_id;
      onAim(aimed as DialEntry);
      forceRender((n) => n + 1);
    }
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    (event.target as Element | null)?.setPointerCapture?.(event.pointerId);
    dragRef.current = { lastX: event.clientX, lastY: event.clientY };
    velocityRef.current = 0;
    clearSettleTimer(settleTimerRef);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.lastX;
    const dy = event.clientY - dragRef.current.lastY;
    dragRef.current = { lastX: event.clientX, lastY: event.clientY };
    const center = new Vector2(size.width / 2, size.height / 2);
    const toPointer = new Vector2(event.clientX - center.x, event.clientY - center.y);
    // tangent direction around the dial axis at the cursor.
    const tangent = new Vector2(-toPointer.y, toPointer.x).normalize();
    const move = new Vector2(dx, dy);
    const along = move.dot(tangent);
    const dTheta = (along / (size.height / DRAG_SCALE)) * Math.PI;
    angleRef.current -= dTheta;
    velocityRef.current = -dTheta;
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    (event.target as Element | null)?.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    if (Math.abs(velocityRef.current) <= MIN_VELOCITY) {
      scheduleSettle();
    }
  };

  return (
    <group position={position}>
      {/* §8.2: the brass dial body. */}
      <group ref={groupRef}>
        <mesh
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          castShadow
        >
          <cylinderGeometry args={[0.35, 0.35, 0.06, 64]} />
          <meshStandardMaterial color="#b8860b" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Tick marks around the rim, one per entry. */}
        {entries.map((entry) => (
          <mesh key={entry.shell_id} rotation={[0, 0, entry.angle]}>
            <boxGeometry args={[0.02, 0.08, 0.07]} />
            <meshStandardMaterial
              color="#3a2a1c"
              metalness={0.3}
              roughness={0.6}
              transparent
              opacity={0.4 + entry.prominence * 0.6}
            />
          </mesh>
        ))}
      </group>
      {/* Fixed needle that does not rotate with the dial. */}
      <mesh position={[0, 0.42, 0.04]}>
        <coneGeometry args={[0.03, 0.12, 16]} />
        <meshStandardMaterial color="#f6c97f" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function clearSettleTimer(ref: { current: number | null }) {
  if (ref.current !== null) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}
