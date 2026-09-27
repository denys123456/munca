import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const label = process.argv[2] || "current";
const out = `artifacts/cinematic/${label}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:5173/#/showcase");
  await page.waitForFunction(() => window.cinematic?.state.engineReady);
  await page.waitForTimeout(1400);
  const audit = await page.evaluate(() => {
    const c = window.cinematic,
      r = c.renderer,
      gl = r.getContext();
    const materials = (root) => {
      const m = new Map();
      root.traverse((n) => {
        for (const v of Array.isArray(n.material) ? n.material : [n.material])
          if (v)
            m.set(v.uuid, {
              name: v.name,
              type: v.type,
              color: v.color?.getHexString(),
              metalness: v.metalness,
              roughness: v.roughness,
              emissive: v.emissive?.getHexString(),
              emissiveIntensity: v.emissiveIntensity,
              opacity: v.opacity,
              transparent: v.transparent,
              transmission: v.transmission,
              env: v.envMapIntensity,
              map: v.map?.colorSpace,
            });
      });
      return [...m.values()];
    };
    return {
      dpr: r.getPixelRatio(),
      output: r.outputColorSpace,
      tone: r.toneMapping,
      exposure: r.toneMappingExposure,
      gpuTimer: !!gl.getExtension("EXT_disjoint_timer_query_webgl2"),
      gpu: gl.getParameter(
        gl.getExtension("WEBGL_debug_renderer_info")?.UNMASKED_RENDERER_WEBGL ||
          gl.RENDERER,
      ),
      car: materials(c.car),
      engine: materials(c.engine.scene),
    };
  });
  for (const [name, p] of [
    ["hero", 0],
    ["side", 0.22],
    ["assembled", 0.64],
    ["pistons", 0.7],
    ["exploded", 0.94],
  ]) {
    await page.evaluate((p) => window.cinematic.setProgress(p), p);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/${name}.png` });
  }
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.start");
  const before = await cdp.send("Performance.getMetrics");
  const metrics = await page.evaluate(async () => {
    const c = window.cinematic,
      r = c.renderer;
    const results = [];
    const gl = r.getContext(),
      ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    const pending = [],
      gpu = [];
    const originalRender = r.render;
    r.render = function (...args) {
      while (
        pending.length &&
        gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)
      ) {
        const q = pending.shift();
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT))
          gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
        gl.deleteQuery(q);
      }
      const q = ext ? gl.createQuery() : null;
      if (q) gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      const result = originalRender.apply(this, args);
      if (q) {
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        pending.push(q);
      }
      return result;
    };
    const longTasks = [];
    const observer = new PerformanceObserver((list) =>
      longTasks.push(...list.getEntries().map((e) => e.duration)),
    );
    observer.observe({ type: "longtask" });
    for (const [name, from, to, duration] of [
      ["orbit", 0, 0.44, 2400],
      ["handoff", 0.46, 0.64, 1600],
      ["mechanism", 0.64, 0.715, 1600],
      ["explode", 0.72, 0.96, 1800],
      ["reverse", 0.96, 0, 2400],
      ["rapid", 0, 1, 1600],
    ]) {
      c.setProgress(from);
      await new Promise((r) => setTimeout(r, 100));
      c.resetMetrics();
      gpu.length = 0;
      longTasks.length = 0;
      const interval = [],
        rig = [],
        hardware = [],
        render = [];
      let previous;
      const wraps = [];
      for (const [object, key, samples] of [
        [c.engine.rig, "evaluate", rig],
        [c.engine.hardware, "update", hardware],
        [r, "render", render],
      ]) {
        const original = object[key];
        object[key] = function (...args) {
          const t = performance.now();
          const v = original.apply(this, args);
          samples.push(performance.now() - t);
          return v;
        };
        wraps.push(() => (object[key] = original));
      }
      await new Promise((resolve) => {
        const start = performance.now();
        function tick(now) {
          if (previous) interval.push(now - previous);
          previous = now;
          const t = Math.min(1, (now - start) / duration);
          const p =
            name === "rapid"
              ? Math.floor(t * 10) % 2
                ? 0.7
                : 0.3
              : from + (to - from) * t;
          window.scrollTo(
            0,
            (document.querySelector(".car-showcase").offsetHeight -
              innerHeight) *
              p,
          );
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        }
        requestAnimationFrame(tick);
      });
      wraps.forEach((f) => f());
      const percentile = (a, p) =>
        a.sort((a, b) => a - b)[Math.floor(a.length * p)] ?? null;
      results.push({
        name,
        ...c.stats(),
        gpuMedian: percentile(gpu, 0.5),
        gpuP95: percentile(gpu, 0.95),
        longTasks: longTasks.slice(),
        rafP95: percentile(interval, 0.95),
        rafMax: Math.max(...interval),
        rigP95: percentile(rig, 0.95),
        hardwareP95: percentile(hardware, 0.95),
        renderP95: percentile(render, 0.95),
      });
    }
    observer.disconnect();
    r.render = originalRender;
    pending.forEach((q) => gl.deleteQuery(q));
    return results;
  });
  const after = await cdp.send("Performance.getMetrics");
  const { profile } = await cdp.send("Profiler.stop");
  const durations = Object.fromEntries(
    after.metrics
      .filter((m) =>
        [
          "TaskDuration",
          "ScriptDuration",
          "LayoutDuration",
          "RecalcStyleDuration",
        ].includes(m.name),
      )
      .map((m) => [
        m.name,
        m.value - before.metrics.find((b) => b.name === m.name).value,
      ]),
  );
  await writeFile(`${out}/main-thread.cpuprofile`, JSON.stringify(profile));
  await writeFile(
    `${out}/report.json`,
    JSON.stringify({ audit, metrics, durations, errors }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        label,
        audit: { ...audit, car: undefined, engine: undefined },
        metrics,
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
