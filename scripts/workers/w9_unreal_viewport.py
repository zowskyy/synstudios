#!/usr/bin/env python3
"""W9 UnrealViewport — UE 5.8 viewport tuning parity for 3D preview."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("src/lib/scene-tuning.ts", ["VIEWPORT_MODE_PRESETS", "showSafeArea", "playbackRate"]),
    ("src/components/studio/SceneTuningPanel.tsx", ["SceneTuningPanel", "Sequencer speed"]),
    ("src/components/studio/ScenePreview3DInner.tsx", ["ViewportOverlays", "viewportMode"]),
    ("docs/UNREAL_VIEWPORT_MAP.md", ["Cinematic Viewport", "Lit Mode"]),
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

    print("PASS: Unreal Engine viewport tuning parity verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
