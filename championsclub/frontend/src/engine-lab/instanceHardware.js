import { DynamicDrawUsage, InstancedMesh, Matrix4 } from "three";

export function instanceHardware(rig) {
  const batches = [];
  const rootInverse = new Matrix4();
  const matrix = new Matrix4();
  for (const component of rig.components) {
    if (!["static", "cam"].includes(component.kind)) continue;
    const candidates = new Map();
    for (const root of component.nodes) {
      root.traverse(node => {
        if (!node.isMesh || node.matrixWorld.determinant() <= 0) return;
        const key = `${node.geometry.uuid}:${node.material.uuid}`;
        if (!candidates.has(key)) candidates.set(key, []);
        candidates.get(key).push(node);
      });
    }
    for (const members of candidates.values()) {
      if (members.length < 2) continue;
      const mesh = new InstancedMesh(members[0].geometry, members[0].material, members.length);
      mesh.name = `${component.id}Instances${batches.length}`;
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.userData.originalNames = members.map(node => node.userData.originalName);
      const masks = members.map(node => node.layers.mask);
      members.forEach(node => node.layers.disable(0));
      rig.root.add(mesh);
      batches.push({ mesh, members, masks });
    }
  }
  function update() {
    rootInverse.copy(rig.root.matrixWorld).invert();
    for (const batch of batches) {
      let count = 0;
      for (const node of batch.members) {
        let visible = true;
        for (let ancestor = node; ancestor; ancestor = ancestor.parent) visible &&= ancestor.visible;
        if (!visible) continue;
        matrix.multiplyMatrices(rootInverse, node.matrixWorld);
        batch.mesh.setMatrixAt(count++, matrix);
      }
      batch.mesh.count = count;
      batch.mesh.visible = count > 0;
      batch.mesh.instanceMatrix.needsUpdate = true;
      batch.mesh.computeBoundingSphere();
    }
  }
  update();
  return {
    update,
    batches,
    savedDrawCalls: batches.reduce((sum, batch) => sum + batch.members.length - 1, 0),
    dispose() {
      for (const batch of batches) {
        batch.members.forEach((node, i) => { node.layers.mask = batch.masks[i]; });
        batch.mesh.removeFromParent();
        batch.mesh.dispose();
      }
    },
  };
}
