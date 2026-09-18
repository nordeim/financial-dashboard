import { test, expect } from "@playwright/test";
import { login, navigateToView, restoreDefaultSettings, signOut } from "./helpers";

/**
 * Settings propagation (round-9 ADR-022) + theme lifecycle (round-10
 * ADR-023): currency/date-format saves reformat every view, toggles
 * persist, dark mode survives reload, sign-out resets to light + clears
 * the stored key, sign-in re-applies the server theme.
 */
test.describe("settings propagation", () => {
  test("currency EUR reformats dashboard figures app-wide (ADR-022)", async ({ page }) => {
    await login(page);
    await navigateToView(page, "Settings", "Settings");
    await page.getByRole("combobox", { name: "Default Currency" }).click();
    await page.getByRole("option", { name: "EUR - Euro (€)" }).click();
    await page.getByRole("button", { name: "Save Settings" }).click();

    await navigateToView(page, "Dashboard", "Financial Dashboard");
    await expect(page.getByText("€").first()).toBeVisible();
    // Round 13: the only permitted $-text is the persisted AI-insight
    // record content — paragraphs inside an insight row (the dashboard's
    // only h4s). Records are immutable content generated with the
    // creation-time currency, exactly like the live's externally-generated
    // TransactionInsight rows (refresh re-lists, never regenerates).
    // Everything else renders live and must show €.
    const staleDollars = await page
      .getByText(/\$\d/)
      .evaluateAll((els) => els.filter((el) => !el.matches("h4 ~ p")).length);
    expect(staleDollars).toBe(0);
    await restoreDefaultSettings(page);
  });

  test("date format dd/MM/yyyy reformats rendered dates (ADR-022)", async ({ page }) => {
    await login(page);
    await navigateToView(page, "Settings", "Settings");
    await page.getByRole("combobox", { name: "Date Format" }).click();
    await page.getByRole("option", { name: "dd/MM/yyyy (25/12/2024)" }).click();
    await page.getByRole("button", { name: "Save Settings" }).click();

    await navigateToView(page, "Expenses", "Expenses");
    await expect(page.getByText(/\d{2}\/\d{2}\/\d{4}/).first()).toBeVisible();
    await restoreDefaultSettings(page);
  });

  test("notification toggles save and persist reloads", async ({ page }) => {
    await login(page);
    await navigateToView(page, "Settings", "Settings");
    const push = page.getByRole("switch").first();
    const initial = await push.getAttribute("aria-checked");
    await push.click();
    await page.getByRole("button", { name: "Save Settings" }).click();
    await page.reload();
    await expect(page.getByRole("switch").first()).not.toHaveAttribute("aria-checked", initial ?? "");
  });
});

test.describe("theme lifecycle (ADR-023)", () => {
  test.use({ colorScheme: "light" });

  test("toggle persists dark across reloads (fire-and-forget PUT)", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: /sepnetflix2023 sepnetflix2023@outlook\.com/ }).click();
    await page.getByRole("menuitem", { name: "Dark Mode" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Financial Dashboard" })).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("finara-theme"))).toBe("dark");
  });

  test("sign-out resets to light + clears the stored key; sign-in re-applies the server theme", async ({ page }) => {
    await login(page);
    // The toggle menuitem is state-dependent ("Dark Mode" when light,
    // "Light Mode" when dark) — only toggle when the app renders light.
    const alreadyDark = await page.locator("html").evaluate((el) => el.classList.contains("dark"));
    if (!alreadyDark) {
      await page.getByRole("button", { name: /sepnetflix2023 sepnetflix2023@outlook\.com/ }).click();
      await page.getByRole("menuitem", { name: "Dark Mode" }).click();
    }
    await expect(page.locator("html")).toHaveClass(/dark/);

    await signOut(page);
    // Login always renders light and the stored key is gone.
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("finara-theme"))).toBeNull();

    // Sign-in re-applies the SERVER theme (async, like the live User/me).
    await page.locator("#email").fill("sepnetflix2023@outlook.com");
    await page.locator("#password").fill("Abcd1234");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Financial Dashboard" })).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
