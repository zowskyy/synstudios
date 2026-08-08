"use client";

import dynamic from "next/dynamic";

export const ScenePreview3D = dynamic(
  () =>
    import("@/components/studio/ScenePreview3DInner").then((m) => m.ScenePreview3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-md border border-border bg-black text-xs text-muted-foreground">
        Loading 3D preview…
      </div>
    ),
  },
);
