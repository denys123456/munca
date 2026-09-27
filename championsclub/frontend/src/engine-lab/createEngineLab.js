import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createEngineRig } from "./createEngineRig.js";
import { createStudio, polishMaterials } from "./studio.js";
import { clamp } from "./kinematics.js";
import { instanceHardware } from "./instanceHardware.js";

function disposeScene(root) {
  const geometry = new Set(), materials = new Set();
  root.traverse(node => { if (node.isMesh) { geometry.add(node.geometry); materials.add(node.material); } });
  geometry.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
}

export function createEngineLab(host, onStatus) {
  const studio = createStudio(host);
  const abort = new AbortController();
  let disposed = false, rig, hardware, manifest, frame, lastTime, lastPublish = 0, playing = false;
  let state = { engineMechanismProgress: 0.125, explosionProgress: 0, cameraProgress: 0, sourcePose: false };
  let dirty = true;
  const intervals = [], renderTimes = [];
  const start = performance.now();
  let loadMilliseconds = 0;
  const fail = error => { if (!disposed && error.name !== "AbortError") onStatus({ status: "error", message: error.message }); };
  const ready = (async () => {
    const responses = await Promise.all([
      fetch("/models/engine/engine-manifest.json", { signal: abort.signal }),
      fetch("/models/engine/engine-lab.glb", { signal: abort.signal }),
      fetch("/models/engine/engine-validation.json", { signal: abort.signal }),
    ]);
    if (responses.some(response => !response.ok)) throw new Error("The prepared engine asset could not be loaded.");
    const [metadata, buffer, validation] = await Promise.all([responses[0].json(), responses[1].arrayBuffer(), responses[2].json()]);
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, "");
    if (disposed) { disposeScene(gltf.scene); return; }
    manifest = metadata;
    polishMaterials(gltf.scene);
    rig = createEngineRig(gltf.scene, manifest);
    studio.scene.add(rig.root);
    hardware = instanceHardware(rig);
    loadMilliseconds = performance.now() - start;
    dirty = true;
    onStatus({ status: "ready", manifest, validation, loadMilliseconds });
  })().catch(fail);
  function percentile(values, p) {
    if (!values.length) return 0;
    return [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))];
  }
  function stats() {
    const median = percentile(intervals, 0.5);
    const geometry = new Set();
    const arrays = new Set();
    rig?.root.traverse(node => {
      if (node.isMesh) geometry.add(node.geometry);
    });
    geometry.forEach(g => {
      for (const a of Object.values(g.attributes)) arrays.add((a.isInterleavedBufferAttribute ? a.data.array : a.array).buffer);
      if (g.index) arrays.add(g.index.array.buffer);
    });
    return {
      fps: median ? 1000 / median : 0,
      medianFrameMilliseconds: median,
      p95FrameMilliseconds: percentile(intervals, 0.95),
      medianRenderCpuMilliseconds: percentile(renderTimes, 0.5),
      drawCalls: studio.renderer.info.render.calls,
      triangles: studio.renderer.info.render.triangles,
      geometries: studio.renderer.info.memory.geometries,
      geometryBufferBytes: [...arrays].reduce((n, a) => n + a.byteLength, 0),
      loadMilliseconds,
      devicePixelRatio: studio.renderer.getPixelRatio(),
      samples: intervals.length,
      instancedBatches: hardware?.batches.length ?? 0,
      savedDrawCalls: hardware?.savedDrawCalls ?? 0,
    };
  }
  function tick(time) {
    if (disposed) return;
    const interval = lastTime === undefined ? 0 : time - lastTime;
    const delta = Math.min(interval / 1000, 0.1);
    lastTime = time;
    if (rig && !document.hidden) {
      if (playing && !state.sourcePose && state.explosionProgress === 0) {
        state.engineMechanismProgress = (state.engineMechanismProgress + delta / 8) % 1;
        dirty = true;
      }
      const renderStart = performance.now();
      if (dirty) { rig.evaluate(state); hardware.update(); dirty = false; }
      studio.setCamera(state.cameraProgress, state.explosionProgress);
      if (studio.orbit.enabled) studio.orbit.update();
      studio.renderer.render(studio.scene, studio.camera);
      if (delta > 0) {
        intervals.push(interval);
        renderTimes.push(performance.now() - renderStart);
        if (intervals.length > 300) { intervals.shift(); renderTimes.shift(); }
      }
      if (time - lastPublish > 500) {
        lastPublish = time;
        onStatus({ status: "ready", state: { ...state }, playing, stats: stats(), phase: rig.state.state, effectiveAngle: rig.state.angle });
      }
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  function setTimeline(next) {
    for (const name of ["engineMechanismProgress", "explosionProgress", "cameraProgress"]) {
      if (next[name] !== undefined) {
        if (!Number.isFinite(next[name])) throw new Error(`Invalid ${name}`);
        state[name] = clamp(next[name]);
      }
    }
    if (next.sourcePose !== undefined) state.sourcePose = Boolean(next.sourcePose);
    if (state.explosionProgress > 0 || state.sourcePose) playing = false;
    dirty = true;
    if (rig) {
      rig.evaluate(state);
      onStatus({ status: "ready", state: { ...state }, effectiveAngle: rig.state.angle, playing });
    }
    return { ...state };
  }
  return {
    ready, setTimeline, stats,
    get rig() { return rig; },
    get state() { return { ...state }; },
    get renderer() { return studio.renderer; },
    get camera() { return studio.camera; },
    setPlaying(value) { playing = Boolean(value) && !state.sourcePose && state.explosionProgress === 0; if (rig) onStatus({ status: "ready", playing }); },
    setOrbit(value) { studio.orbit.enabled = value; },
    setWireframe(value) { rig?.root.traverse(node => { if (node.isMesh) node.material.wireframe = value; }); },
    setVisibility(id, visible) { rig?.setVisibility(id, visible); hardware?.update(); },
    resetMetrics() { intervals.length = 0; renderTimes.length = 0; lastTime = undefined; },
    inspect(id) {
      const component = rig?.components.find(c => c.id === id);
      if (!component) return null;
      return { id, originalNames: component.originalNames, kind: component.kind, offset: component.offset, nodes: component.nodes.map(node => ({ name: node.userData.originalName, sourceNodeIndex: node.userData.sourceNodeIndex, matrix: node.matrix.toArray(), original: rig.reference.get(node) })) };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      hardware?.dispose();
      if (rig) { rig.dispose(); disposeScene(rig.scene); }
      studio.dispose();
    },
  };
}
