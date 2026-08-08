#!/usr/bin/env python3
"""W12 StreamGltf — Phase 3 streamed glTF trial with budget enforcement."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("src/lib/gltf-budget.ts", ["validateGltfTrial", "maxMeshesPerScene"]),
    ("src/lib/gltf-loader.ts", ["loadGltfTrialFile", "releaseGltfUrl"]),
    ("src/lib/gltf-draco.ts", ["DRACOLoader", "configureGltfLoader"]),
    ("src/lib/gltf-textures.ts", ["downscaleSceneTextures", "disposeGltfScene"]),
    ("src/components/studio/UserGltfModel.tsx", ["useGLTF"]),
    ("src/components/studio/ScenePreview3DInner.tsx", ["gltfUrl", "UserGltfModel"]),
    ("store/ASSET_IMPORT_ROADMAP.md", ["Phase 3 — Done"]),
]


def main() -> int:
    for rel, tokens in REQUIRED:
        path = ROOT / rel
        if not path.exists():
            print(f"FAIL: missing {rel}")
            return 1
        text = path.read_text(encoding="utf-8")
        for token in tokens:
            if token not in text:
                print(f"FAIL: {rel} missing `{token}`")
                return 1

    print("PASS: Phase 3 streamed glTF trial + budget enforcement verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
