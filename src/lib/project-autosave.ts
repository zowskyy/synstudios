import type { PreviewMode } from "@/lib/trial-types";

const STORAGE_PREFIX = "synstudios/projects/";
const AUTOSAVE_KEY = `${STORAGE_PREFIX}current`;
const BACKUP_PREFIX = `${STORAGE_PREFIX}backups/`;
const MAX_BACKUPS = 5;
const AUTOSAVE_INTERVAL_MS = 60_000;

export type ProjectSnapshot = {
  version: 1;
  savedAt: string;
  sceneId: string;
  viewMode: PreviewMode;
  reviewer: string;
  customSheetUrl?: string;
  dirty: boolean;
  undoStack: string[];
};

export type RestoreCandidate = {
  snapshot: ProjectSnapshot;
  backupId: string;
  label: string;
};

function backupKey(index: number): string {
  return `${BACKUP_PREFIX}${index}`;
}

function rotateBackups(): void {
  if (typeof window === "undefined") return;
  for (let i = MAX_BACKUPS - 1; i >= 1; i -= 1) {
    const prev = localStorage.getItem(backupKey(i - 1));
    if (prev) localStorage.setItem(backupKey(i), prev);
    else localStorage.removeItem(backupKey(i));
  }
  const current = localStorage.getItem(AUTOSAVE_KEY);
  if (current) localStorage.setItem(backupKey(0), current);
}

export function saveProjectSnapshot(snapshot: ProjectSnapshot): void {
  if (typeof window === "undefined") return;
  const safe: ProjectSnapshot = {
    ...snapshot,
    customSheetUrl: snapshot.customSheetUrl?.startsWith("blob:")
      ? undefined
      : snapshot.customSheetUrl,
  };
  rotateBackups();
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(safe));
}

export function loadProjectSnapshot(): ProjectSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ProjectSnapshot;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch (error) {
    console.error("Failed to parse autosave snapshot", error);
    return null;
  }
}

export function findRestoreCandidate(
  currentSceneId: string,
): RestoreCandidate | null {
  const snapshot = loadProjectSnapshot();
  if (!snapshot?.dirty) return null;
  if (
    snapshot.sceneId === currentSceneId &&
    !snapshot.reviewer &&
    !snapshot.customSheetUrl
  ) {
    return null;
  }
  const saved = new Date(snapshot.savedAt);
  const label = Number.isNaN(saved.getTime())
    ? "your last session"
    : saved.toLocaleString();
  return { snapshot, backupId: "current", label };
}

export function clearDirtyFlag(): void {
  const snapshot = loadProjectSnapshot();
  if (!snapshot) return;
  saveProjectSnapshot({ ...snapshot, dirty: false });
}

export function startAutosaveTimer(
  getSnapshot: () => Omit<ProjectSnapshot, "version" | "savedAt" | "dirty"> & {
    dirty: boolean;
  },
): () => void {
  const id = window.setInterval(() => {
    const data = getSnapshot();
    if (!data.dirty) return;
    saveProjectSnapshot({
      version: 1,
      savedAt: new Date().toISOString(),
      ...data,
    });
  }, AUTOSAVE_INTERVAL_MS);
  return () => window.clearInterval(id);
}

export function isRestorableSheetUrl(url: string | undefined): boolean {
  return !!url && !url.startsWith("blob:");
}

export function pushUndoEntry(sceneId: string): string[] {
  const existing = loadProjectSnapshot()?.undoStack ?? [];
  const next = [...existing, sceneId].slice(-20);
  return next;
}
