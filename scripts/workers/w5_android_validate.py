#!/usr/bin/env python3
"""W5 BundleSizer — export size + Android config validation."""
from __future__ import annotations

import re
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

    variables = ROOT / "android/variables.gradle"
    if variables.exists():
        text = variables.read_text(encoding="utf-8")
        min_match = re.search(r"minSdkVersion\s*=\s*(\d+)", text)
        if not min_match or int(min_match.group(1)) < 24:
            print("FAIL: minSdkVersion must be >= 24")
            return 1
        for key, minimum in (("compileSdkVersion", 34), ("targetSdkVersion", 34)):
            match = re.search(rf"{key}\s*=\s*(\d+)", text)
            if not match or int(match.group(1)) < minimum:
                print(f"FAIL: {key} must be >= {minimum}")
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
        for abi in ("arm64-v8a", "armeabi-v7a", "x86_64"):
            if abi not in text:
                print(f"FAIL: android/app/build.gradle missing ABI filter {abi}")
                return 1

    manifest = ROOT / "android/app/src/main/AndroidManifest.xml"
    if manifest.exists():
        text = manifest.read_text(encoding="utf-8")
        if "READ_EXTERNAL_STORAGE" in text:
            print("FAIL: AndroidManifest must not declare READ_EXTERNAL_STORAGE")
            return 1
        if "WRITE_EXTERNAL_STORAGE" in text and "maxSdkVersion=\"28\"" not in text:
            print(
                "FAIL: WRITE_EXTERNAL_STORAGE only allowed with maxSdkVersion=28 for legacy devices"
            )
            return 1

    print(f"PASS: export size {size_mb:.2f}MB, Android config valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
