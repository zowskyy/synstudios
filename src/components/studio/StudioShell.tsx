"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { isNativeApp, registerLifecycleHandlers } from "@/components/CapacitorInit";
import { Film, Layers, MonitorPlay } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetRoadmapCard } from "@/components/studio/AssetRoadmapCard";
import { CloudTranscodePanel } from "@/components/studio/CloudTranscodePanel";
import { FrontierExportPanel } from "@/components/studio/FrontierExportPanel";
import {
  ProjectFolderPanel,
  type ProjectClipSelection,
} from "@/components/studio/ProjectFolderPanel";
import { SceneTuningPanel } from "@/components/studio/SceneTuningPanel";
import { SpritePreview2D } from "@/components/studio/SpritePreview2D";
import { SpriteTuningPanel } from "@/components/studio/SpriteTuningPanel";
import { GltfProxyPanel } from "@/components/studio/GltfProxyPanel";
import { SpriteUpload } from "@/components/studio/SpriteUpload";
import { TrialSidecarImport } from "@/components/studio/TrialSidecarImport";
import { TrialControls } from "@/components/studio/TrialControls";
import { TrialMetricsPanel } from "@/components/studio/TrialMetricsPanel";
import { useTrialPlayer } from "@/hooks/use-trial-player";
import { loadSpriteSheetFile, releaseObjectUrl } from "@/lib/asset-loader";
import { loadGltfTrialFile, releaseGltfUrl } from "@/lib/gltf-loader";
import {
  clearDirtyFlag,
  findRestoreCandidate,
  isRestorableSheetUrl,
  pushUndoEntry,
  saveProjectSnapshot,
  startAutosaveTimer,
  type RestoreCandidate,
} from "@/lib/project-autosave";
import { ScenePreview3D } from "@/components/studio/ScenePreview3D";
import {
  DEFAULT_SCENE_TUNING,
  type SceneTuning,
} from "@/lib/scene-tuning";
import {
  DEFAULT_SPRITE_TUNING,
  applyPreset,
  type SpriteTuning,
} from "@/lib/sprite-tuning";
import type { GltfProxyInfo } from "@/lib/gltf-proxy";
import { sidecarToSpriteConfig, parseTrialSidecar, type TrialSidecar } from "@/lib/trial-sidecar";
import { trialPackToHints } from "@/lib/trial-pack-apply";
import type { TrialPack } from "@/lib/trial-pack";
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
  const [dirty, setDirty] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<RestoreCandidate | null>(null);
  const [spriteTuning, setSpriteTuning] = useState<SpriteTuning>(DEFAULT_SPRITE_TUNING);
  const [sceneTuning, setSceneTuning] = useState<SceneTuning>(DEFAULT_SCENE_TUNING);
  const [trialDurationMs, setTrialDurationMs] = useState<number | undefined>();
  const [sidecarClip, setSidecarClip] = useState<string | null>(null);
  const [gltfProxyInfo, setGltfProxyInfo] = useState<GltfProxyInfo | null>(null);
  const [customGltfUrl, setCustomGltfUrl] = useState<string | undefined>();
  const undoStackRef = useRef<string[]>([]);

  const effectiveDurationMs = trialDurationMs ?? selected.durationMs;

  const tunedSprite = selected.sprite
    ? {
        ...selected.sprite,
        frameWidth: spriteTuning.frameWidth,
        frameHeight: spriteTuning.frameHeight,
        fps: spriteTuning.fps,
        loop: spriteTuning.loop,
        sheetUrl: customSheetUrl ?? selected.sprite.sheetUrl,
      }
    : undefined;

  const trial = useTrialPlayer({
    mode: viewMode,
    sprite: tunedSprite,
    durationMs: effectiveDurationMs,
    sceneId: selected.id,
    onComplete: (metrics) => {
      if (socket?.connected) {
        socket.emit("trial-complete", {
          sceneId: selected.id,
          reviewer: reviewer || "anonymous",
          metrics,
        });
      }
    },
  });

  const persistSnapshot = useCallback(
    (markDirty: boolean) => {
      saveProjectSnapshot({
        version: 1,
        savedAt: new Date().toISOString(),
        sceneId: selected.id,
        viewMode,
        reviewer,
        customSheetUrl,
        dirty: markDirty,
        undoStack: undoStackRef.current,
      });
    },
    [customSheetUrl, reviewer, selected.id, viewMode],
  );

  useEffect(() => {
    const candidate = findRestoreCandidate(DEMO_SCENES[0].id);
    setRestoreCandidate(candidate);
    if (candidate) {
      undoStackRef.current = candidate.snapshot.undoStack ?? [];
    }
  }, []);

  useEffect(() => {
    const unregister = registerLifecycleHandlers({
      onPause: () => {
        if (dirty) persistSnapshot(true);
      },
      onResume: () => {
        const candidate = findRestoreCandidate(selected.id);
        setRestoreCandidate(candidate);
      },
    });
    return unregister;
  }, [dirty, persistSnapshot, selected.id]);

  useEffect(() => {
    const stopTimer = startAutosaveTimer(() => ({
      sceneId: selected.id,
      viewMode,
      reviewer,
      customSheetUrl,
      dirty,
      undoStack: undoStackRef.current,
    }));
    return stopTimer;
  }, [customSheetUrl, dirty, reviewer, selected.id, viewMode]);

  useEffect(() => {
    setViewMode(selected.mode);
    setCustomSheetUrl((prev) => {
      if (prev) releaseObjectUrl(prev);
      return undefined;
    });
    setTrialDurationMs(undefined);
    setSidecarClip(null);
    setGltfProxyInfo(null);
    setCustomGltfUrl((prev) => {
      if (prev) releaseGltfUrl(prev);
      return undefined;
    });
    if (selected.sprite) {
      setSpriteTuning(
        applyPreset(DEFAULT_SPRITE_TUNING, {
          frameWidth: selected.sprite.frameWidth,
          frameHeight: selected.sprite.frameHeight,
          fps: selected.sprite.fps,
          loop: selected.sprite.loop,
          manualFrame: null,
        }),
      );
    }
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
        path: "/socket.io/",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 3,
        timeout: 8000,
      },
    );

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.disconnect();
    };
  }, []);

  const trialRef = useRef(trial);
  useEffect(() => {
    trialRef.current = trial;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        const { status, play, pause, resume } = trialRef.current;
        if (status === "running") pause();
        else if (status === "paused") resume();
        else if (status === "idle" || status === "complete") play();
      }
      if (event.key === "Escape") {
        trialRef.current.stop();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const playing = trial.status === "running";

  function selectScene(scene: TrialScene) {
    undoStackRef.current = pushUndoEntry(selected.id);
    setSelected(scene);
    setDirty(true);
    persistSnapshot(true);
  }

  function applyRestore() {
    if (!restoreCandidate) return;
    const { snapshot } = restoreCandidate;
    const scene =
      DEMO_SCENES.find((s) => s.id === snapshot.sceneId) ?? DEMO_SCENES[0];
    setSelected(scene);
    setViewMode(snapshot.viewMode);
    setReviewer(snapshot.reviewer);
    setCustomSheetUrl(
      isRestorableSheetUrl(snapshot.customSheetUrl) ? snapshot.customSheetUrl : undefined,
    );
    undoStackRef.current = snapshot.undoStack ?? [];
    setDirty(false);
    clearDirtyFlag();
    setRestoreCandidate(null);
  }

  function dismissRestore() {
    clearDirtyFlag();
    setRestoreCandidate(null);
  }

  function show2d(mode: PreviewMode) {
    return mode === "2d" || mode === "split";
  }

  function show3d(mode: PreviewMode) {
    return mode === "3d" || mode === "split";
  }

  async function handleProjectClip({ entry, file }: ProjectClipSelection) {
    setSidecarClip(entry.name);
    if (entry.kind === "sprite") {
      const result = await loadSpriteSheetFile(file);
      if (!result.ok) return;
      if (customSheetUrl && customSheetUrl !== result.url) releaseObjectUrl(customSheetUrl);
      setCustomSheetUrl(result.url);
      if (result.isProxy && result.frameWidth && result.frameHeight) {
        setSpriteTuning((prev) =>
          applyPreset(prev, {
            frameWidth: result.frameWidth,
            frameHeight: result.frameHeight,
          }),
        );
      }
      if (viewMode === "3d") setViewMode("split");
    } else if (entry.kind === "gltf") {
      const result = await loadGltfTrialFile(file);
      if (!result.ok) return;
      if (customGltfUrl && customGltfUrl !== result.url) releaseGltfUrl(customGltfUrl);
      setCustomGltfUrl(result.url);
      setGltfProxyInfo(result.header);
      if (viewMode === "2d") setViewMode("split");
    } else if (entry.kind === "sidecar") {
      const parsed = parseTrialSidecar(await file.text());
      if (!parsed.ok) return;
      const sprite = sidecarToSpriteConfig(parsed.sidecar);
      setSpriteTuning((prev) =>
        applyPreset(prev, {
          frameWidth: sprite.frameWidth,
          frameHeight: sprite.frameHeight,
          fps: sprite.fps,
          loop: sprite.loop,
          sheetLayout: parsed.sidecar.strip?.layout ?? prev.sheetLayout,
        }),
      );
      setTrialDurationMs(parsed.sidecar.durationMs);
    }
    setDirty(true);
    persistSnapshot(true);
  }

  function applyTrialPack(pack: TrialPack) {
    const hints = trialPackToHints(pack);
    setSidecarClip(hints.sidecarClip ?? pack.clipName);
    if (hints.trialDurationMs) setTrialDurationMs(hints.trialDurationMs);
    if (hints.customSheetUrl) {
      if (customSheetUrl && customSheetUrl !== hints.customSheetUrl) {
        releaseObjectUrl(customSheetUrl);
      }
      setCustomSheetUrl(hints.customSheetUrl);
    }
    if (hints.spriteFrameWidth || hints.spriteFrameHeight || hints.spriteFps) {
      setSpriteTuning((prev) =>
        applyPreset(prev, {
          frameWidth: hints.spriteFrameWidth ?? prev.frameWidth,
          frameHeight: hints.spriteFrameHeight ?? prev.frameHeight,
          fps: hints.spriteFps ?? prev.fps,
        }),
      );
    }
    if (pack.sidecar) {
      setSpriteTuning((prev) =>
        applyPreset(prev, {
          sheetLayout: pack.sidecar?.strip?.layout ?? prev.sheetLayout,
        }),
      );
    }
    setDirty(true);
    persistSnapshot(true);
  }

  return (
    <div className="min-h-screen bg-black text-white safe-area-padding">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SynStudios</h1>
            <p className="text-xs text-muted-foreground">
              2D sprite · 3D animation trial studio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/benchmark">
              <Button variant="outline" size="sm" aria-label="Open benchmark page">
                Benchmark
              </Button>
            </Link>
            <Badge variant={connected ? "default" : "outline"}>
              {isNativeApp() ? "Offline mode" : connected ? "Live sync" : "Offline"}
            </Badge>
          </div>
        </div>
      </header>

      {restoreCandidate ? (
        <div className="border-b border-border bg-white/5 px-4 py-3" role="status">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Recover unsaved work from{" "}
              <span className="font-medium">{restoreCandidate.label}</span>
              {restoreCandidate.snapshot.sceneId ? (
                <>
                  {" "}
                  — scene{" "}
                  <span className="font-mono">
                    {restoreCandidate.snapshot.sceneId}
                  </span>
                </>
              ) : null}
              ?
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyRestore} aria-label="Restore autosaved session">
                Restore
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={dismissRestore}
                aria-label="Discard autosaved session"
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trial scenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2" role="listbox" aria-label="Starter templates">
              {DEMO_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  role="option"
                  aria-selected={selected.id === scene.id}
                  aria-label={`${scene.title}. ${scene.note ?? ""}`}
                  onClick={() => selectScene(scene)}
                  className={`min-h-12 w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected.id === scene.id
                      ? "border-white bg-white/10 ring-1 ring-white"
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
                onChange={(e) => {
                  setReviewer(e.target.value);
                  setDirty(true);
                }}
                placeholder="Animator name"
                aria-label="Reviewer name"
                className="min-h-12 w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <SpriteUpload
                config={tunedSprite ?? selected.sprite}
                onUpload={(result) => {
                  if (customSheetUrl && customSheetUrl !== result.url) {
                    releaseObjectUrl(customSheetUrl);
                  }
                  setCustomSheetUrl(result.url);
                  if (result.isProxy && result.frameWidth && result.frameHeight) {
                    setSpriteTuning((prev) =>
                      applyPreset(prev, {
                        frameWidth: result.frameWidth,
                        frameHeight: result.frameHeight,
                      }),
                    );
                  }
                  setDirty(true);
                  persistSnapshot(true);
                  void result.fileName;
                }}
              />
              <TrialSidecarImport
                onImport={(sidecar: TrialSidecar) => {
                  const sprite = sidecarToSpriteConfig(sidecar);
                  setSpriteTuning((prev) =>
                    applyPreset(prev, {
                      frameWidth: sprite.frameWidth,
                      frameHeight: sprite.frameHeight,
                      fps: sprite.fps,
                      loop: sprite.loop,
                      sheetLayout: sidecar.strip?.layout ?? prev.sheetLayout,
                    }),
                  );
                  setTrialDurationMs(sidecar.durationMs);
                  setSidecarClip(sidecar.clipName);
                  if (sidecar.proxyGltf) {
                    setGltfProxyInfo({
                      meshCount: sidecar.proxyGltf.meshCount ?? 0,
                      nodeCount: 0,
                      boneHint: sidecar.proxyGltf.boneCount ?? 0,
                      bounds: sidecar.proxyGltf.bounds,
                      usesDraco: false,
                      usesMeshopt: false,
                    });
                  }
                  setDirty(true);
                  persistSnapshot(true);
                }}
              />
            </CardContent>
          </Card>

          <AssetRoadmapCard />

          <ProjectFolderPanel onSelectClip={(clip) => void handleProjectClip(clip)} />

          <CloudTranscodePanel onPack={applyTrialPack} />

          <FrontierExportPanel
            durationMs={effectiveDurationMs}
            spriteTuning={spriteTuning}
            sceneTuning={sceneTuning}
            customGltfUrl={customGltfUrl}
            clipName={sidecarClip ?? selected.title}
          />

          {show2d(viewMode) ? (
            <SpriteTuningPanel
              tuning={spriteTuning}
              frameCount={8}
              onChange={(next) => {
                setSpriteTuning(next);
                setDirty(true);
              }}
            />
          ) : null}

          {show3d(viewMode) ? (
            <SceneTuningPanel
              tuning={sceneTuning}
              onChange={(next) => {
                setSceneTuning(next);
                setDirty(true);
              }}
              gltfProxyFooter={
                <GltfProxyPanel
                  info={gltfProxyInfo}
                  gltfUrl={customGltfUrl}
                  onParsed={setGltfProxyInfo}
                  onLoaded={(result) => {
                    if (customGltfUrl && result?.url !== customGltfUrl) {
                      releaseGltfUrl(customGltfUrl);
                    }
                    if (!result) {
                      releaseGltfUrl();
                      setCustomGltfUrl(undefined);
                      setDirty(true);
                      return;
                    }
                    setCustomGltfUrl(result.url);
                    setGltfProxyInfo(result.header);
                    setDirty(true);
                    persistSnapshot(true);
                  }}
                />
              }
            />
          ) : null}
        </aside>

        <section className="space-y-4">
          <Card className="studio-grid overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">
                {sidecarClip ?? selected.title}
              </CardTitle>
              <Tabs
                value={viewMode}
                onValueChange={(v) => {
                  setViewMode(v as PreviewMode);
                  setDirty(true);
                }}
              >
                <TabsList aria-label="Preview mode">
                  <TabsTrigger value="2d" aria-label="2D preview mode">
                    <MonitorPlay className="mr-1 h-3 w-3" aria-hidden />
                    2D
                  </TabsTrigger>
                  <TabsTrigger value="3d" aria-label="3D preview mode">
                    <Film className="mr-1 h-3 w-3" aria-hidden />
                    3D
                  </TabsTrigger>
                  <TabsTrigger value="split" aria-label="Split 2D and 3D preview mode">
                    <Layers className="mr-1 h-3 w-3" aria-hidden />
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
                      config={tunedSprite}
                      playing={playing}
                      elapsedMs={trial.elapsedMs}
                      tuning={spriteTuning}
                    />
                  </div>
                ) : null}
                {show3d(viewMode) ? (
                  <ScenePreview3D
                    playing={playing}
                    elapsedMs={trial.elapsedMs}
                    tuning={sceneTuning}
                    gltfUrl={customGltfUrl}
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
                glTF / procedural 3D rigs. Space = play/pause · Esc = stop.
              </span>
              {!isNativeApp() ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!socket?.connected) return;
                    socket.emit("trial-start", {
                      sceneId: selected.id,
                      reviewer: reviewer || "anonymous",
                    });
                  }}
                  disabled={!connected}
                  aria-label="Broadcast trial start to connected reviewers"
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
