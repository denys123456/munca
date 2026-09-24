import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/#/showcase");
  await expect(page.locator(".car-showcase")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 60000 },
  );
  await expect(page.locator(".car-viewport canvas")).toHaveCount(1);
}

async function chapter(page, progress) {
  await page.evaluate(
    (value) =>
      window.scrollTo(
        0,
        (document.querySelector(".car-showcase").offsetHeight - innerHeight) *
          value,
      ),
    progress,
  );
  await page.waitForTimeout(1600);
}

test("showcase loads only on its route, scrubs both ways, settles, and cleans up", async ({
  page,
}) => {
  const errors = [];
  const models = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith(".glb")) models.push(request.url());
  });
  await page.addInitScript(() => {
    window.carDrawCalls = 0;
    const original = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      window.carDrawCalls++;
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  expect(models).toHaveLength(0);
  await page.getByRole("link", { name: "Explore the design series" }).click();
  await expect(page.locator(".car-showcase")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 60000 },
  );
  await page.screenshot({ path: "artifacts/showcase-desktop.png" });
  await chapter(page, 0.38);
  await expect(
    page.getByRole("button", { name: "2. Every angle" }),
  ).toHaveAttribute("aria-current", "step");
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(100);
  const moving = await page
    .locator(".car-progress > span")
    .evaluate((node) => node.style.transform);
  await page.waitForTimeout(300);
  expect(
    await page
      .locator(".car-progress > span")
      .evaluate((node) => node.style.transform),
  ).not.toBe(moving);
  for (const [progress, name] of [
    [0.7, "front"],
    [0.82, "wheel"],
    [1, "final"],
  ]) {
    await chapter(page, progress);
    await page.screenshot({ path: `artifacts/showcase-${name}.png` });
  }
  await expect(
    page.getByRole("button", { name: "4. Lasting impression" }),
  ).toHaveAttribute("aria-current", "step");
  const draws = await page.evaluate(() => window.carDrawCalls);
  expect(draws).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.carDrawCalls)).toBe(draws);
  await chapter(page, 0);
  await expect(
    page.getByRole("heading", { name: "An icon. In every detail." }),
  ).toHaveCSS("opacity", "1");
  await page.getByRole("link", { name: "Your workspace", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Explore the design series" }).click();
  await expect(page.locator(".car-showcase")).toHaveAttribute(
    "data-status",
    "ready",
  );
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("mobile chapters remain accessible and fit the screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: "artifacts/showcase-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "3. Closer look" }).click();
  await expect(
    page.getByRole("button", { name: "3. Closer look" }),
  ).toHaveAttribute("aria-current", "step");
  await chapter(page, 0.82);
  await page.screenshot({ path: "artifacts/showcase-mobile-detail.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await chapter(page, 0);
  await expect(page.locator(".car-showcase")).toHaveAttribute(
    "data-status",
    "ready",
  );
});

test("reduced motion presents a static composition without a long scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await expect(
    page.getByRole("navigation", { name: "Showcase chapters" }),
  ).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(
    1000,
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(
    page.getByRole("button", { name: "1. First impression" }),
  ).toHaveAttribute("aria-current", "step");
  await chapter(page, 1);
  await expect(
    page.getByRole("button", { name: "4. Lasting impression" }),
  ).toHaveAttribute("aria-current", "step");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".car-heading")).toHaveCSS("opacity", "1");
});

test("a failed model download keeps the poster and supports retry", async ({
  page,
}) => {
  await page.route("**/models/golf-gti.glb", (route) => route.abort());
  await page.goto("/#/showcase");
  await expect(page.locator(".car-showcase")).toHaveAttribute(
    "data-status",
    "error",
  );
  expect(
    await page
      .locator(".car-poster")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  await page.unroute("**/models/golf-gti.glb");
  await page.getByRole("button", { name: "Try 3D again" }).click();
  await expect(page.locator(".car-showcase")).toHaveAttribute(
    "data-status",
    "ready",
    { timeout: 60000 },
  );
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.evaluate(() =>
    document
      .querySelector("canvas")
      .getContext("webgl2")
      .getExtension("WEBGL_lose_context")
      .loseContext(),
  );
  await expect(page.locator(".car-showcase")).toHaveAttribute(
    "data-status",
    "error",
  );
  await expect(
    page.getByRole("link", { name: "Your workspace", exact: true }),
  ).toBeVisible();
});
