import { Text } from '@react-three/drei';

interface NamePlateProps {
  position: [number, number, number];
  text: string;
  // §9.5: the plate uses the room's signature typography.
  // Phase 1 maps the typography id to a font file name; the assets
  // come from R2 in production but ship as static fonts during local dev.
  typography?: string;
}

const TYPOGRAPHY_FONTS: Record<string, string | undefined> = {
  'serif-handwritten-warm': undefined,
  'serif-display': undefined,
};

export function NamePlate({ position, text, typography }: NamePlateProps) {
  const fontUrl = typography ? TYPOGRAPHY_FONTS[typography] : undefined;
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.01]} receiveShadow>
        <planeGeometry args={[1.6, 0.32]} />
        <meshStandardMaterial color="#2a1f17" roughness={0.85} />
      </mesh>
      <Text
        fontSize={0.16}
        color="#f6e7c3"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.5}
        {...(fontUrl ? { font: fontUrl } : {})}
      >
        {text}
      </Text>
    </group>
  );
}
