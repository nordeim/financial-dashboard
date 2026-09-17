import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/demo-user";

/**
 * Round-12 E2E helpers — golden-path drivers shared by every spec.
 *
 * The login IS a golden path (session lives in sessionStorage under
 * "finara-demo-session", finara-app.tsx:24), so each fresh context signs in
 * through the real UI — no storageState shortcut.
 */

/** Unique, greppable probe names — every created row is cleaned up by its spec. */
export function uniqueName(label: string): string {
  return `E2E ${label} ${Date.now()}`;
}

export async function login(page: Page, target = "/Dashboard"): Promise<void> {
  await page.goto(target);
  // Unauthenticated deep links replaceState to /login?from_url=… (ADR-021).
  // replaceState fires no navigation event — wait on the rendered form, not
  // the URL (the same rule applies to every SPA transition below).
  await expect(page.locator("#email")).toBeVisible();
  await page.locator("#email").fill(DEMO_EMAIL);
  await page.locator("#password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // First run of a fresh db/e2e.db: ensureSeeded() fires on the first API
  // request — the dashboard heading is the post-seed marker.
  await expect(page.getByRole("heading", { name: "Financial Dashboard" })).toBeVisible();
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: `${DEMO_EMAIL.split("@")[0]} ${DEMO_EMAIL}` }).click();
  await page.getByRole("menuitem", { name: "Sign Out" }).click();
  await expect(page.locator("#email")).toBeVisible();
}

/**
 * shadcn (Radix) Select driver — the popup lives in a portal, so the option
 * is located by role anywhere in the document.
 */
export async function selectCombobox(page: Page, triggerName: string, optionName: string | RegExp): Promise<void> {
  await page.getByRole("combobox", { name: triggerName }).click();
  await page.getByRole("option", { name: optionName }).click();
}

/** Native confirm() acceptance — returns the message of the last dialog seen. */
export function autoAcceptConfirms(page: Page): { lastMessage: () => string } {
  const state = { message: "" };
  page.on("dialog", async (dialog) => {
    state.message = dialog.message();
    await dialog.accept();
  });
  return {
    lastMessage: () => state.message,
  };
}

/** Capture a browser download (blob-anchor pattern) → filename + text body. */
export async function captureDownload(page: Page, trigger: () => Promise<void>): Promise<{ filename: string; body: string }> {
  const [download] = await Promise.all([page.waitForEvent("download"), trigger()]);
  const filename = download.suggestedFilename();
  const path = await download.path();
  return { filename, body: path ? readFileSync(path, "utf8") : "" };
}

/**
 * Console collector for the zero-error sweep (round 11 automated). Production
 * build — no dev-server noise exists, so warnings are held to the same bar.
 */
export function collectConsole(page: Page): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
    if (message.type() === "warning") warnings.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return { errors, warnings };
}

/** Navigate to a view by sidebar link (SPA soft-nav, no full reload). */
export async function navigateToView(page: Page, label: string, heading: string | RegExp): Promise<void> {
  await page.getByRole("link", { name: new RegExp(label, "i") }).first().click();
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
}

/** Restore the default settings (USD + MM/dd/yyyy) — specs that switch them
 *  must call this at the end so later specs in the serial suite still see
 *  dollar-formatted figures. */
export async function restoreDefaultSettings(page: Page): Promise<void> {
  await navigateToView(page, "Settings", "Settings");
  await page.getByRole("combobox", { name: "Default Currency" }).click();
  await page.getByRole("option", { name: "USD - US Dollar ($)" }).click();
  await page.getByRole("combobox", { name: "Date Format" }).click();
  await page.getByRole("option", { name: "MM/dd/yyyy (12/25/2024)" }).click();
  await page.getByRole("button", { name: "Save Settings" }).click();
}
