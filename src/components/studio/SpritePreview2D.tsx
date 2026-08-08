"use client";

import { useEffect, useRef } from "react";
import {
  createDemoSpriteSheet,
  drawSpriteFrame,
  loadImage,
} from "@/lib/sprite-sheet";
import type { SpriteAnimConfig } from "@/lib/trial-types";

type SpritePreview2DProps = {
  config?: SpriteAnimConfig;
  playing: boolean;
  elapsedMs: number;
  className?: string;
};

export function SpritePreview2D({
  config,
  playing,
  elapsedMs,
  className,
}: SpritePreview2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRef = useRef<CanvasImageSource | null>(null);
  const frameCountRef = useRef(8);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  const frameWidth = config?.frameWidth ?? 32;
  const frameHeight = config?.frameHeight ?? 48;
  const fps = config?.fps ?? 12;
  const loop = config?.loop ?? true;

  useEffect(() => {
    let cancelled = false;

    async function loadSheet() {
      if (config?.sheetUrl) {
        sheetRef.current = await loadImage(config.sheetUrl);
        frameCountRef.current = Math.max(
          1,
          Math.floor(
            (sheetRef.current as HTMLImageElement).width / frameWidth,
          ),
        );
      } else {
        const demo = createDemoSpriteSheet({
          frameWidth,
          frameHeight,
          frameCount: 8,
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
  }, [config?.sheetUrl, frameWidth, frameHeight]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, elapsedMs]);

  function draw() {
    const canvas = canvasRef.current;
    const sheet = sheetRef.current;
    if (!canvas || !sheet) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 4;
    const w = frameWidth * scale + 32;
    const h = frameHeight * scale + 32;
    if (canvasSizeRef.current.w !== w || canvasSizeRef.current.h !== h) {
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    let frameIndex = 0;
    if (playing || elapsedMs > 0) {
      const frameDuration = 1000 / fps;
      const totalFrames = frameCountRef.current;
      const rawIndex = Math.floor(elapsedMs / frameDuration);
      frameIndex = loop
        ? rawIndex % totalFrames
        : Math.min(rawIndex, totalFrames - 1);
    }

    drawSpriteFrame(
      ctx,
      sheet,
      frameIndex,
      frameWidth,
      frameHeight,
      16,
      16,
      scale,
    );
  }

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="mx-auto block" aria-label="2D sprite preview" />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {config?.name ?? "demo"} · {frameWidth}×{frameHeight} · {fps} fps
      </p>
    </div>
  );
}
