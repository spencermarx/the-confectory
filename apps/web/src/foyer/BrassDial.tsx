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

const DIAL_RADIUS = 0.55;
const DIAL_DEPTH = 0.08;
const TICK_RADIUS = 0.46;

// §8.2: a brass dial. Click-and-drag rotates it; the needle settles on
// a name. Resistance and inertia are modeled here in JS for Phase 1
// (the spec calls for Rapier, but the dial's motion is 1-DOF and a
// simple integrator is enough at this complexity).
//
// The dial face is oriented toward the camera: the outer wrapper
// rotates the Y-axis cylinder 90° around X so the flat face points
// along +Z, and the inner spinning group rotates around its own local
// Y axis (which is the world Z axis after the X-rotation bake). That
// keeps `angleRef` in radians-of-spin around the dial's axis without
// the spinner tumbling sideways.
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

    // Inner group spins around its local Y. After the outer wrapper
    // rotates [PI/2, 0, 0], local-Y points along world +Z (away from
    // camera) — which is exactly the dial's axis, so spinning here
    // rolls the face.
    group.rotation.y = angleRef.current;

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
      {/* §8.2: dial face toward camera. */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <group ref={groupRef}>
          <mesh
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            castShadow
          >
            <cylinderGeometry args={[DIAL_RADIUS, DIAL_RADIUS, DIAL_DEPTH, 64]} />
            <meshStandardMaterial color="#d4a017" metalness={0.85} roughness={0.22} />
          </mesh>
          {/* Inner ring — darker recessed face. */}
          <mesh position={[0, DIAL_DEPTH / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[DIAL_RADIUS * 0.65, DIAL_RADIUS * 0.92, 64]} />
            <meshStandardMaterial color="#7a5012" metalness={0.6} roughness={0.5} />
          </mesh>
          {/* Tick marks arranged around the rim, one per entry. */}
          {entries.map((entry) => {
            const x = Math.cos(entry.angle) * TICK_RADIUS;
            const z = Math.sin(entry.angle) * TICK_RADIUS;
            return (
              <mesh
                key={entry.shell_id}
                position={[x, DIAL_DEPTH / 2 + 0.002, z]}
                rotation={[0, -entry.angle, 0]}
              >
                <boxGeometry args={[0.04, 0.015, 0.1]} />
                <meshStandardMaterial
                  color="#2a1f17"
                  metalness={0.3}
                  roughness={0.55}
                  transparent
                  opacity={0.45 + entry.prominence * 0.55}
                />
              </mesh>
            );
          })}
        </group>
      </group>
      {/* Fixed needle that doesn't rotate with the dial. Points up
          toward the name plate. */}
      <mesh position={[0, DIAL_RADIUS + 0.05, 0.06]} castShadow>
        <coneGeometry args={[0.05, 0.18, 16]} />
        <meshStandardMaterial color="#f6c97f" metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Decorative back plate so the dial reads as set into the wall.
          circleGeometry is XY-plane (normal +Z) so this faces camera. */}
      <mesh position={[0, 0, -0.06]}>
        <circleGeometry args={[DIAL_RADIUS + 0.18, 48]} />
        <meshStandardMaterial color="#5a3a2a" metalness={0.3} roughness={0.7} />
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
