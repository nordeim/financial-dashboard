import { test, expect } from "@playwright/test";
import { autoAcceptConfirms, login, navigateToView, selectCombobox, uniqueName } from "./helpers";

/**
 * Goals golden paths + the round-11 complete-state contract: progress to
 * exactly 100% gains the emerald ring + Complete badge and REMOVES the Add
 * Progress button; overshoot stays uncapped (150.0%); negative targets show
 * no badge; deletes use native confirm().
 */
test.describe("savings goals", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToView(page, "Goals", "Savings Goals");
  });

  /** The goal card root (CARD_HOVER div — carries backdrop-blur) of a named goal. */
  function goalCard(page: import("@playwright/test").Page, name: string) {
    return page
      .getByText(name, { exact: true })
      .locator("xpath=ancestor::div[contains(@class, 'backdrop-blur')][1]");
  }

  async function createGoal(page: import("@playwright/test").Page, name: string, target: string) {
    await page.getByRole("button", { name: "New Goal" }).click();
    await page.locator("#title").fill(name);
    await page.locator("#target_amount").fill(target);
    await page.locator("#target_date").fill("2027-06-01");
    await page.getByRole("button", { name: "Create Goal" }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  test("create a goal and add progress via the dialog", async ({ page }) => {
    const name = uniqueName("Vacation");
    await createGoal(page, name, "1000");
    await expect(goalCard(page, name).getByText("0.0%")).toBeVisible();

    await goalCard(page, name).getByRole("button", { name: "Add Progress" }).click();
    await page.locator("#amount").fill("250");
    await page.getByRole("dialog").getByRole("button", { name: "Add Amount" }).click();
    await expect(goalCard(page, name).getByText("25.0%")).toBeVisible();
    await expect(goalCard(page, name).getByText("$250.00")).toBeVisible();
  });

  test("complete-state at 100%: emerald ring + Complete badge + Add Progress removed (round-11)", async ({ page }) => {
    const name = uniqueName("Done goal");
    await createGoal(page, name, "100");
    await goalCard(page, name).getByRole("button", { name: "Add Progress" }).click();
    await page.locator("#amount").fill("100");
    await page.getByRole("dialog").getByRole("button", { name: "Add Amount" }).click();

    await expect(goalCard(page, name).getByText("Complete", { exact: true })).toBeVisible();
    await expect(goalCard(page, name).getByText("100.0%")).toBeVisible();
    // The complete card carries the emerald ring classes.
    await expect(
      page.locator(".ring-2.ring-emerald-200").filter({ hasText: name })
    ).toBeVisible();
    // And its Add Progress button is gone entirely (not disabled).
    await expect(goalCard(page, name).getByRole("button", { name: "Add Progress" })).toHaveCount(0);
  });

  test("overshoot is uncapped — 150.0% renders with the complete-state (round-11)", async ({ page }) => {
    const name = uniqueName("Overshoot goal");
    await createGoal(page, name, "100");
    // The UI button disappears at 100%, so the remaining progress goes
    // through the app's own API (the same call Add Progress makes).
    await goalCard(page, name).getByRole("button", { name: "Add Progress" }).click();
    await page.locator("#amount").fill("100");
    await page.getByRole("dialog").getByRole("button", { name: "Add Amount" }).click();
    await expect(goalCard(page, name).getByText("100.0%")).toBeVisible();

    const goals = await page.request.get("/api/goals");
    const payload = (await goals.json()) as { ok: boolean; data: { id: string; name: string }[] };
    const goal = payload.data.find((row) => row.name === name);
    expect(goal).toBeTruthy();
    const patched = await page.request.patch(`/api/goals/${goal!.id}`, {
      data: { contributeMinor: 5000 },
    });
    expect(patched.ok()).toBeTruthy();

    await page.reload();
    await expect(goalCard(page, name).getByText("150.0%")).toBeVisible();
    await expect(goalCard(page, name).getByText("$150.00")).toBeVisible();
    await expect(goalCard(page, name).getByRole("button", { name: "Add Progress" })).toHaveCount(0);
  });

  test("negative target renders with no Complete badge (round-11)", async ({ page }) => {
    const name = uniqueName("Debt payoff");
    await createGoal(page, name, "-500");
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await expect(goalCard(page, name).getByText("-$500.00")).toBeVisible();
    // 0% progress on a negative target — no badge, Add Progress stays.
    await expect(goalCard(page, name).getByText("Complete", { exact: true })).toHaveCount(0);
    await expect(goalCard(page, name).getByRole("button", { name: "Add Progress" })).toBeVisible();
  });

  test("delete uses the native goal confirm", async ({ page }) => {
    const name = uniqueName("Doomed goal");
    const dialogs = autoAcceptConfirms(page);
    await createGoal(page, name, "300");
    await page.getByRole("button", { name: `Delete ${name}` }).click();
    await expect.poll(() => dialogs.lastMessage()).toContain("Are you sure you want to delete this goal?");
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});
