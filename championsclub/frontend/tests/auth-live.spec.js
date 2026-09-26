import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";

const settingsFile = new URL(
  "../../../.work/preview-settings.json",
  import.meta.url,
);
const local = existsSync(settingsFile)
  ? JSON.parse(readFileSync(settingsFile, "utf8").replace(/^\uFEFF/, ""))
  : {};
const password = process.env.CHAMPIONSCLUB_DEMO_PASSWORD || local.password;
const api =
  process.env.PLAYWRIGHT_API_BASE_URL || local.api || "http://127.0.0.1:8080";

for (const [role, email] of [
  [
    "ADVISOR",
    process.env.CHAMPIONSCLUB_TEST_ADVISOR || "jane.doe@championsclub.example",
  ],
  [
    "MANAGER",
    process.env.CHAMPIONSCLUB_TEST_MANAGER ||
      "alex.smith@championsclub.example",
  ],
]) {
  test(`${role}: real login, refresh, navigation and token revocation`, async ({
    page,
    request,
  }) => {
    test.skip(
      !password,
      "Set CHAMPIONSCLUB_DEMO_PASSWORD for the verification backend.",
    );
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#/login");
    await page.getByLabel("Email address").fill(email.toUpperCase());
    await page.getByLabel("Password", { exact: false }).fill(password);
    const loginResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/auth/login"),
    );
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    const response = await loginResponse;
    expect(response.status()).toBe(200);
    const session = await response.json();
    expect(session.user.role).toBe(role);
    await expect(page).toHaveURL(/#\/overview$/);
    await expect(page.locator(".kpi").first()).toBeVisible();
    await page.reload();
    await expect(page.locator(".kpi").first()).toBeVisible();
    await page.goto("/#/profile");
    await expect(page.locator("main")).toContainText(email);
    await page.screenshot({
      path: `artifacts/login-${role.toLowerCase()}-verified.png`,
      fullPage: true,
    });
    await page
      .locator(".sidebar")
      .getByRole("button", { name: "Sign out" })
      .click();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
    const revoked = await request.get(`${api}/api/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    expect(revoked.status()).toBe(401);
    await page.reload();
    await expect(page.getByLabel("Email address")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
