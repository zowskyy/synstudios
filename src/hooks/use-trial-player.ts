"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TRIAL_DURATION_MS,
  detectPlatform,
  type PreviewMode,
  type SpriteAnimConfig,
  type TrialMetrics,
  type TrialStatus,
} from "@/lib/trial-types";

type UseTrialPlayerOptions = {
  mode: PreviewMode;
  sprite?: SpriteAnimConfig;
  durationMs?: number;
  sceneId?: string;
  onComplete?: (metrics: TrialMetrics) => void;
};

export function useTrialPlayer({
  mode,
  sprite,
  durationMs = TRIAL_DURATION_MS,
  sceneId,
  onComplete,
}: UseTrialPlayerOptions) {
  const [status, setStatus] = useState<TrialStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [metrics, setMetrics] = useState<TrialMetrics>({
    elapsedMs: 0,
    avgFps: 0,
    minFps: 60,
    frameDrops: 0,
    mode,
    platform: "unknown",
    fpsKind: "raf",
  });

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const pauseAccumRef = useRef<number>(0);
  const fpsSamplesRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number>(0);
  const frameDropsRef = useRef(0);
  const statusRef = useRef<TrialStatus>(status);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const tick = useCallback(
    (now: number) => {
      if (statusRef.current !== "running") return;

      const elapsed = now - startRef.current - pauseAccumRef.current;
      if (lastFrameRef.current > 0) {
        const dt = now - lastFrameRef.current;
        const fps = 1000 / Math.max(dt, 1);
        fpsSamplesRef.current.push(fps);
        if (fps < 55) frameDropsRef.current += 1;
      }
      lastFrameRef.current = now;

      if (elapsed >= durationMs) {
        const samples = fpsSamplesRef.current;
        const avgFps =
          samples.length > 0
            ? samples.reduce((a, b) => a + b, 0) / samples.length
            : 0;
        const minFps = samples.length > 0 ? Math.min(...samples) : 0;
        const finalMetrics: TrialMetrics = {
          elapsedMs: durationMs,
          avgFps: Math.round(avgFps * 10) / 10,
          minFps: Math.round(minFps * 10) / 10,
          frameDrops: frameDropsRef.current,
          mode,
          platform: detectPlatform(),
          sceneId,
          timestamp: new Date().toISOString(),
          fpsKind: "raf",
        };
        setElapsedMs(durationMs);
        setMetrics(finalMetrics);
        statusRef.current = "complete";
        setStatus("complete");
        onCompleteRef.current?.(finalMetrics);
        return;
      }

      setElapsedMs(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    },
    [durationMs, mode, sceneId],
  );

  useEffect(() => {
    if (status === "running") {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, tick]);

  const play = useCallback(() => {
    fpsSamplesRef.current = [];
    frameDropsRef.current = 0;
    lastFrameRef.current = 0;
    pauseAccumRef.current = 0;
    startRef.current = performance.now();
    setElapsedMs(0);
    setMetrics({
      elapsedMs: 0,
      avgFps: 0,
      minFps: 60,
      frameDrops: 0,
      mode,
      platform: detectPlatform(),
      sceneId,
      fpsKind: "raf",
    });
    statusRef.current = "running";
    setStatus("running");
  }, [mode, sceneId]);

  const pause = useCallback(() => {
    if (statusRef.current !== "running") return;
    pausedAtRef.current = performance.now();
    statusRef.current = "paused";
    setStatus("paused");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    pauseAccumRef.current += performance.now() - pausedAtRef.current;
    lastFrameRef.current = 0;
    statusRef.current = "running";
    setStatus("running");
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    statusRef.current = "idle";
    setStatus("idle");
    setElapsedMs(0);
  }, []);

  return {
    status,
    elapsedMs,
    durationMs,
    metrics,
    sprite,
    mode,
    play,
    pause,
    resume,
    stop,
    isActive: status === "running" || status === "paused",
  };
}
