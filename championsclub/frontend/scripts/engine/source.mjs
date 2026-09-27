import fs from "node:fs/promises";
import crypto from "node:crypto";
import { Matrix4, Vector3, Quaternion, Matrix3 } from "three";

export async function readEngine(file) {
  const bytes = await fs.readFile(file);
  if (bytes.readUInt32LE(0) !== 0x46546c67) throw new Error("Expected GLB");
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
  const binary = bytes.subarray(28 + bytes.readUInt32LE(12));
  const world = [];
  const parents = [];
  function visit(index, parent = -1) {
    const node = json.nodes[index];
    const local = node.matrix
      ? new Matrix4().fromArray(node.matrix)
      : new Matrix4().compose(new Vector3(...(node.translation || [0, 0, 0])), new Quaternion(...(node.rotation || [0, 0, 0, 1])), new Vector3(...(node.scale || [1, 1, 1])));
    parents[index] = parent;
    world[index] = parent < 0 ? local : world[parent].clone().multiply(local);
    for (const child of node.children || []) visit(child, index);
  }
  for (const root of json.scenes[json.scene || 0].nodes) visit(root);
  function accessor(index) {
    const a = json.accessors[index];
    const view = json.bufferViews[a.bufferView];
    const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const size = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
    const method = { 5126: "readFloatLE", 5125: "readUInt32LE", 5123: "readUInt16LE", 5121: "readUInt8" }[a.componentType];
    return Array.from({ length: a.count }, (_, i) => Array.from({ length: width }, (_, k) => binary[method]((view.byteOffset || 0) + (a.byteOffset || 0) + i * (view.byteStride || width * size) + k * size)));
  }
  function points(meshIndex, worldSpace = false) {
    const nodeIndex = json.nodes.findIndex(n => n.mesh === meshIndex);
    const p = json.meshes[meshIndex].primitives[0];
    const positions = accessor(p.attributes.POSITION);
    const normals = accessor(p.attributes.NORMAL);
    const normalMatrix = new Matrix3().getNormalMatrix(world[nodeIndex]);
    return positions.map((position, i) => ({
      p: worldSpace ? new Vector3(...position).applyMatrix4(world[nodeIndex]).toArray() : position,
      n: worldSpace ? new Vector3(...normals[i]).applyMatrix3(normalMatrix).normalize().toArray() : normals[i],
    }));
  }
  return { json, bytes, binary, accessor, points, world, parents, sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

export function cylinderCandidates(points, axis, minimumRadius = 0.08, maximumRadius = 4) {
  const plane = [0, 1, 2].filter(i => i !== axis);
  const [u, v] = plane;
  const unique = new Map();
  for (const point of points) {
    if (Math.abs(point.n[axis]) > 0.015) continue;
    const key = [point.p[u], point.p[v], point.n[u], point.n[v]].map(n => n.toFixed(4)).join(",");
    unique.set(key, point);
  }
  const samples = [...unique.values()];
  const stride = Math.max(1, Math.floor(samples.length / 1200));
  const buckets = new Map();
  for (let i = 0; i < samples.length; i += stride) {
    for (let j = i + stride; j < samples.length; j += stride) {
      const a = samples[i], b = samples[j];
      const du = a.n[u] - b.n[u], dv = a.n[v] - b.n[v];
      const length = du * du + dv * dv;
      if (length < 0.3) continue;
      const radius = ((a.p[u] - b.p[u]) * du + (a.p[v] - b.p[v]) * dv) / length;
      if (Math.abs(radius) < minimumRadius || Math.abs(radius) > maximumRadius) continue;
      const center = [a.p[u] - radius * a.n[u], a.p[v] - radius * a.n[v]];
      if (Math.hypot(b.p[u] - radius * b.n[u] - center[0], b.p[v] - radius * b.n[v] - center[1]) > 0.002) continue;
      const key = [...center, radius].map(n => n.toFixed(2)).join(",");
      const bucket = buckets.get(key) || { center: [0, 0], radius: 0, count: 0 };
      bucket.center[0] += center[0];
      bucket.center[1] += center[1];
      bucket.radius += radius;
      bucket.count++;
      buckets.set(key, bucket);
    }
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 30).map(b => ({ center: b.center.map(n => n / b.count), radius: b.radius / b.count, votes: b.count }));
}
