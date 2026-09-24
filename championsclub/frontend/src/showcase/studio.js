import {
  ACESFilmicToneMapping,
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  PCFShadowMap,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function createStudio(viewport) {
  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  viewport.appendChild(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 60);
  const room = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new HemisphereLight(0xf2f5ff, 0x747a83, 2));
  const key = new DirectionalLight(0xfffaf2, 3);
  key.position.set(-1, 8, 1);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -4,
    right: 4,
    top: 4,
    bottom: -4,
    near: 0.5,
    far: 20,
  });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 4;
  scene.add(key);
  const fill = new DirectionalLight(0xdde8ff, 1.5);
  fill.position.set(4, 3, -5);
  scene.add(fill);
  const floor = new Mesh(
    new PlaneGeometry(200, 200),
    new ShadowMaterial({ opacity: 0.1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.012;
  floor.receiveShadow = true;
  scene.add(floor);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, "rgba(25, 30, 38, 0.4)");
  gradient.addColorStop(0.6, "rgba(25, 30, 38, 0.16)");
  gradient.addColorStop(1, "rgba(25, 30, 38, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const contact = new Mesh(
    new PlaneGeometry(3.4, 6),
    new MeshBasicMaterial({
      map: new CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -0.006;
  scene.add(contact);
  return { renderer, scene, camera, environment, key };
}
