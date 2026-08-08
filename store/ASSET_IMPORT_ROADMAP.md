# SynStudios — Lightweight Asset Import Roadmap

**Problem:** Game assets (UE `.uasset`, Godot scenes, full glTF rigs, 4K texture atlases) are too heavy to load fully into a Capacitor WebView trial app. Users need to **see their real animation intent** without blowing memory or APK size.

**Principle:** Never bundle user assets in the app. Always **reference → validate → preview at reduced fidelity → optional upgrade**.

---

## Phase 1 — Done (current)

| Item | Status |
|------|--------|
| PNG/WebP sprite strip upload with **8 MB / 16 MP caps** | ✅ `asset-budget.ts` + `asset-loader.ts` |
| Object URL LRU cache (max 3 sheets) | ✅ |
| Aseprite-style tuning without re-upload | ✅ |
| Demo procedural 3D rig (zero user memory) | ✅ |

**Taylor:** W10 AssetRoadmap validates this phase.

---

## Phase 2 — Proxy preview (next, low memory)

**Goal:** User points at a heavy source file; app never loads the full asset.

| Approach | Memory impact | UX |
|----------|---------------|-----|
| **2D thumbnail strip** — auto-generate 8-frame × 128px preview on pick | ~1–2 MB | “Looks like my walk cycle” |
| **3D proxy mesh** — load only bounding box + bone count from glTF header | &lt;100 KB | Silhouette + timing |
| **Sidecar JSON** — user exports `trial.json` from Godot/UE plugin (paths + fps only) | &lt;50 KB | Exact timing, placeholder art |

**Implementation sketch:**
- `scripts/workers/` Godot/UE export template docs in `store/EXPORT_TEMPLATES.md`
- Web Worker decodes images off main thread
- `createImageBitmap` + canvas downscale before preview

**Taylor:** W11 ProxyPreview (future worker)

---

## Phase 3 — Streamed glTF trial (medium)

**Goal:** Real 3D meshes with strict budgets.

| Rule | Limit |
|------|-------|
| Max file size | 12 MB glTF/GLB |
| Max texture edge | 2048 px (auto-downscale) |
| Max meshes per scene | 8 |
| Draco/meshopt compression | Required for &gt;4 MB |

**Tech:** `@react-three/drei` `useGLTF` with `draco` decoder; dispose on scene change; `renderer.dispose()`.

**Not in APK:** Decoder WASM loaded on demand from CDN or chunked in `out/`.

---

## Phase 4 — Project folder link (SAF / File System Access)

**Goal:** “Open project folder” instead of importing everything.

| Platform | API |
|----------|-----|
| Android | Storage Access Framework — read-only URI to `Animations/` subfolder |
| Web (desktop) | `showDirectoryPicker()` — index filenames only, lazy-load selected clip |
| iOS (future) | Document picker single-file |

**Memory:** Only the **active trial clip** is decoded; index is a JSON manifest (&lt;10 KB).

---

## Phase 5 — Cloud transcode lane (optional, zero device RAM)

**Goal:** Heavy UE/Godot export uploads once; server returns **trial package** (&lt;2 MB).

| Output | Contents |
|--------|----------|
| `trial-pack.zip` | Downscaled strip + 512² glTF proxy + 30s metadata JSON |
| Privacy | User opts in; deleted after 24h; no account required for v1 |

**SynStudios stays offline-first;** cloud is optional accelerator.

---

## Phase 6 — Frontier Syntax bridge

Export trial metadata as Frontier-readable structs for wasm codegen:

```json
{
  "strip": { "layout": "horizontal", "frameWidth": 32, "fps": 12 },
  "proxyGltf": "optional-uri",
  "durationMs": 30000
}
```

Relay: `manifest/frontier_relay.json` — see `scripts/frontier_relay.py append`.

---

## Memory budget summary (enforced in app)

| Asset type | Max file | Max decoded |
|------------|----------|-------------|
| Sprite sheet | 8 MB | 16 MP |
| glTF (future) | 12 MB | 2048² textures |
| Cached blobs | 3 entries LRU | — |
| APK static `out/` | 50 MB (W5) | — |

---

## What we will NOT do

- Bundle user assets into the Play Store APK
- Load full UE `.uasset` or Godot `.scn` natively in WebView
- Keep unlimited blob URLs without revocation
- Block trial on large files without explaining the proxy path (Phase 2)

---

## Taylor worker ownership

| Worker | Role |
|--------|------|
| W5 BundleSizer | APK / `out/` size cap |
| W10 AssetRoadmap | Roadmap doc + budget modules present |
| W11 ProxyPreview | (Phase 2) thumbnail + sidecar validation |
| W12 StreamGltf | (Phase 3) glTF budget enforcement |

Run: `python3 scripts/taylor_asset_team.py`
