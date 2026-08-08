"use client";

import { useEffect, useRef } from "react";
import {
  createDemoSpriteSheet,
  drawSpriteFrameAt,
  frameCountFromSheet,
  loadImage,
} from "@/lib/sprite-sheet";
import {
  DEFAULT_SPRITE_TUNING,
  frameDurationMs,
  gridColumns,
  type SpriteTuning,
} from "@/lib/sprite-tuning";
import type { SpriteAnimConfig } from "@/lib/trial-types";

type SpritePreview2DProps = {
  config?: SpriteAnimConfig;
  playing: boolean;
  elapsedMs: number;
  tuning?: SpriteTuning;
  className?: string;
};

export function SpritePreview2D({
  config,
  playing,
  elapsedMs,
  tuning = DEFAULT_SPRITE_TUNING,
  className,
}: SpritePreview2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<CanvasImageSource | null>(null);
  const frameCountRef = useRef(8);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  const frameWidth = tuning.frameWidth;
  const frameHeight = tuning.frameHeight;
  const fps = tuning.fps;
  const loop = tuning.loop;

  useEffect(() => {
    let cancelled = false;

    async function loadSheet() {
      if (config?.sheetUrl) {
        const img = await loadImage(config.sheetUrl);
        sheetRef.current = img;
        frameCountRef.current = frameCountFromSheet(
          img.width,
          img.height,
          frameWidth,
          frameHeight,
          tuning.sheetPadding,
          tuning.sheetLayout,
        );
      } else {
        const demo = createDemoSpriteSheet({
          frameWidth,
          frameHeight,
          frameCount: 8,
          sheetLayout: tuning.sheetLayout,
          sheetPadding: tuning.sheetPadding,
        });
        sheetRef.current = demo;
        frameCountRef.current = 8;
      }
      if (!cancelled) draw();
    }

    loadSheet();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config?.sheetUrl,
    frameWidth,
    frameHeight,
    tuning.sheetLayout,
    tuning.sheetPadding,
  ]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, elapsedMs, tuning]);

  function draw() {
    const canvas = canvasRef.current;
    const sheet = sheetRef.current;
    if (!canvas || !sheet) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = tuning.scale;
    const pad = 16;
    const w = frameWidth * scale + pad * 2;
    const h = frameHeight * scale + pad * 2;
    if (canvasSizeRef.current.w !== w || canvasSizeRef.current.h !== h) {
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    if (tuning.showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      const step = 8 * scale;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const totalFrames = frameCountRef.current;
    const columns = gridColumns(totalFrames);
    let frameIndex = tuning.manualFrame ?? 0;

    if (tuning.manualFrame === null && (playing || elapsedMs > 0)) {
      const rawIndex = Math.floor(elapsedMs / frameDurationMs(fps));
      frameIndex = loop
        ? rawIndex % totalFrames
        : Math.min(rawIndex, totalFrames - 1);
    }

    if (tuning.onionSkin) {
      const radius = tuning.onionRadius;
      for (let offset = -radius; offset <= radius; offset += 1) {
        if (offset === 0) continue;
        const idx = (frameIndex + offset + totalFrames) % totalFrames;
        const alpha = 0.2 + 0.15 * (1 - Math.abs(offset) / (radius + 1));
        drawSpriteFrameAt(
          ctx,
          sheet,
          idx,
          frameWidth,
          frameHeight,
          tuning.sheetPadding,
          tuning.sheetLayout,
          columns,
          pad,
          pad,
          scale,
          alpha,
        );
      }
    }

    drawSpriteFrameAt(
      ctx,
      sheet,
      frameIndex,
      frameWidth,
      frameHeight,
      tuning.sheetPadding,
      tuning.sheetLayout,
      columns,
      pad,
      pad,
      scale,
      1,
    );
  }

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="mx-auto block" aria-label="2D sprite preview" />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {config?.name ?? "demo"} · {frameWidth}×{frameHeight} · {fps} fps ·{" "}
        {tuning.sheetLayout}
        {tuning.onionSkin ? " · onion" : ""}
      </p>
    </div>
  );
}
