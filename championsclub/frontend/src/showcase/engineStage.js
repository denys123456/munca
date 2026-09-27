import { DirectionalLight, HemisphereLight, Scene, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createEngineRig } from "../engine-lab/createEngineRig.js";
import { instanceHardware } from "../engine-lab/instanceHardware.js";
import { cameraViews, polishMaterials } from "../engine-lab/studio.js";
import { disposeObject } from "./carModel.js";

export async function loadEngineStage(environment, signal) {
  const base = `${import.meta.env.BASE_URL}models/engine/`;
  const responses = await Promise.all([fetch(`${base}engine-cinematic.glb`, { signal }), fetch(`${base}engine-manifest.json`, { signal })]);
  if (responses.some(response => !response.ok)) throw new Error("Engine preparation could not be loaded");
  const [bytes, manifest] = await Promise.all([responses[0].arrayBuffer(), responses[1].json()]);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, "");
  if (signal.aborted) { disposeObject(gltf.scene); throw new DOMException("Aborted", "AbortError"); }
  polishMaterials(gltf.scene);
  const rig = createEngineRig(gltf.scene, manifest);
  const hardware = instanceHardware(rig);
  const scene = new Scene();
  scene.environment = environment;
  scene.environmentIntensity = 0.85;
  scene.add(rig.root, new HemisphereLight(0xf6f8ff, 0x383d45, 1.5));
  for (const [intensity, position] of [[3.6, [8, 18, 14]], [3, [-12, 4, -14]], [1.4, [14, -3, -2]]]) {
    const light = new DirectionalLight(0xf1f3f5, intensity);
    light.position.set(...position);
    scene.add(light);
  }
  const position = new Vector3(), target = new Vector3(), direction = new Vector3();
  const views = cameraViews.map(view => ({ position: new Vector3(...view.position), target: new Vector3(...view.target) }));
  return {
    scene, rig, hardware,
    evaluate(state, camera) {
      rig.evaluate(state);
      hardware.update();
      const t = state.cameraProgress;
      const a = t < 0.45 ? views[0] : views[2];
      const b = t < 0.45 ? views[2] : views[4];
      const amount = t < 0.45 ? t / 0.45 : (t - 0.45) / 0.55;
      position.copy(a.position).lerp(b.position, amount);
      target.copy(a.target).lerp(b.target, amount);
      direction.copy(position).sub(target).multiplyScalar(Math.max(1, 1 / camera.aspect));
      direction.multiplyScalar(1 + 0.07 * (1 - state.reveal));
      camera.position.copy(target).add(direction);
      camera.lookAt(target);
    },
    dispose() { hardware.dispose(); rig.dispose(); disposeObject(rig.scene); },
  };
}
