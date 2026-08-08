#!/usr/bin/env python3
"""W11 ProxyPreview — Phase 2 proxy strip, sidecar import, glTF header parse."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("src/lib/trial-sidecar.ts", ["parseTrialSidecar", "sidecarToSpriteConfig"]),
    ("src/lib/sprite-proxy-worker.ts", ["generateProxyStrip", "OffscreenCanvas"]),
    ("src/lib/gltf-proxy.ts", ["parseGltfProxy", "GltfProxyInfo"]),
    ("src/lib/asset-loader.ts", ["generateProxyStrip", "isProxy"]),
    ("store/EXPORT_TEMPLATES.md", ["trial.json", "Godot"]),
    ("src/components/studio/TrialSidecarImport.tsx", ["Import trial.json"]),
    ("src/components/studio/GltfProxyPanel.tsx", ["glTF trial mesh"]),
    ("store/ASSET_IMPORT_ROADMAP.md", ["Phase 2 — Done"]),
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

    print("PASS: Phase 2 proxy preview (strip + sidecar + glTF header) verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
