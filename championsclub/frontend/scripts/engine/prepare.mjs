import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, weld, simplifyPrimitive, prune, reorder } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
import { Matrix4, Vector3, Quaternion, Euler } from "three";
import { readEngine, cylinderCandidates } from "./source.mjs";

const sourcePath = new URL("../../../../car_engine.glb", import.meta.url);
const output = new URL("../../static/models/engine/", import.meta.url);
const source = await readEngine(sourcePath);
const { json, world, parents } = source;
const primitives = json.meshes.flatMap(m => m.primitives);
const before = {
  bytes: source.bytes.length,
  sha256: source.sha256,
  nodes: json.nodes.length,
  meshes: json.meshes.length,
  primitives: primitives.length,
  triangles: primitives.reduce((sum, p) => sum + json.accessors[p.indices].count / 3, 0),
  vertices: primitives.reduce((sum, p) => sum + json.accessors[p.attributes.POSITION].count, 0),
  materials: json.materials.length,
  textures: (json.textures || []).length,
  animations: (json.animations || []).length,
  skins: (json.skins || []).length,
  morphTargets: primitives.reduce((sum, p) => sum + (p.targets || []).length, 0),
};
if (before.meshes !== 160 || before.triangles !== 1398824) throw new Error("Source changed: review component mapping before preparation");

const origin = index => new Vector3().setFromMatrixPosition(world[index]).toArray();
const shaft = cylinderCandidates(source.points(30, true), 2)[0];
const crankCenter = [...shaft.center, 0];
const blockCurves = cylinderCandidates(source.points(93, true), 1);
const outerArcs = blockCurves.filter(c => Math.abs(c.radius - 1) < 0.003 && c.votes >= 5);
const rows = [];
for (const arc of outerArcs) {
  let row = rows.find(r => Math.abs(r.z - arc.center[1]) < 0.02);
  if (!row) rows.push(row = { z: arc.center[1], arcs: [] });
  row.arcs.push(arc);
}
rows.sort((a, b) => b.z - a.z);
if (rows.length !== 4 || rows.some(r => r.arcs.length !== 2)) throw new Error("Expected four paired cutaway opening arcs");
const boreCenters = rows.map(r => [(r.arcs[0].center[0] + r.arcs[1].center[0]) / 2, 0, (r.arcs[0].center[1] + r.arcs[1].center[1]) / 2]);
const pistonPoints = source.points(72);
const pistonSurface = cylinderCandidates(pistonPoints, 1, 0.95, 1.05)[0];
if (pistonSurface.votes < 1000) throw new Error("Piston travel-axis fit is not sufficiently supported");
const pinFits = cylinderCandidates(pistonPoints.filter(p => Math.abs(p.p[1]) < 0.35), 2, 0.1, 0.4);
const wristY = pinFits[0].center[1];
const pistonCrownY = Math.max(...pistonPoints.map(point => point.p[1]));
const pistons = [140, 143, 149, 152].map((node, i) => {
  const axis = new Vector3(0, 1, 0).transformDirection(world[node]);
  const center = new Vector3().setFromMatrixPosition(world[node]);
  return {
    sourceNode: node,
    originalName: json.nodes[node].name,
    sourceCenter: center.toArray(),
    sourceAxis: axis.toArray(),
    correctedAxis: [0, 1, 0],
    crownNormal: [0, 1, 0],
    tiltCorrectionDegrees: axis.angleTo(new Vector3(0, 1, 0)) * 180 / Math.PI,
    transverseCorrection: [boreCenters[i][0] - center.x, 0, boreCenters[i][2] - center.z],
    wristPinLocal: [0, wristY, 0],
    hingeAxis: [0, 0, 1],
    axisEvidence: pistonSurface,
    wristConfidence: "Approximate: weak circle fit on stylized pin openings; axial center constrained to piston centerline",
  };
});
const rods = [87, 89, 88, 90].map(mesh => {
  const points = source.points(mesh);
  const big = cylinderCandidates(points, 2, 0.4, 0.5)[0];
  const top = Math.max(...points.map(p => p.p[1]));
  const small = cylinderCandidates(points.filter(p => p.p[1] > top - 1.1), 2, 0.12, 0.18)[0];
  if (!small) throw new Error(`Small-end fit failed for rod ${mesh}`);
  const zs = points.map(p => p.p[2]);
  const z = (Math.min(...zs) + Math.max(...zs)) / 2;
  const bigEnd = [...big.center, z];
  const smallEnd = [...small.center, z];
  const node = [165, 169, 167, 171][[87, 89, 88, 90].indexOf(mesh)];
  return { mesh, sourceNode: node, originalName: json.nodes[node].name, originalWorldMatrix: world[node].toArray(), localHingeAxis: [0, 0, 1], bigEnd, smallEnd, length: new Vector3(...bigEnd).distanceTo(new Vector3(...smallEnd)), bigEndRadius: Math.abs(big.radius), smallEndRadius: Math.abs(small.radius), fit: "Surface-normal circle fits; small-end and piston wrist fits are approximate on stylized geometry" };
});
const throws = [[62, 68, 66], [60, 72, 74], [78, 82, 80], [84, 86, 88]].map((nodes, i) => {
  const cap = cylinderCandidates(source.points([31, 35, 38, 42][i], true), 2)[0];
  const dx = cap.center[0] - crankCenter[0], dy = cap.center[1] - crankCenter[1];
  const plateCenters = nodes.slice(0, 2).map(n => {
    const mesh = json.nodes[json.nodes[n].children[0]].mesh;
    const pts = source.points(mesh, true).map(p => p.p[2]);
    return (Math.min(...pts) + Math.max(...pts)) / 2;
  });
  return { nodes, radius: Math.hypot(dx, dy), sourceAngle: Math.atan2(dx, dy), sourceZ: (plateCenters[0] + plateCenters[1]) / 2, phase: [0, Math.PI, Math.PI, 0][i], journalRadius: cap.radius };
});

