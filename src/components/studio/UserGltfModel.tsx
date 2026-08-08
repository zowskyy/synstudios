"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group } from "three";
import { configureGltfLoader } from "@/lib/gltf-draco";
import { downscaleSceneTextures, disposeGltfScene } from "@/lib/gltf-textures";
import { animTimeSeconds, type SceneTuning } from "@/lib/scene-tuning";

type UserGltfModelProps = {
  url: string;
  playing: boolean;
  elapsedMs: number;
  tuning: SceneTuning;
};

export function UserGltfModel({
  url,
  playing,
  elapsedMs,
  tuning,
}: UserGltfModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(url, undefined, undefined, configureGltfLoader);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    downscaleSceneTextures(clone);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
    const scale = 2.2 / maxAxis;
    clone.scale.setScalar(scale);
    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      disposeGltfScene(prepared);
      useGLTF.clear(url);
    };
  }, [prepared, url]);

  const t = animTimeSeconds(elapsedMs, playing, tuning);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = t * 0.6;
    groupRef.current.position.y = Math.sin(t * 2.4) * 0.04;
  });

  return <primitive ref={groupRef} object={prepared} />;
}
