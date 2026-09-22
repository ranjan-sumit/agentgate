import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Particle field parted by a central vertical "gate slit"; particles drift
// toward the slit and are absorbed (respawn at edges).
function Particles() {
  const COUNT = 1200;
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const speed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      speed[i] = 0.004 + Math.random() * 0.012;
    }
    return { pos, speed };
  }, []);

  useFrame(() => {
    const p = ref.current;
    if (!p) return;
    const arr = (p.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const x = arr[i * 3];
      const dir = x > 0 ? -1 : 1;
      arr[i * 3] = x + dir * data.speed[i] * (1 + (12 - Math.abs(x)) * 0.06);
      if (Math.abs(arr[i * 3]) < 0.15) {
        // absorbed by the gate — respawn at the far edge
        arr[i * 3] = dir > 0 ? -12 : 12;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      }
    }
    p.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#38E1C6" size={0.05} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function GateSlit() {
  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[0.08, 16]} />
      <meshBasicMaterial color="#38E1C6" transparent opacity={0.9} />
    </mesh>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0, zIndex: 1 }}
      camera={{ position: [0, 0, 10], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
    >
      <Particles />
      <GateSlit />
    </Canvas>
  );
}
