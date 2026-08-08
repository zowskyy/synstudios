#!/usr/bin/env python3
"""W1 GateKeeper — brand rebrand audit + secret scan."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FORBIDDEN_BRANDS = [
    r"pixel\s*studio",
    r"pulsestudio",
    r"pulse\s*studio",
    r"litellm",
    r"crxcibl3",
    r"nextjs_tailwind_shadcn_ts",
]
SECRET_PATTERNS = [
    r"sk-[a-zA-Z0-9]{20,}",
    r"AKIA[0-9A-Z]{16}",
    r"-----BEGIN (RSA |EC )?PRIVATE KEY-----",
]
SKIP_DIRS = {"node_modules", ".next", "out", "android", ".git", "dist", "build"}
SKIP_FILES = {"bun.lock", "package-lock.json"}
TEXT_EXT = {".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".xml", ".gradle", ".properties", ".html", ".css", ".env", ".prisma", ".svg"}


def iter_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_FILES:
            continue
        if path.suffix.lower() in TEXT_EXT or path.name in {".env", "keystore.properties"}:
            files.append(path)
    return files


def main() -> int:
    brand_hits: list[str] = []
    secret_hits: list[str] = []

    for path in iter_files():
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = path.relative_to(ROOT).as_posix()
        for pattern in FORBIDDEN_BRANDS:
            if re.search(pattern, text, re.IGNORECASE):
                if "w1_brand_audit.py" in rel and "FORBIDDEN_BRANDS" in text:
                    continue
                brand_hits.append(f"{rel}: forbidden brand `{pattern}`")
        for pattern in SECRET_PATTERNS:
            if re.search(pattern, text):
                secret_hits.append(f"{rel}: possible secret")

    if brand_hits:
        print("FAIL: forbidden branding found:")
        for hit in brand_hits[:20]:
            print(f"  - {hit}")
        return 1
    if secret_hits:
        print("FAIL: possible secrets found:")
        for hit in secret_hits:
            print(f"  - {hit}")
        return 1

    print("PASS: SynStudios brand audit — no forbidden names or secrets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
