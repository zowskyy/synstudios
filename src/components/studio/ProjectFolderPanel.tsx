"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatBytes } from "@/lib/asset-budget";
import type { ProjectClipEntry } from "@/lib/project-folder";
import { pickProjectFolder } from "@/lib/project-folder-picker";
import {
  clearProjectFolder,
  getProjectManifest,
  resolveProjectClip,
  setProjectFolder,
} from "@/lib/project-folder-store";

export type ProjectClipSelection = {
  entry: ProjectClipEntry;
  file: File;
};

type ProjectFolderPanelProps = {
  onSelectClip: (selection: ProjectClipSelection) => void;
};

export function ProjectFolderPanel({ onSelectClip }: ProjectFolderPanelProps) {
  const [manifest, setManifest] = useState(getProjectManifest());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openFolder() {
    setLoading(true);
    setError(null);
    try {
      const result = await pickProjectFolder();
      setProjectFolder(result.manifest, result.files);
      setManifest(result.manifest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open folder");
    } finally {
      setLoading(false);
    }
  }

  function clearFolder() {
    clearProjectFolder();
    setManifest(null);
    setError(null);
  }

  function selectEntry(entry: ProjectClipEntry) {
    const file = resolveProjectClip(entry);
    if (!file) {
      setError(`Missing file: ${entry.relativePath}`);
      return;
    }
    setError(null);
    onSelectClip({ entry, file });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FolderOpen className="h-4 w-4" />
          Project folder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[10px] text-muted-foreground">
          Index filenames only (&lt;10 KB manifest). Lazy-load one clip at a time — desktop directory
          picker or Android folder select.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            disabled={loading}
            onClick={() => void openFolder()}
            aria-label="Open project folder"
          >
            {loading ? "Indexing…" : "Open folder"}
          </Button>
          {manifest ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={clearFolder}
              aria-label="Clear project folder index"
            >
              Clear
            </Button>
          ) : null}
        </div>
        {manifest ? (
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {manifest.folderName} · {manifest.entries.length} clips
            </Label>
            <ul className="max-h-40 space-y-1 overflow-y-auto" role="listbox" aria-label="Project clips">
              {manifest.entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    role="option"
                    className="flex w-full items-center justify-between rounded border border-border px-2 py-1.5 text-left text-[10px] hover:bg-white/5"
                    onClick={() => selectEntry(entry)}
                    aria-label={`Load ${entry.name}`}
                  >
                    <span className="truncate font-mono text-white">{entry.relativePath}</span>
                    <span className="ml-2 shrink-0 text-muted-foreground">
                      {entry.kind} · {formatBytes(entry.sizeBytes)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
