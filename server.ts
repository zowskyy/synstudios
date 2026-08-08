import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/",
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
  console.log(`SynStudios realtime server on port ${PORT}`);
});
