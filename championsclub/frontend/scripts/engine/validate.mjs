import fs from "node:fs/promises";
import { loadRig } from "./load-rig.mjs";
import { surfaceContact } from "./surface-contacts.mjs";
import { deadCenters } from "../../src/engine-lab/kinematics.js";

const { rig, manifest } = await loadRig();
const meshes = component => {
  const found = [];
  rig.components.find(c => c.id === component).nodes.forEach(node => node.traverse(n => { if (n.isMesh) found.push(n); }));
  return found;
};
const staticMeshes = [...meshes("EngineBlock"), ...meshes("LowerStructure")];
const pairs = [];
const crankMeshes = meshes("CrankshaftGroup");
for (const target of staticMeshes) pairs.push({ component: "CrankshaftGroup", target, angles: [], firstContact: null });
for (let i = 1; i <= 4; i++) {
  for (const component of [`PistonGroup0${i}`, `ConnectingRod0${i}`]) {
    for (const target of staticMeshes) pairs.push({ component, target, angles: [], firstContact: null });
  }
  for (const target of crankMeshes) {
    pairs.push({ component: `ConnectingRod0${i}`, target, angles: [], firstContact: null });
  }
  for (const target of [...meshes(`ConnectingRod0${i}`), ...meshes("ValveGroups")]) {
    pairs.push({ component: `PistonGroup0${i}`, target, angles: [], firstContact: null });
  }
}
const componentMeshes = new Map(rig.components.map(component => [component.id, meshes(component.id)]));
const contactBetween = (a, b) => surfaceContact(a, b) || surfaceContact(b, a);
let maximumLinkageError = 0;
for (let degree = 0; degree < 360; degree++) {
  rig.evaluate({ engineMechanismProgress: degree / 360 });
  maximumLinkageError = Math.max(maximumLinkageError, rig.linkageError());
  for (const pair of pairs) {
    for (const moving of componentMeshes.get(pair.component)) {
      const contact = contactBetween(moving, pair.target);
      if (contact) {
        pair.angles.push(degree);
        pair.firstContact ??= { degree, point: contact, moving: moving.userData.originalName };
        break;
      }
    }
  }
  if (degree % 60 === 0) console.log(`Checked ${degree} degrees`);
}
function ranges(values) {
  const result = [];
  for (const value of values) {
    const last = result.at(-1);
    if (last && last[1] === value - 1) last[1] = value;
    else result.push([value, value]);
  }
  return result;
}
const contacts = pairs.filter(p => p.angles.length).map(p => ({ component: p.component, target: p.target.userData.originalName, targetParent: p.target.parent.userData.originalName, sampledAngleRanges: ranges(p.angles), firstContact: p.firstContact }));
const result = {
  sourceSha256: manifest.before.sha256,
  maximumLinkageError,
  deadCenters: manifest.measurements.rods.map((_, i) => deadCenters(manifest.measurements, i)),
  sampledDegrees: 360,
  componentMeshPairs: pairs.length,
  contactMethod: "Bidirectional mesh edges against triangles, BVH accelerated, one-degree samples, 0.0001-unit endpoint tolerance. Transverse surface intersections only; not a complete solid collision or continuous sweep certificate.",
  contactScope: "Pistons, rods and crankshaft against block/lower structure; every rod against every crank mesh; pistons against their rods and all valves. Derived pins, containment, coplanar contacts and all-pairs accessory contacts are not certified.",
  contacts,
};
await fs.mkdir(new URL("../../artifacts/engine-lab/", import.meta.url), { recursive: true });
await fs.writeFile(new URL("../../artifacts/engine-lab/mechanical-validation.json", import.meta.url), JSON.stringify(result, null, 2) + "\n");
await fs.writeFile(new URL("../../static/models/engine/engine-validation.json", import.meta.url), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
