"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Repeat,
  Repeat1,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  LAYOUT_PRESETS,
  SCALE_PRESETS,
  SIZE_PRESETS,
  SPEED_PRESETS,
  applyPreset,
  type SpriteTuning,
} from "@/lib/sprite-tuning";

type SpriteTuningPanelProps = {
  tuning: SpriteTuning;
  frameCount: number;
  onChange: (next: SpriteTuning) => void;
};

function PresetRow({
  title,
  presets,
  tuning,
  onChange,
}: {
  title: string;
  presets: typeof SPEED_PRESETS;
  tuning: SpriteTuning;
  onChange: (next: SpriteTuning) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const active = Object.entries(preset.patch).every(
            ([key, value]) => tuning[key as keyof SpriteTuning] === value,
          );
          return (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="min-h-[48px] flex-col gap-0 px-2 py-1 text-[10px] leading-tight"
              title={`${preset.description} (Aseprite: ${preset.asepriteRef})`}
              aria-label={`${preset.label}: ${preset.description}`}
              onClick={() => onChange(applyPreset(tuning, preset.patch))}
            >
              <span className="font-medium">{preset.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function SpriteTuningPanel({
  tuning,
  frameCount,
  onChange,
}: SpriteTuningPanelProps) {
  const displayFrame =
    tuning.manualFrame ?? 0;

  function stepFrame(delta: number) {
    const next = (displayFrame + delta + frameCount) % frameCount;
    onChange({ ...tuning, manualFrame: next });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">2D sprite tuning</CardTitle>
        <p className="text-xs text-muted-foreground">
          Aseprite-style presets — tap to adjust speed, size, zoom, and sheet layout.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <PresetRow
          title="Speed"
          presets={SPEED_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />
        <PresetRow
          title="Frame size"
          presets={SIZE_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />
        <PresetRow
          title="Zoom"
          presets={SCALE_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />
        <PresetRow
          title="Sheet layout"
          presets={LAYOUT_PRESETS}
          tuning={tuning}
          onChange={onChange}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={tuning.loop ? "default" : "outline"}
            aria-label={tuning.loop ? "Loop on" : "Loop off"}
            onClick={() => onChange({ ...tuning, loop: !tuning.loop })}
          >
            {tuning.loop ? <Repeat className="h-4 w-4" /> : <Repeat1 className="h-4 w-4" />}
            Loop
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tuning.onionSkin ? "default" : "outline"}
            aria-label={tuning.onionSkin ? "Onion skin on" : "Onion skin off"}
            onClick={() => onChange({ ...tuning, onionSkin: !tuning.onionSkin })}
          >
            {tuning.onionSkin ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Onion
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="Previous frame"
            onClick={() => stepFrame(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex min-h-[48px] items-center font-mono text-xs">
            Frame {displayFrame + 1}/{frameCount}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="Next frame"
            onClick={() => stepFrame(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Sheet padding (px)
          </Label>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((pad) => (
              <Button
                key={pad}
                type="button"
                size="sm"
                variant={tuning.sheetPadding === pad ? "default" : "outline"}
                onClick={() => onChange({ ...tuning, sheetPadding: pad })}
              >
                {pad}px
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
