"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

function AnimatedRig({ playing, elapsedMs }: { playing: boolean; elapsedMs: number }) {
  const group = useRef<Group>(null);
  const t = playing || elapsedMs > 0 ? elapsedMs / 1000 : 0;

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = t * 0.6;
    group.current.position.y = Math.sin(t * 2.4) * 0.08;
  });

  return (
    <group ref={group}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshStandardMaterial color="#ffffff" wireframe />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.7, 0.9, 0.35]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
      <mesh position={[-0.45, 0.55, 0]} rotation={[0, 0, Math.sin(t * 3) * 0.4]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[0.45, 0.55, 0]} rotation={[0, 0, -Math.sin(t * 3) * 0.4]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[-0.18, -0.35, 0]} rotation={[Math.sin(t * 4) * 0.5, 0, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      <mesh position={[0.18, -0.35, 0]} rotation={[-Math.sin(t * 4) * 0.5, 0, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[1.2, 1.25, 64]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
    </group>
  );
}

type ScenePreview3DProps = {
  playing: boolean;
  elapsedMs: number;
  className?: string;
};

export function ScenePreview3D({
  playing,
  elapsedMs,
  className,
}: ScenePreview3DProps) {
  return (
    <div className={className}>
      <div className="h-[280px] w-full overflow-hidden rounded-md border border-border bg-black">
        <Canvas gl={{ antialias: true, alpha: false }}>
          <color attach="background" args={["#000000"]} />
          <PerspectiveCamera makeDefault position={[2.4, 1.6, 2.8]} fov={45} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[4, 6, 3]} intensity={1.1} color="#ffffff" />
          <directionalLight position={[-3, 2, -2]} intensity={0.25} color="#aaaaaa" />
          <AnimatedRig playing={playing} elapsedMs={elapsedMs} />
          <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
          <gridHelper args={[6, 12, "#222222", "#111111"]} />
        </Canvas>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        3D rig preview · React Three Fiber · orbit enabled
      </p>
    </div>
  );
}
