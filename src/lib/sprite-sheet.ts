/** Horizontal strip sprite sheet helpers — mirrors Godot AnimationLoader + Aseprite import/export. */

import {
  gridColumns,
  sheetFrameRect,
  type SheetLayout,
} from "@/lib/sprite-tuning";

export type SpriteSheetOptions = {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
  sheetLayout?: SheetLayout;
  sheetPadding?: number;
};

export function frameCountFromSheet(
  sheetWidth: number,
  sheetHeight: number,
  frameWidth: number,
  frameHeight: number,
  padding: number,
  layout: SheetLayout,
): number {
  const strideW = frameWidth + padding;
  const strideH = frameHeight + padding;
  if (layout === "vertical") {
    return Math.max(1, Math.floor(sheetHeight / strideH));
  }
  if (layout === "grid") {
    const cols = gridColumns(Math.max(1, Math.floor(sheetWidth / strideW)));
    const rows = Math.max(1, Math.floor(sheetHeight / strideH));
    return cols * rows;
  }
  return Math.max(1, Math.floor(sheetWidth / strideW));
}

/** Draw a demo walk-cycle strip when no asset is uploaded. */
export function createDemoSpriteSheet(
  opts: Pick<SpriteSheetOptions, "frameWidth" | "frameHeight" | "frameCount"> & {
    sheetLayout?: SheetLayout;
    sheetPadding?: number;
  },
): HTMLCanvasElement {
  const {
    frameWidth,
    frameHeight,
    frameCount,
    sheetLayout = "horizontal",
    sheetPadding = 0,
  } = opts;
  const canvas = document.createElement("canvas");
  const cols = sheetLayout === "grid" ? gridColumns(frameCount) : sheetLayout === "vertical" ? 1 : frameCount;
  const rows =
    sheetLayout === "grid"
      ? Math.ceil(frameCount / cols)
      : sheetLayout === "vertical"
        ? frameCount
        : 1;
  canvas.width = cols * (frameWidth + sheetPadding) - sheetPadding;
  canvas.height = rows * (frameHeight + sheetPadding) - sheetPadding;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  for (let i = 0; i < frameCount; i += 1) {
    const { sx, sy } = sheetFrameRect(
      i,
      frameWidth,
      frameHeight,
      sheetPadding,
      sheetLayout,
      cols,
    );
    const bob = i % 2 === 0 ? 0 : 1;
    ctx.fillStyle = "#000000";
    ctx.fillRect(sx, sy, frameWidth, frameHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sx + 8, sy + 8 + bob, 16, 20);
    ctx.fillRect(sx + 10, sy + 28 + bob, 5, 12);
    ctx.fillRect(sx + 17, sy + 28 - bob, 5, 12);
    ctx.fillRect(sx + 6, sy + 18 + bob, 6, 4);
    ctx.fillRect(sx + 20, sy + 18 - bob, 6, 4);
  }

  return canvas;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export function drawSpriteFrameAt(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  frameIndex: number,
  frameWidth: number,
  frameHeight: number,
  padding: number,
  layout: SheetLayout,
  columns: number,
  destX: number,
  destY: number,
  scale: number,
  alpha = 1,
): void {
  const { sx, sy } = sheetFrameRect(
    frameIndex,
    frameWidth,
    frameHeight,
    padding,
    layout,
    columns,
  );
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    sx,
    sy,
    frameWidth,
    frameHeight,
    destX,
    destY,
    frameWidth * scale,
    frameHeight * scale,
  );
  ctx.restore();
}

export function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  frameIndex: number,
  frameWidth: number,
  frameHeight: number,
  destX: number,
  destY: number,
  scale = 3,
): void {
  drawSpriteFrameAt(
    ctx,
    image,
    frameIndex,
    frameWidth,
    frameHeight,
    0,
    "horizontal",
    1,
    destX,
    destY,
    scale,
  );
}
