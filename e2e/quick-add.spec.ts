import { test, expect } from "@playwright/test";
import { login, navigateToView, uniqueName } from "./helpers";

/**
 * FAB Quick Add flow (ADR-014): the two-step chooser at z-40, the rotating
 * plus→X toggle, the compact step-2 form (income defaults monthly, expenses
 * submit subcategory "other"), and the chooser-only overlay dismissal.
 */
test.describe("FAB quick add", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Expenses", "Expenses");
  });

  test("FAB opens the chooser and rotates its plus into an X", async ({ page }) => {
    const fab = page.locator('button[aria-label="Add transaction"]');
    await fab.click();
    await expect(page.getByText("What would you like to add?")).toBeVisible();
    // The plus wrapper rotates 45deg while open (live-probed).
    const rotation = await fab.locator("div").first().evaluate((node) => getComputedStyle(node).transform);
    expect(rotation).toContain("0.7071");
  });

  test("quick expense lands with subcategory other (ADR-014)", async ({ page }) => {
    const name = uniqueName("FAB expense");
    await page.locator('button[aria-label="Add transaction"]').click();
    await page.getByRole("dialog").getByRole("button", { name: "Add Expense" }).click();
    await page.getByPlaceholder("Expense description...").fill(name);
    await page.getByPlaceholder("Amount").fill("9.99");
    await page.getByRole("dialog").getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("heading", { name: name })).toBeVisible();
    // Quick Add expenses submit subcategory "other" — rendered badge "other"
    // (the badges live in a sibling branch of the h3 — climb to the row root).
    const row = page.locator("h3", { hasText: name }).locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    await expect(row.getByText("other")).toBeVisible();
  });

  test("quick income lands as a monthly source (ADR-014)", async ({ page }) => {
    const name = uniqueName("FAB income");
    await page.locator('button[aria-label="Add transaction"]').click();
    await page.getByRole("dialog").getByRole("button", { name: "Add Income" }).click();
    await page.getByPlaceholder("Income source...").fill(name);
    await page.getByPlaceholder("Amount").fill("123.45");
    await page.getByRole("dialog").getByRole("button", { name: "Add", exact: true }).click();
    // Verify on the Income view: the source card renders with the monthly equivalent.
    await navigateToView(page, "Income", "Income Sources");
    await expect(page.getByRole("heading", { name: name, exact: true })).toBeVisible();
    await expect(
      page.locator("h3", { hasText: name }).locator('xpath=ancestor::div[contains(@class, "backdrop-blur")][1]').getByText("$123.45").first()
    ).toBeVisible();
  });

  test("chooser dismisses on overlay click (the only overlay-dismiss dialog)", async ({ page }) => {
    await page.locator('button[aria-label="Add transaction"]').click();
    await expect(page.getByText("What would you like to add?")).toBeVisible();
    await page.mouse.click(20, 200);
    await expect(page.getByText("What would you like to add?")).toHaveCount(0);
  });

  test("FAB toggle closes the chooser (X click)", async ({ page }) => {
    await page.locator('button[aria-label="Add transaction"]').click();
    await expect(page.getByText("What would you like to add?")).toBeVisible();
    await page.locator('button[aria-label="Add transaction"]').click();
    await expect(page.getByText("What would you like to add?")).toHaveCount(0);
  });
});
