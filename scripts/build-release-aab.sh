#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f out/index.html ]]; then
  echo "== W2 BuildCore: static export =="
  npm run build:mobile
fi

if [[ ! -f out/index.html ]]; then
  echo "FAIL: out/index.html missing after build:mobile" >&2
  exit 1
fi

echo "== Capacitor sync =="
npx cap sync android

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  if [[ -d "$ROOT/.tools/android-sdk" ]]; then
    export ANDROID_HOME="$ROOT/.tools/android-sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
  elif [[ -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
  fi
fi

if [[ -n "${ANDROID_HOME:-}" ]]; then
  printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
  echo "ANDROID_HOME=$ANDROID_HOME"
else
  echo "FAIL: Android SDK not found. Set ANDROID_HOME or run setup-local-toolchain." >&2
  exit 1
fi

if [[ ! -f android/keystore.properties ]]; then
  echo ""
  echo "WARN: android/keystore.properties not found."
  echo "Copy android/keystore.properties.example and create release keystore first."
  echo "Building unsigned bundle for validation only..."
fi

chmod +x android/gradlew

echo "== bundleRelease (AAB) =="
(cd android && ./gradlew bundleRelease --no-daemon)

AAB="android/app/build/outputs/bundle/release/app-release.aab"
if [[ ! -f "$AAB" ]]; then
  echo "FAIL: AAB not found at $AAB" >&2
  exit 1
fi

mkdir -p dist
cp "$AAB" dist/synstudios-release.aab
echo "PASS: AAB at dist/synstudios-release.aab"
