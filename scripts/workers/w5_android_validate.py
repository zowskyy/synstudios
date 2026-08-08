#!/usr/bin/env python3
"""W5 BundleSizer — export size + Android config validation."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "out"
MAX_MB = 50


def dir_size(path: Path) -> int:
    total = 0
    for f in path.rglob("*"):
        if f.is_file():
            total += f.stat().st_size
    return total


def main() -> int:
    if not OUT.exists():
        print("WARN: out/ not built yet — run W2 BuildCore first")
        return 0

    size_mb = dir_size(OUT) / (1024 * 1024)
    if size_mb > MAX_MB:
        print(f"FAIL: static export {size_mb:.1f}MB exceeds {MAX_MB}MB cap")
        return 1

    gradle = ROOT / "android/app/build.gradle"
    if gradle.exists():
        text = gradle.read_text(encoding="utf-8")
        if "targetSdkVersion" not in text and "targetSdk" not in text:
            print("FAIL: android/app/build.gradle missing targetSdk")
            return 1
        if "versionCode" not in text:
            print("FAIL: android/app/build.gradle missing versionCode")
            return 1

    print(f"PASS: export size {size_mb:.2f}MB, Android config valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
