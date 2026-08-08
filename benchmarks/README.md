# SynStudios Web vs APK Benchmark

## 1. Web baseline

```powershell
cd synstudios
npm run dev
```

Open http://localhost:3000/benchmark → **Run standard benchmark** → JSON downloads automatically.

Save or move the file to `benchmarks/` (e.g. `synstudios-benchmark-web-hero-walk-2d-*.json`).

## 2. Android APK

```powershell
npm run android:debug
```

Install:

```powershell
adb install -r dist\synstudios-debug.apk
```

Open app → **Benchmark** → run the same 30s trial → export JSON to `benchmarks/`.

## 3. Compare

```powershell
npm run benchmark:compare
# or
python scripts/benchmark-compare.py benchmarks\web.json benchmarks\android.json
```

Report written to `benchmarks/COMPARE_REPORT.md`.

## Metrics compared

| Metric | Better |
|--------|--------|
| Avg FPS | Higher |
| Min FPS | Higher |
| Frame drops | Lower |

Both runs use scene `hero-walk-2d` for 30 seconds with 2D sprite + 3D preview.
