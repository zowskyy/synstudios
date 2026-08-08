#!/usr/bin/env python3
"""
SynStudios release readiness gate.

Usage:
  python3 scripts/release_readiness.py --audit
  python3 scripts/release_readiness.py --audit --skip-run
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "manifest" / "release_readiness.json"
REPORT = ROOT / "audit_reports" / "RELEASE_READINESS_REPORT.md"
PYTHON = sys.executable

WAVE_CHECKS = {
    "wave_0_tracking_gate": [PYTHON, "scripts/tracking.py", "gate"],
    "wave_0_independent_validate": [PYTHON, "scripts/independent_validate.py"],
    "wave_0_taylor_playstore": [PYTHON, "scripts/taylor_playstore_team.py", "--mode", "production"],
    "wave_1_sprite_studio": [PYTHON, "scripts/workers/w8_sprite_studio.py"],
    "wave_2_android_debug_workflow": None,
    "wave_3_frontier_relay": None,
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def run_cmd(cmd: list[str]) -> dict:
    try:
        proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=900)
        return {
            "pass": proc.returncode == 0,
            "exit_code": proc.returncode,
            "output": (proc.stdout + proc.stderr)[-800:],
            "command": " ".join(cmd),
        }
    except subprocess.TimeoutExpired:
        return {"pass": False, "exit_code": -1, "output": "timeout", "command": " ".join(cmd)}


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def audit(version: str, skip_run: bool) -> dict:
    checks: list[dict] = []

    if skip_run:
        tracking = read_json(ROOT / "manifest" / "tracking_evidence.json")
        checks.append({
            "name": "wave_0_tracking_gate",
            "pass": tracking.get("all_pass", False),
            "skipped": True,
            "output": json.dumps(tracking)[:400],
        })
        checks.append({
            "name": "wave_0_independent_validate",
            "pass": tracking.get("phase_7_pass", False),
            "skipped": True,
        })
    else:
        for name, cmd in WAVE_CHECKS.items():
            if cmd is None:
                continue
            checks.append({"name": name, **run_cmd(cmd)})

    checks.append({
        "name": "wave_2_android_debug_workflow",
        "pass": (ROOT / "scripts/build-debug-apk.sh").exists()
        and (ROOT / ".github/workflows/android-debug-release.yml").exists(),
        "skipped": skip_run,
    })
    relay = read_json(ROOT / "manifest" / "frontier_relay.json")
    checks.append({
        "name": "wave_3_frontier_relay",
        "pass": len(relay.get("entries", [])) >= 1,
        "skipped": skip_run,
    })

    blockers = [c["name"] for c in checks if not c.get("pass")]
    all_pass = len(blockers) == 0
    verdict = "RELEASE_READY" if all_pass else "NOT_READY"

    result = {
        "verdict": verdict,
        "version": version,
        "all_pass": all_pass,
        "rc_ready": all_pass,
        "ga_ready": all_pass,
        "blockers": blockers,
        "rc_blockers": blockers,
        "audited_at": utc_now(),
        "checks": checks,
        "manifest": "manifest/release_readiness.json",
        "report": str(REPORT.relative_to(ROOT)),
    }

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# SynStudios Release Readiness",
        "",
        f"**Verdict:** {verdict}",
        f"**Version:** {version}",
        f"**Audited:** {result['audited_at']}",
        "",
        "## Checks",
        "",
    ]
    for c in checks:
        mark = "PASS" if c.get("pass") else "FAIL"
        lines.append(f"- [{mark}] `{c['name']}`")
    if blockers:
        lines.extend(["", "## Blockers", ""])
        for b in blockers:
            lines.append(f"- {b}")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="SynStudios release readiness")
    parser.add_argument("--audit", action="store_true")
    parser.add_argument("--skip-run", action="store_true")
    parser.add_argument("--version", default="1.0.0-rc.1")
    args = parser.parse_args()
    if not args.audit:
        parser.print_help()
        return 2
    result = audit(args.version, skip_run=args.skip_run)
    print(json.dumps({k: result[k] for k in result if k != "checks"}, indent=2))
    return 0 if result["all_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
