import { Matrix4 } from "three";

export function captureReference(root) {
  root.updateMatrixWorld(true);
  const records = new Map();
  root.traverse(node => {
    const record = {
      position: node.position.toArray(),
      rotation: node.rotation.toArray(),
      quaternion: node.quaternion.toArray(),
      scale: node.scale.toArray(),
      localMatrix: node.matrix.toArray(),
      worldMatrix: node.matrixWorld.toArray(),
      parent: node.parent?.uuid ?? null,
      parentWorldMatrix: node.parent?.matrixWorld.toArray() ?? new Matrix4().toArray(),
      matrixAutoUpdate: node.matrixAutoUpdate,
    };
    Object.values(record).forEach(value => { if (Array.isArray(value)) Object.freeze(value); });
    records.set(node.uuid, Object.freeze(record));
  });
  return { get: node => records.get(node.uuid), entries: () => [...records.entries()] };
}

export function restoreNode(node, reference) {
  node.position.fromArray(reference.position);
  node.rotation.fromArray(reference.rotation);
  node.quaternion.fromArray(reference.quaternion);
  node.scale.fromArray(reference.scale);
  node.matrix.fromArray(reference.localMatrix);
  node.matrixAutoUpdate = false;
  node.matrixWorldNeedsUpdate = true;
}

export function applyLocalMatrix(node, matrix) {
  node.matrix.copy(matrix);
  matrix.decompose(node.position, node.quaternion, node.scale);
  node.matrixAutoUpdate = false;
  node.matrixWorldNeedsUpdate = true;
}
