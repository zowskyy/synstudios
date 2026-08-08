"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";
import { detectPlatform } from "@/lib/trial-types";

type LifecycleHandlers = {
  onPause?: () => void;
  onResume?: () => void;
};

let lifecycleHandlers: LifecycleHandlers = {};

export function registerLifecycleHandlers(handlers: LifecycleHandlers): () => void {
  lifecycleHandlers = handlers;
  return () => {
    lifecycleHandlers = {};
  };
}

export function CapacitorInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Dark }).catch((error: unknown) => {
      console.error("StatusBar.setStyle failed", error);
    });
    StatusBar.setBackgroundColor({ color: "#000000" }).catch((error: unknown) => {
      console.error("StatusBar.setBackgroundColor failed", error);
    });

    const pauseListener = App.addListener("pause", () => {
      lifecycleHandlers.onPause?.();
    });
    const resumeListener = App.addListener("resume", () => {
      lifecycleHandlers.onResume?.();
    });

    return () => {
      void pauseListener.then((handle) => handle.remove());
      void resumeListener.then((handle) => handle.remove());
    };
  }, []);
  return null;
}

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function getRuntimePlatform(): "web" | "android" {
  return detectPlatform() === "android" ? "android" : "web";
}
