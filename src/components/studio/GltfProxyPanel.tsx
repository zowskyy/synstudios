"use client";

import { useState } from "react";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ASSET_BUDGET, formatBytes } from "@/lib/asset-budget";
import { GLTF_BUDGET } from "@/lib/gltf-budget";
import { loadGltfTrialFile } from "@/lib/gltf-loader";
import type { GltfProxyInfo } from "@/lib/gltf-proxy";

export type GltfTrialLoadResult = {
  url: string;
  fileName: string;
  header: GltfProxyInfo;
};

type GltfProxyPanelProps = {
  info: GltfProxyInfo | null;
  gltfUrl?: string;
  onParsed: (info: GltfProxyInfo | null) => void;
  onLoaded: (result: GltfTrialLoadResult | null) => void;
};

export function GltfProxyPanel({
  info,
  gltfUrl,
  onParsed,
  onLoaded,
}: GltfProxyPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    setLoadedName(null);

    const result = await loadGltfTrialFile(file);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      onParsed(null);
      onLoaded(null);
      return;
    }

    onParsed(result.header);
    onLoaded({ url: result.url, fileName: result.fileName, header: result.header });
    setLoadedName(result.fileName);
  }

  function clearTrial() {
    setError(null);
    setLoadedName(null);
    onParsed(null);
    onLoaded(null);
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Label className="flex items-center gap-1.5">
        <Box className="h-3.5 w-3.5" />
        glTF trial mesh
      </Label>
      <p className="text-[10px] text-muted-foreground">
        Streamed GLB up to {formatBytes(ASSET_BUDGET.maxGltfBytes)} · max{" "}
        {GLTF_BUDGET.maxMeshesPerScene} meshes · Draco/meshopt over{" "}
        {formatBytes(GLTF_BUDGET.compressionRequiredAboveBytes)}. Textures auto-downscale to{" "}
        {ASSET_BUDGET.maxTextureEdgePx}px.
      </p>
      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
        <label className="cursor-pointer">
          {loading ? "Validating…" : "Choose .glb trial"}
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            className="hidden"
            disabled={loading}
            aria-label="Upload GLB for streamed 3D trial preview"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      </Button>
      {loadedName || gltfUrl ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-emerald-400" role="status">
            Loaded: {loadedName ?? "trial mesh"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[10px]"
            onClick={clearTrial}
            aria-label="Clear loaded glTF trial mesh"
          >
            Clear
          </Button>
        </div>
      ) : null}
      {info ? (
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          <dt>Meshes</dt>
          <dd className="text-white">{info.meshCount}</dd>
          <dt>Nodes</dt>
          <dd className="text-white">{info.nodeCount}</dd>
          <dt>Compression</dt>
          <dd className="text-white">
            {info.usesDraco ? "Draco" : info.usesMeshopt ? "meshopt" : "none"}
          </dd>
          <dt>Bone hint</dt>
          <dd className="text-white">{info.boneHint}</dd>
        </dl>
      ) : null}
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
