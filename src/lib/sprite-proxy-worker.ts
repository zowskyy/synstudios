/**
 * Build an inline Web Worker that downscales heavy sprite sheets to an 8-frame proxy strip.
 */

const WORKER_SOURCE = `
self.onmessage = async (event) => {
  const { buffer, frameCount, thumbHeight } = event.data;
  try {
    const blob = new Blob([buffer]);
    const bitmap = await createImageBitmap(blob);
    const frames = frameCount || 8;
    const thumbH = thumbHeight || 128;
    const sliceW = Math.max(1, Math.floor(bitmap.width / frames));
    const thumbW = Math.max(1, Math.round((sliceW / bitmap.height) * thumbH));
    const outW = thumbW * frames;
    const canvas = new OffscreenCanvas(outW, thumbH);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("OffscreenCanvas unsupported");
    ctx.imageSmoothingEnabled = true;
    for (let i = 0; i < frames; i += 1) {
      const sx = i * sliceW;
      ctx.drawImage(bitmap, sx, 0, sliceW, bitmap.height, i * thumbW, 0, thumbW, thumbH);
    }
    bitmap.close();
    const outBlob = await canvas.convertToBlob({ type: "image/png" });
    const outBuffer = await outBlob.arrayBuffer();
    self.postMessage({ ok: true, buffer: outBuffer, frameWidth: thumbW, frameHeight: thumbH, frameCount: frames }, [outBuffer]);
  } catch (error) {
    self.postMessage({ ok: false, message: String(error) });
  }
};
`;

let workerUrl: string | null = null;

function getWorkerUrl(): string {
  if (!workerUrl) {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    workerUrl = URL.createObjectURL(blob);
  }
  return workerUrl;
}

export type ProxyStripResult = {
  url: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
};

export function generateProxyStrip(file: File): Promise<ProxyStripResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(getWorkerUrl());
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      worker.onmessage = (event: MessageEvent) => {
        worker.terminate();
        const data = event.data as {
          ok: boolean;
          buffer?: ArrayBuffer;
          frameWidth?: number;
          frameHeight?: number;
          frameCount?: number;
          message?: string;
        };
        if (!data.ok || !data.buffer) {
          reject(new Error(data.message ?? "Proxy generation failed"));
          return;
        }
        const blob = new Blob([data.buffer], { type: "image/png" });
        resolve({
          url: URL.createObjectURL(blob),
          frameWidth: data.frameWidth ?? 128,
          frameHeight: data.frameHeight ?? 128,
          frameCount: data.frameCount ?? 8,
        });
      };
      worker.onerror = () => {
        worker.terminate();
        reject(new Error("Proxy worker error"));
      };
      worker.postMessage({ buffer, frameCount: 8, thumbHeight: 128 }, [buffer]);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
