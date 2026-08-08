#!/usr/bin/env python3
"""
SynStudios Taylor Play Store Team — 9-worker orchestrator for Google Play release.

Group 1 FOUNDATION (sequential):
  W1 GateKeeper     → brand + secrets audit
  W2 BuildCore      → Next.js static export + TypeScript check
  W3 AuditGuardian  → Play Store policy + privacy checklist

Group 2 BUILD (parallel):
  W4 SpecParity     → 2D/3D feature parity verification
  W5 BundleSizer    → web bundle size + android config validation

Group 3 SHIP (parallel):
  W6 ReleaseOps     → signing template + version manifest
  W7 LaunchContinuity → store listing + README + submission guide

Usage:
  python scripts/taylor_playstore_team.py --mode production
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parent.parent
MANIFEST = REPO / "manifest" / "taylor_playstore_mission.json"
REPORT = REPO / "audit_reports" / "taylor_playstore_report.md"

PYTHON = sys.executable

WORKERS: dict[str, dict[str, Any]] = {
    "W1_GateKeeper": {
        "group": 1,
        "name": "GateKeeper",
        "role": "Brand rebrand audit + secret scan",
        "commands": [[PYTHON, "scripts/workers/w1_brand_audit.py"]],
        "allow_nonzero": False,
    },
    "W2_BuildCore": {
        "group": 1,
        "name": "BuildCore",
        "role": "Next.js static export for Capacitor",
        "commands": [[PYTHON, "scripts/workers/w2_web_build.py"]],
        "allow_nonzero": False,
    },
    "W3_AuditGuardian": {
        "group": 1,
        "name": "AuditGuardian",
        "role": "Play Store policy + privacy checklist",
        "commands": [[PYTHON, "scripts/workers/w3_playstore_policy.py"]],
        "allow_nonzero": False,
    },
    "W4_SpecParity": {
        "group": 2,
        "name": "SpecParity",
        "role": "2D sprite + 3D animation feature verification",
        "commands": [[PYTHON, "scripts/workers/w4_feature_parity.py"]],
        "allow_nonzero": False,
    },
    "W5_BundleSizer": {
        "group": 2,
        "name": "BundleSizer",
        "role": "Export size + Android manifest validation",
        "commands": [[PYTHON, "scripts/workers/w5_android_validate.py"]],
        "allow_nonzero": True,
    },
    "W6_ReleaseOps": {
        "group": 3,
        "name": "ReleaseOps",
        "role": "Release signing config + version manifest",
        "commands": [[PYTHON, "scripts/workers/w6_release_ops.py"]],
        "allow_nonzero": False,
    },
    "W7_LaunchContinuity": {
        "group": 3,
        "name": "LaunchContinuity",
        "role": "Store listing + submission guide completeness",
        "commands": [[PYTHON, "scripts/workers/w7_launch_continuity.py"]],
        "allow_nonzero": False,
    },
    "W9_UnrealViewport": {
        "group": 2,
        "name": "UnrealViewport",
        "role": "UE 5.8 viewport tuning parity for 3D preview",
        "commands": [[PYTHON, "scripts/workers/w9_unreal_viewport.py"]],
        "allow_nonzero": False,
    },
}

GROUPS = {
    1: {"name": "FOUNDATION", "workers": ["W1_GateKeeper", "W2_BuildCore", "W3_AuditGuardian"], "sequential": True},
    2: {"name": "BUILD", "workers": ["W4_SpecParity", "W5_BundleSizer", "W8_SpriteStudio", "W9_UnrealViewport"], "sequential": False},
    3: {"name": "SHIP", "workers": ["W6_ReleaseOps", "W7_LaunchContinuity"], "sequential": False},
}


def run_step(cmd: list[str]) -> dict[str, Any]:
    start = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=REPO,
            capture_output=True,
            text=True,
            timeout=600,
            shell=False,
        )
        return {
            "command": " ".join(cmd),
            "exit_code": proc.returncode,
            "pass": proc.returncode == 0,
            "duration_s": round(time.time() - start, 3),
            "stdout_tail": proc.stdout[-2000:] if proc.stdout else "",
            "stderr_tail": proc.stderr[-2000:] if proc.stderr else "",
        }
    except subprocess.TimeoutExpired:
        return {
            "command": " ".join(cmd),
            "exit_code": -1,
            "pass": False,
            "duration_s": round(time.time() - start, 3),
            "stdout_tail": "",
            "stderr_tail": "TIMEOUT",
        }


def run_worker(worker_id: str) -> dict[str, Any]:
    spec = WORKERS[worker_id]
    steps = []
    ok = True
    started = datetime.now(timezone.utc).isoformat()
    for cmd in spec["commands"]:
        step = run_step(cmd)
        steps.append(step)
        if not step["pass"] and not spec.get("allow_nonzero"):
            ok = False
            break
    finished = datetime.now(timezone.utc).isoformat()
    return {
        "id": worker_id,
        "name": spec["name"],
        "group": spec["group"],
        "role": spec["role"],
        "steps": steps,
        "ok": ok,
        "started_at": started,
        "finished_at": finished,
    }


def render_report(results: list[dict], production_ready: bool) -> str:
    lines = [
        "# SynStudios Taylor Play Store Report",
        "",
        f"**Production ready:** {'YES' if production_ready else 'NO'}",
        f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
        "",
    ]
    for r in results:
        status = "PASS" if r["ok"] else "FAIL"
        lines.append(f"## {r['id']} — {r['name']} [{status}]")
        lines.append(f"*{r['role']}*")
        lines.append("")
        for s in r["steps"]:
            mark = "PASS" if s["pass"] else "FAIL"
            lines.append(f"- [{mark}] `{s['command']}` ({s['duration_s']}s)")
            if not s["pass"] and s["stderr_tail"]:
                lines.append(f"  ```\n{s['stderr_tail'][-500:]}\n  ```")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="SynStudios Taylor Play Store team")
    parser.add_argument("--mode", default="production", choices=["end-of-turn", "production", "full"])
    args = parser.parse_args()

    if args.mode == "end-of-turn":
        worker_ids = ["W1_GateKeeper", "W7_LaunchContinuity"]
    else:
        worker_ids = list(WORKERS.keys())

    results: list[dict] = []
    if args.mode == "production" or args.mode == "full":
        for gid in [1, 2, 3]:
            group = GROUPS[gid]
            ids = [w for w in group["workers"] if w in worker_ids]
            if group["sequential"]:
                for wid in ids:
                    r = run_worker(wid)
                    results.append(r)
                    if not r["ok"]:
                        break
            else:
                with ThreadPoolExecutor(max_workers=len(ids)) as pool:
                    futs = {pool.submit(run_worker, wid): wid for wid in ids}
                    for fut in as_completed(futs):
                        results.append(fut.result())
            if not all(r["ok"] for r in results):
                break
    else:
        for wid in worker_ids:
            results.append(run_worker(wid))

    production_ready = all(r["ok"] for r in results) and len(results) == len(worker_ids if args.mode != "end-of-turn" else worker_ids)

    manifest = {
        "run_id": datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
        "mode": args.mode,
        "started_at": results[0]["started_at"] if results else None,
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "workers": results,
        "production_ready": production_ready,
        "play_store_ready": production_ready,
    }

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    REPORT.write_text(render_report(results, production_ready), encoding="utf-8")

    print(f"Taylor Play Store team: {'PASS' if production_ready else 'FAIL'}")
    print(f"Report: {REPORT}")
    return 0 if production_ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
