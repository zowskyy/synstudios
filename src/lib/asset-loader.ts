/**
 * Lightweight asset loading — object URLs with LRU eviction, no APK bundling.
 */

import {
  ASSET_BUDGET,
  type AssetRejectReason,
  assetRejectMessage,
  validateSpriteDimensions,
  validateSpriteFile,
} from "@/lib/asset-budget";

type CachedEntry = {
  url: string;
  fileName: string;
  lastUsed: number;
};

const cache = new Map<string, CachedEntry>();
let order: string[] = [];

function touch(key: string, entry: CachedEntry): void {
  entry.lastUsed = Date.now();
  order = order.filter((k) => k !== key);
  order.push(key);
}

function evictIfNeeded(): void {
  while (order.length > ASSET_BUDGET.maxCachedAssets) {
    const oldest = order.shift();
    if (!oldest) break;
    const entry = cache.get(oldest);
    if (entry) URL.revokeObjectURL(entry.url);
    cache.delete(oldest);
  }
}

export type SpriteLoadResult =
  | { ok: true; url: string; fileName: string }
  | { ok: false; reason: AssetRejectReason; message: string };

export async function loadSpriteSheetFile(file: File): Promise<SpriteLoadResult> {
  const fileReason = validateSpriteFile(file);
  if (fileReason) {
    return { ok: false, reason: fileReason, message: assetRejectMessage(fileReason) };
  }

  const dimReason = await validateSpriteDimensions(file);
  if (dimReason) {
    return { ok: false, reason: dimReason, message: assetRejectMessage(dimReason) };
  }

  const key = `${file.name}-${file.size}-${file.lastModified}`;
  const existing = cache.get(key);
  if (existing) {
    touch(key, existing);
    return { ok: true, url: existing.url, fileName: existing.fileName };
  }

  const url = URL.createObjectURL(file);
  cache.set(key, { url, fileName: file.name, lastUsed: Date.now() });
  touch(key, cache.get(key)!);
  evictIfNeeded();
  return { ok: true, url, fileName: file.name };
}

export function releaseObjectUrl(url: string | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  for (const [key, entry] of cache.entries()) {
    if (entry.url === url) {
      URL.revokeObjectURL(entry.url);
      cache.delete(key);
      order = order.filter((k) => k !== key);
      return;
    }
  }
  URL.revokeObjectURL(url);
}

export function clearAssetCache(): void {
  for (const entry of cache.values()) URL.revokeObjectURL(entry.url);
  cache.clear();
  order = [];
}
