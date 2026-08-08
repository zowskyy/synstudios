# SynStudios — Cursor Continuation Handoff

**Project path:** `C:\Users\thewi\OneDrive\Desktop\synstudios`  
**Last updated:** 2026-08-07  
**Goal:** Web + Android APK studio for 2D sprite / 3D animation 30s trials, benchmarkable vs web, Play Store ready.

---

## Open this folder in Cursor

```
File → Open Folder → C:\Users\thewi\OneDrive\Desktop\synstudios
```

Or paste this into a new Agent chat in that workspace:

> Continue SynStudios Play Store work. Read `CONTEXT.md` first. Finish Android SDK setup, build `dist/synstudios-debug.apk`, run web vs APK benchmark, then Taylor production pipeline.

---

## What's DONE

| Item | Status |
|------|--------|
| Web studio (Next.js 16) | ✅ Built |
| 2D sprite preview (Godot strip compatible) | ✅ |
| 3D preview (React Three Fiber) | ✅ |
| Split 2D+3D mode | ✅ |
| 30s trial player + FPS metrics | ✅ |
| Benchmark page `/benchmark` | ✅ |
| JSON export for web vs APK compare | ✅ |
| Capacitor Android scaffold | ✅ `android/` with `gradlew.bat` |
| Static mobile export | ✅ `out/index.html` |
| Taylor 7-worker Play Store pipeline | ✅ `scripts/taylor_playstore_team.py` |
| Play Store docs | ✅ `store/` |
| Local JDK 21 | ✅ `.tools/jdk-21/` |

---

## What's BLOCKED (finish these next)

| Item | Status | Fix |
|------|--------|-----|
| Android SDK | ❌ Incomplete | Run toolchain script below |
| Debug APK | ❌ Not built | `npm run android:debug` after SDK |
| Web benchmark JSON | ⏳ Manual | Run `/benchmark` in browser |
| APK benchmark JSON | ⏳ Needs APK | Install APK → `/benchmark` |
| Play Store AAB | ⏳ Needs signing keystore | See `store/SUBMISSION_CHECKLIST.md` |

---

## Quick commands (PowerShell)

```powershell
cd C:\Users\thewi\OneDrive\Desktop\synstudios

# 1. Web dev
npm run dev
# → http://localhost:3000
# → http://localhost:3000/benchmark

# 2. Finish Android SDK (one-time, ~5–15 min download)
powershell -ExecutionPolicy Bypass -File scripts\setup-local-toolchain.ps1

# 3. Build debug APK
npm run android:debug
# Output: dist\synstudios-debug.apk

# 4. Install on device/emulator
$adb = "C:\Users\thewi\OneDrive\Desktop\synstudios\.tools\android-sdk\platform-tools\adb.exe"
& $adb install -r dist\synstudios-debug.apk

# 5. Benchmark compare (after exporting JSON from web + APK)
npm run benchmark:compare

# 6. Taylor Play Store workers (all 7 must PASS)
npm run taylor:playstore
```

---

## Benchmark workflow (web vs APK)

1. **Web:** `npm run dev` → open `/benchmark` → **Run standard benchmark** → JSON auto-downloads  
2. Save to `benchmarks/synstudios-benchmark-web-hero-walk-2d-*.json`
3. **APK:** install `dist/synstudios-debug.apk` → open app → **Benchmark** → run trial → export JSON  
4. Save to `benchmarks/synstudios-benchmark-android-hero-walk-2d-*.json`
5. Compare:

```powershell
python scripts/benchmark-compare.py benchmarks\web.json benchmarks\android.json
```

Report: `benchmarks/COMPARE_REPORT.md`

---

## Taylor workers (7-worker system)

| Worker | Script | Role |
|--------|--------|------|
| W1 GateKeeper | `scripts/workers/w1_brand_audit.py` | No old branding / secrets |
| W2 BuildCore | `scripts/workers/w2_web_build.py` | Static export |
| W3 AuditGuardian | `scripts/workers/w3_playstore_policy.py` | Privacy + manifest |
| W4 SpecParity | `scripts/workers/w4_feature_parity.py` | 2D+3D features |
| W5 BundleSizer | `scripts/workers/w5_android_validate.py` | Export size + Gradle |
| W6 ReleaseOps | `scripts/workers/w6_release_ops.py` | Version manifest |
| W7 LaunchContinuity | `scripts/workers/w7_launch_continuity.py` | Store listing docs |

Orchestrator: `python scripts/taylor_playstore_team.py --mode production`  
Reports: `audit_reports/taylor_playstore_report.md`, `manifest/taylor_playstore_mission.json`

---

## Key files

```
synstudios/
├── src/app/page.tsx              Main studio
├── src/app/benchmark/page.tsx    Standard benchmark (web vs APK)
├── src/components/studio/        2D/3D preview, trial UI
├── src/lib/trial-types.ts        Metrics + JSON export types
├── scripts/build-debug-apk.ps1   APK build
├── scripts/setup-local-toolchain.ps1  JDK + Android SDK bootstrap
├── scripts/benchmark-compare.py  Web vs APK report
├── scripts/taylor_playstore_team.py
├── android/                      Capacitor (com.synstudios.preview)
├── out/                          Static export (bundled in APK)
├── store/                        Privacy policy + Play listing
├── benchmarks/                   Drop JSON exports here
└── dist/                         APK output (after build)
```

---

## Android app details

- **Package:** `com.synstudios.preview`
- **App name:** SynStudios
- **UI:** Black & white
- **Offline:** Core trials work without server; Socket.io sync disabled on native
- **Capacitor config:** `capacitor.config.ts`

---

## Play Store submission (after APK works)

1. Generate release keystore (see `store/SUBMISSION_CHECKLIST.md`)
2. `npm run android:release` → AAB
3. Upload AAB to Google Play Console
4. Host `store/PRIVACY_POLICY.md` at a public URL
5. Complete Data safety + content rating forms

---

## Known issues

- **Android SDK download** may hang if two setup scripts run at once — kill stale PowerShell, delete `%TEMP%\cmdline-tools.zip`, rerun `setup-local-toolchain.ps1`
- **Node.js** must be on PATH (`C:\Program Files\nodejs`) — already installed via winget
- **No system Android Studio** required if using `.tools/android-sdk`
- Delete old `pulsestudio-*.png` from root if still present (brand audit W1 flags them)

---

## Suggested next Agent prompt (copy-paste)

```
Read CONTEXT.md in synstudios. Finish Android SDK in .tools/, build dist/synstudios-debug.apk, verify /benchmark works in web and APK, run benchmark-compare.py, then run taylor:playstore until all 7 workers PASS. Do not stop until APK exists at dist/synstudios-debug.apk.
```

---

## Related project (optional merge later)

`C:\Users\thewi\OneDrive\Desktop\crxcibl3` — Godot 4.7 Android game with AnimationLoader + CutsceneDirector. Could become native trial player alongside this Capacitor web shell.