const components = [];
function add(id, nodes, offset, stage, kind = "static") {
  components.push({ id, nodes, originalNames: nodes.map(n => json.nodes[n].name), offset, stage, kind });
}
add("EngineBlock", [177], [5.5, 1, 0], [0.15, 0.8]);
add("LowerStructure", [173, 185], [0, -4.5, 0], [0.2, 0.9]);
[140, 143, 149, 152].forEach((n, i) => add(`PistonGroup0${i + 1}`, [n], [0, 4, (1.5 - i) * 0.45], [0.4, 1], "piston"));
[165, 169, 167, 171].forEach((n, i) => add(`ConnectingRod0${i + 1}`, [n], [-3.5, 1, (1.5 - i) * 0.45], [0.4, 1], "rod"));
add("CrankshaftGroup", [60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88], [0, -1.8, 0], [0.4, 1], "crank");
add("CamshaftIntakeGroup", [110, 113, 115, 132, 135], [2.2, 5.5, 0], [0.2, 0.85], "cam");
add("CamshaftExhaustGroup", [118, 120, 123, 126, 129], [-2.2, 5.5, 0], [0.2, 0.85], "cam");
add("ValveGroups", Array.from({ length: 16 }, (_, i) => 187 + i * 2), [0, 3.2, 0], [0.25, 0.85]);
add("FlywheelGroup", [287], [0, 0, -4.8], [0, 0.6], "flywheel");
add("GearGroups", [289, 291, 293, 295, 108, 146], [0, 0, 4.5], [0, 0.6]);
add("PulleyGroups", [92, 100, 102, 104], [0, -0.5, 5.5], [0, 0.6]);
add("PipeGroups", [58, 90, ...Array.from({ length: 23 }, (_, i) => 219 + i * 2)], [-4.2, 1.8, 0], [0, 0.65]);
add("TimingChainGroup", [269, 285, 4, 6, 8], [0, 0, 6.5], [0, 0.65]);
const assigned = new Set(components.flatMap(c => c.nodes));
const remaining = json.nodes[3].children.filter(n => !assigned.has(n));
add("AccessoryGroups", remaining, [4.5, 0, 3], [0, 0.7]);
const originalTransforms = json.nodes.map((n, i) => {
  const local = parents[i] < 0 ? world[i].clone() : world[parents[i]].clone().invert().multiply(world[i]);
  if (n.matrix) local.fromArray(n.matrix);
  const position = new Vector3(), quaternion = new Quaternion(), scale = new Vector3();
  local.decompose(position, quaternion, scale);
  return { index: i, name: n.name, parent: parents[i], position: position.toArray(), rotation: new Euler().setFromQuaternion(quaternion).toArray(), quaternion: quaternion.toArray(), scale: scale.toArray(), localMatrix: local.toArray(), worldMatrix: world[i].toArray() };
});
const measurements = {
  coordinateSystem: "Source scene world units; Y is vertical, Z is the shaft axis. Physical metre scale is not established.",
  crankCenter, crankAxis: [0, 0, 1], travelAxis: [0, 1, 0],
  boreCenters, openingArcs: rows, pistonRadius: Math.max(...pistonPoints.map(point => Math.hypot(point.p[0], point.p[2]))),
  pistons, pistonWrist: [0, wristY, 0], pistonCrownY,
  shaftFit: shaft,
  rods, throws,
  camAxes: [cylinderCandidates(source.points(55, true), 2)[0].center, cylinderCandidates(source.points(58, true), 2)[0].center],
  flywheelCenter: origin(287),
  limitations: [
    "The block contains paired open arcs, not sealed cylindrical liners. Centerlines are the midpoints of the paired arcs.",
    "Source throws point upward at different angles. The derived setup rephases them to 0/180/180/0 and relocates their axial positions to the measured opening centers.",
    "Throw radii differ in the source and are retained. This is a coherent offset slider-crank visualization, not a dimensionally certified inline-four engine.",
    "Source journal caps are smaller than the rod eyes. Derived journal sleeves and wrist pins bridge those gaps; source hero surfaces are preserved.",
    "Counterweight planes are straightened perpendicular to the shaft and spaced with a 0.50-unit inner gap for the approximately 0.444-unit rod thickness.",
    "Intake/exhaust cam labels are provisional bank aliases; the source does not identify flow direction.",
    "Valves, springs, chain and camshafts remain static during mechanical playback. Accurate valvetrain timing is not claimed.",
  ],
};
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(fileURLToPath(sourcePath));
doc.getRoot().listNodes().forEach((n, i) => n.setExtras({ ...n.getExtras(), sourceNodeIndex: i, originalName: json.nodes[i].name }));
const meshList = doc.getRoot().listMeshes();
meshList.forEach((m, i) => {
  m.setExtras({ sourceMeshIndex: i });
  for (const p of m.listPrimitives()) p.setAttribute("TEXCOORD_0", null);
});
await doc.transform(weld());
const decisions = [];
for (let i = 0; i < meshList.length; i++) {
  let ratio = 1, error = 0;
  if (i >= 139 && i <= 154) { ratio = 0.16; error = 0.002; }
  else if (i >= 98 && i <= 113) { ratio = 0.28; error = 0.002; }
  else if (i >= 3 && i <= 26) { ratio = 0.2; error = 0.003; }
  const primitive = meshList[i].listPrimitives()[0];
  const input = primitive.getIndices().getCount() / 3;
  if (ratio < 1) {
    const normals = primitive.getAttribute("NORMAL").getArray();
    const simplifier = {
      simplify: (indices, positions, stride, target, tolerance) => MeshoptSimplifier.simplifyWithAttributes(indices, positions, stride, normals, 3, [0.01, 0.01, 0.01], null, target, tolerance, ["Permissive"]),
    };
    simplifyPrimitive(primitive, { simplifier, ratio, error });
  }
  decisions.push({ mesh: i, before: input, after: primitive.getIndices().getCount() / 3, ratio, error });
}
await doc.transform(dedup(), prune({ keepLeaves: true }), reorder({ encoder: MeshoptEncoder, target: "size" }));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await fs.mkdir(output, { recursive: true });
const encoded = await io.writeBinary(doc);
await fs.writeFile(new URL("engine-lab.glb", output), encoded);
const after = { bytes: encoded.byteLength, triangles: decisions.reduce((s, d) => s + d.after, 0), meshDefinitions: doc.getRoot().listMeshes().length, meshInstances: doc.getRoot().listNodes().filter(n => n.getMesh()).length, compression: "Lossless Meshopt encoding, no position quantization", decisions };
const manifest = { version: 2, source: "car_engine.glb", before, after, components, measurements, originalTransforms, asset: "engine-lab.glb" };
await fs.writeFile(new URL("engine-manifest.json", output), JSON.stringify(manifest, null, 2) + "\n");
const check = await readEngine(sourcePath);
if (check.sha256 !== source.sha256) throw new Error("Source hash changed");
console.log(JSON.stringify({ before, after: { ...after, decisions: undefined }, measurements }, null, 2));
