# Export templates — Godot & Unreal → SynStudios trial.json

Lightweight sidecar files let users preview **timing and layout** without loading full game assets into the app.

---

## trial.json schema (v1)

```json
{
  "version": "1",
  "source": "godot",
  "clipName": "hero_walk",
  "durationMs": 30000,
  "fps": 12,
  "strip": {
    "frameWidth": 32,
    "frameHeight": 48,
    "frameCount": 8,
    "layout": "horizontal"
  },
  "proxyGltf": {
    "bounds": [1.0, 1.8, 0.5],
    "boneCount": 12,
    "meshCount": 4
  },
  "note": "Exported from Godot AnimationPlayer — strip path optional"
}
```

Import in SynStudios: **Reviewer card → Import trial.json**

---

## Godot 4.x (GDScript)

Save as `res://tools/export_trial_json.gd` and run on an `AnimationPlayer` node:

```gdscript
@tool
extends EditorScript

func _run() -> void:
    var player := get_scene().get_node_or_null("AnimationPlayer") as AnimationPlayer
    if player == null:
        push_error("Select a scene with AnimationPlayer")
        return
    var anim := player.get_animation_list()[0]
    var a := player.get_animation(anim)
    var data := {
        "version": "1",
        "source": "godot",
        "clipName": anim,
        "durationMs": int(a.length * 1000),
        "fps": 12,
        "strip": { "frameWidth": 32, "frameHeight": 48, "frameCount": 8, "layout": "horizontal" }
    }
    var path := "user://trial.json"
    var f := FileAccess.open(path, FileAccess.WRITE)
    f.store_string(JSON.stringify(data, "\t"))
    f.close()
    print("Wrote ", path)
```

Compatible with Godot `AnimationLoader` horizontal strips when you also export a small PNG preview.

---

## Unreal Engine 5.8

UE assets (`.uasset`) are not loaded directly. Export instead:

1. **Sequencer** → render 8-frame PNG strip (128px tall) or use Media Framework capture.
2. Export **trial.json** manually or via Python editor utility:

```python
import json
trial = {
    "version": "1",
    "source": "unreal",
    "clipName": "BossIntro",
    "durationMs": 30000,
    "fps": 24,
    "strip": {"frameWidth": 64, "frameHeight": 64, "frameCount": 8, "layout": "horizontal"}
}
with open("trial.json", "w") as f:
    json.dump(trial, f, indent=2)
```

3. Optional: export **glTF** trial mesh (&lt; 12 MB, Draco if &gt;4 MB) — SynStudios streams with texture downscale.

See `docs/UNREAL_VIEWPORT_MAP.md` for viewport tuning parity.

---

## Heavy PNG / atlas (auto proxy)

If a sprite sheet exceeds **8 MB** or **16 MP**, SynStudios automatically builds an **8-frame × 128px proxy strip** in a Web Worker (~1–2 MB decoded). Full file is never kept in memory.

---

## Frontier Syntax

`trial.json` maps to Frontier trial-pack codegen (`store/ASSET_IMPORT_ROADMAP.md` Phase 6).

```bash
python3 scripts/frontier_relay.py append \
  --synstudios-feature "trial.json sidecar import" \
  --frontier-target "TrialPack v1 wasm struct" \
  --insight "Sidecar carries fps/duration/strip dims without binary embed"
```
