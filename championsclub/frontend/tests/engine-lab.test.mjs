import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { Matrix4, Vector3 } from "three";
import { loadRig } from "../scripts/engine/load-rig.mjs";
import { instanceHardware } from "../src/engine-lab/instanceHardware.js";
import { deadCenters, solveCylinder, TAU } from "../src/engine-lab/kinematics.js";

const { rig, manifest } = await loadRig();
const pose = () => [...rig.nodes].map(([id, node]) => [id, ...node.matrix.elements]);

test("source remains byte-identical and every source component is mapped once", async () => {
  const bytes = await fs.readFile(new URL("../../../car_engine.glb", import.meta.url));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), manifest.before.sha256);
  const assignments = manifest.components.flatMap(c => c.nodes);
  assert.equal(new Set(assignments).size, assignments.length);
  assert.equal(assignments.length, 123);
  assert.equal(rig.components.filter(c => c.kind === "piston").length, 4);
  assert.equal(rig.components.filter(c => c.kind === "rod").length, 4);
  assert.equal(rig.nodes.size, 297);
});

test("complete cycle closes every rod linkage and keeps four parallel piston axes", () => {
  for (let degree = 0; degree <= 360; degree++) {
    rig.evaluate({ engineMechanismProgress: degree / 360 });
    assert.ok(rig.linkageError() < 1e-10, `Linkage at ${degree} degrees`);
    for (let i = 0; i < 4; i++) {
      const joint = rig.joints[i];
      assert.ok(Math.abs(new Vector3(...joint.wrist).distanceTo(new Vector3(...joint.journal)) - rig.measurements.rods[i].length) < 1e-12);
      const piston = rig.components.find(c => c.id === `PistonGroup0${i + 1}`).nodes[0];
      const axis = new Vector3(0, 1, 0).transformDirection(piston.matrixWorld);
      assert.ok(axis.distanceTo(new Vector3(0, 1, 0)) < 1e-12);
      assert.ok(Math.abs(joint.wrist[0] - rig.measurements.boreCenters[i][0]) < 1e-12);
      assert.ok(Math.abs(joint.wrist[2] - rig.measurements.boreCenters[i][2]) < 1e-12);
    }
  }
});

test("analytic dead centers are actual height extrema for the offset slider crank", () => {
  for (let i = 0; i < 4; i++) {
    const centers = deadCenters(rig.measurements, i);
    for (let n = 0; n < 1440; n++) {
      const y = solveCylinder(rig.measurements, i, n * TAU / 1440).wrist[1];
      assert.ok(y <= centers.tdcWrist[1] + 1e-10);
      assert.ok(y >= centers.bdcWrist[1] - 1e-10);
    }
  }
});

test("twenty source explosion cycles restore exact local matrices and parents", () => {
  rig.evaluate({ sourcePose: true });
  const baseline = pose();
  for (let cycle = 0; cycle < 20; cycle++) {
    for (const p of [0.1, 0.35, 0.7, 1, 0.8, 0.4, 0.01, 0]) rig.evaluate({ sourcePose: true, explosionProgress: p });
    assert.deepEqual(pose(), baseline);
    assert.deepEqual(rig.restoreError(), { maximumLocalMatrixError: 0, parentChanges: 0 });
  }
});

test("prepared reconstruction is deterministic, reversible and independent of evaluation order", () => {
  const state = { engineMechanismProgress: 0.125, explosionProgress: 0 };
  rig.evaluate(state);
  const baseline = pose();
  for (let i = 0; i < 20; i++) {
    rig.evaluate({ ...state, explosionProgress: 1 });
    rig.evaluate({ ...state, explosionProgress: 0.38 });
    rig.evaluate(state);
    assert.deepEqual(pose(), baseline);
  }
  rig.evaluate({ ...state, explosionProgress: 0.63 });
  const middle = pose();
  rig.evaluate({ engineMechanismProgress: 0.9, explosionProgress: 0.12 });
  rig.evaluate({ ...state, explosionProgress: 0.63 });
  assert.deepEqual(pose(), middle);
});

test("mechanism parks continuously and does not move once parts separate", () => {
  rig.evaluate({ explosionProgress: 0.6, engineMechanismProgress: 0.1 });
  const baseline = pose();
  rig.evaluate({ explosionProgress: 0.6, engineMechanismProgress: 0.9 });
  const next = pose();
  next.forEach((row, i) => row.forEach((n, j) => assert.ok(Math.abs(n - baseline[i][j]) < 1e-12)));
  rig.evaluate({ sourcePose: true, explosionProgress: 0 });
  const source = pose();
  rig.evaluate({ sourcePose: true, explosionProgress: 1e-8 });
  pose().forEach((row, i) => row.forEach((n, j) => assert.ok(Math.abs(n - source[i][j]) < 1e-10)));
});

test("derived asset meets selective budget and preserves all hero triangle counts", () => {
  assert.ok(manifest.after.triangles < 600000);
  assert.ok(manifest.after.bytes < 8 * 1048576);
  for (const decision of manifest.after.decisions) {
    if (decision.ratio === 1) assert.equal(decision.before, decision.after);
  }
});

test("crank parts preserve their relative matrices through the complete cycle", () => {
  rig.evaluate({ engineMechanismProgress: 0 });
  const crank = rig.components.find(c => c.kind === "crank").nodes;
  const relative = () => crank.map(node => crank[0].matrixWorld.clone().invert().multiply(node.matrixWorld));
  const baseline = relative();
  for (let degree = 0; degree <= 360; degree++) {
    rig.evaluate({ engineMechanismProgress: degree / 360 });
    relative().forEach((matrix, index) => matrix.elements.forEach((value, i) => {
      assert.ok(Math.abs(value - baseline[index].elements[i]) < 1e-10);
    }));
  }
});

test("hardware instances follow canonical transforms, visibility and source reconstruction", () => {
  const hardware = instanceHardware(rig);
  assert.ok(hardware.savedDrawCalls > 30);
  for (const sourcePose of [true, false]) {
    for (const explosionProgress of [0, 0.25, 0.7, 1, 0]) {
      rig.evaluate({ sourcePose, explosionProgress });
      hardware.update();
      for (const batch of hardware.batches) {
        assert.equal(batch.mesh.count, batch.members.length);
        batch.members.forEach((member, i) => {
          const instance = new Matrix4();
          batch.mesh.getMatrixAt(i, instance);
          instance.elements.forEach((value, j) => assert.ok(Math.abs(value - member.matrixWorld.elements[j]) < 1e-5));
          assert.equal(member.layers.isEnabled(0), false);
        });
      }
    }
  }
  rig.setVisibility("ValveGroups", false);
  hardware.update();
  assert.ok(hardware.batches.filter(b => b.mesh.name.startsWith("ValveGroups")).every(b => b.mesh.count === 0));
  rig.setVisibility("ValveGroups", true);
  hardware.dispose();
  rig.evaluate({ sourcePose: true });
  assert.deepEqual(rig.restoreError(), { maximumLocalMatrixError: 0, parentChanges: 0 });
  rig.dispose();
});
