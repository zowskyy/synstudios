/**
 * Memory and file-size budgets for on-device asset preview.
 * Keeps trials lightweight on Android WebView and mobile browsers.
 */

export const ASSET_BUDGET = {
  /** Max single 2D sprite sheet file before reject (8 MB). */
  maxSpriteSheetBytes: 8 * 1024 * 1024,
  /** Max decoded sprite sheet pixels (width × height) ~16 MP. */
  maxSpriteSheetPixels: 16_000_000,
  /** Max glTF/GLB file for future 3D import (12 MB trial cap). */
  maxGltfBytes: 12 * 1024 * 1024,
  /** Max textures in memory for one trial scene. */
  maxTexturesInMemory: 4,
  /** Target decoded texture edge (downscale if larger). */
  maxTextureEdgePx: 2048,
  /** LRU cache entries for object URLs / decoded sheets. */
  maxCachedAssets: 3,
} as const;

export type AssetRejectReason =
  | "file_too_large"
  | "pixels_too_large"
  | "unsupported_type";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateSpriteFile(file: File): AssetRejectReason | null {
  if (!file.type.startsWith("image/")) return "unsupported_type";
  if (file.size > ASSET_BUDGET.maxSpriteSheetBytes) return "file_too_large";
  return null;
}

export async function validateSpriteDimensions(
  file: File,
): Promise<AssetRejectReason | null> {
  const bitmap = await createImageBitmap(file);
  const pixels = bitmap.width * bitmap.height;
  bitmap.close();
  if (pixels > ASSET_BUDGET.maxSpriteSheetPixels) return "pixels_too_large";
  return null;
}

export function assetRejectMessage(reason: AssetRejectReason): string {
  switch (reason) {
    case "file_too_large":
      return `File exceeds ${formatBytes(ASSET_BUDGET.maxSpriteSheetBytes)} trial limit. Export a smaller strip or use Phase 2 proxy preview (see Asset Roadmap).`;
    case "pixels_too_large":
      return `Image has too many pixels for on-device preview. Downscale or split the sheet (max ~16 MP decoded).`;
    case "unsupported_type":
      return "Use PNG or WebP sprite strips for now.";
  }
}
