import { Box3, Group, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

export async function loadCar(signal) {
  const response = await fetch(
    `${import.meta.env.BASE_URL}models/golf-gti.glb`,
    { signal },
  );
  if (!response.ok) throw new Error(`Model request failed: ${response.status}`);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const { scene } = await loader.parseAsync(await response.arrayBuffer(), "");
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const scale = 4.5 / Math.max(size.x, size.z);
  scene.scale.setScalar(scale);
  scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  const car = new Group();
  car.name = "Golf GTI studio model";
  car.add(scene);
  car.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = false;
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const material of materials) {
      material.envMapIntensity = 1.1;
      if (material.name.startsWith("Rojo Kings")) {
        material.color.set("#b7bec7");
        material.metalness = 0.82;
        material.roughness = 0.27;
        material.clearcoat = 1;
        material.clearcoatRoughness = 0.18;
      }
    }
  });
  return car;
}

export function disposeObject(root) {
  const resources = new Set();
  root.traverse((node) => {
    if (node.geometry) resources.add(node.geometry);
    const materials = Array.isArray(node.material)
      ? node.material
      : [node.material];
    for (const material of materials.filter(Boolean)) {
      resources.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) resources.add(value);
      }
    }
  });
  for (const resource of resources) {
    resource.dispose();
    if (resource.isTexture) resource.source?.data?.close?.();
  }
}
