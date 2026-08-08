# Frontier Relay — SynStudios → Frontier Syntax

Every SynStudios session that ships code should log at least one connection to [Frontier Syntax](https://github.com/zowskyy/frontier-syntax).

## Append an entry

```bash
python3 scripts/frontier_relay.py append \
  --synstudios-feature "2D sprite tuning panel" \
  --frontier-target "wasm strip import codegen" \
  --insight "Aseprite preset buttons map to Frontier AnimationLoader metadata" \
  --frontier-file-hint "scripts/tracking.py"
```

## List entries

```bash
python3 scripts/frontier_relay.py list
```

Manifest: `manifest/frontier_relay.json`  
Tracking phase 8 requires relay entries + `scripts/frontier_relay.py`.
