/**
 * Downscale oversized glTF textures to stay within trial memory budget.
 */

import * as THREE from "three";
import { ASSET_BUDGET } from "@/lib/asset-budget";

const MAP_KEYS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
] as const;

function downscaleTexture(tex: THREE.Texture, maxEdge: number): void {
  const img = tex.image as CanvasImageSource & { width?: number; height?: number };
  if (!img || !img.width || !img.height) return;
  const maxDim = Math.max(img.width, img.height);
  if (maxDim <= maxEdge) return;

  const scale = maxEdge / maxDim;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, w, h);
  tex.image = canvas;
  tex.needsUpdate = true;
}

export function downscaleSceneTextures(
  root: THREE.Object3D,
  maxEdge = ASSET_BUDGET.maxTextureEdgePx,
): number {
  let resized = 0;
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const mat of materials) {
      if (!mat) continue;
      for (const key of MAP_KEYS) {
        const tex = (mat as THREE.MeshStandardMaterial)[key];
        if (!tex || !(tex instanceof THREE.Texture)) continue;
        const img = tex.image as { width?: number; height?: number };
        if (!img?.width || !img?.height) continue;
        if (Math.max(img.width, img.height) > maxEdge) {
          downscaleTexture(tex, maxEdge);
          resized += 1;
        }
      }
    }
  });
  return resized;
}

export function disposeGltfScene(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry?.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const mat of materials) {
      if (!mat) continue;
      for (const key of MAP_KEYS) {
        const tex = (mat as THREE.MeshStandardMaterial)[key];
        if (tex instanceof THREE.Texture) tex.dispose();
      }
      mat.dispose();
    }
  });
}
