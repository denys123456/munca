import { test, expect } from "@playwright/test";

const key = "championsclub.session.v2";
const account = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  role: "ADVISOR",
  email: "jane@example.com",
  active: true,
};

async function fillLogin(page) {
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: false }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

async function seedSession(page) {
  await page.goto("/");
  await page.evaluate(
    ([key, token]) => sessionStorage.setItem(key, token),
    [key, "old-session"],
  );
}

test("missing public API reports a service configuration error and permits retry", async ({
  page,
}) => {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      status: 404,
      contentType: "text/plain",
      body: "NOT_FOUND",
    }),
  );
  await page.goto("/");
  await fillLogin(page);
  await expect(page.getByRole("alert")).toContainText(
    "not connected to the authentication service",
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Email address")).toHaveValue(account.email);
});

test("wrong password is clear and does not save a session", async ({
  page,
}) => {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ status: 401, body: "" }),
  );
  await page.goto("/");
  await fillLogin(page);
  await expect(page.getByRole("alert")).toContainText(
    "Invalid email or password",
  );
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
});

test("invalid success payload does not crash the login page", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/auth/login", (route) => route.fulfill({ json: {} }));
  await page.goto("/");
  await fillLogin(page);
  await expect(page.getByRole("alert")).toContainText("invalid session");
  expect(errors).toEqual([]);
});

test("failed session restoration can return to the login form", async ({
  page,
}) => {
  await seedSession(page);
  await page.route("**/api/me", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(page.getByLabel("Email address")).toBeVisible();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
});

test("plain-text expired session is cleared and allows signing in again", async ({
  page,
}) => {
  await seedSession(page);
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "text/plain",
      body: "Unauthorized",
    }),
  );
  await page.reload();
  await expect(page.getByRole("status")).toContainText("session has expired");
  await expect(page.getByLabel("Email address")).toBeVisible();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
});

test("abandoning a pending restore does not overwrite a new login", async ({
  page,
}) => {
  await seedSession(page);
  let finishRestore;
  await page.route("**/api/me", async (route) => {
    await new Promise((resolve) => {
      finishRestore = resolve;
    });
    await route.fulfill({ status: 401, body: "Unauthorized" }).catch(() => {});
  });
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ json: { accessToken: "new-session", user: account } }),
  );
  await page.route("**/api/dashboard/**", (route) =>
    route.fulfill({ status: 503, body: "" }),
  );
  await page.reload();
  await expect.poll(() => Boolean(finishRestore)).toBe(true);
  await page
    .getByRole("button", { name: "Sign in with another account" })
    .click();
  await fillLogin(page);
  await expect(page.locator(".sidebar")).toBeVisible();
  finishRestore();
  await expect(page.locator(".sidebar")).toBeVisible();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), key)).toBe(
    "new-session",
  );
});

test("logout clears this device even when the service is down", async ({
  page,
}) => {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({ json: { accessToken: "new-session", user: account } }),
  );
  await page.route("**/api/dashboard/**", (route) =>
    route.fulfill({ status: 503, body: "" }),
  );
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 503, body: "" }),
  );
  await page.goto("/#/login");
  await fillLogin(page);
  await expect(page).toHaveURL(/#\/overview$/);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Sign out" })
    .click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "signed out on this device",
  );
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), key),
  ).toBeNull();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});
