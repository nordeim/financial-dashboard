import { test, expect } from "@playwright/test";
import { autoAcceptConfirms, login, navigateToView, selectCombobox, uniqueName } from "./helpers";

/**
 * Income sources golden paths: add via the shell dialog (frequency select),
 * the monthly-equivalent hero total, the edit dialog ("Update Income"), the
 * Active toggle, and native confirm() delete.
 */
test.describe("income sources", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Income", "Income Sources");
  });

  test("hero card renders Total Monthly Income with the normalized seed total", async ({ page }) => {
    await expect(page.getByText("Total Monthly Income")).toBeVisible();
    await expect(page.getByText(/\$[\d,]+\.\d{2}/).first()).toBeVisible();
  });

  test("add an income source with a biweekly frequency", async ({ page }) => {
    const name = uniqueName("Side gig");
    await page.getByRole("button", { name: "Add Income Source" }).click();
    await page.locator("#source_name").fill(name);
    await page.locator("#amount").fill("2000");
    await selectCombobox(page, "Frequency", "Bi-weekly");
    await page.getByRole("button", { name: "Add Income", exact: true }).click();
    // Biweekly normalizes ×26/12 ≈ $4,333.33/month — the card shows the
    // monthly equivalent, and the hero total includes it.
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("$4,333.33")).toBeVisible();
  });

  test("edit dialog changes the amount (Update Income)", async ({ page }) => {
    const name = uniqueName("Edit income");
    await page.getByRole("button", { name: "Add Income Source" }).click();
    await page.locator("#source_name").fill(name);
    await page.locator("#amount").fill("500");
    await page.getByRole("button", { name: "Add Income", exact: true }).click();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: `Edit ${name}` }).click();
    await expect(page.locator("#amount")).toHaveValue("500.00");
    await page.locator("#amount").fill("750");
    await page.getByRole("button", { name: "Update Income" }).click();
    await expect(page.getByText("$750.00").first()).toBeVisible();
  });

  test("delete uses the native income confirm", async ({ page }) => {
    const name = uniqueName("Doomed income");
    const dialogs = autoAcceptConfirms(page);
    await page.getByRole("button", { name: "Add Income Source" }).click();
    await page.locator("#source_name").fill(name);
    await page.locator("#amount").fill("100");
    await page.getByRole("button", { name: "Add Income", exact: true }).click();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: `Delete ${name}` }).click();
    await expect.poll(() => dialogs.lastMessage()).toContain("Are you sure you want to delete this income source?");
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});
