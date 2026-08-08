#!/usr/bin/env bash
# Copy Android release artifacts into dist/ with stable names.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./package.json').version")"
mkdir -p dist

DEBUG_APK="android/app/build/outputs/apk/debug/app-debug.apk"
RELEASE_AAB="android/app/build/outputs/bundle/release/app-release.aab"

if [[ -f "$DEBUG_APK" ]]; then
  cp "$DEBUG_APK" "dist/synstudios-debug.apk"
  echo "Packaged dist/synstudios-debug.apk"
fi

if [[ -f "$RELEASE_AAB" ]]; then
  cp "$RELEASE_AAB" "dist/synstudios-release.aab"
  cp "$RELEASE_AAB" "dist/synstudios-v${VERSION}.aab"
  echo "Packaged dist/synstudios-release.aab"
  echo "Packaged dist/synstudios-v${VERSION}.aab"
fi

ls -lh dist/
