"use client";

import { useState } from "react";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ASSET_BUDGET, formatBytes } from "@/lib/asset-budget";
import { parseGltfProxy, type GltfProxyInfo } from "@/lib/gltf-proxy";

type GltfProxyPanelProps = {
  info: GltfProxyInfo | null;
  onParsed: (info: GltfProxyInfo | null) => void;
};

export function GltfProxyPanel({ info, onParsed }: GltfProxyPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    if (file.size > ASSET_BUDGET.maxGltfBytes) {
      setLoading(false);
      setError(`GLB exceeds ${formatBytes(ASSET_BUDGET.maxGltfBytes)} — header-only parse skipped.`);
      onParsed(null);
      return;
    }
    const parsed = await parseGltfProxy(file);
    setLoading(false);
    if (!parsed) {
      setError("Could not read GLB header. Use a binary .glb under 12 MB.");
      onParsed(null);
      return;
    }
    onParsed(parsed);
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Label className="flex items-center gap-1.5">
        <Box className="h-3.5 w-3.5" />
        glTF proxy header
      </Label>
      <p className="text-[10px] text-muted-foreground">
        Reads mesh/node counts from GLB header only — no mesh decode (&lt;100 KB RAM).
      </p>
      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
        <label className="cursor-pointer">
          {loading ? "Parsing…" : "Choose .glb"}
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            className="hidden"
            disabled={loading}
            aria-label="Upload GLB for header-only proxy parse"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      </Button>
      {info ? (
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          <dt>Meshes</dt>
          <dd className="text-white">{info.meshCount}</dd>
          <dt>Nodes</dt>
          <dd className="text-white">{info.nodeCount}</dd>
          <dt>Bone hint</dt>
          <dd className="text-white">{info.boneHint}</dd>
          <dt>Bounds (W×H×D)</dt>
          <dd className="text-white">
            {info.bounds.map((n) => n.toFixed(1)).join(" × ")}
          </dd>
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
