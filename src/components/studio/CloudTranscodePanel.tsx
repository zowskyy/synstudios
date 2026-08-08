"use client";

import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/asset-budget";
import { buildLocalTrialPack, requestCloudTranscode } from "@/lib/cloud-transcode";
import { isTrialPackExpired, type TrialPack } from "@/lib/trial-pack";

type CloudTranscodePanelProps = {
  onPack: (pack: TrialPack) => void;
};

export function CloudTranscodePanel({ onPack }: CloudTranscodePanelProps) {
  const [optedIn, setOptedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPack, setLastPack] = useState<TrialPack | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const pack = optedIn
        ? await requestCloudTranscode(file, { optedIn: true })
        : await buildLocalTrialPack(file);
      if (isTrialPackExpired(pack)) {
        setError("Trial pack expired — regenerate");
        return;
      }
      setLastPack(pack);
      onPack(pack);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcode failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CloudUpload className="h-4 w-4" />
          Trial pack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[10px] text-muted-foreground">
          Optional cloud lane returns a &lt;2 MB trial pack. Offline-first: builds proxy strip locally
          when cloud is unavailable. Deleted after 24h when cloud is used.
        </p>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={(e) => setOptedIn(e.target.checked)}
            className="mt-0.5"
            aria-label="Opt in to cloud transcode upload"
          />
          <span>
            Opt in to upload once for cloud transcode (no account). Falls back to on-device proxy if
            offline.
          </span>
        </label>
        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
          <label className="cursor-pointer">
            {loading ? "Building pack…" : optedIn ? "Upload for trial pack" : "Build local trial pack"}
            <input
              type="file"
              accept="image/png,image/webp,.glb,.gltf,application/json"
              className="hidden"
              disabled={loading}
              aria-label="Choose file for trial pack"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </label>
        </Button>
        {lastPack ? (
          <p className="text-xs text-emerald-400" role="status">
            {lastPack.clipName} · {formatBytes(lastPack.sourceBytes)}
            {lastPack.offlineFallback ? " · on-device" : " · cloud"}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
