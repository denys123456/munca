import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
});
try {
  await page.goto("http://127.0.0.1:5173/#/showcase");
  await page
    .locator('.car-showcase[data-status="ready"]')
    .waitFor({ timeout: 60000 });
  await page.addStyleTag({
    content:
      ".car-showcase, .car-stage, body, :root { background: transparent !important; } .car-stage::after, .car-stage > :not(.car-viewport), .car-poster { visibility: hidden !important; } .car-viewport canvas { opacity: 1 !important; transition: none !important; }",
  });
  await mkdir("artifacts", { recursive: true });
  const capture = await page
    .locator(".car-viewport")
    .screenshot({ omitBackground: true });
  await sharp(capture)
    .resize({ width: 1600 })
    .webp({ quality: 90 })
    .toFile("static/models/golf-gti-poster.webp");
  console.log("Captured the actual model as the loading and fallback poster.");
} finally {
  await browser.close();
}
