import { Text } from '@react-three/drei';

interface SignProps {
  position: [number, number, number];
  text: string;
}

// §9.3: the sign is a real 3D object in the room. In production the name
// is pre-baked into a texture at Shell publish time; for the foyer's
// current-aim sign we render at runtime since the name changes as the
// guest sweeps the dial.
export function Sign({ position, text }: SignProps) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.28, 0.04]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.7} />
      </mesh>
      <Text
        position={[0, 0, 0.025]}
        fontSize={0.1}
        color="#f6e7c3"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
      >
        {text}
      </Text>
    </group>
  );
}
