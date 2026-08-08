#!/usr/bin/env python3
"""Compare SynStudios benchmarks — web vs APK, or run vs checked-in baseline."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIR = ROOT / "benchmarks"
BASELINE_MANIFEST = ROOT / "manifest" / "benchmark_baselines.json"


def load_run(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("studio") != "SynStudios":
        raise ValueError(f"{path.name}: not a SynStudios benchmark file")
    return data


def load_manifest() -> dict:
    if not BASELINE_MANIFEST.exists():
        raise FileNotFoundError(f"Missing {BASELINE_MANIFEST.relative_to(ROOT)}")
    return json.loads(BASELINE_MANIFEST.read_text(encoding="utf-8"))


def find_baseline(
    manifest: dict,
    *,
    platform: str | None = None,
    scene_id: str | None = None,
    baseline_id: str | None = None,
) -> dict:
    for entry in manifest.get("baselines", []):
        if baseline_id and entry.get("id") != baseline_id:
            continue
        if platform and entry.get("platform") != platform:
            continue
        if scene_id and entry.get("sceneId") != scene_id:
            continue
        path = ROOT / entry["file"]
        if not path.exists():
            raise FileNotFoundError(f"Baseline file missing: {entry['file']}")
        return {"entry": entry, "run": load_run(path)}
    raise LookupError("No matching baseline in manifest/benchmark_baselines.json")


def trial_pass(metrics: dict) -> bool:
    return metrics["avgFps"] >= 30 and metrics["frameDrops"] < metrics["elapsedMs"] / 100


def compare(web: dict, android: dict) -> str:
    w = web["metrics"]
    a = android["metrics"]
    lines = [
        "# SynStudios Benchmark — Web vs Android APK",
        "",
        "| Metric | Web | Android | Delta | Winner |",
        "|--------|-----|---------|-------|--------|",
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

    lines.extend(
        [
            "",
            f"- Web trial pass: **{'YES' if trial_pass(w) else 'NO'}**",
            f"- Android trial pass: **{'YES' if trial_pass(a) else 'NO'}**",
            f"- Scene: `{web.get('sceneId', '?')}`",
            "",
            "## How to reproduce",
            "",
            "1. Web: `npm run dev` → open http://localhost:3000/benchmark → export JSON",
            "2. APK: install debug APK → open Benchmark → export JSON",
            "3. Compare: `npm run benchmark:compare -- web.json android.json`",
            "4. Baseline: `npm run benchmark:baseline -- android.json`",
        ]
    )
    return "\n".join(lines)


def compare_to_baseline(run: dict, baseline: dict, entry: dict, manifest: dict) -> tuple[str, list[str]]:
    tolerances = manifest.get("tolerances", {})
    avg_ratio = float(tolerances.get("avgFpsMinRatio", 0.85))
    min_ratio = float(tolerances.get("minFpsMinRatio", 0.85))
    drops_delta = int(tolerances.get("maxFrameDropsDelta", 5))
    abs_min_fps = float(tolerances.get("minAbsoluteAvgFps", 30))

    m = run["metrics"]
    b = baseline["metrics"]
    failures: list[str] = []

    min_avg = max(b["avgFps"] * avg_ratio, abs_min_fps)
    min_min = b["minFps"] * min_ratio
    max_drops = b["frameDrops"] + drops_delta

    if m["avgFps"] < min_avg:
        failures.append(f"avgFps {m['avgFps']:.1f} < floor {min_avg:.1f}")
    if m["minFps"] < min_min:
        failures.append(f"minFps {m['minFps']:.1f} < floor {min_min:.1f}")
    if m["frameDrops"] > max_drops:
        failures.append(f"frameDrops {m['frameDrops']} > max {max_drops}")
    if not trial_pass(m):
        failures.append("trial pass gate failed (avgFps < 30 or too many drops)")

    lines = [
        "# SynStudios Benchmark — Run vs Baseline",
        "",
        f"- Baseline: **{entry['id']}** ({entry.get('device', '?')}, v{entry.get('appVersion', '?')})",
        f"- Run platform: `{run.get('platform', '?')}` scene `{run.get('sceneId', '?')}`",
        "",
        "| Metric | Baseline | Run | Delta | Status |",
        "|--------|----------|-----|-------|--------|",
    ]

    def status(delta: float, ok: bool) -> str:
        sign = "+" if delta >= 0 else ""
        return f"{sign}{delta:.1f} | {'OK' if ok else 'REGRESSION'}"

    avg_ok = m["avgFps"] >= min_avg
    min_ok = m["minFps"] >= min_min
    drops_ok = m["frameDrops"] <= max_drops

    lines.append(
        f"| Avg FPS | {b['avgFps']:.1f} | {m['avgFps']:.1f} | {status(m['avgFps'] - b['avgFps'], avg_ok)} |"
    )
    lines.append(
        f"| Min FPS | {b['minFps']:.1f} | {m['minFps']:.1f} | {status(m['minFps'] - b['minFps'], min_ok)} |"
    )
    lines.append(
        f"| Frame drops | {b['frameDrops']} | {m['frameDrops']} | "
        f"{m['frameDrops'] - b['frameDrops']:+d} | {'OK' if drops_ok else 'REGRESSION'} |"
    )
    lines.extend(
        [
            "",
            f"- Trial pass: **{'YES' if trial_pass(m) else 'NO'}**",
            f"- Regression check: **{'PASS' if not failures else 'FAIL'}**",
        ]
    )
    if failures:
        lines.append("")
        lines.append("## Failures")
        for failure in failures:
            lines.append(f"- {failure}")

    return "\n".join(lines), failures


def find_latest(platform: str, directory: Path) -> Path | None:
    matches = sorted(directory.glob(f"synstudios-benchmark-{platform}-*.json"))
    return matches[-1] if matches else None


def list_baselines() -> str:
    manifest = load_manifest()
    lines = ["# SynStudios benchmark baselines", ""]
    for entry in manifest.get("baselines", []):
        lines.append(
            f"- `{entry['id']}` — {entry['platform']} / {entry['sceneId']} "
            f"({entry.get('device', '?')}, v{entry.get('appVersion', '?')})"
        )
    lines.extend(
        [
            "",
            "Manifest: `manifest/benchmark_baselines.json`",
            "Check a run: `npm run benchmark:baseline -- path/to/run.json`",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Compare SynStudios benchmarks")
    parser.add_argument("web", nargs="?", help="Web benchmark JSON path")
    parser.add_argument("android", nargs="?", help="Android benchmark JSON path")
    parser.add_argument("--dir", default=str(DEFAULT_DIR), help="Benchmark directory")
    parser.add_argument("--out", default=str(ROOT / "benchmarks" / "COMPARE_REPORT.md"))
    parser.add_argument(
        "--against-baseline",
        metavar="RUN",
        help="Compare a benchmark JSON run against the checked-in baseline",
    )
    parser.add_argument("--baseline-id", help="Baseline id (default: match platform + scene)")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit 1 if run regresses vs baseline (use with --against-baseline)",
    )
    parser.add_argument("--list-baselines", action="store_true", help="List manifest baselines")
    args = parser.parse_args()

    if args.list_baselines:
        print(list_baselines())
        return 0

    if args.against_baseline:
        run_path = Path(args.against_baseline)
        if not run_path.exists():
            print(f"FAIL: run file not found: {run_path}")
            return 1
        run = load_run(run_path)
        manifest = load_manifest()
        try:
            match = find_baseline(
                manifest,
                baseline_id=args.baseline_id,
                platform=run.get("platform"),
                scene_id=run.get("sceneId"),
            )
        except LookupError as exc:
            print(f"FAIL: {exc}")
            return 1
        report, failures = compare_to_baseline(run, match["run"], match["entry"], manifest)
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(report, encoding="utf-8")
        print(report)
        print(f"\nReport saved: {out}")
        if args.check and failures:
            return 1
        return 0

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
