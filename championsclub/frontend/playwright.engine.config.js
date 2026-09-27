import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "engine-lab.spec.js",
  timeout: 90000,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "artifacts/engine-lab/browser-results.json" }]],
  outputDir: "artifacts/engine-lab/browser-tests",
  use: {
    baseURL: process.env.ENGINE_LAB_URL || "http://127.0.0.1:5174",
    viewport: { width: 1440, height: 1000 },
    launchOptions: { channel: "chrome" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
