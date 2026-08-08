#!/usr/bin/env python3
"""W16 BenchmarkBaseline — checked-in device baselines + compare script."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "manifest" / "benchmark_baselines.json"
BASELINE_RUN = ROOT / "benchmarks" / "baseline" / "android-hero-walk-2d-sm-a376u.json"
COMPARE = ROOT / "scripts" / "benchmark-compare.py"


def main() -> int:
    if not MANIFEST.exists():
        print("FAIL: missing manifest/benchmark_baselines.json")
        return 1
    if not BASELINE_RUN.exists():
        print("FAIL: missing android baseline JSON")
        return 1
    if not COMPARE.exists():
        print("FAIL: missing scripts/benchmark-compare.py")
        return 1

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if not manifest.get("baselines"):
        print("FAIL: no baselines registered")
        return 1

    text = COMPARE.read_text(encoding="utf-8")
    for token in ("--against-baseline", "compare_to_baseline", "benchmark_baselines.json"):
        if token not in text:
            print(f"FAIL: benchmark-compare.py missing `{token}`")
            return 1

    proc = subprocess.run(
        [sys.executable, str(COMPARE), "--against-baseline", str(BASELINE_RUN), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        print("FAIL: baseline self-check regression")
        print(proc.stdout[-500:] if proc.stdout else proc.stderr[-500:])
        return 1

    print("PASS: benchmark baseline manifest + regression compare verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
