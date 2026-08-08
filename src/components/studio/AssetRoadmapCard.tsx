"use client";

import Link from "next/link";
import { FileStack } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
          Sprite strips and GLB meshes load on-device with strict budgets. Open a project folder,
          build a trial pack, or export Frontier metadata from the studio sidebar.
        </p>
        <Link href="/assets" className="inline-block text-white underline underline-offset-2">
          Read asset import roadmap →
        </Link>
      </CardContent>
    </Card>
  );
}
