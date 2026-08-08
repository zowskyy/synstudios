#!/usr/bin/env python3
"""W3 AuditGuardian — Play Store policy + privacy checklist."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    "store/PRIVACY_POLICY.md",
    "store/PLAY_STORE_LISTING.md",
    "store/SUBMISSION_CHECKLIST.md",
    "android/app/src/main/AndroidManifest.xml",
    "android/app/build.gradle",
    "capacitor.config.ts",
    "public/logo.svg",
]


def main() -> int:
    missing = [p for p in REQUIRED if not (ROOT / p).exists()]
    if missing:
        print("FAIL: Play Store policy files missing:")
        for m in missing:
            print(f"  - {m}")
        return 1

    privacy = (ROOT / "store/PRIVACY_POLICY.md").read_text(encoding="utf-8")
    if "SynStudios" not in privacy:
        print("FAIL: privacy policy must mention SynStudios")
        return 1

    manifest = (ROOT / "android/app/src/main/AndroidManifest.xml").read_text(encoding="utf-8")
    if "com.synstudios.preview" not in manifest:
        print("FAIL: AndroidManifest missing package com.synstudios.preview")
        return 1

    print("PASS: Play Store policy checklist complete")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
