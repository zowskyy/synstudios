"use client";

import {
  Camera,
  Clapperboard,
  Eye,
  Grid3x3,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  CAMERA_PRESETS,
  EXPOSURE_PRESETS,
  FOV_PRESETS,
  PLAYBACK_PRESETS,
  VIEWPORT_MODE_PRESETS,
  applyScenePreset,
  type SceneTuning,
} from "@/lib/scene-tuning";

type SceneTuningPanelProps = {
  tuning: SceneTuning;
  onChange: (next: SceneTuning) => void;
};

function PresetRow({
  title,
  icon,
  presets,
  tuning,
  onChange,
}: {
  title: string;
  icon: React.ReactNode;
  presets: typeof VIEWPORT_MODE_PRESETS;
  tuning: SceneTuning;
  onChange: (next: SceneTuning) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const active = Object.entries(preset.patch).every(
            ([key, value]) => tuning[key as keyof SceneTuning] === value,
          );
          return (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="min-h-[48px] px-2.5 text-[10px]"
              title={`${preset.description} (UE: ${preset.unrealRef})`}
              aria-label={`${preset.label}: ${preset.description}`}
              onClick={() => onChange(applyScenePreset(tuning, preset.patch))}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function SceneTuningPanel({ tuning, onChange }: SceneTuningPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">3D viewport tuning</CardTitle>
        <p className="text-xs text-muted-foreground">
          Unreal-style view modes, camera, sequencer playback, and cinematic guides.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <PresetRow
          title="View mode"
          icon={<Eye className="h-3 w-3" />}
          presets={VIEWPORT_MODE_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />
        <PresetRow
          title="Camera"
          icon={<Camera className="h-3 w-3" />}
          presets={CAMERA_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />
        <PresetRow
          title="Sequencer speed"
          icon={<Clapperboard className="h-3 w-3" />}
          presets={PLAYBACK_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />
        <PresetRow
          title="FOV"
          icon={<Camera className="h-3 w-3" />}
          presets={FOV_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />
        <PresetRow
          title="Exposure"
          icon={<Sun className="h-3 w-3" />}
          presets={EXPOSURE_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={tuning.showGrid ? "default" : "outline"}
            aria-label="Toggle grid"
            onClick={() => onChange({ ...tuning, showGrid: !tuning.showGrid })}
          >
            <Grid3x3 className="h-4 w-4" />
            Grid
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tuning.showThirds ? "default" : "outline"}
            aria-label="Toggle rule of thirds"
            onClick={() => onChange({ ...tuning, showThirds: !tuning.showThirds })}
          >
            ⅓
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tuning.showSafeArea ? "default" : "outline"}
            aria-label="Toggle safe area"
            onClick={() => onChange({ ...tuning, showSafeArea: !tuning.showSafeArea })}
          >
            Safe
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tuning.autoRotate ? "default" : "outline"}
            aria-label="Toggle auto orbit"
            onClick={() => onChange({ ...tuning, autoRotate: !tuning.autoRotate })}
          >
            Orbit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
