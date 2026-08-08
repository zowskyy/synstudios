"use client";

import { useState } from "react";
import { FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseTrialSidecar, type TrialSidecar } from "@/lib/trial-sidecar";

type TrialSidecarImportProps = {
  onImport: (sidecar: TrialSidecar) => void;
};

export function TrialSidecarImport({ onImport }: TrialSidecarImportProps) {
  const [error, setError] = useState<string | null>(null);
  const [lastClip, setLastClip] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const text = await file.text();
    const result = parseTrialSidecar(text);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setLastClip(result.sidecar.clipName);
    onImport(result.sidecar);
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Label className="flex items-center gap-1.5">
        <FileJson className="h-3.5 w-3.5" />
        Import trial.json
      </Label>
      <p className="text-[10px] text-muted-foreground">
        Godot / UE sidecar — timing + strip layout, no heavy assets loaded.
      </p>
      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
        <label className="cursor-pointer">
          Choose trial.json
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import trial.json sidecar"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      </Button>
      {lastClip ? (
        <p className="text-xs text-emerald-400" role="status">
          Loaded clip: {lastClip}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
