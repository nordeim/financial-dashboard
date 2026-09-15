import { describe, expect, it } from "vitest";
import { normalizeFinaraExport } from "@/lib/import-export";

const validExpense = {
  description: "Groceries",
  amountMinor: 5500,
  category: "Needs",
  subcategory: "groceries",
  date: "2026-09-01T00:00:00.000Z",
  notes: null,
  recurring: false,
};
const validIncome = {
  name: "Salary",
  amountMinor: 500000,
  frequency: "monthly",
  category: "primary",
  active: true,
  nextPaymentDate: null,
};
const validGoal = {
  name: "Emergency Fund",
  targetAmountMinor: 1000000,
  currentAmountMinor: 250000,
  deadline: null,
  category: "emergency",
  priority: "high",
};
const validAccount = {
  name: "Everyday Checking",
  type: "checking",
  institution: "Nordbank",
  balanceMinor: 250000,
  currency: "USD",
};

describe("normalizeFinaraExport", () => {
  it("round-trips a well-formed finara-export-v1 payload", () => {
    const result = normalizeFinaraExport({
      format: "finara-export-v1",
      expenses: [validExpense],
      incomeSources: [validIncome],
      goals: [validGoal],
      accounts: [validAccount],
    });
    expect(result.errors).toEqual([]);
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0]).toMatchObject({ description: "Groceries", amountMinor: 5500, category: "Needs" });
    expect(result.incomeSources).toHaveLength(1);
    expect(result.incomeSources[0]).toMatchObject({ name: "Salary", frequency: "monthly", category: "primary" });
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0]).toMatchObject({ name: "Emergency Fund", priority: "high" });
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0]).toMatchObject({ name: "Everyday Checking", type: "checking" });
    expect(result.accounts[0]?.lastSyncedAt).toBeInstanceOf(Date);
  });

  it("keeps valid rows and reports invalid rows per entity", () => {
    const result = normalizeFinaraExport({
      format: "finara-export-v1",
      expenses: [
        validExpense,
        { description: "", amountMinor: 100, category: "Needs", subcategory: "other", date: "2026-09-02" },
        { description: "No amount", amountMinor: "x", category: "Needs", subcategory: "other", date: "2026-09-02" },
        { description: "Bad category", amountMinor: 100, category: "Misc", subcategory: "other", date: "2026-09-02" },
        { description: "Bad date", amountMinor: 100, category: "Needs", subcategory: "other", date: "not-a-date" },
      ],
      goals: [validGoal, { name: "No target", currentAmountMinor: 0 }],
    });
    expect(result.expenses).toHaveLength(1);
    expect(result.errors.map((error) => error.entity)).toEqual(["expenses", "expenses", "expenses", "expenses", "goals"]);
    expect(result.errors.map((error) => error.row)).toEqual([2, 3, 4, 5, 2]);
  });

  it("defaults optional fields and clamps free-text enums to safe values", () => {
    const result = normalizeFinaraExport({
      format: "finara-export-v1",
      expenses: [{ description: "Legacy row", amountMinor: 200, category: "Needs", date: "09/03/2026" }],
      incomeSources: [{ name: "Dividends", amountMinor: 12000, frequency: "annual" }],
      goals: [{ name: "Trip", targetAmountMinor: 50000, currentAmountMinor: 100, category: "vacation" }],
      accounts: [{ name: "Old account", type: "unknown-type", balanceMinor: 0 }],
    });
    expect(result.expenses[0]?.subcategory).toBe("other");
    expect(result.expenses[0]?.recurring).toBe(false);
    expect(result.incomeSources[0]?.category).toBe("primary");
    expect(result.incomeSources[0]?.active).toBe(true);
    expect(result.goals[0]?.priority).toBe("medium");
    expect(result.accounts[0]?.type).toBe("other");
    expect(result.accounts[0]?.currency).toBe("USD");
    // MM/DD/YYYY bank-style dates are accepted.
    expect(result.expenses[0]?.date.getUTCFullYear()).toBe(2026);
  });

  it("accepts PascalCase entity keys (Accounts/Income/Goals) like the source app export", () => {
    const result = normalizeFinaraExport({
      Accounts: [validAccount],
      Income: [validIncome],
      Goals: [validGoal],
      Expenses: [validExpense],
    });
    expect(result.errors).toEqual([]);
    expect(result.accounts).toHaveLength(1);
    expect(result.incomeSources).toHaveLength(1);
    expect(result.goals).toHaveLength(1);
    expect(result.expenses).toHaveLength(1);
  });

  it("rejects non-object payloads with a top-level error", () => {
    const result = normalizeFinaraExport("nope");
    expect(result.expenses).toEqual([]);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0]?.entity).toBe("payload");
  });

  it("returns empty collections for an export without entities", () => {
    const result = normalizeFinaraExport({ format: "finara-export-v1" });
    expect(result.errors).toEqual([]);
    expect(result.expenses).toEqual([]);
    expect(result.incomeSources).toEqual([]);
    expect(result.goals).toEqual([]);
    expect(result.accounts).toEqual([]);
  });
});
