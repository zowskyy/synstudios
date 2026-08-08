"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { loadSpriteSheetFile } from "@/lib/asset-loader";
import { ASSET_BUDGET, formatBytes } from "@/lib/asset-budget";
import type { SpriteAnimConfig } from "@/lib/trial-types";

export type SpriteUploadResult = {
  url: string;
  fileName: string;
  isProxy?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
};

type SpriteUploadProps = {
  config?: SpriteAnimConfig;
  onUpload: (result: SpriteUploadResult) => void;
};

export function SpriteUpload({ config, onUpload }: SpriteUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [proxyNote, setProxyNote] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProxyNote(null);
    const result = await loadSpriteSheetFile(file);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.isProxy) {
      setProxyNote(
        `Proxy strip built (${result.frameCount ?? 8} frames · ${result.frameWidth ?? "?"}×${result.frameHeight ?? "?"} px) — full sheet not kept in memory.`,
      );
    }
    onUpload({
      url: result.url,
      fileName: result.fileName,
      isProxy: result.isProxy,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      frameCount: result.frameCount,
    });
  }

  return (
    <div className="space-y-2">
      <Label>2D sprite sheet</Label>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-black/50 px-4 py-6 text-center hover:bg-white/5">
        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          PNG/WebP strip · max {formatBytes(ASSET_BUDGET.maxSpriteSheetBytes)} ·{" "}
          {config?.frameWidth ?? 32}×{config?.frameHeight ?? 48}
        </span>
        <span className="mt-1 text-[10px] text-muted-foreground">
          Larger sheets auto-downscale to 8-frame proxy
        </span>
        <input
          type="file"
          accept="image/png,image/webp"
          className="hidden"
          disabled={loading}
          aria-label="Upload horizontal PNG sprite strip"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </label>
      {proxyNote ? (
        <p className="text-xs text-amber-300/90" role="status">
          {proxyNote}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
        <label className="cursor-pointer">
          {loading ? "Checking…" : "Choose PNG strip"}
          <input
            type="file"
            accept="image/png,image/webp"
            className="hidden"
            disabled={loading}
            aria-label="Choose PNG sprite strip file"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      </Button>
    </div>
  );
}
