"use client";

import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatMs } from "@/lib/utils";
import type { TrialStatus } from "@/lib/trial-types";

type TrialControlsProps = {
  status: TrialStatus;
  elapsedMs: number;
  durationMs: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

export function TrialControls({
  status,
  elapsedMs,
  durationMs,
  onPlay,
  onPause,
  onResume,
  onStop,
}: TrialControlsProps) {
  const progress = Math.min(100, (elapsedMs / durationMs) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Trial timeline</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {formatMs(elapsedMs)} / {formatMs(durationMs)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {status === "idle" || status === "complete" ? (
          <Button onClick={onPlay} size="sm">
            <Play className="h-4 w-4" />
            {status === "complete" ? "Replay trial" : "Start 30s trial"}
          </Button>
        ) : null}
        {status === "running" ? (
          <Button onClick={onPause} variant="outline" size="sm">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        ) : null}
        {status === "paused" ? (
          <Button onClick={onResume} size="sm">
            <Play className="h-4 w-4" />
            Resume
          </Button>
        ) : null}
        {status !== "idle" ? (
          <Button onClick={onStop} variant="ghost" size="sm">
            <Square className="h-4 w-4" />
            Stop
          </Button>
        ) : null}
        {status === "complete" ? (
          <Button onClick={onPlay} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
            New run
          </Button>
        ) : null}
      </div>
    </div>
  );
}
