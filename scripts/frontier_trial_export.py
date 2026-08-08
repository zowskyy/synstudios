#!/usr/bin/env python3
"""
Export a Frontier Syntax trial pack JSON from default studio tuning.

Usage:
  python3 scripts/frontier_trial_export.py [--out manifest/frontier_trial_sample.json]
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "manifest" / "frontier_trial_sample.json"


def to_frontier_trial_pack() -> dict:
    """Mirror src/lib/frontier-trial-pack.ts defaults for CI validation."""
    return {
        "version": "1",
        "exportedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "durationMs": 30_000,
        "clipName": "hero-walk-2d",
        "strip": {
            "layout": "horizontal",
            "frameWidth": 32,
            "frameHeight": 48,
            "fps": 12,
            "loop": True,
        },
        "scene": {
            "viewportMode": "lit",
            "playbackRate": 1,
            "fov": 50,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Export Frontier trial pack sample JSON")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    pack = to_frontier_trial_pack()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(pack, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
