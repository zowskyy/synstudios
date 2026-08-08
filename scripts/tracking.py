#!/usr/bin/env python3
"""
SynStudios blueprint tracking gate — phases 0–8.

usage: python3 scripts/tracking.py gate
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACKING = ROOT / "TRACKING.json"
EVIDENCE = ROOT / "manifest" / "tracking_evidence.json"
PYTHON = sys.executable


def run(cmd: list[str], timeout: int = 900) -> dict:
    try:
        proc = subprocess.run(
            cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout
        )
        return {
            "pass": proc.returncode == 0,
            "exit_code": proc.returncode,
            "output": (proc.stdout + proc.stderr)[-1200:],
            "command": " ".join(cmd),
        }
    except subprocess.TimeoutExpired:
        return {"pass": False, "exit_code": -1, "output": "timeout", "command": " ".join(cmd)}


def check_file(path: str, tokens: list[str]) -> dict:
    p = ROOT / path
    if not p.exists():
        return {"pass": False, "reason": f"missing {path}"}
    text = p.read_text(encoding="utf-8")
    for token in tokens:
        if token not in text:
            return {"pass": False, "reason": f"{path} missing {token}"}
    return {"pass": True}


def gate(max_phase: int = 8) -> dict:
    checks: dict[str, dict] = {}

    checks["0.1_workers"] = run([PYTHON, "scripts/independent_validate.py"])
    checks["0.2_tracking_manifest"] = {"pass": TRACKING.exists()}
    checks["0.3_frontier_relay"] = check_file(
        "manifest/frontier_relay.json", ["frontier-syntax", "entries"]
    )

    checks["1.1_sprite_tuning"] = run([PYTHON, "scripts/workers/w8_sprite_studio.py"])
    checks["1.2_tuning_panel"] = check_file(
        "src/components/studio/SpriteTuningPanel.tsx", ["SPEED_PRESETS", "Onion"]
    )
    checks["1.3_onion_skin"] = check_file(
        "src/lib/sprite-tuning.ts", ["onionSkin", "sheetLayout"]
    )

    checks["2.1_spec_parity"] = run([PYTHON, "scripts/workers/w4_feature_parity.py"])
    checks["2.2_trial_player"] = check_file(
        "src/hooks/use-trial-player.ts", ["TRIAL_DURATION_MS", "requestAnimationFrame"]
    )

    checks["3.1_android"] = run([PYTHON, "scripts/workers/w5_android_validate.py"])
    checks["3.2_capacitor"] = check_file("capacitor.config.ts", ["com.synstudios.preview"])

    checks["4.1_benchmark"] = check_file(
        "src/app/benchmark/page.tsx", ["BENCHMARK_SCENE", "exportBenchmarkJson"]
    )
    checks["4.2_downloads_save"] = check_file(
        "src/lib/benchmark-export.ts", ["exportViaDownloads", "BenchmarkSave"]
    )

    checks["5.1_policy"] = run([PYTHON, "scripts/workers/w3_playstore_policy.py"])
    checks["5.2_launch"] = run([PYTHON, "scripts/workers/w7_launch_continuity.py"])

    checks["6.1_release_ops"] = run([PYTHON, "scripts/workers/w6_release_ops.py"])
    checks["6.2_web_build"] = run([PYTHON, "scripts/workers/w2_web_build.py"])

    checks["7.1_independent"] = checks["0.1_workers"]

    checks["8.1_relay_script"] = check_file(
        "scripts/frontier_relay.py", ["frontier-syntax", "append_entry"]
    )

    phase_map = {
        0: ["0.1_workers", "0.2_tracking_manifest", "0.3_frontier_relay"],
        1: ["1.1_sprite_tuning", "1.2_tuning_panel", "1.3_onion_skin"],
        2: ["2.1_spec_parity", "2.2_trial_player"],
        3: ["3.1_android", "3.2_capacitor"],
        4: ["4.1_benchmark", "4.2_downloads_save"],
        5: ["5.1_policy", "5.2_launch"],
        6: ["6.1_release_ops", "6.2_web_build"],
        7: ["7.1_independent"],
        8: ["8.1_relay_script"],
    }

    phase_pass: dict[int, bool] = {}
    for phase in range(9):
        if phase > max_phase:
            phase_pass[phase] = False
            continue
        if phase > 0 and not phase_pass.get(phase - 1, False):
            phase_pass[phase] = False
            continue
        keys = phase_map.get(phase, [])
        phase_pass[phase] = all(
            checks.get(k, {}).get("pass") is True for k in keys
        )

    summary = {
        "all_pass": all(phase_pass.get(i, False) for i in range(max_phase + 1)),
        "max_phase": max_phase,
        "phase_0_pass": phase_pass.get(0, False),
        "phase_1_pass": phase_pass.get(1, False),
        "phase_2_pass": phase_pass.get(2, False),
        "phase_3_pass": phase_pass.get(3, False),
        "phase_4_pass": phase_pass.get(4, False),
        "phase_5_pass": phase_pass.get(5, False),
        "phase_6_pass": phase_pass.get(6, False),
        "phase_7_pass": phase_pass.get(7, False),
        "phase_8_pass": phase_pass.get(8, False),
        "checks": checks,
        "audited_at": datetime.now(timezone.utc).isoformat(),
    }

    EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    if TRACKING.exists():
        tracking = json.loads(TRACKING.read_text(encoding="utf-8"))
        for i in range(9):
            tracking[f"phase_{i}_pass"] = phase_pass.get(i, False)
        TRACKING.write_text(json.dumps(tracking, indent=2) + "\n", encoding="utf-8")

    return summary


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="SynStudios tracking gate")
    parser.add_argument("command", nargs="?", default="gate")
    parser.add_argument("--max-phase", type=int, default=8)
    args = parser.parse_args()
    if args.command != "gate":
        print("unsupported command", file=sys.stderr)
        return 2

    summary = gate(max_phase=args.max_phase)
    print(json.dumps({k: summary[k] for k in summary if k != "checks"}, indent=2))

    for phase in range(args.max_phase + 1):
        keys = [k for k, v in summary["checks"].items() if k.startswith(f"{phase}.")]
        for key in sorted(keys):
            ok = summary["checks"][key].get("pass")
            mark = "PASS" if ok else "FAIL"
            print(f"  [{mark}] {key}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
