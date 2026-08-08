# Unreal Engine 5.8 → SynStudios 3D Viewport Map

Adapted from [UE 5.8 documentation](https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-8-documentation) for our React Three Fiber / Capacitor environment.

| Unreal Engine concept | SynStudios control | Notes |
|----------------------|-------------------|-------|
| **Lit Mode / Unlit / Wireframe** view modes | View mode buttons (Lit, Unlit, Wire) | `meshStandardMaterial` vs `meshBasicMaterial` vs wireframe |
| **Cinematic Viewport** safe area + rule of thirds | Safe / ⅓ toggles | CSS overlays on preview — no post-process stack |
| **Sequencer playback rate** | ¼× · ½× · 1× · 2× | Scales rig animation time, not wall-clock trial duration |
| **Cine Camera FOV** | Wide 60° · 45° · Tele 30° | `PerspectiveCamera` fov prop |
| **Alt+LMB orbit / camera cuts** | Orbit · Front · Side · Cine presets | Camera position presets + OrbitControls |
| **Toggle Auto Exposure** | Auto vs Fixed exposure | Ambient + key light intensity lock |
| **Show grid** | Grid toggle | `gridHelper` visibility |
| **Animation Mode — show bones** | Wire mode + Show bones | Wireframe rig meshes |
| **Level viewport auto-rotate** | Orbit toggle | `OrbitControls.autoRotate` |

## Not applicable in SynStudios (web shell)

- Control Rig / Sequencer tracks / Camera Cut tracks (no UE editor)
- Lightmap density, Lumen, Nanite debug views
- WASD fly navigation (touch orbit only on mobile)
- Full post-process exposure eye adaptation (approximated with fixed/auto light levels)

## Frontier Syntax relay

UE viewport preset structs map to Frontier code-gen targets for trial scene metadata (`SceneTuning` JSON export in future worker W10).
