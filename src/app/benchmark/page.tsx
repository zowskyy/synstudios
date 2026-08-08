"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { getRuntimePlatform } from "@/components/CapacitorInit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScenePreview3D } from "@/components/studio/ScenePreview3D";
import { SpritePreview2D } from "@/components/studio/SpritePreview2D";
import { TrialControls } from "@/components/studio/TrialControls";
import { TrialMetricsPanel } from "@/components/studio/TrialMetricsPanel";
import { useTrialPlayer } from "@/hooks/use-trial-player";
import {
  BENCHMARK_SCENE_ID,
  DEMO_SCENES,
  buildBenchmarkRun,
} from "@/lib/trial-types";
import { exportBenchmarkJson } from "@/lib/benchmark-export";

const BENCHMARK_SCENE = DEMO_SCENES.find((s) => s.id === BENCHMARK_SCENE_ID)!;

export default function BenchmarkPage() {
  const platform = getRuntimePlatform();
  const exportedRef = useRef(false);

  const trial = useTrialPlayer({
    mode: BENCHMARK_SCENE.mode,
    sprite: BENCHMARK_SCENE.sprite,
    durationMs: BENCHMARK_SCENE.durationMs,
    sceneId: BENCHMARK_SCENE.id,
    onComplete: (metrics) => {
      if (exportedRef.current) return;
      exportedRef.current = true;
      void exportBenchmarkJson(buildBenchmarkRun(BENCHMARK_SCENE, metrics));
    },
  });

  useEffect(() => {
    exportedRef.current = false;
  }, []);

  const playing = trial.status === "running";

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Studio
          </Link>
          <Badge>{platform.toUpperCase()} benchmark</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standard benchmark — {BENCHMARK_SCENE.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Fixed 30s trial on the same scene for apples-to-apples comparison between
              the web app and the Android APK.
            </p>
            <p>
              Platform detected: <strong className="text-white">{platform}</strong>.
              On completion, JSON exports via download (web) or the Android share
              sheet (APK) for{" "}
              <code className="text-white">scripts/benchmark-compare.py</code>.
            </p>
          </CardContent>
        </Card>

        <Card className="studio-grid">
          <CardContent className="grid gap-4 p-4 md:grid-cols-2">
            <SpritePreview2D
              config={BENCHMARK_SCENE.sprite}
              playing={playing}
              elapsedMs={trial.elapsedMs}
            />
            <ScenePreview3D playing={playing} elapsedMs={trial.elapsedMs} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <TrialControls
                status={trial.status}
                elapsedMs={trial.elapsedMs}
                durationMs={trial.durationMs}
                onPlay={() => {
                  exportedRef.current = false;
                  trial.play();
                }}
                onPause={trial.pause}
                onResume={trial.resume}
                onStop={trial.stop}
              />
              {trial.status === "idle" ? (
                <Button
                  className="mt-3 w-full"
                  onClick={() => {
                    exportedRef.current = false;
                    trial.play();
                  }}
                >
                  <Play className="h-4 w-4" />
                  Run standard benchmark
                </Button>
              ) : null}
            </CardContent>
          </Card>
          <TrialMetricsPanel
            status={trial.status}
            metrics={trial.metrics}
            sceneId={BENCHMARK_SCENE.id}
            sceneTitle={BENCHMARK_SCENE.title}
          />
        </div>
      </main>
    </div>
  );
}
