import { test, expect } from "@playwright/test";
import { autoAcceptConfirms, login, navigateToView, selectCombobox, uniqueName } from "./helpers";

/**
 * Accounts + Investments golden paths, including the round-11 investment
 * form contracts (empty current price → 0, no positivity gate).
 */
test.describe("bank accounts", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Accounts", "My Accounts");
  });

  test("add an account via the dialog (plain default-primary submit)", async ({ page }) => {
    const name = uniqueName("Checking");
    await page.getByRole("button", { name: "Add Account" }).first().click();
    await page.locator("#account_name").fill(name);
    await page.locator("#bank_name").fill("E2E Bank");
    await selectCombobox(page, "Account Type", "Checking");
    await page.locator("#manual_balance").fill("1234.56");
    await page.getByRole("button", { name: "Add Account", exact: true }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(page.getByText("$1,234.56").first()).toBeVisible();
  });

  test("edit an account (Save Changes)", async ({ page }) => {
    const name = uniqueName("Edit acct");
    await page.getByRole("button", { name: "Add Account" }).first().click();
    await page.locator("#account_name").fill(name);
    await page.locator("#bank_name").fill("E2E Bank");
    await page.locator("#manual_balance").fill("100");
    await page.getByRole("button", { name: "Add Account", exact: true }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Edit ${name}` }).click();
    await page.locator("#manual_balance").fill("250.75");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("$250.75").first()).toBeVisible();
  });

  test("delete uses the native account confirm", async ({ page }) => {
    const name = uniqueName("Doomed acct");
    const dialogs = autoAcceptConfirms(page);
    await page.getByRole("button", { name: "Add Account" }).first().click();
    await page.locator("#account_name").fill(name);
    await page.locator("#bank_name").fill("E2E Bank");
    await page.locator("#manual_balance").fill("10");
    await page.getByRole("button", { name: "Add Account", exact: true }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Remove ${name}` }).click();
    await expect.poll(() => dialogs.lastMessage()).toContain("Are you sure you want to delete this account?");
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});

test.describe("investments", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Investments", "Investments");
  });

  test("add a holding with an EMPTY current price — saved as 0 (round-11)", async ({ page }) => {
    const name = uniqueName("Holding");
    await page.getByRole("button", { name: "Add Investment" }).click();
    await page.locator("#symbol").fill("E2E1");
    await selectCombobox(page, "Type", "Stock");
    await page.locator("#name").fill(name);
    await page.locator("#shares").fill("10");
    await page.locator("#purchase_price").fill("5");
    // current_price left EMPTY — live stores 0 (round-11 probe, "PRB").
    await selectCombobox(page, "Sector", "Technology");
    await page.getByRole("button", { name: "Add Investment", exact: true }).click();
    await expect(page.getByText("E2E1").first()).toBeVisible();
    await expect(page.getByText("$0.00").first()).toBeVisible();
  });

  test("negative shares + avg cost persist (round-11 signed units)", async ({ page }) => {
    await page.getByRole("button", { name: "Add Investment" }).click();
    await page.locator("#symbol").fill("E2E2");
    await selectCombobox(page, "Type", "Stock");
    await page.locator("#name").fill(uniqueName("Short position"));
    await page.locator("#shares").fill("-10");
    await page.locator("#purchase_price").fill("-5");
    await selectCombobox(page, "Sector", "Technology");
    await page.getByRole("button", { name: "Add Investment", exact: true }).click();
    // Live probe rendering: -10 / -$5.00 … the negative-zero value edge.
    await expect(page.getByText("-$5.00").first()).toBeVisible();
  });

  test("sector dot list renders the fixed per-sector colors", async ({ page }) => {
    await expect(page.locator(".w-3.h-3.rounded-full").first()).toBeVisible();
  });

  test("delete uses the native investment confirm", async ({ page }) => {
    const dialogs = autoAcceptConfirms(page);
    await page.getByRole("button", { name: "Add Investment" }).click();
    await page.locator("#symbol").fill("E2E3");
    await selectCombobox(page, "Type", "Stock");
    await page.locator("#name").fill(uniqueName("Doomed holding"));
    await page.locator("#shares").fill("1");
    await page.locator("#purchase_price").fill("1");
    await selectCombobox(page, "Sector", "Technology");
    await page.getByRole("button", { name: "Add Investment", exact: true }).click();
    await expect(page.getByText("E2E3").first()).toBeVisible();

    await page.getByRole("button", { name: "Remove E2E3" }).click();
    await expect.poll(() => dialogs.lastMessage()).toContain("Are you sure you want to delete this investment?");
    await expect(page.getByText("E2E3")).toHaveCount(0);
  });
});
