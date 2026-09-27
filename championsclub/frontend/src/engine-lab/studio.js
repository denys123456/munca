import { ACESFilmicToneMapping, Color, DirectionalLight, HemisphereLight, PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { smooth } from "./kinematics.js";

export const cameraViews = [
  { name: "Assembled study", position: [19, 7.7, 21.4], target: [0.6, -2.8, -4] },
  { name: "Cylinder approach", position: [16, 6, 14], target: [0.6, -1.5, -3.8] },
  { name: "Piston & rod", position: [16, 0, 10], target: [0.4, -2.7, -3.8] },
  { name: "Crankshaft", position: [15, -2.8, 10], target: [0, -5.5, -4] },
  { name: "Exploded study", position: [32, 16, 36], target: [0.5, -1.5, -3] },
];

export function createStudio(host) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, host.clientWidth < 700 ? 1.25 : 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-label", "Interactive cutaway engine");
  host.appendChild(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.05, 250);
  const room = new RoomEnvironment();
  const generator = new PMREMGenerator(renderer);
  const environment = generator.fromScene(room, 0.06);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  room.dispose();
  generator.dispose();
  scene.add(new HemisphereLight(0xf6f8ff, 0x383d45, 1.5));
  for (const [color, intensity, position] of [[0xffffff, 3.6, [8, 18, 14]], [0xe4eeff, 3, [-12, 4, -14]], [0xfff6e8, 1.4, [14, -3, -2]]]) {
    const light = new DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
  }
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enabled = false;
  orbit.enableDamping = true;
  orbit.minDistance = 10;
  orbit.maxDistance = 100;
  orbit.enablePan = false;
  let width = 1, height = 1;
  function resize() {
    const bounds = host.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  function setCamera(progress, explosion) {
    if (orbit.enabled) return;
    const step = progress * (cameraViews.length - 1);
    const index = Math.min(cameraViews.length - 2, Math.floor(step));
    const t = smooth(step - index);
    const a = cameraViews[index], b = cameraViews[index + 1];
    const target = new Vector3(...a.target).lerp(new Vector3(...b.target), t);
    const position = new Vector3(...a.position).lerp(new Vector3(...b.position), t);
    const expansion = smooth(explosion);
    target.lerp(new Vector3(...cameraViews[4].target), expansion);
    position.lerp(new Vector3(...cameraViews[4].position), expansion);
    const direction = position.clone().sub(target);
    const portrait = Math.max(1, 0.95 / camera.aspect);
    camera.position.copy(target).add(direction.multiplyScalar(portrait));
    camera.lookAt(target);
    orbit.target.copy(target);
  }
  return {
    renderer, scene, camera, orbit, setCamera,
    dispose() {
      observer.disconnect();
      orbit.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export function polishMaterials(root) {
  const palette = {
    material_0: [0x9ba2a8, 0.72, 0.38],
    "Material.004": [0x555e67, 0.82, 0.37],
    "Material.001": [0xbac0c6, 0.88, 0.25],
    Material: [0x4b525a, 0.72, 0.4],
    "Material.003": [0x89949d, 0.86, 0.3],
    "Material.008": [0x20252a, 0.05, 0.72],
    Frame: [0x424a52, 0.68, 0.48],
    "Material.002": [0x22282e, 0.12, 0.62],
    "Material.005": [0x8c8067, 0.75, 0.4],
    "Material.006": [0x66574c, 0.8, 0.42],
  };
  const materials = new Set();
  root.traverse(node => {
    if (!node.isMesh) return;
    materials.add(node.material);
    const values = palette[node.material.name];
    if (values) {
      node.material.color.copy(new Color(values[0]));
      node.material.metalness = values[1];
      node.material.roughness = values[2];
    }
    node.material.envMapIntensity = 1;
  });
  return materials;
}
