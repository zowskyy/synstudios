#!/usr/bin/env python3
"""Compare SynStudios web vs Android benchmark JSON exports."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIR = ROOT / "benchmarks"


def load_run(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("studio") != "SynStudios":
        raise ValueError(f"{path.name}: not a SynStudios benchmark file")
    return data


def metric(run: dict, key: str) -> float:
    return float(run["metrics"][key])


def compare(web: dict, android: dict) -> str:
    w = web["metrics"]
    a = android["metrics"]
    lines = [
        "# SynStudios Benchmark — Web vs Android APK",
        "",
        f"| Metric | Web | Android | Delta | Winner |",
        f"|--------|-----|---------|-------|--------|",
    ]

    def row(label: str, wv: float, av: float, higher_better: bool = True) -> None:
        delta = av - wv
        if higher_better:
            winner = "Android" if av > wv else ("Web" if wv > av else "Tie")
        else:
            winner = "Android" if av < wv else ("Web" if wv < av else "Tie")
        sign = "+" if delta >= 0 else ""
        lines.append(f"| {label} | {wv:.1f} | {av:.1f} | {sign}{delta:.1f} | {winner} |")

    row("Avg FPS", w["avgFps"], a["avgFps"], True)
    row("Min FPS", w["minFps"], a["minFps"], True)
    row("Frame drops", w["frameDrops"], a["frameDrops"], False)

    web_pass = w["avgFps"] >= 30 and w["frameDrops"] < w["elapsedMs"] / 100
    apk_pass = a["avgFps"] >= 30 and a["frameDrops"] < a["elapsedMs"] / 100
    lines.extend(
        [
            "",
            f"- Web trial pass: **{'YES' if web_pass else 'NO'}**",
            f"- Android trial pass: **{'YES' if apk_pass else 'NO'}**",
            f"- Scene: `{web.get('sceneId', '?')}`",
            "",
            "## How to reproduce",
            "",
            "1. Web: `npm run dev` → open http://localhost:3000/benchmark → export JSON",
            "2. APK: install debug APK → open Benchmark tab → export JSON",
            "3. Compare: `python scripts/benchmark-compare.py web.json android.json`",
        ]
    )
    return "\n".join(lines)


def find_latest(platform: str, directory: Path) -> Path | None:
    matches = sorted(directory.glob(f"synstudios-benchmark-{platform}-*.json"))
    return matches[-1] if matches else None


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare web vs Android benchmarks")
    parser.add_argument("web", nargs="?", help="Web benchmark JSON path")
    parser.add_argument("android", nargs="?", help="Android benchmark JSON path")
    parser.add_argument("--dir", default=str(DEFAULT_DIR), help="Benchmark directory")
    parser.add_argument("--out", default=str(ROOT / "benchmarks" / "COMPARE_REPORT.md"))
    args = parser.parse_args()

    bench_dir = Path(args.dir)
    bench_dir.mkdir(parents=True, exist_ok=True)

    web_path = Path(args.web) if args.web else find_latest("web", bench_dir)
    apk_path = Path(args.android) if args.android else find_latest("android", bench_dir)

    if not web_path or not web_path.exists():
        print("FAIL: web benchmark JSON not found")
        print("Run web benchmark at /benchmark and export JSON to benchmarks/")
        return 1
    if not apk_path or not apk_path.exists():
        print("FAIL: android benchmark JSON not found")
        print("Run APK benchmark and export JSON to benchmarks/")
        return 1

    report = compare(load_run(web_path), load_run(apk_path))
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report, encoding="utf-8")
    print(report)
    print(f"\nReport saved: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
