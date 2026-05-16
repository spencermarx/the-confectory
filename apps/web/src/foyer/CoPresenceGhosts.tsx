interface CoPresenceGhostsProps {
  presence: Array<{ ghost_token: string }>;
}

// §8.5: ghostly co-presence. Other guests in the foyer appear as faint,
// semi-transparent figures examining their own portal walls. No
// interaction. No voice. Just witness.
//
// Phase 2 renders a tasteful low-poly silhouette per active ghost,
// positioned deterministically around the foyer based on the ghost
// token so the layout stays stable across frames.
export function CoPresenceGhosts({ presence }: CoPresenceGhostsProps) {
  return (
    <group>
      {presence.map((ghost) => {
        const position = ghostPosition(ghost.ghost_token);
        return <Ghost key={ghost.ghost_token} position={position} />;
      })}
    </group>
  );
}

function Ghost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.22, 1.0, 4, 8]} />
        <meshStandardMaterial color="#f6e7c3" transparent opacity={0.18} roughness={1} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#f6e7c3" transparent opacity={0.22} roughness={1} />
      </mesh>
    </group>
  );
}

// Deterministic position keyed by ghost token. Stays consistent
// across reloads so the ghost is recognisably "in the same spot".
function ghostPosition(token: string): [number, number, number] {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const angle = (hash >>> 0) / 0xffffffff;
  const radius = 2.8 + (((hash >>> 8) & 0xff) / 255) * 1.5;
  const theta = angle * Math.PI * 2;
  return [Math.cos(theta) * radius, 0, Math.sin(theta) * radius * 0.6];
}
