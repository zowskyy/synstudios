/**
 * Lightweight GLB header parse — mesh/bone counts only, no mesh decode.
 */

export type GltfProxyInfo = {
  meshCount: number;
  nodeCount: number;
  boneHint: number;
  bounds: [number, number, number];
};

export async function parseGltfProxy(file: File): Promise<GltfProxyInfo | null> {
  if (!file.name.toLowerCase().endsWith(".glb") && file.type !== "model/gltf-binary") {
    return null;
  }
  const slice = file.slice(0, Math.min(file.size, 512 * 1024));
  const buffer = await slice.arrayBuffer();
  const view = new DataView(buffer);
  if (buffer.byteLength < 20) return null;
  const magic = view.getUint32(0, true);
  if (magic !== 0x46546c67) return null;

  const jsonLen = view.getUint32(12, true);
  const jsonType = view.getUint32(16, true);
  if (jsonType !== 0x4e4f534a) return null;

  const jsonBytes = new Uint8Array(buffer, 20, Math.min(jsonLen, buffer.byteLength - 20));
  const text = new TextDecoder().decode(jsonBytes);
  try {
    const doc = JSON.parse(text) as {
      meshes?: unknown[];
      nodes?: { name?: string }[];
    };
    const meshCount = doc.meshes?.length ?? 0;
    const nodeCount = doc.nodes?.length ?? 0;
    const boneHint = doc.nodes?.filter((n) =>
      /bone|joint|spine|arm|leg/i.test(n.name ?? ""),
    ).length ?? 0;
    const size = 1 + meshCount * 0.3;
    return {
      meshCount,
      nodeCount,
      boneHint,
      bounds: [size, size * 1.8, size * 0.5],
    };
  } catch {
    return null;
  }
}
