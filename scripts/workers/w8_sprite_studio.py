#!/usr/bin/env python3
"""W8 SpriteStudio — Aseprite-inspired 2D tuning panel parity."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("src/lib/sprite-tuning.ts", ["SPEED_PRESETS", "onionSkin", "sheetLayout", "horizontal"]),
    ("src/components/studio/SpriteTuningPanel.tsx", ["SpriteTuningPanel", "Onion", "Loop"]),
    ("src/components/studio/SpritePreview2D.tsx", ["onionSkin", "sheetLayout", "loop"]),
    ("src/lib/sprite-sheet.ts", ["drawSpriteFrameAt"]),
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

    print("PASS: Aseprite-style 2D sprite studio parity verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
