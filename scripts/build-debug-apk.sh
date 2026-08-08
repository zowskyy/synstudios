#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f out/index.html ]]; then
  echo "== Static export =="
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
  echo "FAIL: Android SDK not found. Set ANDROID_HOME or run CI workflow." >&2
  exit 1
fi

chmod +x android/gradlew

echo "== assembleDebug (APK) =="
(cd android && ./gradlew assembleDebug --no-daemon)

APK="android/app/build/outputs/apk/debug/app-debug.apk"
if [[ ! -f "$APK" ]]; then
  echo "FAIL: APK not found at $APK" >&2
  exit 1
fi

mkdir -p dist
cp "$APK" dist/synstudios-debug.apk
echo "PASS: APK at dist/synstudios-debug.apk"
