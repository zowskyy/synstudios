/**
 * glTF trial budgets — Phase 3 streamed mesh preview.
 */

import { ASSET_BUDGET, formatBytes } from "@/lib/asset-budget";
import type { GltfProxyInfo } from "@/lib/gltf-proxy";

export const GLTF_BUDGET = {
  /** Max meshes allowed in one trial scene. */
  maxMeshesPerScene: 8,
  /** Files above this size must use Draco or meshopt compression. */
  compressionRequiredAboveBytes: 4 * 1024 * 1024,
} as const;

export type GltfRejectReason =
  | "file_too_large"
  | "unsupported_type"
  | "too_many_meshes"
  | "compression_required"
  | "parse_failed";

export function validateGltfTrial(
  file: File,
  header: GltfProxyInfo,
): GltfRejectReason | null {
  const name = file.name.toLowerCase();
  if (
    !name.endsWith(".glb") &&
    !name.endsWith(".gltf") &&
    file.type !== "model/gltf-binary" &&
    file.type !== "model/gltf+json"
  ) {
    return "unsupported_type";
  }
  if (file.size > ASSET_BUDGET.maxGltfBytes) return "file_too_large";
  if (header.meshCount > GLTF_BUDGET.maxMeshesPerScene) return "too_many_meshes";
  if (
    file.size > GLTF_BUDGET.compressionRequiredAboveBytes &&
    !header.usesDraco &&
    !header.usesMeshopt
  ) {
    return "compression_required";
  }
  return null;
}

export function gltfRejectMessage(reason: GltfRejectReason): string {
  switch (reason) {
    case "file_too_large":
      return `GLB exceeds ${formatBytes(ASSET_BUDGET.maxGltfBytes)} trial limit.`;
    case "unsupported_type":
      return "Use .glb or .gltf for 3D trial preview.";
    case "too_many_meshes":
      return `Scene has too many meshes (max ${GLTF_BUDGET.maxMeshesPerScene}). Merge or split the export.`;
    case "compression_required":
      return `Files over ${formatBytes(GLTF_BUDGET.compressionRequiredAboveBytes)} need Draco or meshopt compression.`;
    case "parse_failed":
      return "Could not read glTF header.";
  }
}
