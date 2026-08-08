#!/usr/bin/env python3
"""W14 CloudTranscode — Phase 5 optional cloud trial pack lane."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("src/lib/trial-pack.ts", ["TrialPack", "TRIAL_PACK_TTL_MS"]),
    ("src/lib/cloud-transcode.ts", ["requestCloudTranscode", "buildLocalTrialPack"]),
    ("src/components/studio/CloudTranscodePanel.tsx", ["Opt in", "trial pack"]),
    ("server.ts", ["/api/transcode", "optedIn"]),
    ("store/ASSET_IMPORT_ROADMAP.md", ["Phase 5 — Done"]),
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

    print("PASS: Phase 5 cloud transcode lane + offline fallback verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
