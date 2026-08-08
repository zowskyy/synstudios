#!/usr/bin/env python3
"""W7 LaunchContinuity — store listing + submission guide completeness."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED_SECTIONS = {
    "store/PLAY_STORE_LISTING.md": ["Short description", "Full description", "Category"],
    "store/SUBMISSION_CHECKLIST.md": ["Google Play Console", "AAB", "Privacy policy"],
    "README.md": ["SynStudios", "Play Store", "Android"],
}


def main() -> int:
    for rel, sections in REQUIRED_SECTIONS.items():
        path = ROOT / rel
        if not path.exists():
            print(f"FAIL: missing {rel}")
            return 1
        text = path.read_text(encoding="utf-8")
        for section in sections:
            if section not in text:
                print(f"FAIL: {rel} missing section `{section}`")
                return 1

    print("PASS: launch continuity docs complete")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
