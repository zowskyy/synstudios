import { registerPlugin } from "@capacitor/core";

export type BenchmarkSaveResult = {
  path: string;
  uri: string;
};

export interface BenchmarkSavePlugin {
  saveJsonToDownloads(options: {
    fileName: string;
    content: string;
  }): Promise<BenchmarkSaveResult>;
}

export const BenchmarkSave = registerPlugin<BenchmarkSavePlugin>("BenchmarkSave");
