import { test, expect } from "@playwright/test";
import { autoAcceptConfirms, login, navigateToView, uniqueName } from "./helpers";

/**
 * Expenses golden paths + the round-8/11 contracts: no pagination, the
 * Filters "2" badge quirk, Quick Select → manual form flow, negative
 * amounts (double-minus rendering), native confirm() deletes, and the
 * blue bulk bar anatomy.
 */
test.describe("expenses", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Expenses", "Expenses");
  });

  test("renders the full seed list with no pagination (round-8)", async ({ page }) => {
    await expect(page.getByText(/Expense History \(\d+\)/)).toBeVisible();
    const rows = page.locator("h3.font-semibold");
    expect(await rows.count()).toBeGreaterThanOrEqual(90);
  });

  test("Filters badge shows the source quirk count 2 by default (round-8)", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Filters\s*2/ })).toBeVisible();
  });

  test("filters panel opens with empty min/max placeholders (round-11 null default)", async ({ page }) => {
    await page.getByRole("button", { name: /^Filters/ }).click();
    const min = page.getByPlaceholder("0.00").first();
    await expect(min).toBeVisible();
    await expect(min).toHaveValue("");
  });

  test("search narrows the visible rows", async ({ page }) => {
    const search = page.getByLabel("Search expenses...");
    await search.fill("coffee");
    await expect(page.getByText(/Expense History \(\d+\)/)).toContainText(/\([1-9]\d?\)/);
  });

  test("category tabs filter rows (All/Needs/Wants/Savings)", async ({ page }) => {
    const allText = await page.getByText(/Expense History \(\d+\)/).textContent();
    const allCount = Number(allText?.match(/\((\d+)\)/)?.[1] ?? 0);
    await page.getByRole("tab", { name: "Savings" }).click();
    await expect(page.getByText(/Expense History \(\d+\)/)).not.toContainText(`(${allCount})`);
  });

  test("Quick Select modal flow: tile pre-fills the manual form and submits (ADR-014)", async ({ page }) => {
    const name = uniqueName("Coffee run");
    await page.getByRole("button", { name: "Add Expense" }).first().click();
    await expect(page.getByText("Quick Select Category")).toBeVisible();
    // 5 Needs tiles; rent reads "Rent/Mortgage" while the stored id stays "Rent".
    await page.getByRole("button", { name: /Groceries/ }).click();
    await expect(page.locator("#title")).toBeVisible();
    await expect(page.locator("#title")).toHaveValue("Groceries");
    await page.locator("#title").fill(name);
    await page.locator("#amount").fill("12.34");
    await page.getByRole("dialog").getByRole("button", { name: "Add Expense" }).click();
    await expect(page.getByRole("heading", { name: name })).toBeVisible();
    await expect(page.locator("h3", { hasText: name }).locator("..").getByText("-$12.34")).toBeVisible();
  });

  test("negative expense renders the live double-minus quirk (round-11)", async ({ page }) => {
    const name = uniqueName("Refund");
    await page.getByRole("button", { name: "Add Expense" }).first().click();
    await page.getByRole("button", { name: /Groceries/ }).click();
    await page.locator("#title").fill(name);
    await page.locator("#amount").fill("-5.5");
    await page.getByRole("dialog").getByRole("button", { name: "Add Expense" }).click();
    await expect(page.getByRole("heading", { name: name })).toBeVisible();
    // The live template is `-{formatMoney}` — a negative amount renders --$5.50.
    await expect(page.locator("h3", { hasText: name }).locator("..").getByText("--$5.50")).toBeVisible();
  });

  test("zero amount is blocked with the live toast (round-11 zero-validation)", async ({ page }) => {
    await page.getByRole("button", { name: "Add Expense" }).first().click();
    await page.getByRole("button", { name: /Groceries/ }).click();
    await page.locator("#title").fill(uniqueName("Zero"));
    await page.locator("#amount").fill("0");
    await page.getByRole("dialog").getByRole("button", { name: "Add Expense" }).click();
    await expect(page.getByText("Amount must be greater than zero").first()).toBeVisible();
  });

  test("edit dialog updates the row amount", async ({ page }) => {
    const name = uniqueName("Edit target");
    await page.getByRole("button", { name: "Add Expense" }).first().click();
    await page.getByRole("button", { name: /Groceries/ }).click();
    await page.locator("#title").fill(name);
    await page.locator("#amount").fill("7.77");
    await page.getByRole("dialog").getByRole("button", { name: "Add Expense" }).click();
    await expect(page.getByRole("heading", { name: name })).toBeVisible();

    await page.getByRole("button", { name: `Edit ${name}` }).click();
    await expect(page.locator("#title")).toHaveValue(name);
    await page.locator("#amount").fill("8.88");
    await page.getByRole("button", { name: "Update Expense" }).click();
    await expect(page.locator("h3", { hasText: name }).locator("..").getByText("-$8.88")).toBeVisible();
  });

  test("delete uses the native confirm and removes the row", async ({ page }) => {
    const name = uniqueName("Doomed");
    const dialogs = autoAcceptConfirms(page);
    await page.getByRole("button", { name: "Add Expense" }).first().click();
    await page.getByRole("button", { name: /Groceries/ }).click();
    await page.locator("#title").fill(name);
    await page.locator("#amount").fill("3.33");
    await page.getByRole("dialog").getByRole("button", { name: "Add Expense" }).click();
    await expect(page.getByRole("heading", { name: name })).toBeVisible();

    await page.getByRole("button", { name: `Delete ${name}` }).click();
    await expect.poll(() => dialogs.lastMessage()).toContain("Are you sure you want to delete this expense?");
    await expect(page.getByRole("heading", { name: name })).toHaveCount(0);
  });

  test("bulk select renders the blue bar with the always-plural count (round-8)", async ({ page }) => {
    const firstRow = page.locator('button[aria-label^="Select "]').first();
    const rowName = await firstRow.getAttribute("aria-label");
    await firstRow.click();
    await expect(page.getByText("1 expenses selected")).toBeVisible();
    await expect(page.getByRole("button", { name: /Select All \(\d+\)/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Delete \(1\)/ })).toBeVisible();
    await page.getByRole("button", { name: "Clear selection" }).click();
    await expect(page.getByText("1 expenses selected")).toHaveCount(0);
    expect(rowName).toBeTruthy();
  });
});
