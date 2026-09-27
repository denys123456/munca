import { Box3, Matrix4, PerspectiveCamera, Raycaster, Scene, Vector3 } from "three";
import { segment } from "./cinematicTimeline.js";

export function createOcclusionHandoff(car, studio) {
  car.updateMatrixWorld(true);
  let surface;
  car.traverse(node => { if (node.isMesh && node.name.startsWith("Ext_Body_Grille_Shadow")) surface = node; });
  if (!surface) throw new Error("The car grille occlusion surface is unavailable");
  const box = new Box3().setFromObject(surface);
  const center = box.getCenter(new Vector3());
  const outside = center.clone();
  outside.z = box.min.z - 2;
  const ray = new Raycaster(outside, new Vector3(0, 0, 1));
  const hit = ray.intersectObject(surface, false)[0];
  if (!hit) throw new Error("The grille does not cover the transition ray");
  const target = hit.point.clone();
  const endpoint = target.clone().add(new Vector3(0, 0, -0.004));
  const scene = new Scene();
  scene.environment = studio.scene.environment;
  scene.environmentIntensity = studio.scene.environmentIntensity;
  for (const node of studio.scene.children) if (node.isLight) { const light = node.clone(); light.castShadow = false; scene.add(light); }
  const patch = surface.clone();
  patch.matrixAutoUpdate = false;
  patch.matrix.copy(surface.matrixWorld);
  patch.castShadow = false;
  scene.add(patch);
  const original = patch.matrix.clone();
  const camera = new PerspectiveCamera(32, 1, 0.0001, 60);
  camera.position.copy(endpoint);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  const axis = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const motion = new Matrix4();
  return {
    endpoint, target, scene, camera, surfaceName: surface.name,
    render(renderer, aspect, progress) {
      if (progress >= 0.608) return;
      if (camera.aspect !== aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
      const t = segment(progress, 0.563, 0.608);
      const travel = t * t * 2.8;
      motion.makeTranslation(axis.x * travel, axis.y * travel, axis.z * travel);
      patch.matrix.copy(motion).multiply(original);
      patch.matrixWorldNeedsUpdate = true;
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(scene, camera);
      renderer.autoClear = true;
    },
  };
}
