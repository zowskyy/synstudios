#!/usr/bin/env python3
"""
SynStudios independent validator — re-runs Taylor workers without trusting prior stdout.

Usage:
  python3 scripts/independent_validate.py          # must exit 0
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PYTHON = sys.executable

WORKERS = [
    "scripts/workers/w1_brand_audit.py",
    "scripts/workers/w2_web_build.py",
    "scripts/workers/w3_playstore_policy.py",
    "scripts/workers/w4_feature_parity.py",
    "scripts/workers/w5_android_validate.py",
    "scripts/workers/w6_release_ops.py",
    "scripts/workers/w7_launch_continuity.py",
    "scripts/workers/w8_sprite_studio.py",
    "scripts/workers/w9_unreal_viewport.py",
    "scripts/workers/w10_asset_roadmap.py",
    "scripts/workers/w11_proxy_preview.py",
]


def main() -> int:
    failures: list[str] = []
    for worker in WORKERS:
        path = ROOT / worker
        if not path.exists():
            failures.append(f"MISSING {worker}")
            continue
        proc = subprocess.run(
            [PYTHON, str(path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=900,
        )
        tail = (proc.stdout + proc.stderr).strip().splitlines()
        line = tail[-1] if tail else "(no output)"
        if proc.returncode != 0:
            failures.append(f"FAIL {worker}: {line}")
            print(f"[FAIL] {worker}")
        else:
            print(f"[PASS] {worker}: {line}")

    if failures:
        print("\nIndependent validation FAILED:")
        for f in failures:
            print(f"  - {f}")
        return 1

    print("PASS: independent validation — all Taylor workers verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
