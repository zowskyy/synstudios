/** Aseprite-inspired sprite tuning — simple presets mapped to adjusters. */

export type SheetLayout = "horizontal" | "vertical" | "grid";

export type SpriteTuning = {
  frameWidth: number;
  frameHeight: number;
  fps: number;
  loop: boolean;
  scale: number;
  onionSkin: boolean;
  onionRadius: number;
  sheetLayout: SheetLayout;
  sheetPadding: number;
  manualFrame: number | null;
  showGrid: boolean;
};

export const DEFAULT_SPRITE_TUNING: SpriteTuning = {
  frameWidth: 32,
  frameHeight: 48,
  fps: 12,
  loop: true,
  scale: 4,
  onionSkin: false,
  onionRadius: 1,
  sheetLayout: "horizontal",
  sheetPadding: 0,
  manualFrame: null,
  showGrid: true,
};

export type TuningPreset = {
  id: string;
  label: string;
  description: string;
  asepriteRef: string;
  patch: Partial<SpriteTuning>;
};

/** One-tap presets — maps Aseprite workflows to friendly buttons. */
export const SPEED_PRESETS: TuningPreset[] = [
  { id: "slow", label: "Slow", description: "6 fps · storyboard pace", asepriteRef: "frame duration", patch: { fps: 6 } },
  { id: "normal", label: "Normal", description: "12 fps · classic pixel", asepriteRef: "timeline playback", patch: { fps: 12 } },
  { id: "fast", label: "Fast", description: "24 fps · smooth motion", asepriteRef: "animation preview", patch: { fps: 24 } },
  { id: "game", label: "Game", description: "60 fps · engine tick", asepriteRef: "game export", patch: { fps: 60 } },
];

export const SIZE_PRESETS: TuningPreset[] = [
  { id: "16", label: "16×16", description: "Tiny tile / icon", asepriteRef: "sprite size", patch: { frameWidth: 16, frameHeight: 16 } },
  { id: "32sq", label: "32×32", description: "Standard tile", asepriteRef: "sprite size", patch: { frameWidth: 32, frameHeight: 32 } },
  { id: "32x48", label: "32×48", description: "Walk cycle strip", asepriteRef: "import sprite sheet", patch: { frameWidth: 32, frameHeight: 48 } },
  { id: "64", label: "64×64", description: "HD pixel art", asepriteRef: "sprite size", patch: { frameWidth: 64, frameHeight: 64 } },
];

export const SCALE_PRESETS: TuningPreset[] = [
  { id: "1x", label: "1×", description: "Native pixels", asepriteRef: "zoom 100%", patch: { scale: 1 } },
  { id: "2x", label: "2×", description: "Double size", asepriteRef: "zoom 200%", patch: { scale: 2 } },
  { id: "4x", label: "4×", description: "Preview default", asepriteRef: "zoom 400%", patch: { scale: 4 } },
  { id: "8x", label: "8×", description: "Pixel inspect", asepriteRef: "zoom 800%", patch: { scale: 8 } },
];

export const LAYOUT_PRESETS: TuningPreset[] = [
  { id: "h", label: "Strip →", description: "Horizontal sheet", asepriteRef: "export horizontal sprite sheet", patch: { sheetLayout: "horizontal" } },
  { id: "v", label: "Strip ↓", description: "Vertical sheet", asepriteRef: "export vertical sprite sheet", patch: { sheetLayout: "vertical" } },
  { id: "grid", label: "Grid", description: "Matrix layout", asepriteRef: "export matrix sprite sheet", patch: { sheetLayout: "grid" } },
];

export function applyPreset(
  current: SpriteTuning,
  patch: Partial<SpriteTuning>,
): SpriteTuning {
  return { ...current, ...patch };
}

export function frameDurationMs(fps: number): number {
  return 1000 / Math.max(fps, 1);
}

export function gridColumns(frameCount: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(frameCount)));
}

/** Source rect for a frame index given Aseprite-style sheet layouts. */
export function sheetFrameRect(
  frameIndex: number,
  frameWidth: number,
  frameHeight: number,
  padding: number,
  layout: SheetLayout,
  columns: number,
): { sx: number; sy: number } {
  const strideW = frameWidth + padding;
  const strideH = frameHeight + padding;
  if (layout === "vertical") {
    return { sx: 0, sy: frameIndex * strideH };
  }
  if (layout === "grid") {
    const col = frameIndex % columns;
    const row = Math.floor(frameIndex / columns);
    return { sx: col * strideW, sy: row * strideH };
  }
  return { sx: frameIndex * strideW, sy: 0 };
}
