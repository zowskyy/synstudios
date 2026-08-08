"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadFrontierTrialPack,
  toFrontierTrialPack,
  type FrontierExportInput,
} from "@/lib/frontier-trial-pack";

type FrontierExportPanelProps = FrontierExportInput;

export function FrontierExportPanel(props: FrontierExportPanelProps) {
  function exportPack() {
    const pack = toFrontierTrialPack(props);
    downloadFrontierTrialPack(pack);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Download className="h-4 w-4" />
          Frontier export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[10px] text-muted-foreground">
          Export trial metadata as a Frontier Syntax–readable JSON struct for wasm codegen (no mesh
          embed).
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={exportPack}
          aria-label="Download Frontier trial pack JSON"
        >
          Download frontier-trial.json
        </Button>
      </CardContent>
    </Card>
  );
}
