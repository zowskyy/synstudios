import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { BenchmarkRun } from "@/lib/trial-types";

export type BenchmarkExportResult =
  | { method: "download"; fileName: string }
  | { method: "share"; fileName: string }
  | { method: "clipboard"; fileName: string };

function benchmarkFileName(run: BenchmarkRun): string {
  return `synstudios-benchmark-${run.platform}-${run.sceneId}-${Date.now()}.json`;
}

function benchmarkJson(run: BenchmarkRun): string {
  return JSON.stringify(run, null, 2);
}

async function exportViaWebDownload(
  run: BenchmarkRun,
  fileName: string,
): Promise<BenchmarkExportResult> {
  const blob = new Blob([benchmarkJson(run)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return { method: "download", fileName };
}

async function exportViaNativeShare(
  run: BenchmarkRun,
  fileName: string,
): Promise<BenchmarkExportResult> {
  const content = benchmarkJson(run);

  await Filesystem.writeFile({
    path: fileName,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  const { uri } = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Cache,
  });

  await Share.share({
    title: "SynStudios benchmark",
    text: content,
    url: uri,
    dialogTitle: "Save or share benchmark JSON",
  });

  return { method: "share", fileName };
}

async function exportViaClipboard(
  run: BenchmarkRun,
  fileName: string,
): Promise<BenchmarkExportResult> {
  const content = benchmarkJson(run);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  return { method: "clipboard", fileName };
}

export async function exportBenchmarkJson(
  run: BenchmarkRun,
): Promise<BenchmarkExportResult> {
  const fileName = benchmarkFileName(run);

  if (!Capacitor.isNativePlatform()) {
    return exportViaWebDownload(run, fileName);
  }

  try {
    return await exportViaNativeShare(run, fileName);
  } catch (error) {
    console.error("Native benchmark share failed, falling back to clipboard", error);
    return exportViaClipboard(run, fileName);
  }
}

export function exportResultMessage(result: BenchmarkExportResult): string {
  switch (result.method) {
    case "download":
      return `Downloaded ${result.fileName}`;
    case "share":
      return `Opened share sheet for ${result.fileName}`;
    case "clipboard":
      return `Copied JSON to clipboard (${result.fileName})`;
  }
}
