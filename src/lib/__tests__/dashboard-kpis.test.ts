import { describe, expect, it } from "vitest";
import { budgetRemainingLabel } from "@/lib/dashboard-kpis";
import { computeDashboardKpis, PLACEHOLDER_TRENDS } from "@/lib/dashboard-kpis";

interface ExpenseInput {
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  date: Date;
}

interface IncomeInput {
  name: string;
  amountMinor: number;
  frequency: string;
}

interface GoalInput {
  currentAmountMinor: number;
  targetAmountMinor: number;
}

const NOW = new Date(2026, 8, 15); // Sep 15 2026 — fixed clock for determinism

function makeKpis(expenses: ExpenseInput[], income: IncomeInput[], goals: GoalInput[]) {
  return computeDashboardKpis({
    expenses,
    incomeSources: income,
    goals,
    now: NOW,
  });
}

describe("savings progress (source-app semantics: goal progress)", () => {
  it("computes total current / total target across goals", () => {
    const kpis = makeKpis([], [], [
      { currentAmountMinor: 2500, targetAmountMinor: 10000 },
    ]);
    expect(kpis.savingsProgressPercent).toBe(25);
  });

  it("aggregates multiple goals into one weighted ratio", () => {
    const kpis = makeKpis([], [], [
      { currentAmountMinor: 2500, targetAmountMinor: 10000 },
      { currentAmountMinor: 7500, targetAmountMinor: 10000 },
    ]);
    expect(kpis.savingsProgressPercent).toBe(50);
  });

  it("is 0 when there are no goals", () => {
    const kpis = makeKpis([], [], []);
    expect(kpis.savingsProgressPercent).toBe(0);
  });
});

describe("trend placeholders (source-app fallbacks)", () => {
  it("returns the exact placeholder set on an empty database", () => {
    const kpis = makeKpis([], [], []);
    expect(kpis.incomeChangePercent).toBe(PLACEHOLDER_TRENDS.income);
    expect(kpis.expenseChangePercent).toBe(PLACEHOLDER_TRENDS.expense);
    expect(kpis.netChangePercent).toBe(PLACEHOLDER_TRENDS.netNoIncome);
  });

  it("uses the with-income net placeholder when only the current month has data", () => {
    const kpis = makeKpis(
      [{ description: "Coffee", amountMinor: 450, category: "Wants", subcategory: "dining", date: new Date(2026, 8, 15) }],
      [{ name: "Salary", amountMinor: 500000, frequency: "monthly" }],
      [],
    );
    expect(kpis.incomeChangePercent).toBe(PLACEHOLDER_TRENDS.income);
    expect(kpis.expenseChangePercent).toBe(PLACEHOLDER_TRENDS.expense);
    expect(kpis.netChangePercent).toBe(PLACEHOLDER_TRENDS.netWithIncome);
  });

  it("computes real month-over-month when both months have data", () => {
    const kpis = makeKpis(
      [
        { description: "A", amountMinor: 10000, category: "Needs", subcategory: "rent", date: new Date(2026, 8, 5) },
        { description: "B", amountMinor: 5000, category: "Needs", subcategory: "rent", date: new Date(2026, 7, 5) },
      ],
      [{ name: "Salary", amountMinor: 100000, frequency: "monthly" }],
      [],
    );
    // expenses 100.00 vs 50.00 prior month → +100%
    expect(kpis.expenseChangePercent).not.toBe(PLACEHOLDER_TRENDS.expense);
    expect(kpis.expenseChangePercent).toBe(100);
  });
});

describe("largest expense category", () => {
  it("returns the top-level 50/30/20 bucket name", () => {
    const kpis = makeKpis(
      [
        { description: "Coffee", amountMinor: 450, category: "Wants", subcategory: "dining", date: new Date(2026, 8, 15) },
        { description: "Rent", amountMinor: 245000, category: "Needs", subcategory: "rent", date: new Date(2026, 8, 1) },
      ],
      [],
      [],
    );
    expect(kpis.largestExpenseCategory).toBe("Needs");
    expect(kpis.largestExpenseMinor).toBe(245000);
  });

  it("is null with amount 0 when there are no expenses", () => {
    const kpis = makeKpis([], [], []);
    expect(kpis.largestExpenseCategory).toBeNull();
    expect(kpis.largestExpenseMinor).toBe(0);
  });
});

