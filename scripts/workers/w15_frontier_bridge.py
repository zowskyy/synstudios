#!/usr/bin/env python3
"""W15 FrontierBridge — Phase 6 Frontier Syntax trial pack export."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("src/lib/frontier-trial-pack.ts", ["toFrontierTrialPack", "FrontierTrialPack"]),
    ("src/components/studio/FrontierExportPanel.tsx", ["Frontier export", "frontier-trial.json"]),
    ("scripts/frontier_trial_export.py", ["to_frontier_trial_pack"]),
    ("store/ASSET_IMPORT_ROADMAP.md", ["Phase 6 — Done"]),
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

    print("PASS: Phase 6 Frontier Syntax trial pack bridge verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
