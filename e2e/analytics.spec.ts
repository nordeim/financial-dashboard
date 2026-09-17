import { test, expect } from "@playwright/test";
import { captureDownload, login, navigateToView } from "./helpers";

/**
 * Analytics golden paths + the round-9/11 contracts: legend census 1/0/0/0,
 * the borderless ghost tooltip (computed), inert From/To pickers, the empty
 * Income tab quirk, and the live-shaped transactions CSV export.
 */
test.describe("analytics", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Analytics", "Analytics");
  });

  test("Overview renders the line chart with exactly ONE legend (census 1/0/0/0)", async ({ page }) => {
    await expect(page.locator(".recharts-line")).toHaveCount(3);
    await expect(page.locator(".recharts-legend-wrapper")).toHaveCount(1);
  });

  test("tab census: Expenses/Income/Investments carry no legends (round-11)", async ({ page }) => {
    for (const tab of ["Expenses", "Investments"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await expect(page.locator(".recharts-legend-wrapper")).toHaveCount(0);
      await expect(page.locator("svg.recharts-surface").first()).toBeVisible();
    }
  });

  test("Income tab renders empty by design (verified source quirk, round-9)", async ({ page }) => {
    await page.getByRole("tab", { name: "Income", exact: true }).click();
    await expect(page.locator(".recharts-surface")).toHaveCount(0);
    await expect(page.locator(".recharts-legend-wrapper")).toHaveCount(0);
  });

  test("hover tooltip renders the borderless ghost style (round-11, computed)", async ({ page }) => {
    const chart = page.locator("svg.recharts-surface").first();
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width * 0.6, box!.y + box!.height * 0.5);
    const tooltip = page.locator(".recharts-default-tooltip");
    await expect(tooltip).toBeVisible();
    const style = await tooltip.evaluate((node) => {
      const computed = getComputedStyle(node);
      return { bg: computed.backgroundColor, border: computed.borderStyle, width: computed.borderWidth };
    });
    expect(style.bg).toBe("rgba(0, 0, 0, 0)");
    expect(style.border).toBe("none");
    expect(style.width).toBe("0px");
  });

  test("From/To date inputs are inert — no analytics refetch on change (round-9)", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/analytics")) requests.push(request.url());
    });
    const before = requests.length;
    await page.getByLabel("Start date").fill("2026-01-01");
    await page.getByLabel("End date").fill("2026-12-31");
    await page.waitForTimeout(800);
    expect(requests.length).toBe(before);
  });

  test("Export downloads the live-shaped transactions CSV (round-9 + round-12 F0 pin)", async ({ page }) => {
    const { filename, body } = await captureDownload(page, async () => {
      await page.getByRole("button", { name: "Export" }).click();
    });
    expect(filename).toMatch(/^financial-report-\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = body.trim().split("\n");
    expect(lines[0]).toBe('"Date","Description","Category","Subcategory","Amount","Type"');
    // Expense rows carry ISO date-only stamps; raw decimals; grouped type order.
    const firstDataRow = lines[1]!.split(",");
    expect(firstDataRow[0]).toMatch(/^"\d{4}-\d{2}-\d{2}"$/);
    const types = lines.map((line) => line.trim().endsWith('"Expense"'));
    expect(types.some(Boolean)).toBeTruthy();
    expect(lines.some((line) => line.trim().endsWith('"Income"'))).toBeTruthy();
    expect(lines.some((line) => line.trim().endsWith('"Investment"'))).toBeTruthy();
    // Expenses → income → investments grouping: the last Income row comes
    // before the first Investment row.
    const lastIncomeIndex = lines.map((line, i) => [line, i] as const).filter(([line]) => line.endsWith('"Income"')).pop();
    const firstInvestmentIndex = lines.map((line, i) => [line, i] as const).find(([line]) => line.endsWith('"Investment"'));
    expect(firstInvestmentIndex?.[1]).toBeGreaterThan(lastIncomeIndex?.[1] ?? -1);
  });
});
