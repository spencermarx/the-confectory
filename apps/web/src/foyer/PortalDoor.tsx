interface PortalDoorProps {
  position: [number, number, number];
}

// §8.2: the Portal Door is a single physical door on a fixed wall.
// Phase 1 placeholder: a tall warm-lit rectangle. The dial,
// resonant layout, and threshold animation land in §21.2.
export function PortalDoor({ position }: PortalDoorProps) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.4, 2.4, 0.1]} />
        <meshStandardMaterial color="#6b3d20" roughness={0.7} />
      </mesh>
      <pointLight position={[0, 0, 0.6]} intensity={0.8} color="#f6c97f" distance={3} />
    </group>
  );
}