describe("monthly totals", () => {
  it("counts only current-month expenses", () => {
    const kpis = makeKpis(
      [
        { description: "Now", amountMinor: 10000, category: "Needs", subcategory: "rent", date: new Date(2026, 8, 5) },
        { description: "Last month", amountMinor: 99000, category: "Needs", subcategory: "rent", date: new Date(2026, 7, 5) },
      ],
      [],
      [],
    );
    expect(kpis.monthlyExpensesMinor).toBe(10000);
  });

  it("normalizes income frequencies to monthly equivalents", () => {
    const kpis = makeKpis([], [
      { name: "Salary", amountMinor: 480000, frequency: "biweekly" },
      { name: "Rental", amountMinor: 95000, frequency: "monthly" },
    ], []);
    expect(kpis.monthlyIncomeMinor).toBe(Math.round((480000 * 26) / 12) + 95000);
  });

  it("computes net balance as income minus expenses", () => {
    const kpis = makeKpis(
      [{ description: "Coffee", amountMinor: 450, category: "Wants", subcategory: "dining", date: new Date(2026, 8, 15) }],
      [{ name: "Salary", amountMinor: 500000, frequency: "monthly" }],
      [],
    );
    expect(kpis.netBalanceMinor).toBe(499550);
  });
});

describe("recent activity", () => {
  it("mixes income and expenses, newest first", () => {
    const result = computeDashboardKpis({
      expenses: [
        { description: "Coffee", amountMinor: 450, category: "Wants", subcategory: "dining", date: new Date(2026, 8, 15) },
        { description: "Water bill", amountMinor: 6850, category: "Needs", subcategory: "utilities", date: new Date(2026, 8, 14) },
      ],
      incomeSources: [{ name: "Salary", amountMinor: 500000, frequency: "monthly" }],
      goals: [],
      now: NOW,
      recentIncomeEvents: [{ name: "Salary", amountMinor: 500000, category: "primary", date: new Date(2026, 8, 15) }],
    });
    expect(result.recentActivity).toHaveLength(3);
    expect(result.recentActivity[0]?.kind).toBe("income");
    expect(result.recentActivity[0]?.description).toBe("Salary");
    expect(result.recentActivity[2]?.description).toBe("Water bill");
  });

  it("carries the income source's category onto the activity item (live badge text)", () => {
    const result = computeDashboardKpis({
      expenses: [],
      incomeSources: [{ name: "Salary", amountMinor: 500000, frequency: "monthly" }],
      goals: [],
      now: NOW,
      recentIncomeEvents: [
        { name: "Salary", amountMinor: 500000, category: "primary", date: new Date(2026, 8, 15) },
        { name: "Rental", amountMinor: 95000, category: "passive", date: new Date(2026, 8, 14) },
      ],
    });
    expect(result.recentActivity[0]?.category).toBe("primary");
    expect(result.recentActivity[1]?.category).toBe("passive");
  });

  it("caps the feed at six entries", () => {
    const expenses: ExpenseInput[] = Array.from({ length: 10 }, (_, index) => ({
      description: `Expense ${index}`,
      amountMinor: 100,
      category: "Needs",
      subcategory: "rent",
      date: new Date(2026, 8, index + 1),
    }));
    const result = computeDashboardKpis({ expenses, incomeSources: [], goals: [], now: NOW });
    expect(result.recentActivity).toHaveLength(6);
  });
});

describe("monthly trend", () => {
  it("builds a six-month window ending on the current month with short-year labels", () => {
    const result = computeDashboardKpis({ expenses: [], incomeSources: [], goals: [], now: NOW });
    expect(result.monthlyTrend).toHaveLength(6);
    expect(result.monthlyTrend[0]?.month).toBe("Apr 26");
    expect(result.monthlyTrend[5]?.month).toBe("Sep 26");
  });
});

describe("budget remaining label (live-verified limit=0 edge)", () => {
  it("shows $0.00 remaining when the monthly limit is zero", () => {
    expect(budgetRemainingLabel(0, -450)).toBe("$0.00 remaining");
  });

  it("shows the plain remaining amount under budget", () => {
    expect(budgetRemainingLabel(100000, 40000)).toBe("$400.00 remaining");
  });

  it("shows the over-budget wording when a real limit is exceeded", () => {
    expect(budgetRemainingLabel(100000, -2500)).toBe("$25.00 over budget");
  });
});
