/**
 * Project folder manifest — filename index only, lazy decode per clip (Phase 4).
 */

export const PROJECT_FOLDER_MAX_INDEX_BYTES = 10_000;

export type ProjectClipKind = "sprite" | "gltf" | "sidecar" | "other";

export type ProjectClipEntry = {
  id: string;
  name: string;
  relativePath: string;
  sizeBytes: number;
  kind: ProjectClipKind;
};

export type ProjectFolderManifest = {
  version: "1";
  folderName: string;
  indexedAt: string;
  entries: ProjectClipEntry[];
};

export function classifyClip(name: string): ProjectClipKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".webp")) return "sprite";
  if (lower.endsWith(".glb") || lower.endsWith(".gltf")) return "gltf";
  if (lower.endsWith("trial.json")) return "sidecar";
  return "other";
}

export function buildProjectManifest(
  folderName: string,
  files: File[],
): ProjectFolderManifest {
  const entries: ProjectClipEntry[] = [];
  files.forEach((file, index) => {
    const relativePath =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name;
    const kind = classifyClip(file.name);
    if (kind === "other") return;
    entries.push({
      id: `clip-${index}`,
      name: file.name,
      relativePath,
      sizeBytes: file.size,
      kind,
    });
  });
  entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return {
    version: "1",
    folderName,
    indexedAt: new Date().toISOString(),
    entries,
  };
}

export function manifestByteSize(manifest: ProjectFolderManifest): number {
  return new TextEncoder().encode(JSON.stringify(manifest)).length;
}

export function validateManifestSize(manifest: ProjectFolderManifest): boolean {
  return manifestByteSize(manifest) <= PROJECT_FOLDER_MAX_INDEX_BYTES;
}
