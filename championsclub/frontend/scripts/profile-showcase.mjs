import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
try {
  await page.goto("http://127.0.0.1:5173/#/showcase");
  await page
    .locator('.car-showcase[data-status="ready"]')
    .waitFor({ timeout: 60000 });
  const result = await page.evaluate(async () => {
    const samples = [];
    const renderSamples = [];
    const longTasks = [];
    let drawCalls = 0;
    let previousDrawCalls = 0;
    let previousRender;
    const originalDraw = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      drawCalls++;
      return originalDraw.apply(this, args);
    };
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(entry.duration);
    });
    observer.observe({ type: "longtask" });
    const distance =
      document.querySelector(".car-showcase").offsetHeight - innerHeight;
    let previous;
    await new Promise((resolve) => {
      const start = performance.now();
      function step(now) {
        if (previous) samples.push(now - previous);
        previous = now;
        if (drawCalls !== previousDrawCalls) {
          if (previousRender) renderSamples.push(now - previousRender);
          previousRender = now;
          previousDrawCalls = drawCalls;
        }
        const progress = Math.min(1, (now - start) / 8000);
        window.scrollTo(0, distance * progress);
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
    observer.disconnect();
    WebGL2RenderingContext.prototype.drawElements = originalDraw;
    samples.sort((a, b) => a - b);
    renderSamples.sort((a, b) => a - b);
    return {
      animationFrames: samples.length,
      renderedFrames: renderSamples.length,
      renderMedianMs: renderSamples[Math.floor(renderSamples.length * 0.5)],
      renderP95Ms: renderSamples[Math.floor(renderSamples.length * 0.95)],
      medianMs: samples[Math.floor(samples.length * 0.5)],
      p95Ms: samples[Math.floor(samples.length * 0.95)],
      longestMs: samples.at(-1),
      longTasksOver50ms: longTasks.length,
      modelBytes: performance
        .getEntriesByType("resource")
        .find((entry) => entry.name.endsWith("golf-gti.glb"))?.decodedBodySize,
    };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
