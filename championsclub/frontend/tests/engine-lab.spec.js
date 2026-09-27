import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("engine controls, reconstruction, performance and responsive framing", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/#/engine-lab");
  await expect(page.locator(".engine-lab")).toHaveAttribute("data-status", "ready");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  const initial = await page.evaluate(() => window.engineLab.state.engineMechanismProgress);
  await expect.poll(() => page.evaluate(() => window.engineLab.state.engineMechanismProgress)).not.toBe(initial);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("slider", { name: "Crank angle" }).fill("0.25");
  expect(await page.evaluate(() => window.engineLab.state.engineMechanismProgress)).toBe(0.25);
  await page.getByRole("slider", { name: "Explosion progress" }).fill("1");
  await expect(page.getByRole("slider", { name: "Crank angle" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeDisabled();
  await page.getByRole("slider", { name: "Explosion progress" }).fill("0");
  await page.getByRole("button", { name: "Inspect +", exact: true }).click();
  await page.getByLabel("Original source pose").check();
  const reconstruction = await page.evaluate(() => {
    for (let i = 0; i < 10; i++) {
      window.engineLab.setTimeline({ explosionProgress: 1 });
      window.engineLab.setTimeline({ explosionProgress: 0 });
    }
    return window.engineLab.rig.restoreError();
  });
  expect(reconstruction).toEqual({ maximumLocalMatrixError: 0, parentChanges: 0 });
  await page.getByLabel("Original source pose").uncheck();
  await page.getByLabel("Wireframe", { exact: true }).check();
  expect(await page.evaluate(() => {
    let all = true;
    window.engineLab.rig.root.traverse(node => { if (node.isMesh && !node.material.wireframe) all = false; });
    return all;
  })).toBe(true);
  await page.getByLabel("Wireframe", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Hide component", exact: true }).click();
  expect(await page.evaluate(() => window.engineLab.rig.components.find(c => c.id === "EngineBlock").nodes[0].visible)).toBe(false);
  await page.getByRole("button", { name: "Show component", exact: true }).click();
  await page.getByRole("button", { name: "Inspect −", exact: true }).click();

  const measurements = [];
  const cameraClearance = await page.evaluate(async () => {
    const { rig, camera } = window.engineLab;
    let minimumDepth = Infinity;
    for (let step = 0; step <= 20; step++) {
      window.engineLab.setTimeline({ cameraProgress: step / 20, explosionProgress: 0 });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      camera.updateMatrixWorld(true);
      rig.root.traverse(node => {
        if (!node.isMesh || node.isInstancedMesh) return;
        const point = camera.position.clone();
        const positions = node.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
          minimumDepth = Math.min(minimumDepth, -point.z);
        }
      });
    }
    return { minimumDepth, near: camera.near, samples: 21 };
  });
  expect(cameraClearance.minimumDepth).toBeGreaterThan(cameraClearance.near);
  for (const scenario of [
    { name: "assembled", cameraProgress: 0, explosionProgress: 0, playing: false },
    { name: "mechanism", cameraProgress: 0.5, explosionProgress: 0, playing: true },
    { name: "exploded", cameraProgress: 1, explosionProgress: 1, playing: false },
    { name: "crank-close", cameraProgress: 0.75, explosionProgress: 0, playing: false },
  ]) {
    await page.evaluate(s => {
      window.engineLab.setTimeline({ ...s, engineMechanismProgress: 0.125 });
      window.engineLab.setPlaying(s.playing);
      window.engineLab.resetMetrics();
    }, scenario);
    await page.evaluate(() => new Promise(resolve => {
      let count = 0;
      function next() { if (++count >= 180) resolve(); else requestAnimationFrame(next); }
      requestAnimationFrame(next);
    }));
    measurements.push({ name: scenario.name, ...await page.evaluate(() => window.engineLab.stats()) });
    await page.screenshot({ path: `artifacts/engine-lab/${scenario.name}.png` });
  }
  const context = await page.evaluate(() => {
    const gl = window.engineLab.renderer.getContext();
    const extension = gl.getExtension("WEBGL_debug_renderer_info");
    return { userAgent: navigator.userAgent, renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), viewport: [innerWidth, innerHeight], hardwareConcurrency: navigator.hardwareConcurrency };
  });
  const framing = [];
  for (const [width, height] of [[1366, 768], [1920, 1080], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (const exploded of [false, true]) {
      await page.evaluate(exploded => {
        window.engineLab.setPlaying(false);
        window.engineLab.setTimeline({ cameraProgress: exploded ? 1 : 0, explosionProgress: exploded ? 1 : 0 });
      }, exploded);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const result = await page.evaluate(() => {
        const { camera, rig, renderer } = window.engineLab;
        let outside = 0, visibleMeshes = 0;
        rig.root.traverse(node => {
          if (!node.isMesh || node.isInstancedMesh) return;
          let ancestor = node;
          while (ancestor) { if (!ancestor.visible) return; ancestor = ancestor.parent; }
          visibleMeshes++;
          const attribute = node.geometry.attributes.position;
          const point = camera.position.clone();
          for (let i = 0; i < attribute.count; i++) {
            point.fromBufferAttribute(attribute, i).applyMatrix4(node.matrixWorld).project(camera);
            if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1 || Math.abs(point.z) > 1) { outside++; break; }
          }
        });
        const bounds = renderer.domElement.getBoundingClientRect();
        return { outside, visibleMeshes, aspect: camera.aspect, canvasAspect: bounds.width / bounds.height, horizontalOverflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(result.outside).toBe(0);
      expect(result.aspect).toBeCloseTo(result.canvasAspect, 5);
      expect(result.horizontalOverflow).toBe(false);
      framing.push({ width, height, exploded, ...result });
      await page.screenshot({ path: `artifacts/engine-lab/${width}-${exploded ? "exploded" : "assembled"}.png` });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Presentation", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Crank angle" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show lab controls", exact: true }).click();
  await fs.writeFile("artifacts/engine-lab/performance.json", JSON.stringify({ context, measurements, framing, cameraClearance, errors }, null, 2));
  expect(errors).toEqual([]);
  await page.goto("/#/login");
  await expect(page.locator(".engine-lab")).toHaveCount(0);
  expect(await page.evaluate(() => window.engineLab === undefined)).toBe(true);
  await page.goto("/#/engine-lab");
  await expect(page.locator(".engine-lab")).toHaveAttribute("data-status", "ready");
  expect(errors).toEqual([]);
});
