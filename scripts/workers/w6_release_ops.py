#!/usr/bin/env python3
"""W6 ReleaseOps — release signing template + version manifest."""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "manifest" / "release.json"
KEYSTORE_TEMPLATE = ROOT / "android/keystore.properties.example"
BUILD_GRADLE = ROOT / "android/app/build.gradle"
PACKAGE_JSON = ROOT / "package.json"


def read_android_versions() -> tuple[int, str]:
    text = BUILD_GRADLE.read_text(encoding="utf-8")
    code_match = re.search(r"versionCode\s+(\d+)", text)
    name_match = re.search(r'versionName\s+"([^"]+)"', text)
    if not code_match or not name_match:
        raise ValueError("Could not parse versionCode/versionName from android/app/build.gradle")
    return int(code_match.group(1)), name_match.group(1)


def main() -> int:
    required = [
        BUILD_GRADLE,
        KEYSTORE_TEMPLATE,
        ROOT / "scripts/build-release-aab.ps1",
        PACKAGE_JSON,
    ]
    missing = [p for p in required if not p.exists()]
    if missing:
        print("FAIL: release ops files missing:")
        for m in missing:
            print(f"  - {m.relative_to(ROOT)}")
        return 1

    npm_version = json.loads(PACKAGE_JSON.read_text(encoding="utf-8")).get("version", "0.0.0")
    version_code, version_name = read_android_versions()
    if version_name != npm_version:
        print(
            f"FAIL: version mismatch package.json ({npm_version}) "
            f"vs android ({version_name})"
        )
        return 1

    release = {
        "app_id": "com.synstudios.preview",
        "app_name": "SynStudios",
        "version_code": version_code,
        "version_name": version_name,
        "min_sdk": 24,
        "target_sdk": 35,
        "bundle_format": "aab",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(release, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: release manifest written to {MANIFEST.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
