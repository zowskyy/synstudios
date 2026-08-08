"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  exportBenchmarkJson,
  exportResultMessage,
} from "@/lib/benchmark-export";
import type { BenchmarkRun, TrialMetrics, TrialStatus } from "@/lib/trial-types";
import { buildBenchmarkRun } from "@/lib/trial-types";

type TrialMetricsPanelProps = {
  status: TrialStatus;
  metrics: TrialMetrics;
  sceneId: string;
  sceneTitle: string;
  onBenchmarkExport?: (run: BenchmarkRun) => void;
};

export function TrialMetricsPanel({
  status,
  metrics,
  sceneId,
  sceneTitle,
  onBenchmarkExport,
}: TrialMetricsPanelProps) {
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const pass =
    status === "complete" &&
    metrics.avgFps >= 30 &&
    metrics.frameDrops < metrics.elapsedMs / 100;

  async function exportBenchmark() {
    setExporting(true);
    setExportMessage(null);
    try {
      const run = buildBenchmarkRun(
        { id: sceneId, title: sceneTitle, mode: metrics.mode, durationMs: metrics.elapsedMs },
        metrics,
      );
      const result = await exportBenchmarkJson(run);
      setExportMessage(exportResultMessage(result));
      onBenchmarkExport?.(run);
    } catch (error) {
      console.error("Benchmark export failed", error);
      setExportMessage("Export failed — try again or screenshot metrics.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          Performance
          {status === "complete" ? (
            <Badge variant={pass ? "default" : "outline"}>
              {pass ? "Trial pass" : "Needs work"}
            </Badge>
          ) : (
            <Badge variant="muted">{status}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Avg FPS" value={metrics.avgFps.toFixed(1)} />
          <Metric label="Min FPS" value={metrics.minFps.toFixed(1)} />
          <Metric label="Frame drops" value={String(metrics.frameDrops)} />
          <Metric label="Platform" value={metrics.platform.toUpperCase()} />
        </div>
        {status === "complete" ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void exportBenchmark()}
              disabled={exporting}
              aria-label="Export benchmark JSON"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Export benchmark JSON"}
            </Button>
            {exportMessage ? (
              <p className="text-center text-xs text-muted-foreground" role="status">
                {exportMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-black/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-base">{value}</div>
    </div>
  );
}
