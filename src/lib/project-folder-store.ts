/**
 * In-memory file map for lazy-loaded project folder clips.
 */

import type { ProjectClipEntry, ProjectFolderManifest } from "@/lib/project-folder";

let manifest: ProjectFolderManifest | null = null;
const filesByPath = new Map<string, File>();

export function setProjectFolder(
  nextManifest: ProjectFolderManifest,
  files: Map<string, File>,
): void {
  manifest = nextManifest;
  filesByPath.clear();
  for (const [path, file] of files) filesByPath.set(path, file);
}

export function clearProjectFolder(): void {
  manifest = null;
  filesByPath.clear();
}

export function getProjectManifest(): ProjectFolderManifest | null {
  return manifest;
}

export function resolveProjectClip(entry: ProjectClipEntry): File | null {
  return (
    filesByPath.get(entry.relativePath) ??
    filesByPath.get(entry.name) ??
    null
  );
}
