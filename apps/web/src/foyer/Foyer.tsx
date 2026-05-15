import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { PortalDoor } from './PortalDoor.tsx';

// §8: the foyer is the only persistent room. Hand-authored.
// Phase 1 placeholder: a dark room with the Portal Door on the far wall.
// The brass dial logic ships in Phase 1.2 (§21.2).
export function Foyer() {
  return (
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
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.9}
        />
      </Suspense>
    </Canvas>
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
