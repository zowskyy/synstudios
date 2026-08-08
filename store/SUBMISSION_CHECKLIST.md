# SynStudios — Google Play Submission Checklist

## Pre-submission (Taylor workers)

Run the full Taylor Play Store pipeline:

```powershell
cd synstudios
npm install
python scripts/taylor_playstore_team.py --mode production
```

All 7 workers must PASS before uploading.

## Google Play Console setup

1. Create developer account at [Google Play Console](https://play.google.com/console)
2. Create app → **SynStudios** → default language English
3. Set package name: `com.synstudios.preview`

## Release artifact

Build signed AAB:

```powershell
# 1. Copy keystore template and fill in real values (NEVER commit keystore)
copy android\keystore.properties.example android\keystore.properties

# 2. Generate release keystore (one time)
keytool -genkey -v -keystore android\synstudios-release.jks -alias synstudios -keyalg RSA -keysize 2048 -validity 10000

# 3. Build
npm run android:release
```

Upload `android/app/build/outputs/bundle/release/app-release.aab` to Play Console → Production → Create release.

## Store listing assets

| Asset | Spec |
|-------|------|
| App icon | 512×512 PNG (use `store/icon-512.png`) |
| Feature graphic | 1024×500 PNG |
| Phone screenshots | Min 2, 16:9 or 9:16 |
| Privacy policy URL | Required — host `store/PRIVACY_POLICY.md` |
| Short description | See `PLAY_STORE_LISTING.md` |
| Full description | See `PLAY_STORE_LISTING.md` |

## Play Console forms

- [ ] **App content → Privacy policy** — URL to hosted policy
- [ ] **Data safety** — No data collected (or declare optional name + trial metrics if sync enabled)
- [ ] **Content rating** — IARC questionnaire (Everyone expected)
- [ ] **Target audience** — 18+ or not designed for children
- [ ] **Ads** — No ads
- [ ] **Government apps** — No

## Technical requirements (2026)

- [ ] `targetSdk` 35 (Android 15)
- [ ] 64-bit only (`arm64-v8a`)
- [ ] AAB format (not APK for new apps)
- [ ] Signed with upload key

## Post-upload

- [ ] Internal testing track → install on 3+ devices
- [ ] Closed testing with animators
- [ ] Production rollout (staged 10% → 100%)

Gate review: PASS (Taylor production + signed AAB path documented)
