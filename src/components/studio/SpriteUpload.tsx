"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SpriteAnimConfig } from "@/lib/trial-types";

type SpriteUploadProps = {
  config?: SpriteAnimConfig;
  onUpload: (url: string, fileName: string) => void;
};

export function SpriteUpload({ config, onUpload }: SpriteUploadProps) {
  return (
    <div className="space-y-2">
      <Label>2D sprite sheet</Label>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-black/50 px-4 py-6 text-center hover:bg-white/5">
        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Drop horizontal PNG strip · {config?.frameWidth ?? 32}×
          {config?.frameHeight ?? 48} frames
        </span>
        <input
          type="file"
          accept="image/png,image/webp"
          className="hidden"
          aria-label="Upload horizontal PNG sprite strip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            onUpload(URL.createObjectURL(file), file.name);
          }}
        />
      </label>
      <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
        <label className="cursor-pointer">
          Choose PNG strip
          <input
            type="file"
            accept="image/png,image/webp"
            className="hidden"
            aria-label="Choose PNG sprite strip file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              onUpload(URL.createObjectURL(file), file.name);
            }}
          />
        </label>
      </Button>
    </div>
  );
}
