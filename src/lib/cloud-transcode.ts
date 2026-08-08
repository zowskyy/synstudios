/**
 * Cloud transcode lane — optional accelerator, offline-first (Phase 5).
 */

import { Capacitor } from "@capacitor/core";
import { generateProxyStrip } from "@/lib/sprite-proxy-worker";
import {
  createTrialPackExpiry,
  type TrialPack,
} from "@/lib/trial-pack";
import { TRIAL_DURATION_MS } from "@/lib/trial-types";

export const DEFAULT_TRANSCODE_URL = "/api/transcode";

export type TranscodeOptions = {
  optedIn: boolean;
  endpoint?: string;
};

export async function buildLocalTrialPack(file: File): Promise<TrialPack> {
  const clipName = file.name.replace(/\.[^.]+$/, "");
  const base: TrialPack = {
    version: "1",
    generatedAt: new Date().toISOString(),
    expiresAt: createTrialPackExpiry(),
    clipName,
    durationMs: TRIAL_DURATION_MS,
    sourceBytes: file.size,
    offlineFallback: true,
    note: "Built on-device — no cloud upload",
  };

  if (file.type.startsWith("image/") || /\.(png|webp)$/i.test(file.name)) {
    const proxy = await generateProxyStrip(file);
    base.strip = {
      frameWidth: proxy.frameWidth,
      frameHeight: proxy.frameHeight,
      fps: 12,
      frameCount: proxy.frameCount,
      dataUrl: proxy.url,
    };
    return base;
  }

  base.sidecar = {
    version: "1",
    source: "manual",
    clipName,
    durationMs: TRIAL_DURATION_MS,
    fps: 12,
    note: "Local pack — use streamed glTF or sprite upload for preview",
  };
  return base;
}

export async function requestCloudTranscode(
  file: File,
  options: TranscodeOptions,
): Promise<TrialPack> {
  if (!options.optedIn) {
    throw new Error("Cloud transcode requires opt-in");
  }

  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    return buildLocalTrialPack(file);
  }

  const endpoint = options.endpoint ?? DEFAULT_TRANSCODE_URL;
  const transcodeUrl =
    typeof window !== "undefined" && endpoint === DEFAULT_TRANSCODE_URL
      ? `${window.location.protocol}//${window.location.hostname}:3003/api/transcode`
      : endpoint;

  try {
    const res = await fetch(transcodeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        optedIn: true,
        fileName: file.name,
        sizeBytes: file.size,
      }),
    });
    if (!res.ok) {
      return buildLocalTrialPack(file);
    }
    const pack = (await res.json()) as TrialPack;
    if (pack.version !== "1") {
      return buildLocalTrialPack(file);
    }
    return { ...pack, offlineFallback: false };
  } catch {
    return buildLocalTrialPack(file);
  }
}
