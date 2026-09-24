import { Vector3 } from "three";
import { loadCar, disposeObject } from "./carModel.js";
import { createStudio } from "./studio.js";
import { createScrollTimeline } from "./scrollTimeline.js";

export function createShowcase(root, viewport, onStatus) {
  let studio;
  try {
    studio = createStudio(viewport);
  } catch {
    onStatus("error");
    return () => {};
  }
  const { renderer, camera, scene, environment, key } = studio;
  const controller = new AbortController();
  const shot = {
    theta: 2.35,
    radius: 6.2,
    height: 1.85,
    targetY: 0.65,
    targetZ: 0,
  };
  const target = new Vector3();
  let disposed = false;
  let ready = false;
  let frame = 0;
  let lastFrame = -Infinity;
  let stopTimeline;
  let visible = true;
  let failed = false;
  const timeout = window.setTimeout(() => {
    controller.abort();
    fail();
  }, 60000);

  function render(now = performance.now()) {
    frame = 0;
    if (disposed || !ready || !visible || document.hidden || failed) return;
    if (now - lastFrame < 1000 / 60 - 0.5) {
      invalidate();
      return;
    }
    lastFrame = now;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const aspect = width / height;
    const portrait = aspect < 1.1;
    const fit = Math.max(1, 1.65 / aspect);
    camera.position.set(
      Math.sin(shot.theta) * shot.radius * fit,
      shot.height * (portrait ? 1.25 : 1),
      Math.cos(shot.theta) * shot.radius * fit + shot.targetZ,
    );
    target.set(0, shot.targetY, shot.targetZ);
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  function invalidate() {
    if (!disposed && !frame) frame = requestAnimationFrame(render);
  }
  function resize() {
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    invalidate();
  }
  function fail() {
    if (disposed) return;
    failed = true;
    ready = false;
    stopTimeline?.();
    onStatus("error");
  }
  function contextLost(event) {
    event.preventDefault();
    fail();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    invalidate();
  });
  intersectionObserver.observe(viewport);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", invalidate);
  resize();

  loadCar(controller.signal)
    .then(async (car) => {
      if (disposed || failed) {
        disposeObject(car);
        return;
      }
      scene.add(car);
      camera.position.set(6, 2.9, 6);
      camera.lookAt(0, 0.65, 0);
      await renderer.compileAsync(scene, camera);
      if (disposed || failed) return;
      clearTimeout(timeout);
      renderer.shadowMap.needsUpdate = true;
      ready = true;
      stopTimeline = createScrollTimeline(root, shot, invalidate);
      render();
      onStatus("ready");
    })
    .catch(fail);

  return () => {
    disposed = true;
    controller.abort();
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    stopTimeline?.();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", invalidate);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    disposeObject(scene);
    environment.dispose();
    key.shadow.map?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
