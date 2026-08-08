/**
 * Frontier Syntax bridge — trial metadata export for wasm codegen (Phase 6).
 */

import type { SceneTuning } from "@/lib/scene-tuning";
import type { SpriteTuning } from "@/lib/sprite-tuning";

export type FrontierTrialPack = {
  version: "1";
  exportedAt: string;
  durationMs: number;
  strip?: {
    layout: SpriteTuning["sheetLayout"];
    frameWidth: number;
    frameHeight: number;
    fps: number;
    loop: boolean;
  };
  proxyGltf?: string;
  scene?: {
    viewportMode: SceneTuning["viewportMode"];
    playbackRate: number;
    fov: number;
  };
  clipName?: string;
};

export type FrontierExportInput = {
  durationMs: number;
  spriteTuning: SpriteTuning;
  sceneTuning: SceneTuning;
  customGltfUrl?: string;
  clipName?: string;
};

export function toFrontierTrialPack(input: FrontierExportInput): FrontierTrialPack {
  return {
    version: "1",
    exportedAt: new Date().toISOString(),
    durationMs: input.durationMs,
    clipName: input.clipName,
    strip: {
      layout: input.spriteTuning.sheetLayout,
      frameWidth: input.spriteTuning.frameWidth,
      frameHeight: input.spriteTuning.frameHeight,
      fps: input.spriteTuning.fps,
      loop: input.spriteTuning.loop,
    },
    proxyGltf: input.customGltfUrl,
    scene: {
      viewportMode: input.sceneTuning.viewportMode,
      playbackRate: input.sceneTuning.playbackRate,
      fov: input.sceneTuning.fov,
    },
  };
}

export function frontierTrialPackJson(pack: FrontierTrialPack): string {
  return JSON.stringify(pack, null, 2);
}

export function downloadFrontierTrialPack(pack: FrontierTrialPack, fileName = "frontier-trial.json"): void {
  const blob = new Blob([frontierTrialPackJson(pack)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
