import Link from "next/link";
import { AssetRoadmapCard } from "@/components/studio/AssetRoadmapCard";

export default function AssetsRoadmapPage() {
  return (
    <div className="min-h-screen bg-black text-white safe-area-padding">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="text-sm text-muted-foreground hover:text-white">
            ← Studio
          </Link>
          <span className="text-sm font-medium">Asset import roadmap</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 prose prose-invert prose-sm">
        <h1 className="text-xl font-semibold">Lightweight asset import</h1>
        <p className="text-muted-foreground">
          SynStudios previews your animation without loading full game engine assets into memory.
          <strong className="text-white"> All six roadmap phases are complete.</strong>
        </p>
        <section className="space-y-3 text-sm">
          <h2 className="text-base font-medium text-white">Phase 1 — Sprite upload</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>PNG/WebP sprite strips with size caps and LRU cache</li>
            <li>Procedural 3D rig for zero-cost trials</li>
          </ul>
          <h2 className="text-base font-medium text-white">Phase 2 — Proxy preview</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Auto thumbnail strip, glTF header parse, trial.json sidecar</li>
          </ul>
          <h2 className="text-base font-medium text-white">Phase 3 — Streamed glTF</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>12 MB cap, Draco/meshopt, 2048² texture downscale</li>
          </ul>
          <h2 className="text-base font-medium text-white">Phase 4 — Project folder</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Directory picker — index filenames, lazy-load one clip</li>
          </ul>
          <h2 className="text-base font-medium text-white">Phase 5 — Cloud transcode</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Optional opt-in trial pack; offline proxy fallback</li>
          </ul>
          <h2 className="text-base font-medium text-white">Phase 6 — Frontier bridge</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Export frontier-trial.json for wasm codegen</li>
          </ul>
        </section>
        <AssetRoadmapCard />
        <p className="text-xs text-muted-foreground">
          Full spec: <code className="text-white">store/ASSET_IMPORT_ROADMAP.md</code>
        </p>
      </main>
    </div>
  );
}
