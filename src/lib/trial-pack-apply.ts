/**
 * Apply a trial pack to studio preview state helpers.
 */

import type { TrialPack } from "@/lib/trial-pack";
import { parseTrialSidecar } from "@/lib/trial-sidecar";

export type TrialPackApplyHints = {
  sidecarClip?: string;
  trialDurationMs?: number;
  customSheetUrl?: string;
  spriteFrameWidth?: number;
  spriteFrameHeight?: number;
  spriteFps?: number;
};

export function trialPackToHints(pack: TrialPack): TrialPackApplyHints {
  const hints: TrialPackApplyHints = {
    sidecarClip: pack.clipName,
    trialDurationMs: pack.durationMs,
  };

  if (pack.strip) {
    hints.spriteFrameWidth = pack.strip.frameWidth;
    hints.spriteFrameHeight = pack.strip.frameHeight;
    hints.spriteFps = pack.strip.fps;
    if (pack.strip.dataUrl) {
      hints.customSheetUrl = pack.strip.dataUrl;
    }
  }

  if (pack.sidecar) {
    hints.trialDurationMs = pack.sidecar.durationMs;
    hints.spriteFps = pack.sidecar.fps;
    if (pack.sidecar.strip) {
      hints.spriteFrameWidth = pack.sidecar.strip.frameWidth;
      hints.spriteFrameHeight = pack.sidecar.strip.frameHeight;
    }
  }

  return hints;
}

export function parseTrialPackSidecar(pack: TrialPack) {
  if (pack.sidecar) return { ok: true as const, sidecar: pack.sidecar };
  return parseTrialSidecar(
    JSON.stringify({
      version: "1",
      source: "manual",
      clipName: pack.clipName,
      durationMs: pack.durationMs,
      fps: pack.strip?.fps ?? 12,
      strip: pack.strip
        ? {
            frameWidth: pack.strip.frameWidth,
            frameHeight: pack.strip.frameHeight,
            frameCount: pack.strip.frameCount,
            layout: "horizontal" as const,
          }
        : undefined,
    }),
  );
}
