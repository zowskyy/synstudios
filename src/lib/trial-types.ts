export const TRIAL_DURATION_MS = 30_000;

export type PreviewMode = "2d" | "3d" | "split";
export type TrialPlatform = "web" | "android" | "unknown";

export type TrialStatus = "idle" | "running" | "paused" | "complete";

export type SpriteAnimConfig = {
  name: string;
  frameWidth: number;
  frameHeight: number;
  fps: number;
  loop: boolean;
  sheetUrl?: string;
};

export type TrialMetrics = {
  elapsedMs: number;
  avgFps: number;
  minFps: number;
  frameDrops: number;
  mode: PreviewMode;
  platform: TrialPlatform;
  sceneId?: string;
  timestamp?: string;
};

export type BenchmarkRun = {
  version: "1";
  studio: "SynStudios";
  platform: TrialPlatform;
  sceneId: string;
  sceneTitle: string;
  metrics: TrialMetrics;
  userAgent?: string;
};

export type TrialScene = {
  id: string;
  title: string;
  mode: PreviewMode;
  durationMs: number;
  sprite?: SpriteAnimConfig;
  note?: string;
};

export const BENCHMARK_SCENE_ID = "hero-walk-2d";

export const DEMO_SCENES: TrialScene[] = [
  {
    id: "hero-walk-2d",
    title: "Hero Walk Cycle",
    mode: "2d",
    durationMs: TRIAL_DURATION_MS,
    sprite: {
      name: "walk_right",
      frameWidth: 32,
      frameHeight: 48,
      fps: 12,
      loop: true,
    },
    note: "Metal Slug-style horizontal strip · 32×48 · 12 fps",
  },
  {
    id: "boss-intro-3d",
    title: "Boss Intro Rig",
    mode: "3d",
    durationMs: TRIAL_DURATION_MS,
    note: "Procedural rig preview · orbit camera · 30s cap",
  },
  {
    id: "cutscene-split",
    title: "Cutscene Composite",
    mode: "split",
    durationMs: TRIAL_DURATION_MS,
    sprite: {
      name: "idle",
      frameWidth: 32,
      frameHeight: 48,
      fps: 8,
      loop: true,
    },
    note: "2D sprite overlay + 3D stage · animator trial run",
  },
];

export function detectPlatform(): TrialPlatform {
  if (typeof window === "undefined") return "unknown";
  const cap = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  if (cap?.getPlatform?.() === "android") return "android";
  if (/Android/i.test(navigator.userAgent)) return "android";
  return "web";
}

export function buildBenchmarkRun(
  scene: TrialScene,
  metrics: TrialMetrics,
): BenchmarkRun {
  return {
    version: "1",
    studio: "SynStudios",
    platform: metrics.platform,
    sceneId: scene.id,
    sceneTitle: scene.title,
    metrics,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };
}
