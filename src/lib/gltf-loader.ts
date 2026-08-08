/**
 * Streamed glTF trial loader — single active clip, object URL lifecycle.
 */

import { validateGltfTrial, gltfRejectMessage, type GltfRejectReason } from "@/lib/gltf-budget";
import { parseGltfProxy, type GltfProxyInfo } from "@/lib/gltf-proxy";

type GltfCacheEntry = {
  url: string;
  fileName: string;
};

let activeEntry: GltfCacheEntry | null = null;

export type GltfLoadResult =
  | { ok: true; url: string; fileName: string; header: GltfProxyInfo }
  | { ok: false; reason: GltfRejectReason; message: string };

export async function loadGltfTrialFile(file: File): Promise<GltfLoadResult> {
  const header = await parseGltfProxy(file);
  if (!header) {
    return {
      ok: false,
      reason: "parse_failed",
      message: gltfRejectMessage("parse_failed"),
    };
  }

  const reject = validateGltfTrial(file, header);
  if (reject) {
    return { ok: false, reason: reject, message: gltfRejectMessage(reject) };
  }

  releaseGltfUrl();

  const url = URL.createObjectURL(file);
  activeEntry = { url, fileName: file.name };
  return { ok: true, url, fileName: file.name, header };
}

export function releaseGltfUrl(url?: string): void {
  if (!activeEntry) return;
  if (url && activeEntry.url !== url) return;
  URL.revokeObjectURL(activeEntry.url);
  activeEntry = null;
}

export function getActiveGltfUrl(): string | undefined {
  return activeEntry?.url;
}
