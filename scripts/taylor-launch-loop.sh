#!/usr/bin/env bash
# SynStudios launch loop — Taylor audit → build → package Android bundles.
# Run from repo root: bash scripts/taylor-launch-loop.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./package.json').version")"

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  if [[ -d "$ROOT/.tools/android-sdk" ]]; then
    export ANDROID_HOME="$ROOT/.tools/android-sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
  elif [[ -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
  fi
fi

echo "============================================"
echo " SynStudios Taylor Launch Loop v${VERSION}"
echo "============================================"

echo ""
echo ">>> Step 1/6: Taylor production audit"
python3 scripts/taylor_playstore_team.py --mode production

echo ""
echo ">>> Step 2/6: Independent worker validation"
python3 scripts/independent_validate.py

echo ""
echo ">>> Step 3/6: Release readiness gate"
python3 scripts/release_readiness.py --audit --version "$VERSION"

echo ""
echo ">>> Step 4/6: Tracking phase gate"
python3 scripts/tracking.py gate

echo ""
echo ">>> Step 5/6: Build Android bundles"
bash scripts/build-debug-apk.sh
bash scripts/build-release-aab.sh

echo ""
echo ">>> Step 6/6: Package release artifacts"
bash scripts/package-releases.sh

echo ""
echo "============================================"
echo " LAUNCH READY — Android bundles in dist/"
echo "============================================"
ls -lh dist/
