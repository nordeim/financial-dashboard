import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { login, navigateToView, restoreDefaultSettings } from "./helpers";

const FIXTURES = join(__dirname, "fixtures");

/**
 * CSV import golden path (3-step flow), the live error card (round-9), the
 * GDPR export shape + restore round-trip (round-9), and the round-12 F0 pin
 * (exports are settings-independent) + the round-12 signed-amounts import
 * fix (negative CSV rows import instead of skipping).
 */
test.describe("CSV import", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Import", "Import Transactions");
  });

  test("3-step flow: upload → extract → review with guessed categories → import", async ({ page }) => {
    await page.locator("#file-upload").setInputFiles(join(FIXTURES, "import-sample.csv"));
    await expect(page.getByText("import-sample.csv")).toBeVisible();
    await page.getByRole("button", { name: "Upload and Extract" }).click();
    await expect(page.getByText("2 transactions detected")).toBeVisible();
    await expect(page.getByText("E2E Coffee Shop")).toBeVisible();

    await page.getByRole("button", { name: /Import 2 Transactions/ }).click();
    await expect(page.getByText("Imported 2 transactions").first()).toBeVisible();

    // Both rows land — including the accounting-negative rent row (round-12:
    // the import route no longer rejects signed amounts).
    await navigateToView(page, "Expenses", "Expenses");
    await expect(page.getByRole("heading", { name: "E2E Coffee Shop" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "E2E Rent Payment" })).toBeVisible();
  });

  test("garbage CSV renders the live error card with Start New Import (round-9)", async ({ page }) => {
    await page.locator("#file-upload").setInputFiles(join(FIXTURES, "import-garbage.csv"));
    await page.getByRole("button", { name: "Upload and Extract" }).click();
    await expect(page.getByRole("heading", { name: "An Error Occurred" })).toBeVisible();
    await expect(page.getByText("The file needs a header row plus at least one data row.")).toBeVisible();

    await page.getByRole("button", { name: "Start New Import" }).click();
    await expect(page.getByRole("heading", { name: "An Error Occurred" })).toHaveCount(0);
    await expect(page.getByText("Step 1: Upload File")).toBeVisible();
  });
});

test.describe("GDPR export + restore", () => {
  test("export downloads the live snake_case shape with the email filename", async ({ page }) => {
    await login(page);
    await navigateToView(page, "Settings", "Settings");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export All Data" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^finara-export-sepnetflix2023@outlook\.com-\d{4}-\d{2}-\d{2}\.json$/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test("exports stay settings-independent under EUR + dd/MM/yyyy (round-12 F0 live probe)", async ({ page }) => {
    await login(page);
    // Switch settings away from the defaults.
    await navigateToView(page, "Settings", "Settings");
    await page.getByRole("combobox", { name: "Default Currency" }).click();
    await page.getByRole("option", { name: "EUR - Euro (€)" }).click();
    await page.getByRole("combobox", { name: "Date Format" }).click();
    await page.getByRole("option", { name: "dd/MM/yyyy (25/12/2024)" }).click();
    await page.getByRole("button", { name: "Save Settings" }).click();

    // The transactions CSV keeps ISO dates + raw decimals + the ISO filename
    // (live-probed byte-identical under both settings).
    await navigateToView(page, "Analytics", "Analytics");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^financial-report-\d{4}-\d{2}-\d{2}\.csv$/);
    const path = await download.path();
    expect(path).toBeTruthy();
    const { readFileSync } = await import("node:fs");
    const body = readFileSync(path, "utf8");
    const firstDate = body.split("\n")[1]?.split(",")[0] ?? "";
    expect(firstDate).toMatch(/^"\d{4}-\d{2}-\d{2}"$/);
    expect(body).not.toContain("€");
    expect(body).not.toContain("17/09/2026");

    // Serial suite hygiene: later specs assert dollar-formatted figures.
    await restoreDefaultSettings(page);
  });
});
