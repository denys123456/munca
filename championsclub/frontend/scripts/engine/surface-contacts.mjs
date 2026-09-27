import { Box3, Matrix4, Ray, Vector3 } from "three";

const cache = new WeakMap();
function build(geometry) {
  if (cache.has(geometry)) return cache.get(geometry);
  const positions = geometry.attributes.position;
  const index = geometry.index;
  const vertices = Array.from({ length: positions.count }, (_, i) => new Vector3().fromBufferAttribute(positions, i));
  const triangles = [];
  const edges = new Map();
  for (let i = 0; i < index.count; i += 3) {
    const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    const points = ids.map(id => vertices[id]);
    const box = new Box3().setFromPoints(points);
    triangles.push({ points, box, center: box.getCenter(new Vector3()) });
    for (let k = 0; k < 3; k++) {
      const a = ids[k], b = ids[(k + 1) % 3];
      edges.set(`${Math.min(a, b)},${Math.max(a, b)}`, [a, b]);
    }
  }
  function split(list) {
    const box = new Box3();
    list.forEach(t => box.union(t.box));
    if (list.length <= 12) return { box, triangles: list };
    const size = box.getSize(new Vector3());
    const axis = size.x > size.y && size.x > size.z ? "x" : size.y > size.z ? "y" : "z";
    list.sort((a, b) => a.center[axis] - b.center[axis]);
    const middle = Math.floor(list.length / 2);
    return { box, left: split(list.slice(0, middle)), right: split(list.slice(middle)) };
  }
  const result = { tree: split(triangles), vertices, edges: [...edges.values()] };
  cache.set(geometry, result);
  return result;
}

export function surfaceContact(moving, target) {
  const a = build(moving.geometry), b = build(target.geometry);
  const transform = new Matrix4().copy(target.matrixWorld).invert().multiply(moving.matrixWorld);
  if (!a.tree.box.clone().applyMatrix4(transform).intersectsBox(b.tree.box)) return null;
  const points = a.vertices.map(p => p.clone().applyMatrix4(transform));
  const ray = new Ray(), hit = new Vector3(), segmentBox = new Box3();
  let segmentLength = 0;
  function visit(tree) {
    if (!segmentBox.intersectsBox(tree.box)) return null;
    if (!tree.triangles) return visit(tree.left) || visit(tree.right);
    for (const triangle of tree.triangles) {
      if (!segmentBox.intersectsBox(triangle.box)) continue;
      const point = ray.intersectTriangle(...triangle.points, false, hit);
      if (point) {
        const distance = ray.origin.distanceTo(point);
        if (distance > 0.0001 && distance < segmentLength - 0.0001) return point.clone().applyMatrix4(target.matrixWorld).toArray();
      }
    }
    return null;
  }
  for (const [i, j] of a.edges) {
    ray.origin.copy(points[i]);
    ray.direction.copy(points[j]).sub(points[i]);
    segmentLength = ray.direction.length();
    if (segmentLength < 0.0002) continue;
    ray.direction.divideScalar(segmentLength);
    segmentBox.setFromPoints([points[i], points[j]]);
    const contact = visit(b.tree);
    if (contact) return contact;
  }
  return null;
}
