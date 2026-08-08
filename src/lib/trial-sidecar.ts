/**
 * SynStudios trial sidecar — metadata-only import from Godot / Unreal exports.
 * @see store/EXPORT_TEMPLATES.md
 */

export type TrialSidecar = {
  version: "1";
  source: "godot" | "unreal" | "manual";
  clipName: string;
  durationMs: number;
  fps: number;
  strip?: {
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    layout: "horizontal" | "vertical" | "grid";
  };
  proxyGltf?: {
    bounds: [number, number, number];
    boneCount?: number;
    meshCount?: number;
  };
  note?: string;
};

export type SidecarParseResult =
  | { ok: true; sidecar: TrialSidecar }
  | { ok: false; message: string };

export function parseTrialSidecar(text: string): SidecarParseResult {
  try {
    const raw = JSON.parse(text) as TrialSidecar;
    if (raw.version !== "1") {
      return { ok: false, message: "trial.json version must be \"1\"" };
    }
    if (!raw.clipName || typeof raw.durationMs !== "number" || typeof raw.fps !== "number") {
      return { ok: false, message: "trial.json requires clipName, durationMs, and fps" };
    }
    if (!["godot", "unreal", "manual"].includes(raw.source)) {
      return { ok: false, message: "source must be godot, unreal, or manual" };
    }
    return { ok: true, sidecar: raw };
  } catch {
    return { ok: false, message: "Invalid JSON in trial.json" };
  }
}

export function sidecarToSpriteConfig(sidecar: TrialSidecar) {
  const strip = sidecar.strip;
  return {
    name: sidecar.clipName,
    frameWidth: strip?.frameWidth ?? 32,
    frameHeight: strip?.frameHeight ?? 48,
    fps: sidecar.fps,
    loop: true,
  };
}
