import type { IncomingMessage, ServerResponse } from "http";
import { createServer } from "http";
import { Server } from "socket.io";

const TRIAL_DURATION_MS = 30_000;
const TRIAL_PACK_TTL_MS = 24 * 60 * 60 * 1000;

type TranscodeRequest = {
  optedIn?: boolean;
  fileName?: string;
  sizeBytes?: number;
};

function readJsonBody(req: IncomingMessage): Promise<TranscodeRequest> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")) as TranscodeRequest);
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function handleTranscode(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readJsonBody(req);
    if (!body.optedIn) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "opt-in required" }));
      return;
    }

    const clipName = (body.fileName ?? "clip").replace(/\.[^.]+$/, "");
    const now = Date.now();
    const pack = {
      version: "1" as const,
      generatedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + TRIAL_PACK_TTL_MS).toISOString(),
      clipName,
      durationMs: TRIAL_DURATION_MS,
      sourceBytes: body.sizeBytes ?? 0,
      offlineFallback: false,
      note: "Cloud transcode stub — metadata-only response; wire real transcode pipeline in production",
      sidecar: {
        version: "1" as const,
        source: "manual" as const,
        clipName,
        durationMs: TRIAL_DURATION_MS,
        fps: 12,
        strip: { frameWidth: 32, frameHeight: 48, frameCount: 8, layout: "horizontal" as const },
      },
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(pack));
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "bad request" }));
  }
}

const httpServer = createServer((req, res) => {
  const path = req.url?.split("?")[0] ?? "";
  if (req.method === "POST" && path === "/api/transcode") {
    void handleTranscode(req, res);
    return;
  }
  if (path.startsWith("/socket.io")) {
    return;
  }
  if (!res.writableEnded) {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  path: "/socket.io/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

type TrialEvent = {
  sceneId: string;
  reviewer: string;
  metrics?: {
    avgFps: number;
    minFps: number;
    frameDrops: number;
    mode: string;
    elapsedMs: number;
  };
};

io.on("connection", (socket) => {
  console.log(`SynStudios client connected: ${socket.id}`);

  socket.on("trial-start", (data: TrialEvent) => {
    io.emit("trial-started", {
      ...data,
      timestamp: new Date().toISOString(),
      studio: "SynStudios",
    });
    console.log(`Trial started: ${data.sceneId} by ${data.reviewer}`);
  });

  socket.on("trial-complete", (data: TrialEvent) => {
    const passed =
      !!data.metrics &&
      data.metrics.avgFps >= 30 &&
      data.metrics.frameDrops < data.metrics.elapsedMs / 100;

    io.emit("trial-finished", {
      ...data,
      passed,
      timestamp: new Date().toISOString(),
      studio: "SynStudios",
    });
    console.log(
      `Trial complete: ${data.sceneId} avgFps=${data.metrics?.avgFps ?? 0} pass=${passed}`,
    );
  });

  socket.on("disconnect", () => {
    console.log(`SynStudios client disconnected: ${socket.id}`);
  });
});

const PORT = Number(process.env.WS_PORT ?? 3003);
httpServer.listen(PORT, () => {
  console.log(`SynStudios realtime + transcode server on port ${PORT}`);
});
