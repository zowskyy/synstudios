#!/usr/bin/env python3
"""
Frontier relay — log how SynStudios work feeds back into Frontier Syntax.

Every agent session should append at least one entry when actionable work ships.

Usage:
  python3 scripts/frontier_relay.py append \\
    --synstudios-feature "2D sprite tuning panel" \\
    --frontier-target "AnimationLoader strip import" \\
    --insight "Preset buttons map Aseprite fps/size to Godot-compatible SpriteAnimConfig"
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RELAY = ROOT / "manifest" / "frontier_relay.json"
FRONTIER_REPO = "https://github.com/zowskyy/frontier-syntax"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_relay() -> dict:
    if not RELAY.exists():
        return {
            "version": "1.0.0",
            "source_project": "SynStudios",
            "frontier_repo": FRONTIER_REPO,
            "rule": "Every SynStudios feature should note a Frontier Syntax counterpart.",
            "entries": [],
        }
    return json.loads(RELAY.read_text(encoding="utf-8"))


def append_entry(
    synstudios_feature: str,
    frontier_target: str,
    insight: str,
    frontier_file_hint: str = "",
) -> dict:
    data = load_relay()
    entry = {
        "id": f"relay-{len(data['entries']) + 1:04d}",
        "created_at": utc_now(),
        "synstudios_feature": synstudios_feature,
        "frontier_target": frontier_target,
        "insight": insight,
        "frontier_file_hint": frontier_file_hint,
    }
    data["entries"].append(entry)
    RELAY.parent.mkdir(parents=True, exist_ok=True)
    RELAY.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return entry


def main() -> int:
    parser = argparse.ArgumentParser(description="SynStudios → Frontier Syntax relay")
    sub = parser.add_subparsers(dest="command", required=True)

    append_p = sub.add_parser("append", help="Append relay entry")
    append_p.add_argument("--synstudios-feature", required=True)
    append_p.add_argument("--frontier-target", required=True)
    append_p.add_argument("--insight", required=True)
    append_p.add_argument("--frontier-file-hint", default="")

    sub.add_parser("list", help="List relay entries")

    args = parser.parse_args()
    if args.command == "append":
        entry = append_entry(
            args.synstudios_feature,
            args.frontier_target,
            args.insight,
            args.frontier_file_hint,
        )
        print(json.dumps(entry, indent=2))
        return 0
    if args.command == "list":
        print(json.dumps(load_relay(), indent=2))
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
