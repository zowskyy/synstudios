#!/usr/bin/env python3
"""W2 BuildCore — Next.js static export for Capacitor Android shell."""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "out"
NPM = shutil.which("npm") or r"C:\Program Files\nodejs\npm.cmd"


def run(cmd: list[str]) -> int:
    print(f"> {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=ROOT, env=os.environ.copy())
    return proc.returncode


def main() -> int:
    if not Path(NPM).exists() and shutil.which("npm") is None:
        print("FAIL: npm not found — install Node.js LTS")
        return 1

    if not (ROOT / "node_modules").exists():
        if run([NPM, "install"]) != 0:
            print("FAIL: npm install")
            return 1

    env = os.environ.copy()
    env["MOBILE_EXPORT"] = "1"
    env["NEXT_TELEMETRY_DISABLED"] = "1"

    proc = subprocess.run([NPM, "run", "build:mobile"], cwd=ROOT, env=env)
    if proc.returncode != 0:
        print("FAIL: npm run build:mobile")
        return 1

    if not OUT.exists() or not (OUT / "index.html").exists():
        print("FAIL: out/index.html missing after static export")
        return 1

    print(f"PASS: static export at {OUT} ({len(list(OUT.rglob('*')))} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
