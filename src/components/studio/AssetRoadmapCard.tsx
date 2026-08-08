"use client";

import Link from "next/link";
import { FileStack } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSET_BUDGET, formatBytes } from "@/lib/asset-budget";

export function AssetRoadmapCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileStack className="h-4 w-4" />
          Your game assets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <p>
          Sprite strips up to <strong className="text-white">{formatBytes(ASSET_BUDGET.maxSpriteSheetBytes)}</strong> load
          on-device. Heavier sheets auto-build an 8-frame proxy; GLB meshes stream up to 12 MB in 3D mode.
        </p>
        <Link href="/assets" className="inline-block text-white underline underline-offset-2">
          Read asset import roadmap →
        </Link>
      </CardContent>
    </Card>
  );
}
