import { Color, Vector3 } from "three";
import { loadCar, disposeObject } from "./carModel.js";
import { createStudio } from "./studio.js";
import { createScrollTimeline } from "./scrollTimeline.js";
import { cinematicState, createProgressDamping, segment } from "./cinematicTimeline.js";
import { loadEngineStage } from "./engineStage.js";
import { createOcclusionHandoff } from "./occlusionHandoff.js";

export function createShowcase(root, viewport, onStatus) {
  let studio;
  try { studio = createStudio(viewport); } catch { onStatus("error"); return () => {}; }
  const { renderer, camera, scene, environment, key } = studio;
  const controller = new AbortController();
  const damping = createProgressDamping();
  const target = new Vector3(), position = new Vector3();
  const bright = new Color("#f0f1f2"), dark = new Color("#242a30"), background = new Color();
  const ink = new Color(), darkInk = new Color("#202225"), lightInk = new Color("#dce1e5");
  const stage = root.querySelector(".car-stage");
  const heading = root.querySelector(".car-heading"), detail = root.querySelector(".car-detail"), finale = root.querySelector(".car-finale");
  const watermark = root.querySelector(".car-watermark"), scrollHint = root.querySelector(".car-scroll"), progressLine = root.querySelector(".car-progress > span");
  const chapters = [...root.querySelectorAll("[data-chapter]")];
  const retry = root.querySelector(".car-engine-retry");
  let disposed = false, ready = false, failed = false, visible = true, reduced = false;
  let engine, car, handoff, stopTimeline, frame = 0, lastTime = 0, lastInput = 0, lastChapter = -1;
  let engineLoading = false, engineStarted = 0, engineLoadMilliseconds = 0;
  let current = cinematicState(0);
  const samples = [];
  renderer.info.autoReset = false;
  camera.near = 0.0001;
  camera.far = 250;
  camera.updateProjectionMatrix();
  const timeout = setTimeout(() => { controller.abort(); fail(); }, 60000);
  function fail() {
    if (disposed) return;
    failed = true;
    ready = false;
    stopTimeline?.();
    onStatus("error");
  }
  function invalidate() {
    if (!disposed && !frame) frame = requestAnimationFrame(render);
  }
  function update(progress, reduce = false) {
    const now = performance.now();
    reduced = reduce;
    damping.target(progress, (now - lastInput) / 1000);
    lastInput = now;
    invalidate();
  }
  function render(now) {
    frame = 0;
    if (disposed || !ready || !visible || document.hidden || failed) return;
    const delta = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
    const frameInterval = lastTime ? now - lastTime : 0;
    lastTime = now;
    const start = performance.now();
    current = cinematicState(damping.step(delta, engine ? 1 : 0.46, reduced));
    const p = current.progress;
    root.dataset.scene = current.scene;
    root.dataset.progress = p.toFixed(5);
    background.copy(bright).lerp(dark, current.tone);
    ink.copy(darkInk).lerp(lightInk, current.tone);
    stage.style.background = `radial-gradient(ellipse at 50% 35%, ${background.getStyle()} 0%, ${background.clone().multiplyScalar(0.72).getStyle()} 130%)`;
    root.style.setProperty("--car-ink", ink.getStyle());
    heading.style.opacity = 1 - segment(p, 0.43, 0.49);
    detail.style.opacity = segment(p, 0.612, 0.638) * (1 - segment(p, 0.75, 0.8));
    finale.style.opacity = segment(p, 0.93, 0.98);
    watermark.style.opacity = 1 - segment(p, 0.4, 0.47);
    scrollHint.style.opacity = 1 - segment(p, 0.025, 0.08);
    progressLine.style.transform = `scaleX(${p})`;
    if (lastChapter !== current.chapter) {
      chapters.forEach((button, index) => index === current.chapter ? button.setAttribute("aria-current", "step") : button.removeAttribute("aria-current"));
      lastChapter = current.chapter;
    }
    renderer.info.reset();
    if (current.scene === "car") {
      renderer.toneMappingExposure = 1.05;
      const fit = Math.max(1.18, 1.65 / camera.aspect);
      position.set(Math.sin(current.theta) * current.radius * fit, 1.85, Math.cos(current.theta) * current.radius * fit);
      target.set(0, 0.65, 0);
      position.lerp(handoff.endpoint, current.approach);
      target.lerp(handoff.target, current.approach);
      camera.position.copy(position);
      camera.lookAt(target);
      renderer.render(scene, camera);
    } else {
      renderer.toneMappingExposure = 1.05 + 0.12 * current.reveal;
      engine.evaluate(current, camera);
      renderer.render(engine.scene, camera);
      handoff.render(renderer, camera.aspect, p);
    }
    if (frameInterval > 0 && frameInterval < 100) {
      samples.push({ interval: frameInterval, cpu: performance.now() - start, draws: renderer.info.render.calls, triangles: renderer.info.render.triangles, scene: current.scene });
      if (samples.length > 360) samples.shift();
    }
    if (!damping.settled && (engine || damping.rendered < 0.45999)) invalidate();
  }
  function resize() {
    const width = viewport.clientWidth, height = viewport.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 700 ? 1.25 : 1.5));
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  }
  async function preloadEngine() {
    if (engineLoading || engine || disposed) return;
    engineLoading = true;
    engineStarted = performance.now();
    root.dataset.engine = "loading";
    try {
      const loaded = await loadEngineStage(environment.texture, controller.signal);
      if (disposed) { loaded.dispose(); return; }
      const compileCamera = camera.clone();
      loaded.evaluate(cinematicState(0.64), compileCamera);
      await renderer.compileAsync(loaded.scene, compileCamera);
      if (disposed) { loaded.dispose(); return; }
      engine = loaded;
      engineLoadMilliseconds = performance.now() - engineStarted;
      root.dataset.engine = "ready";
      invalidate();
    } catch (error) {
      if (!disposed) { root.dataset.engine = "error"; root.dataset.engineError = error.message; }
    } finally { engineLoading = false; }
  }
  function contextLost(event) { event.preventDefault(); fail(); }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; lastTime = 0; invalidate(); });
  intersectionObserver.observe(viewport);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", invalidate);
  retry?.addEventListener("click", preloadEngine);
  resize();
  loadCar(controller.signal).then(async loaded => {
    if (disposed || failed) { disposeObject(loaded); return; }
    car = loaded;
    scene.add(car);
    handoff = createOcclusionHandoff(car, studio);
    camera.position.set(6, 2.9, 6);
    camera.lookAt(0, 0.65, 0);
    await renderer.compileAsync(scene, camera);
    if (disposed || failed) return;
    clearTimeout(timeout);
    renderer.shadowMap.needsUpdate = true;
    ready = true;
    stopTimeline = createScrollTimeline(root, update);
    invalidate();
    onStatus("ready");
    preloadEngine();
  }).catch(fail);
  const debug = {
    setProgress: value => update(value, true),
    get state() { return { ...current, raw: damping.raw, engineReady: Boolean(engine) }; },
    get engine() { return engine; },
    get car() { return car; },
    get handoff() { return handoff; },
    camera, renderer,
    resetMetrics() { samples.length = 0; lastTime = 0; },
    stats() {
      const percentile = (key, p) => [...samples].sort((a, b) => a[key] - b[key])[Math.min(samples.length - 1, Math.floor(samples.length * p))]?.[key] ?? 0;
      return { samples: samples.length, medianFrameMilliseconds: percentile("interval", 0.5), p95FrameMilliseconds: percentile("interval", 0.95), medianCpuMilliseconds: percentile("cpu", 0.5), draws: renderer.info.render.calls, triangles: renderer.info.render.triangles, engineLoadMilliseconds, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
    },
  };
  if (import.meta.env.DEV) window.cinematic = debug;
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
    retry?.removeEventListener("click", preloadEngine);
    engine?.dispose();
    disposeObject(scene);
    environment.dispose();
    key.shadow.map?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    if (window.cinematic === debug) delete window.cinematic;
  };
}
