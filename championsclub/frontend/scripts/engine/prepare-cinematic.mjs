import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { Matrix4, Vector3 } from "three";

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const base = new URL("../../static/models/engine/", import.meta.url);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(fileURLToPath(new URL("engine-lab.glb", base)));
const center = [-0.1801303528825897, -6.244226828109037];
const radius = 0.575;
const changes = [];
for (const node of doc.getRoot().listNodes()) {
  if (![174, 178].includes(node.getExtras().sourceNodeIndex)) continue;
  const matrix = new Matrix4().fromArray(node.getWorldMatrix());
  for (const primitive of node.getMesh().listPrimitives()) {
    const positions = primitive.getAttribute("POSITION").getArray();
    const normals = primitive.getAttribute("NORMAL").getArray();
    const indices = primitive.getIndices().getArray();
    const outPositions = [], outNormals = [];
    const point = new Vector3();
    const vertex = index => {
      const local = Array.from(positions.slice(index * 3, index * 3 + 3));
      point.fromArray(local).applyMatrix4(matrix);
      return [...local, ...normals.slice(index * 3, index * 3 + 3), point.x, point.y];
    };
    function emit(polygon) {
      for (let i = 1; i < polygon.length - 1; i++) {
        for (const v of [polygon[0], polygon[i], polygon[i + 1]]) {
          outPositions.push(...v.slice(0, 3));
          outNormals.push(...v.slice(3, 6));
        }
      }
    }
    for (let i = 0; i < indices.length; i += 3) {
      let inside = [vertex(indices[i]), vertex(indices[i + 1]), vertex(indices[i + 2])];
      let separate = false;
      for (let plane = 0; plane < 48; plane++) {
        const angle = plane * Math.PI * 2 / 48;
        if (inside.every(v => Math.cos(angle) * (v[6] - center[0]) + Math.sin(angle) * (v[7] - center[1]) >= radius)) { separate = true; break; }
      }
      if (separate) { emit(inside); continue; }
      for (let plane = 0; plane < 48 && inside.length; plane++) {
        const angle = plane * Math.PI * 2 / 48;
        const nx = Math.cos(angle), ny = Math.sin(angle);
        const distance = v => nx * (v[6] - center[0]) + ny * (v[7] - center[1]) - radius;
        const outer = [], inner = [];
        for (let j = 0; j < inside.length; j++) {
          const a = inside[j], b = inside[(j + 1) % inside.length];
          const da = distance(a), db = distance(b);
          (da >= 0 ? outer : inner).push(a);
          if ((da >= 0) !== (db >= 0)) {
            const t = da / (da - db);
            const crossing = a.map((n, k) => n + (b[k] - n) * t);
            outer.push(crossing);
            inner.push(crossing);
          }
        }
        emit(outer);
        inside = inner;
      }
    }
    const buffer = primitive.getAttribute("POSITION").getBuffer();
    primitive.setAttribute("POSITION", doc.createAccessor().setType("VEC3").setBuffer(buffer).setArray(new Float32Array(outPositions)));
    primitive.setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setBuffer(buffer).setArray(new Float32Array(outNormals)));
    primitive.setIndices(doc.createAccessor().setType("SCALAR").setBuffer(buffer).setArray(Uint32Array.from({ length: outPositions.length / 3 }, (_, i) => i)));
    changes.push({ node: node.getExtras().originalName, before: indices.length / 3, after: outPositions.length / 9 });
  }
}
await doc.transform(weld(), prune({ keepLeaves: true }));
const bytes = await io.writeBinary(doc);
await fs.writeFile(new URL("engine-cinematic.glb", base), bytes);
const report = { radius, center, method: "48-plane cylindrical clearance removed from two derived cutaway casting surfaces; no hero meshes changed. Open cutaway edges, not watertight manufacturing geometry.", mechanismDegrees: [30, 100], changes, bytes: bytes.length };
await fs.writeFile(new URL("cinematic-clearance.json", base), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
