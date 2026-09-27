import { Box3, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { applyLocalMatrix, captureReference, restoreNode } from "./referenceState.js";
import { resolveTimeline, smooth, solveCylinder } from "./kinematics.js";

const translation = (x, y, z) => new Matrix4().makeTranslation(x, y, z);
const rotation = angle => new Matrix4().makeRotationZ(angle);
const pivotRotation = (center, angle) => translation(...center).multiply(rotation(angle)).multiply(translation(...center.map(n => -n)));

export function createEngineRig(scene, manifest) {
  const reference = captureReference(scene);
  const nodes = new Map();
  scene.traverse(node => {
    if (Number.isInteger(node.userData.sourceNodeIndex)) nodes.set(node.userData.sourceNodeIndex, node);
  });
  const engineRoot = new Group();
  engineRoot.name = "EngineRoot";
  engineRoot.add(scene);
  const measurements = manifest.measurements;
  const components = manifest.components.map(definition => ({
    ...definition,
    nodes: definition.nodes.map(index => {
      const node = nodes.get(index);
      if (!node) throw new Error(`Missing source node ${index}`);
      return node;
    }),
    visible: true,
  }));
  const byId = new Map(components.map(c => [c.id, c]));
  const rest = new Map();
  for (const component of components) {
    for (const node of component.nodes) {
      const saved = reference.get(node);
      rest.set(node, {
        world: new Matrix4().fromArray(saved.worldMatrix),
        parentInverse: new Matrix4().fromArray(saved.parentWorldMatrix).invert(),
      });
    }
  }
  const preparedCrank = new Map();
  for (const node of byId.get("CrankshaftGroup").nodes) preparedCrank.set(node, rest.get(node).world.clone());
  measurements.throws.forEach((throwData, i) => {
    for (const [part, index] of throwData.nodes.entries()) {
      const node = nodes.get(index);
      let world = rest.get(node).world.clone();
      if (part < 2) {
        const axis = new Vector3(0, 0, 1).transformDirection(world);
        const correction = new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(axis, new Vector3(0, 0, Math.sign(axis.z))));
        const pivot = [measurements.crankCenter[0], measurements.crankCenter[1], throwData.sourceZ];
        world = translation(...pivot).multiply(correction).multiply(translation(...pivot.map(n => -n))).multiply(world);
        const box = new Box3();
        node.traverse(mesh => {
          if (!mesh.isMesh) return;
          mesh.geometry.computeBoundingBox();
          const relative = rest.get(node).world.clone().invert().multiply(new Matrix4().fromArray(reference.get(mesh).worldMatrix));
          box.union(mesh.geometry.boundingBox.clone().applyMatrix4(world.clone().multiply(relative)));
        });
        const thickness = box.max.z - box.min.z;
        const center = (box.max.z + box.min.z) / 2;
        const side = part === 0 ? 1 : -1;
        const target = throwData.sourceZ + side * (0.25 + thickness / 2);
        world.elements[14] += target - center;
      }
      preparedCrank.set(node, translation(0, 0, measurements.boreCenters[i][2] - throwData.sourceZ)
        .multiply(pivotRotation(measurements.crankCenter, throwData.sourceAngle - throwData.phase))
        .multiply(world));
    }
  });
  const jointMaterial = new MeshStandardMaterial({ color: 0x89939d, metalness: 0.85, roughness: 0.3 });
  const journals = [];
  const wristPins = [];
  measurements.rods.forEach((rod, i) => {
    const journal = new Mesh(new CylinderGeometry(rod.bigEndRadius - 0.003, rod.bigEndRadius - 0.003, 0.48, 40), jointMaterial);
    journal.geometry.rotateX(Math.PI / 2);
    journal.name = `DerivedJournalSleeve0${i + 1}`;
    const wrist = new Mesh(new CylinderGeometry(rod.smallEndRadius - 0.002, rod.smallEndRadius - 0.002, 1.6, 32), jointMaterial);
    wrist.geometry.rotateX(Math.PI / 2);
    wrist.name = `DerivedWristPin0${i + 1}`;
    engineRoot.add(journal, wrist);
    journals.push(journal);
    wristPins.push(wrist);
  });
  let state = resolveTimeline();
  let joints = [];
  function explosionOffset(component, progress) {
    const amount = smooth((progress - component.stage[0]) / (component.stage[1] - component.stage[0]));
    return new Vector3(...component.offset).multiplyScalar(amount);
  }
  function evaluate(input) {
    state = resolveTimeline(input);
    joints = measurements.rods.map((_, i) => solveCylinder(measurements, i, state.angle));
    const crankRotation = pivotRotation(measurements.crankCenter, -state.angle);
    for (const component of components) {
      const offset = explosionOffset(component, state.explosionProgress);
      for (const node of component.nodes) {
        node.visible = component.visible;
        if (state.sourcePose && state.explosionProgress === 0) {
          restoreNode(node, reference.get(node));
          continue;
        }
        let world = rest.get(node).world.clone();
        if (!state.sourcePose) {
          const index = Number(component.id.slice(-2)) - 1;
          if (component.kind === "piston") {
            const wrist = joints[index].wrist;
            world = translation(wrist[0], wrist[1] - measurements.pistonWrist[1], wrist[2]);
          } else if (component.kind === "rod") {
            const rod = measurements.rods[index];
            const localAngle = Math.atan2(rod.smallEnd[1] - rod.bigEnd[1], rod.smallEnd[0] - rod.bigEnd[0]);
            const originalScale = new Vector3().setFromMatrixScale(rest.get(node).world);
            world = translation(...joints[index].journal)
              .multiply(rotation(joints[index].rodAngle - localAngle))
              .multiply(new Matrix4().makeScale(1, 1, originalScale.z))
              .multiply(translation(...rod.bigEnd.map(n => -n)));
          } else if (component.kind === "crank") {
            world = crankRotation.clone().multiply(preparedCrank.get(node));
          } else if (component.kind === "flywheel") {
            world = crankRotation.clone()
              .multiply(translation(measurements.crankCenter[0] - measurements.flywheelCenter[0], measurements.crankCenter[1] - measurements.flywheelCenter[1], 0))
              .multiply(world);
          }
        }
        world.elements[12] += offset.x;
        world.elements[13] += offset.y;
        world.elements[14] += offset.z;
        applyLocalMatrix(node, rest.get(node).parentInverse.clone().multiply(world));
      }
    }
    journals.forEach((journal, i) => {
      journal.visible = !state.sourcePose && byId.get("CrankshaftGroup").visible;
      journal.position.fromArray(joints[i].journal).add(explosionOffset(byId.get("CrankshaftGroup"), state.explosionProgress));
      const wrist = wristPins[i];
      wrist.visible = !state.sourcePose && byId.get(`PistonGroup0${i + 1}`).visible;
      wrist.position.fromArray(joints[i].wrist).add(explosionOffset(byId.get(`PistonGroup0${i + 1}`), state.explosionProgress));
    });
    engineRoot.updateMatrixWorld(true);
    return state;
  }
  function restoreError() {
    let error = 0, parentChanges = 0;
    scene.traverse(node => {
      const saved = reference.get(node);
      if (node !== scene && node.parent?.uuid !== saved.parent) parentChanges++;
      node.matrix.elements.forEach((n, i) => { error = Math.max(error, Math.abs(n - saved.localMatrix[i])); });
    });
    return { maximumLocalMatrixError: error, parentChanges };
  }
  function linkageError() {
    let error = 0;
    measurements.rods.forEach((rod, i) => {
      const node = byId.get(`ConnectingRod0${i + 1}`).nodes[0];
      const world = rest.get(node).parentInverse.clone().invert().multiply(node.matrix);
      const big = new Vector3(...rod.bigEnd).applyMatrix4(world);
      const small = new Vector3(...rod.smallEnd).applyMatrix4(world);
      error = Math.max(error, big.distanceTo(new Vector3(...joints[i].journal)), small.distanceTo(new Vector3(...joints[i].wrist)));
    });
    return error;
  }
  function setVisibility(id, visible) {
    const component = byId.get(id);
    if (!component) throw new Error(`Unknown component ${id}`);
    component.visible = visible;
    evaluate(state);
  }
  evaluate(state);
  const preparedReference = captureReference(scene);
  return {
    root: engineRoot, scene, reference, preparedReference, nodes, components, measurements,
    evaluate, restoreError, linkageError, setVisibility,
    get state() { return state; },
    get joints() { return joints; },
    dispose() {
      journals.forEach(mesh => mesh.geometry.dispose());
      wristPins.forEach(mesh => mesh.geometry.dispose());
      jointMaterial.dispose();
    },
  };
}
