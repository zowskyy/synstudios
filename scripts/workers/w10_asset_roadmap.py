#!/usr/bin/env python3
"""W10 AssetRoadmap — lightweight asset import roadmap + budget modules."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("store/ASSET_IMPORT_ROADMAP.md", ["Phase 2", "Phase 3", "LRU", "glTF"]),
    ("src/lib/asset-budget.ts", ["ASSET_BUDGET", "maxSpriteSheetBytes"]),
    ("src/lib/asset-loader.ts", ["loadSpriteSheetFile", "releaseObjectUrl"]),
    ("src/app/assets/page.tsx", ["Asset import roadmap"]),
    ("src/components/studio/AssetRoadmapCard.tsx", ["Your game assets"]),
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

    print("PASS: asset import roadmap + lightweight loader verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
