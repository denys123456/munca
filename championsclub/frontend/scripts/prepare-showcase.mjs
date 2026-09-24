import { mkdir } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  meshopt,
  textureCompress,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const source = process.argv[2];
if (!source) throw new Error("Pass the extracted source GLB path.");
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.encoder": MeshoptEncoder,
  });
const document = await io.read(source);
for (const property of [
  document.getRoot(),
  ...document.getRoot().listNodes(),
  ...document.getRoot().listMeshes(),
]) {
  property.setExtras({});
}
await document.transform(
  dedup(),
  prune(),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    resize: [2048, 2048],
    quality: 92,
  }),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
await mkdir("static/models", { recursive: true });
await io.write("static/models/golf-gti.glb", document);
console.log(
  "Prepared static/models/golf-gti.glb without geometry simplification.",
);
