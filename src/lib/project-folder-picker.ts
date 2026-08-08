/**
 * Open project folder — File System Access API or webkitdirectory fallback.
 */

import {
  buildProjectManifest,
  validateManifestSize,
  type ProjectFolderManifest,
} from "@/lib/project-folder";

export type ProjectFolderPickResult = {
  manifest: ProjectFolderManifest;
  files: Map<string, File>;
};

async function walkDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  prefix: string,
  files: Map<string, File>,
  fileList: File[],
): Promise<void> {
  for await (const [name, entry] of handle.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (entry.kind === "file") {
      const file = await entry.getFile();
      files.set(path, file);
      const withPath = file as File & { webkitRelativePath?: string };
      withPath.webkitRelativePath = path;
      fileList.push(withPath);
    } else {
      await walkDirectoryHandle(entry, path, files, fileList);
    }
  }
}

export async function pickProjectFolder(): Promise<ProjectFolderPickResult> {
  if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
    const dir = await window.showDirectoryPicker({ mode: "read" });
    const files = new Map<string, File>();
    const fileList: File[] = [];
    await walkDirectoryHandle(dir, "", files, fileList);
    const manifest = buildProjectManifest(dir.name, fileList);
    if (!validateManifestSize(manifest)) {
      throw new Error("Project folder index exceeds 10 KB — narrow to Animations/ subfolder.");
    }
    return { manifest, files };
  }

  return pickProjectFolderViaInput();
}

function pickProjectFolderViaInput(): Promise<ProjectFolderPickResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.onchange = () => {
      const list = Array.from(input.files ?? []);
      if (!list.length) {
        reject(new Error("No folder selected"));
        return;
      }
      const files = new Map<string, File>();
      for (const file of list) {
        const path =
          (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? file.name;
        files.set(path, file);
      }
      const folderName =
        (list[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split("/")[0] ??
        "project";
      const manifest = buildProjectManifest(folderName, list);
      if (!validateManifestSize(manifest)) {
        reject(new Error("Project folder index exceeds 10 KB — narrow to Animations/ subfolder."));
        return;
      }
      resolve({ manifest, files });
    };
    input.click();
  });
}
