/**
 * Unreal Engine 5.8 viewport concepts — adapted for React Three Fiber trial preview.
 * @see https://dev.epicgames.com/documentation/unreal-engine/viewport-modes-in-unreal-engine
 * @see https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-editor-mode-in-unreal-engine
 */

export type ViewportMode = "lit" | "unlit" | "wireframe";
export type CameraPreset = "orbit" | "front" | "side" | "cinematic";
export type ExposureMode = "auto" | "fixed";

export type SceneTuning = {
  viewportMode: ViewportMode;
  cameraPreset: CameraPreset;
  fov: number;
  orbitMin: number;
  orbitMax: number;
  autoRotate: boolean;
  playbackRate: number;
  showGrid: boolean;
  showSafeArea: boolean;
  showThirds: boolean;
  exposureMode: ExposureMode;
  ambientIntensity: number;
  rigAnimSpeed: number;
  showBones: boolean;
};

export const DEFAULT_SCENE_TUNING: SceneTuning = {
  viewportMode: "lit",
  cameraPreset: "orbit",
  fov: 45,
  orbitMin: 2,
  orbitMax: 6,
  autoRotate: false,
  playbackRate: 1,
  showGrid: true,
  showSafeArea: false,
  showThirds: false,
  exposureMode: "auto",
  ambientIntensity: 0.35,
  rigAnimSpeed: 1,
  showBones: false,
};

export type ScenePreset = {
  id: string;
  label: string;
  description: string;
  unrealRef: string;
  patch: Partial<SceneTuning>;
};

export const VIEWPORT_MODE_PRESETS: ScenePreset[] = [
  { id: "lit", label: "Lit", description: "Materials + lighting", unrealRef: "Lit Mode", patch: { viewportMode: "lit" } },
  { id: "unlit", label: "Unlit", description: "Flat shading check", unrealRef: "Unlit Mode", patch: { viewportMode: "unlit" } },
  { id: "wire", label: "Wire", description: "Topology / rig debug", unrealRef: "Show Bones / wireframe", patch: { viewportMode: "wireframe", showBones: true } },
];

export const CAMERA_PRESETS: ScenePreset[] = [
  { id: "orbit", label: "Orbit", description: "Default tumble", unrealRef: "Alt+LMB orbit", patch: { cameraPreset: "orbit", fov: 45 } },
  { id: "front", label: "Front", description: "Character front", unrealRef: "Orthographic front / focus", patch: { cameraPreset: "front", fov: 40 } },
  { id: "side", label: "Side", description: "Profile view", unrealRef: "Side viewport", patch: { cameraPreset: "side", fov: 40 } },
  { id: "cine", label: "Cine", description: "Low hero angle", unrealRef: "Cinematic Viewport / Cine Camera", patch: { cameraPreset: "cinematic", fov: 35, showThirds: true, showSafeArea: true } },
];

export const PLAYBACK_PRESETS: ScenePreset[] = [
  { id: "quarter", label: "¼×", description: "Slow preview", unrealRef: "Sequencer playback rate", patch: { playbackRate: 0.25 } },
  { id: "half", label: "½×", description: "Half speed", unrealRef: "Sequencer playback rate", patch: { playbackRate: 0.5 } },
  { id: "normal", label: "1×", description: "Realtime", unrealRef: "Sequencer playback rate", patch: { playbackRate: 1 } },
  { id: "double", label: "2×", description: "Fast review", unrealRef: "Sequencer playback rate", patch: { playbackRate: 2 } },
];

export const FOV_PRESETS: ScenePreset[] = [
  { id: "wide", label: "Wide", description: "60° FOV", unrealRef: "Cine Camera wide", patch: { fov: 60 } },
  { id: "std", label: "45°", description: "Default lens", unrealRef: "Perspective camera", patch: { fov: 45 } },
  { id: "tele", label: "Tele", description: "30° tight", unrealRef: "Cine Camera telephoto", patch: { fov: 30 } },
];

export const EXPOSURE_PRESETS: ScenePreset[] = [
  { id: "auto", label: "Auto", description: "Eye-adaptive brightness", unrealRef: "Toggle Auto Exposure", patch: { exposureMode: "auto", ambientIntensity: 0.35 } },
  { id: "fixed", label: "Fixed", description: "Locked exposure", unrealRef: "Fixed Exposure", patch: { exposureMode: "fixed", ambientIntensity: 0.55 } },
];

export function applyScenePreset(
  current: SceneTuning,
  patch: Partial<SceneTuning>,
): SceneTuning {
  return { ...current, ...patch };
}

export function cameraPositionForPreset(preset: CameraPreset): [number, number, number] {
  switch (preset) {
    case "front":
      return [0, 1.2, 4.2];
    case "side":
      return [4.2, 1.2, 0];
    case "cinematic":
      return [3.2, 0.85, 2.4];
    default:
      return [2.4, 1.6, 2.8];
  }
}

export function animTimeSeconds(
  elapsedMs: number,
  playing: boolean,
  tuning: SceneTuning,
): number {
  if (!playing && elapsedMs <= 0) return 0;
  return (elapsedMs / 1000) * tuning.playbackRate * tuning.rigAnimSpeed;
}
