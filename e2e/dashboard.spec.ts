import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Dashboard golden paths: KPI cards with formatted money, the budget
 * overview + colored dot rows, recent activity, AI insights (deterministic
 * fallback), quick actions, and the header CTA trio.
 */
test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("KPI cards render with formatted money and live-exact labels", async ({ page }) => {
    for (const label of ["Monthly Income", "Monthly Expenses", "Net Balance", "Savings Progress"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByText(/\$[\d,]+\.\d{2}/).first()).toBeVisible();
    await expect(page.getByText("Largest Expense Category")).toBeVisible();
  });

  test("Budget Overview renders the 50/30/20 rows with progress bars", async ({ page }) => {
    await expect(page.getByText("Budget Overview")).toBeVisible();
    // The three category budgets render progress rows with aria labels.
    await expect(page.locator('[aria-label*="budget:"]').first()).toBeVisible();
    expect(await page.locator('[aria-label*="budget:"]').count()).toBeGreaterThanOrEqual(3);
  });

  test("Recent Activity renders seed rows", async ({ page }) => {
    await expect(page.getByText("Recent Activity")).toBeVisible();
    await expect(page.locator(".fade-in-up").getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });

  test("AI Insights cards render (LLM or deterministic fallback)", async ({ page }) => {
    await expect(page.getByText("AI Insights")).toBeVisible();
    // The fallback renders insight-shaped cards; assert at least one card
    // body paragraph is present next to the header.
    await expect(page.locator("div").filter({ hasText: "AI Insights" }).locator("p").first()).toBeVisible();
  });

  test("header renders AI Coach + Refresh + the sage Add Transaction anchor", async ({ page }) => {
    await expect(page.getByRole("button", { name: /AI Coach/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Refresh", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Add Transaction" }).click();
    await expect(page.getByRole("heading", { name: "Expenses" })).toBeVisible();
  });

  test("FAB is visible on the dashboard", async ({ page }) => {
    await expect(page.locator('button[aria-label="Add transaction"]')).toBeVisible();
  });
});
