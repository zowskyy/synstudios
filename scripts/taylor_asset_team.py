#!/usr/bin/env python3
"""
Taylor Asset Team — orchestrator for lightweight asset import phases.

Usage:
  python3 scripts/taylor_asset_team.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "manifest" / "taylor_asset_mission.json"
REPORT = ROOT / "audit_reports" / "taylor_asset_report.md"
PYTHON = sys.executable

WORKERS = [
    ("W10_AssetRoadmap", [PYTHON, "scripts/workers/w10_asset_roadmap.py"]),
    ("W5_BundleSizer", [PYTHON, "scripts/workers/w5_android_validate.py"]),
    ("W8_SpriteStudio", [PYTHON, "scripts/workers/w8_sprite_studio.py"]),
]


def run(cmd: list[str]) -> dict:
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=600)
    tail = (proc.stdout + proc.stderr).strip().splitlines()
    return {
        "pass": proc.returncode == 0,
        "exit_code": proc.returncode,
        "output": tail[-1] if tail else "",
        "command": " ".join(cmd),
    }


def main() -> int:
    results = []
    all_pass = True
    for name, cmd in WORKERS:
        r = run(cmd)
        r["worker"] = name
        results.append(r)
        if not r["pass"]:
            all_pass = False
        print(f"[{'PASS' if r['pass'] else 'FAIL'}] {name}: {r['output']}")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        json.dumps(
            {
                "mission": "taylor_asset_team",
                "audited_at": datetime.now(timezone.utc).isoformat(),
                "all_pass": all_pass,
                "workers": results,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# Taylor Asset Team Report", "", f"**Result:** {'PASS' if all_pass else 'FAIL'}", ""]
    for r in results:
        lines.append(f"- [{'x' if r['pass'] else ' '}] {r['worker']}: {r['output']}")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    return 0 if all_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
