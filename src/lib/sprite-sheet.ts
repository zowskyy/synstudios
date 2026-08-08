/** Horizontal strip sprite sheet helpers — mirrors Godot AnimationLoader conventions. */

export type SpriteSheetOptions = {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
};

export function frameCountFromSheet(
  sheetWidth: number,
  frameWidth: number,
): number {
  return Math.max(1, Math.floor(sheetWidth / frameWidth));
}

/** Draw a demo walk-cycle strip when no asset is uploaded. */
export function createDemoSpriteSheet(
  opts: Pick<SpriteSheetOptions, "frameWidth" | "frameHeight" | "frameCount">,
): HTMLCanvasElement {
  const { frameWidth, frameHeight, frameCount } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = frameWidth * frameCount;
  canvas.height = frameHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  for (let i = 0; i < frameCount; i += 1) {
    const x = i * frameWidth;
    const bob = i % 2 === 0 ? 0 : 1;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, 0, frameWidth, frameHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 8, 8 + bob, 16, 20);
    ctx.fillRect(x + 10, 28 + bob, 5, 12);
    ctx.fillRect(x + 17, 28 - bob, 5, 12);
    ctx.fillRect(x + 6, 18 + bob, 6, 4);
    ctx.fillRect(x + 20, 18 - bob, 6, 4);
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
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    frameIndex * frameWidth,
    0,
    frameWidth,
    frameHeight,
    destX,
    destY,
    frameWidth * scale,
    frameHeight * scale,
  );
}
