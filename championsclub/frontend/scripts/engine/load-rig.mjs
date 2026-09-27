import fs from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createEngineRig } from "../../src/engine-lab/createEngineRig.js";

export async function loadRig(asset = "engine-lab.glb") {
  const base = new URL("../../static/models/engine/", import.meta.url);
  const manifest = JSON.parse(await fs.readFile(new URL("engine-manifest.json", base), "utf8"));
  const bytes = await fs.readFile(new URL(asset, base));
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  return { rig: createEngineRig(gltf.scene, manifest), manifest };
}
