import { test, expect } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/demo-user";
import { login, signOut } from "./helpers";

/**
 * Round-8 route architecture contracts (ADR-021) + the login gate:
 * real paths, replaceState redirect with from_url, title contracts,
 * the 404 view, and the demo-credential check (round-4 error state).
 */
test.describe("auth + routes", () => {
  test("unauthenticated deep link redirects to /login with from_url + bare title (round-12 fix)", async ({ page }) => {
    await page.goto("/Goals");
    await expect(page.locator("#email")).toBeVisible();
    expect(page.url()).toContain("from_url=");
    await expect(page.getByRole("heading", { name: "Welcome to Finara" })).toBeVisible();
    // Round-12 live probe: the login surface titles bare "Finara" in both
    // the direct-visit and redirect cases (the clone used to keep the
    // deep-link title — fixed this round).
    await expect(page).toHaveTitle("Finara");
  });

  test("invalid credentials render the error alert (round-4 bug fix)", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle("Finara");
    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("nope");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid login lands on the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(DEMO_EMAIL);
    await page.locator("#password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Financial Dashboard" })).toBeVisible();
    await expect(page).toHaveTitle("Finara");
  });

  test("from_url round trip: login returns to the deep-linked view", async ({ page }) => {
    await page.goto("/Goals");
    await expect(page.locator("#email")).toBeVisible();
    await page.locator("#email").fill(DEMO_EMAIL);
    await page.locator("#password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Savings Goals" })).toBeVisible();
    await expect.poll(() => page.url()).toContain("/Goals");
    await expect(page).toHaveTitle("Goals | Finara");
  });

  test("sign out returns to the login page and clears the session", async ({ page }) => {
    await login(page);
    await signOut(page);
    await expect(page.getByRole("heading", { name: "Welcome to Finara" })).toBeVisible();
    const session = await page.evaluate(() => window.sessionStorage.getItem("finara-demo-session"));
    expect(session).toBeNull();
    // Navigating back to a view re-gates.
    await page.goto("/Dashboard");
    await expect(page.locator("#email")).toBeVisible();
  });

  test("'/' renders the dashboard with no active nav pill (live-probed)", async ({ page }) => {
    await login(page, "/");
    await expect(page.getByRole("heading", { name: "Financial Dashboard" })).toBeVisible();
    await expect(page).toHaveTitle("Finara");
    await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
  });

  test("'/Dashboard' marks its nav pill active; other views title 'X | Finara'", async ({ page }) => {
    await login(page, "/Dashboard");
    await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
    await page.getByRole("link", { name: /income/i }).first().click();
    await expect(page.getByRole("heading", { name: "Income Sources" })).toBeVisible();
    await expect.poll(() => page.url()).toContain("/Income");
    await expect(page).toHaveTitle("Income | Finara");
  });

  test("unknown path renders the standalone 404 view with camelCase-split title", async ({ page }) => {
    await login(page);
    await page.goto("/NonexistentPage");
    await expect(page.getByText(/page not found|404|doesn't exist/i).first()).toBeVisible();
    await expect(page).toHaveTitle("Nonexistent Page | Finara");
  });
});
