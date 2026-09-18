import { test, expect } from "@playwright/test";
import { login } from "./helpers";

/**
 * Dashboard golden paths: KPI cards with formatted money, the budget
 * overview + colored dot rows, recent activity, AI insights (persisted
 * records with dismiss — round 13), quick actions, and the header CTA trio.
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
    // exact: the AI Insights card renders free-text record content below —
    // the KPI label must match only its own paragraph, never a substring
    // of an insight description (round-13 E2E-gate lesson).
    await expect(page.getByText("Largest Expense Category", { exact: true })).toBeVisible();
  });

  test("Budget rows render the live indeterminate progressbars (no aria-valuenow)", async ({ page }) => {
    await expect(page.getByText("Budget Overview", { exact: true })).toBeVisible();
    // The three category budgets render progress rows with aria labels.
    await expect(page.locator('[aria-label*="budget:"]').first()).toBeVisible();
    expect(await page.locator('[aria-label*="budget:"]').count()).toBeGreaterThanOrEqual(3);
    // Round 13: the live's Progress renders data-state=indeterminate and
    // NO aria-valuenow (the value feeds the manual transform only).
    const bar = page.locator('[aria-label*="budget:"]').first();
    await expect(bar).toHaveAttribute("data-state", "indeterminate");
    expect(await bar.getAttribute("aria-valuenow")).toBeNull();
    await expect(bar.locator("div").first()).toHaveAttribute("data-state", "indeterminate");
  });

  test("Recent Activity renders seed rows", async ({ page }) => {
    await expect(page.getByText("Recent Activity", { exact: true })).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d{2}/).first()).toBeVisible();
  });

  test("AI Insights render persisted records with type badges and confidence", async ({ page }) => {
    await expect(page.getByText("AI Insights", { exact: true })).toBeVisible();
    // Round 13: records generate on first load (the table starts empty) and
    // render the live card anatomy — type badge, dismiss X, confidence %.
    await expect(page.getByText(/Confidence: \d+%/).first()).toBeVisible();
    await expect(page.locator("h4").filter({ hasText: /Savings rate|Top spending|Spending exceeds|Budget/ }).first()).toBeVisible();
  });

  test("dismissing an insight removes its row and refresh keeps it gone", async ({ page }) => {
    const before = await page.getByText(/Confidence: \d+%/).count();
    test.skip(before === 0, "no insights generated on this run");
    const firstRow = page.locator("button[aria-label^='Dismiss insight:']").first();
    const title = await page.locator("h4").filter({ hasText: /.+/ }).first().textContent();
    await firstRow.click();
    if (title) {
      await expect(page.locator("h4", { hasText: title })).toHaveCount(0);
    }
    // The refresh button re-lists (dismissed records stay dismissed).
    await page.getByRole("button", { name: "Refresh insights" }).click();
    if (title) {
      await expect(page.locator("h4", { hasText: title })).toHaveCount(0);
    }
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
