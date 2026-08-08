#!/usr/bin/env python3
"""W4 SpecParity — verify 2D sprite + 3D animation components exist."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED_SOURCES = [
    ("src/components/studio/SpritePreview2D.tsx", ["frameWidth", "fps", "canvas"]),
    ("src/components/studio/ScenePreview3DInner.tsx", ["Canvas", "useFrame", "OrbitControls"]),
    ("src/components/studio/StudioShell.tsx", ["SynStudios", "split", "2d", "3d"]),
    ("src/hooks/use-trial-player.ts", ["TRIAL_DURATION_MS", "requestAnimationFrame"]),
    ("src/lib/sprite-sheet.ts", ["horizontal", "frameWidth"]),
]


def main() -> int:
    for rel, tokens in REQUIRED_SOURCES:
        path = ROOT / rel
        if not path.exists():
            print(f"FAIL: missing {rel}")
            return 1
        text = path.read_text(encoding="utf-8").lower()
        for token in tokens:
            if token.lower() not in text:
                print(f"FAIL: {rel} missing token `{token}`")
                return 1

    print("PASS: 2D sprite + 3D animation feature parity verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
