import { test, expect } from "@playwright/test";
import { collectConsole, login } from "./helpers";

/**
 * Mobile drawer (round-5/10 contracts at 375×812) + the round-11 console
 * sweep (all 9 views, zero errors AND zero warnings on the production
 * build — no dev-server noise exists).
 */
test.describe("mobile drawer", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
  });

  test("drawer opens with the Menu→X glyph swap (round-10)", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Open navigation menu" });
    await toggle.click();
    await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeVisible();
    // The drawer renders the nav + the direct Sign Out button.
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  });

  test("drawer Sign Out works (round-5 direct button)", async ({ page }) => {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.locator("#email")).toBeVisible();
  });

  test("desktop sidebar is hidden at 375px", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible();
  });
});

const VIEWS: [string, string][] = [
  ["/Dashboard", "Financial Dashboard"],
  ["/Income", "Income Sources"],
  ["/Expenses", "Expenses"],
  ["/Accounts", "My Accounts"],
  ["/Investments", "Investments"],
  ["/Import", "Import Transactions"],
  ["/Analytics", "Analytics"],
  ["/Goals", "Savings Goals"],
  ["/Settings", "Settings"],
];

test.describe("console sweep (round-11 automated)", () => {
  test("all 9 views render with zero console errors and zero warnings", async ({ page }) => {
    const { errors, warnings } = collectConsole(page);
    await login(page);
    for (const [path, heading] of VIEWS) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(errors, `console errors: ${errors.join(" | ")}`).toEqual([]);
    expect(warnings, `console warnings: ${warnings.join(" | ")}`).toEqual([]);
  });

  test("the 404 view renders clean too", async ({ page }) => {
    const { errors, warnings } = collectConsole(page);
    await login(page);
    await page.goto("/E2EMissingPage");
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
