/**
 * Trial pack schema — cloud transcode output (Phase 5).
 */

import type { TrialSidecar } from "@/lib/trial-sidecar";

export const TRIAL_PACK_TTL_MS = 24 * 60 * 60 * 1000;

export type TrialPack = {
  version: "1";
  generatedAt: string;
  expiresAt: string;
  clipName: string;
  durationMs: number;
  sourceBytes: number;
  offlineFallback: boolean;
  sidecar?: TrialSidecar;
  strip?: {
    frameWidth: number;
    frameHeight: number;
    fps: number;
    frameCount: number;
    /** PNG data URL of proxy strip when available. */
    dataUrl?: string;
  };
  note?: string;
};

export function isTrialPackExpired(pack: TrialPack): boolean {
  return Date.now() > new Date(pack.expiresAt).getTime();
}

export function createTrialPackExpiry(): string {
  return new Date(Date.now() + TRIAL_PACK_TTL_MS).toISOString();
}
