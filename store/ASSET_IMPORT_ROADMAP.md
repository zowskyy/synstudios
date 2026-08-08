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

## Phase 2 — Done (proxy preview)

**Goal:** User points at a heavy source file; app never loads the full asset.

| Approach | Status |
|----------|--------|
| **2D thumbnail strip** — auto-generate 8-frame × 128px preview on pick | ✅ `sprite-proxy-worker.ts` + `asset-loader.ts` |
| **3D proxy mesh** — load only bounding box + bone count from glTF header | ✅ `gltf-proxy.ts` + `GltfProxyPanel` |
| **Sidecar JSON** — `trial.json` from Godot/UE (`store/EXPORT_TEMPLATES.md`) | ✅ `trial-sidecar.ts` + `TrialSidecarImport` |

**Taylor:** W11 ProxyPreview validates this phase.

---

## Phase 3 — Done (streamed glTF trial)

**Goal:** Real 3D meshes with strict budgets.

| Rule | Limit | Status |
|------|-------|--------|
| Max file size | 12 MB glTF/GLB | ✅ `gltf-budget.ts` + `gltf-loader.ts` |
| Max texture edge | 2048 px (auto-downscale) | ✅ `gltf-textures.ts` |
| Max meshes per scene | 8 | ✅ header validation |
| Draco/meshopt compression | Required for &gt;4 MB | ✅ `gltf-proxy.ts` extension scan |

**Tech:** `@react-three/drei` `useGLTF` + `DRACOLoader` (CDN WASM on demand); dispose on scene/url change.

**Taylor:** W12 StreamGltf validates this phase.

---

## Phase 4 — Done (project folder link)

**Goal:** “Open project folder” instead of importing everything.

| Platform | Status |
|----------|--------|
| Web desktop `showDirectoryPicker()` | ✅ `project-folder-picker.ts` |
| Android / Chrome folder select (`webkitdirectory`) | ✅ fallback in picker |
| Lazy load one clip | ✅ `ProjectFolderPanel` + `project-folder-store.ts` |

**Memory:** Filename index manifest only (&lt;10 KB); active clip decoded on demand.

**Taylor:** W13 ProjectFolder validates this phase.

---

## Phase 5 — Done (optional cloud transcode)

**Goal:** Heavy export uploads once; server returns **trial package** (&lt;2 MB metadata).

| Item | Status |
|------|--------|
| Opt-in UI + 24h TTL schema | ✅ `CloudTranscodePanel` + `trial-pack.ts` |
| Cloud stub endpoint | ✅ `server.ts` `/api/transcode` |
| Offline-first fallback | ✅ `buildLocalTrialPack()` on-device proxy |

**Taylor:** W14 CloudTranscode validates this phase.

---

## Phase 6 — Done (Frontier Syntax bridge)

Export trial metadata as Frontier-readable structs for wasm codegen:

```json
{
  "strip": { "layout": "horizontal", "frameWidth": 32, "fps": 12 },
  "proxyGltf": "optional-uri",
  "durationMs": 30000
}
```

| Item | Status |
|------|--------|
| `toFrontierTrialPack()` export | ✅ `frontier-trial-pack.ts` |
| Studio download button | ✅ `FrontierExportPanel` |
| CLI sample export | ✅ `scripts/frontier_trial_export.py` |

Relay: `manifest/frontier_relay.json` — see `scripts/frontier_relay.py append`.

**Taylor:** W15 FrontierBridge validates this phase.

---

## Roadmap complete

All six asset-import phases are implemented. Future work is production hardening (real cloud transcode pipeline, iOS folder picker, meshopt decoder).

## Memory budget summary (enforced in app)

| Asset type | Max file | Max decoded |
|------------|----------|-------------|
| Sprite sheet | 8 MB | 16 MP |
| glTF trial | 12 MB | 2048² textures |
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
| W11 ProxyPreview | Phase 2 thumbnail + sidecar + glTF header validation |
| W12 StreamGltf | Phase 3 glTF budget + streamed preview |
| W13 ProjectFolder | Phase 4 directory index + lazy clip load |
| W14 CloudTranscode | Phase 5 cloud trial pack + offline fallback |
| W15 FrontierBridge | Phase 6 Frontier Syntax export bridge |

Run: `python3 scripts/taylor_asset_team.py`
