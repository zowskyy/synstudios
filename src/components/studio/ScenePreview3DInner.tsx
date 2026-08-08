"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import {
  DEFAULT_SCENE_TUNING,
  animTimeSeconds,
  cameraPositionForPreset,
  type SceneTuning,
} from "@/lib/scene-tuning";

function RigMaterial({
  mode,
  baseColor,
  wireframe,
}: {
  mode: SceneTuning["viewportMode"];
  baseColor: string;
  wireframe?: boolean;
}) {
  if (mode === "wireframe" || wireframe) {
    return <meshStandardMaterial color={baseColor} wireframe />;
  }
  if (mode === "unlit") {
    return <meshBasicMaterial color={baseColor} />;
  }
  return <meshStandardMaterial color={baseColor} />;
}

function AnimatedRig({
  playing,
  elapsedMs,
  tuning,
}: {
  playing: boolean;
  elapsedMs: number;
  tuning: SceneTuning;
}) {
  const group = useRef<Group>(null);
  const t = animTimeSeconds(elapsedMs, playing, tuning);

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = t * 0.6;
    group.current.position.y = Math.sin(t * 2.4) * 0.08;
  });

  const mode = tuning.viewportMode;
  const bones = tuning.showBones || mode === "wireframe";

  return (
    <group ref={group}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <RigMaterial mode={mode} baseColor="#ffffff" wireframe={bones} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.7, 0.9, 0.35]} />
        <RigMaterial mode={mode} baseColor="#cccccc" />
      </mesh>
      <mesh position={[-0.45, 0.55, 0]} rotation={[0, 0, Math.sin(t * 3) * 0.4]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <RigMaterial mode={mode} baseColor="#888888" />
      </mesh>
      <mesh position={[0.45, 0.55, 0]} rotation={[0, 0, -Math.sin(t * 3) * 0.4]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <RigMaterial mode={mode} baseColor="#888888" />
      </mesh>
      <mesh position={[-0.18, -0.35, 0]} rotation={[Math.sin(t * 4) * 0.5, 0, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <RigMaterial mode={mode} baseColor="#666666" />
      </mesh>
      <mesh position={[0.18, -0.35, 0]} rotation={[-Math.sin(t * 4) * 0.5, 0, 0]}>
        <boxGeometry args={[0.22, 0.75, 0.22]} />
        <RigMaterial mode={mode} baseColor="#666666" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[1.2, 1.25, 64]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
    </group>
  );
}

function ViewportOverlays({ tuning }: { tuning: SceneTuning }) {
  if (!tuning.showSafeArea && !tuning.showThirds) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {tuning.showThirds ? (
        <>
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
        </>
      ) : null}
      {tuning.showSafeArea ? (
        <div className="absolute inset-[10%] border border-dashed border-white/30" />
      ) : null}
    </div>
  );
}

type ScenePreview3DProps = {
  playing: boolean;
  elapsedMs: number;
  tuning?: SceneTuning;
  className?: string;
};

export function ScenePreview3D({
  playing,
  elapsedMs,
  tuning = DEFAULT_SCENE_TUNING,
  className,
}: ScenePreview3DProps) {
  const camPos = cameraPositionForPreset(tuning.cameraPreset);
  const keyLight = tuning.exposureMode === "fixed" ? 1.35 : 1.1;
  const ambient = tuning.ambientIntensity;

  return (
    <div className={className}>
      <div
        className="relative h-[280px] w-full overflow-hidden rounded-md border border-border bg-black"
        role="img"
        aria-label="3D rig preview canvas"
      >
        <Canvas gl={{ antialias: true, alpha: false }}>
          <color attach="background" args={["#000000"]} />
          <PerspectiveCamera makeDefault position={camPos} fov={tuning.fov} />
          <ambientLight intensity={ambient} />
          <directionalLight position={[4, 6, 3]} intensity={keyLight} color="#ffffff" />
          {tuning.viewportMode === "lit" ? (
            <directionalLight position={[-3, 2, -2]} intensity={0.25} color="#aaaaaa" />
          ) : null}
          <AnimatedRig playing={playing} elapsedMs={elapsedMs} tuning={tuning} />
          <OrbitControls
            enablePan={false}
            minDistance={tuning.orbitMin}
            maxDistance={tuning.orbitMax}
            autoRotate={tuning.autoRotate}
            autoRotateSpeed={0.8}
          />
          {tuning.showGrid ? (
            <gridHelper args={[6, 12, "#222222", "#111111"]} />
          ) : null}
        </Canvas>
        <ViewportOverlays tuning={tuning} />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {tuning.viewportMode} · {tuning.cameraPreset} · {tuning.playbackRate}× · fov{" "}
        {tuning.fov}°
        {tuning.showThirds ? " · ⅓" : ""}
        {tuning.showSafeArea ? " · safe" : ""}
      </p>
    </div>
  );
}
