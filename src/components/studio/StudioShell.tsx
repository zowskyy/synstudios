"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { isNativeApp } from "@/components/CapacitorInit";
import Image from "next/image";
import { Film, Layers, MonitorPlay } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenePreview3D } from "@/components/studio/ScenePreview3D";
import { SpritePreview2D } from "@/components/studio/SpritePreview2D";
import { SpriteUpload } from "@/components/studio/SpriteUpload";
import { TrialControls } from "@/components/studio/TrialControls";
import { TrialMetricsPanel } from "@/components/studio/TrialMetricsPanel";
import { useTrialPlayer } from "@/hooks/use-trial-player";
import {
  DEMO_SCENES,
  type PreviewMode,
  type TrialScene,
} from "@/lib/trial-types";

export function StudioShell() {
  const [selected, setSelected] = useState<TrialScene>(DEMO_SCENES[0]);
  const [viewMode, setViewMode] = useState<PreviewMode>(selected.mode);
  const [customSheetUrl, setCustomSheetUrl] = useState<string | undefined>();
  const [connected, setConnected] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const trial = useTrialPlayer({
    mode: viewMode,
    sprite: selected.sprite
      ? { ...selected.sprite, sheetUrl: customSheetUrl ?? selected.sprite.sheetUrl }
      : undefined,
    durationMs: selected.durationMs,
    sceneId: selected.id,
    onComplete: (metrics) => {
      socket?.emit("trial-complete", {
        sceneId: selected.id,
        reviewer: reviewer || "anonymous",
        metrics,
      });
    },
  });

  useEffect(() => {
    setViewMode(selected.mode);
    setCustomSheetUrl(undefined);
    trial.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.id]);

  useEffect(() => {
    if (isNativeApp()) {
      setConnected(false);
      return;
    }

    const socketInstance = io(
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:3003`
        : "/",
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 3,
        timeout: 8000,
      },
    );

    socketInstance.on("connect", () => setConnected(true));
    socketInstance.on("disconnect", () => setConnected(false));
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const playing = trial.status === "running";

  function show2d(mode: PreviewMode) {
    return mode === "2d" || mode === "split";
  }

  function show3d(mode: PreviewMode) {
    return mode === "3d" || mode === "split";
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="SynStudios" width={32} height={32} />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">SynStudios</h1>
              <p className="text-xs text-muted-foreground">
                2D sprite · 3D animation trial studio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/benchmark">
              <Button variant="outline" size="sm">Benchmark</Button>
            </Link>
            <Badge variant={connected ? "default" : "outline"}>
              {isNativeApp() ? "Offline mode" : connected ? "Live sync" : "Offline"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trial scenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setSelected(scene)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected.id === scene.id
                      ? "border-white bg-white/10"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  <div className="font-medium">{scene.title}</div>
                  <div className="text-xs text-muted-foreground">{scene.note}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reviewer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                placeholder="Animator name"
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <SpriteUpload
                config={selected.sprite}
                onUpload={(url) => setCustomSheetUrl(url)}
              />
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          <Card className="studio-grid overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{selected.title}</CardTitle>
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as PreviewMode)}
              >
                <TabsList>
                  <TabsTrigger value="2d">
                    <MonitorPlay className="mr-1 h-3 w-3" />
                    2D
                  </TabsTrigger>
                  <TabsTrigger value="3d">
                    <Film className="mr-1 h-3 w-3" />
                    3D
                  </TabsTrigger>
                  <TabsTrigger value="split">
                    <Layers className="mr-1 h-3 w-3" />
                    Split
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div
                className={`grid gap-4 ${
                  viewMode === "split" ? "md:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {show2d(viewMode) ? (
                  <div className="pixel-preview rounded-md border border-border bg-black p-4">
                    <SpritePreview2D
                      config={
                        selected.sprite
                          ? {
                              ...selected.sprite,
                              sheetUrl:
                                customSheetUrl ?? selected.sprite.sheetUrl,
                            }
                          : selected.sprite
                      }
                      playing={playing}
                      elapsedMs={trial.elapsedMs}
                    />
                  </div>
                ) : null}
                {show3d(viewMode) ? (
                  <ScenePreview3D
                    playing={playing}
                    elapsedMs={trial.elapsedMs}
                    className="rounded-md border border-border bg-black p-2"
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Trial controls</CardTitle>
              </CardHeader>
              <CardContent>
                <TrialControls
                  status={trial.status}
                  elapsedMs={trial.elapsedMs}
                  durationMs={trial.durationMs}
                  onPlay={trial.play}
                  onPause={trial.pause}
                  onResume={trial.resume}
                  onStop={trial.stop}
                />
              </CardContent>
            </Card>
            <TrialMetricsPanel
              status={trial.status}
              metrics={trial.metrics}
              sceneId={selected.id}
              sceneTitle={selected.title}
            />
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-muted-foreground">
              <span>
                Compatible with horizontal sprite strips (Godot AnimationLoader) and
                glTF / procedural 3D rigs.
              </span>
              {!isNativeApp() ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    socket?.emit("trial-start", {
                      sceneId: selected.id,
                      reviewer: reviewer || "anonymous",
                    })
                  }
                >
                  Broadcast trial start
                </Button>
              ) : (
                <span>Native build — trials run fully on-device.</span>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
