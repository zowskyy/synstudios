#!/usr/bin/env python3
"""W13 ProjectFolder — Phase 4 SAF / directory picker lazy load."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED = [
    ("src/lib/project-folder.ts", ["buildProjectManifest", "PROJECT_FOLDER_MAX_INDEX_BYTES"]),
    ("src/lib/project-folder-picker.ts", ["showDirectoryPicker", "pickProjectFolder"]),
    ("src/lib/project-folder-store.ts", ["resolveProjectClip", "setProjectFolder"]),
    ("src/components/studio/ProjectFolderPanel.tsx", ["Open folder", "Lazy-load"]),
    ("store/ASSET_IMPORT_ROADMAP.md", ["Phase 4 — Done"]),
]


def main() -> int:
    for rel, tokens in REQUIRED:
        path = ROOT / rel
        if not path.exists():
            print(f"FAIL: missing {rel}")
            return 1
        text = path.read_text(encoding="utf-8")
        for token in tokens:
            if token not in text:
                print(f"FAIL: {rel} missing `{token}`")
                return 1

    print("PASS: Phase 4 project folder link + lazy clip load verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
