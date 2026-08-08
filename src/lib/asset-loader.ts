/**
 * Lightweight asset loading — object URLs with LRU eviction, no APK bundling.
 * Heavy sheets auto-downscale to an 8-frame proxy strip (Phase 2).
 */

import {
  ASSET_BUDGET,
  type AssetRejectReason,
  assetRejectMessage,
  validateSpriteDimensions,
  validateSpriteFile,
} from "@/lib/asset-budget";
import { generateProxyStrip } from "@/lib/sprite-proxy-worker";

type CachedEntry = {
  url: string;
  fileName: string;
  lastUsed: number;
  isProxy?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
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

function cacheKey(file: File, proxy: boolean): string {
  return `${file.name}-${file.size}-${file.lastModified}${proxy ? "-proxy" : ""}`;
}

function storeUrl(
  key: string,
  url: string,
  fileName: string,
  meta?: Pick<CachedEntry, "isProxy" | "frameWidth" | "frameHeight" | "frameCount">,
): string {
  cache.set(key, { url, fileName, lastUsed: Date.now(), ...meta });
  touch(key, cache.get(key)!);
  evictIfNeeded();
  return url;
}

export type SpriteLoadResult =
  | {
      ok: true;
      url: string;
      fileName: string;
      isProxy?: boolean;
      frameWidth?: number;
      frameHeight?: number;
      frameCount?: number;
    }
  | { ok: false; reason: AssetRejectReason | "proxy_failed"; message: string };

async function needsProxy(file: File): Promise<boolean> {
  if (file.size > ASSET_BUDGET.maxSpriteSheetBytes) return true;
  const dimReason = await validateSpriteDimensions(file);
  return dimReason === "pixels_too_large";
}

export async function loadSpriteSheetFile(file: File): Promise<SpriteLoadResult> {
  const fileReason = validateSpriteFile(file);
  if (fileReason === "unsupported_type") {
    return { ok: false, reason: fileReason, message: assetRejectMessage(fileReason) };
  }

  const useProxy = fileReason === "file_too_large" || (await needsProxy(file));

  if (useProxy) {
    const key = cacheKey(file, true);
    const existing = cache.get(key);
    if (existing) {
      touch(key, existing);
      return {
        ok: true,
        url: existing.url,
        fileName: `${existing.fileName} (proxy)`,
        isProxy: true,
        frameWidth: existing.frameWidth,
        frameHeight: existing.frameHeight,
        frameCount: existing.frameCount,
      };
    }

    try {
      const proxy = await generateProxyStrip(file);
      const url = storeUrl(key, proxy.url, file.name, {
        isProxy: true,
        frameWidth: proxy.frameWidth,
        frameHeight: proxy.frameHeight,
        frameCount: proxy.frameCount,
      });
      return {
        ok: true,
        url,
        fileName: `${file.name} (proxy)`,
        isProxy: true,
        frameWidth: proxy.frameWidth,
        frameHeight: proxy.frameHeight,
        frameCount: proxy.frameCount,
      };
    } catch {
      return {
        ok: false,
        reason: "proxy_failed",
        message:
          "Could not build proxy preview for this sheet. Export a smaller strip or trial.json sidecar (see Asset Roadmap).",
      };
    }
  }

  const key = cacheKey(file, false);
  const existing = cache.get(key);
  if (existing) {
    touch(key, existing);
    return { ok: true, url: existing.url, fileName: existing.fileName };
  }

  const url = storeUrl(key, URL.createObjectURL(file), file.name);
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
