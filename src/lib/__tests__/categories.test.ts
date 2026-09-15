import { describe, expect, it } from "vitest";
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  DATE_FORMATS,
  GOAL_CATEGORIES,
  GOAL_PRIORITIES,
  INCOME_CATEGORIES,
  INCOME_FREQUENCIES,
  INVESTMENT_TYPES,
  SECTORS,
  SUBCATEGORIES,
  subcategoriesFor,
  subcategoryLabel,
} from "@/lib/categories";

describe("expense taxonomy (source-app parity)", () => {
  it("has exactly the live subcategory sets, in order", () => {
    expect(subcategoriesFor("Needs").map((s) => s.label)).toEqual([
      "Rent",
      "Groceries",
      "Utilities",
      "Transportation",
      "Healthcare",
      "Other",
    ]);
    expect(subcategoriesFor("Wants").map((s) => s.label)).toEqual([
      "Other",
      "Dining",
      "Entertainment",
      "Shopping",
      "Subscriptions",
    ]);
    expect(subcategoriesFor("Savings").map((s) => s.label)).toEqual([
      "Other",
      "Emergency Fund",
      "Investments",
      "Retirement",
    ]);
  });

  it("keeps quick-select to the five Needs essentials", () => {
    expect(SUBCATEGORIES.filter((s) => s.category === "Needs").slice(0, 5).map((s) => s.label)).toEqual([
      "Rent",
      "Groceries",
      "Utilities",
      "Transportation",
      "Healthcare",
    ]);
  });

  it("labels unknown subcategories as Other", () => {
    expect(subcategoryLabel("does-not-exist")).toBe("Other");
  });
});

describe("income taxonomy", () => {
  it("frequency set matches the live app exactly", () => {
    expect([...INCOME_FREQUENCIES]).toEqual(["monthly", "weekly", "biweekly", "annual"]);
  });

  it("category set matches the live app exactly", () => {
    expect(INCOME_CATEGORIES.map((c) => c.label)).toEqual([
      "Primary Income",
      "Secondary Income",
      "Passive Income",
      "Other",
    ]);
  });
});

describe("goal taxonomy", () => {
  it("category set matches the live app exactly", () => {
    expect(GOAL_CATEGORIES.map((c) => c.label)).toEqual([
      "Emergency",
      "Vacation",
      "Home",
      "Car",
      "Education",
      "Retirement",
      "Other",
    ]);
  });

  it("priority set is High / Medium / Low", () => {
    expect(GOAL_PRIORITIES.map((p) => p.label)).toEqual(["High", "Medium", "Low"]);
  });
});

describe("investment taxonomy", () => {
  it("type set matches the live app exactly", () => {
    expect(INVESTMENT_TYPES.map((t) => t.label)).toEqual([
      "Stock",
      "ETF",
      "Bond",
      "Crypto",
      "Mutual Fund",
      "Other",
    ]);
  });

  it("sector set matches the live app exactly", () => {
    expect([...SECTORS]).toEqual([
      "Technology",
      "Healthcare",
      "Finance",
      "Energy",
      "Consumer",
      "Industrial",
      "Real Estate",
      "Utilities",
      "Other",
    ]);
  });
});

describe("account taxonomy", () => {
  it("type set matches the live app exactly", () => {
    expect(ACCOUNT_TYPES.map((t) => t.label)).toEqual([
      "Checking",
      "Savings",
      "Credit Card",
      "Investment",
      "Other",
    ]);
  });
});

describe("settings option lists", () => {
  it("currency list matches the live app exactly", () => {
    expect(CURRENCIES.map((c) => c.code)).toEqual(["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "NOK", "DKK"]);
  });

  it("date format list matches the live app exactly", () => {
    expect(DATE_FORMATS.map((d) => d.id)).toEqual([
      "MM/dd/yyyy",
      "dd/MM/yyyy",
      "yyyy-MM-dd",
      "dd MMM yyyy",
      "MMM dd, yyyy",
    ]);
  });
});
