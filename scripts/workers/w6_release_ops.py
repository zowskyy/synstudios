#!/usr/bin/env python3
"""W6 ReleaseOps — release signing template + version manifest."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "manifest" / "release.json"
KEYSTORE_TEMPLATE = ROOT / "android/keystore.properties.example"


def main() -> int:
    required = [
        ROOT / "android/app/build.gradle",
        KEYSTORE_TEMPLATE,
        ROOT / "scripts/build-release-aab.ps1",
    ]
    missing = [p for p in required if not p.exists()]
    if missing:
        print("FAIL: release ops files missing:")
        for m in missing:
            print(f"  - {m.relative_to(ROOT)}")
        return 1

    release = {
        "app_id": "com.synstudios.preview",
        "app_name": "SynStudios",
        "version_code": 1,
        "version_name": "1.0.0",
        "min_sdk": 24,
        "target_sdk": 35,
        "bundle_format": "aab",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(release, indent=2), encoding="utf-8")
    print(f"PASS: release manifest written to {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
