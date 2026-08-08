# SynStudios

**2D sprite and 3D animation trial studio** — preview scenes in capped 30-second runs before committing to full production. Available as a **web app** and **Google Play Android app**.

Black-and-white UI. Compatible with Godot `AnimationLoader` horizontal strip conventions and React Three Fiber 3D rigs.

## Features

- **2D sprite preview** — horizontal strip playback, pixel-perfect canvas, PNG upload
- **3D rig preview** — React Three Fiber with orbit camera
- **Split mode** — composite 2D + 3D cutscene trials
- **30s trial player** — FPS metrics and pass/fail gate
- **Android app** — Capacitor shell for Google Play submission

## Quick start (web)

```bash
cd synstudios
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Google Play / Android

### Taylor Play Store workers

Seven-worker pipeline (adapted from Taylor Ops Team):

| Worker | Role |
|--------|------|
| W1 GateKeeper | Brand + secrets audit |
| W2 BuildCore | Next.js static export |
| W3 AuditGuardian | Play Store policy checklist |
| W4 SpecParity | 2D/3D feature verification |
| W5 BundleSizer | Export size + Android config |
| W6 ReleaseOps | Signing + version manifest |
| W7 LaunchContinuity | Store listing docs |

```powershell
npm install
python scripts/taylor_playstore_team.py --mode production
```

### Build release AAB

```powershell
# One-time: create signing keystore
keytool -genkey -v -keystore android/synstudios-release.jks -alias synstudios -keyalg RSA -keysize 2048 -validity 10000
copy android\keystore.properties.example android\keystore.properties
# Edit keystore.properties with your passwords

npm run android:release
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` to Google Play Console.

See **`store/SUBMISSION_CHECKLIST.md`** for full Play Store submission steps.

## Project structure

```
src/app/                 Next.js app
src/components/studio/   2D/3D preview + trial UI
scripts/workers/         Taylor W1–W7 workers
scripts/taylor_playstore_team.py
android/                 Capacitor Android project
store/                   Privacy policy + Play listing
manifest/release.json    Version manifest (W6)
```

## Sprite sheet convention

Matches Godot `AnimationLoader`:

- Horizontal strip PNG
- Fixed frame width × height per frame
- `fps` and `loop` flags

## Rebrand

All product naming uses **SynStudios**. Former Pulse Studio references removed from shipped UI.
