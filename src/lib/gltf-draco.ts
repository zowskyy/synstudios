/**
 * Draco decoder — loaded on demand from CDN (not bundled in APK static export).
 */

import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

/** Google-hosted Draco WASM decoders (on-demand, ~200 KB). */
export const DRACO_DECODER_PATH =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

let dracoLoader: DRACOLoader | null = null;

export function configureGltfLoader(loader: GLTFLoader): void {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
  }
  loader.setDRACOLoader(dracoLoader);
}
