import { describe, expect, it } from "vitest";
import { applyExpenseFilters, countActiveFilters, defaultExpenseFilters, type ExpenseFilters } from "@/lib/expense-filters";

interface Row {
  id: string;
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  date: string; // ISO
}

const NOW = new Date(2026, 8, 15); // Sep 15 2026

const ROWS: Row[] = [
  { id: "1", description: "Weekly grocery haul", amountMinor: 20500, category: "Needs", subcategory: "groceries", date: "2026-09-15T01:00:00.000Z" },
  { id: "2", description: "Water bill", amountMinor: 6850, category: "Needs", subcategory: "utilities", date: "2026-09-14T01:00:00.000Z" },
  { id: "3", description: "Dinner at Trattoria Roma", amountMinor: 12500, category: "Wants", subcategory: "dining", date: "2026-08-09T01:00:00.000Z" },
  { id: "4", description: "Cinema - weekend show", amountMinor: 3200, category: "Wants", subcategory: "entertainment", date: "2026-08-16T01:00:00.000Z" },
  { id: "5", description: "Brokerage index purchase", amountMinor: 63168, category: "Savings", subcategory: "investments", date: "2026-07-15T01:00:00.000Z" },
  { id: "6", description: "Coffee beans subscription", amountMinor: 2200, category: "Wants", subcategory: "subscriptions", date: "2026-04-09T01:00:00.000Z" },
];

function run(filters: ExpenseFilters, rows: Row[] = ROWS): Row[] {
  return applyExpenseFilters(rows, filters, NOW) as Row[];
}

describe("countActiveFilters (badge)", () => {
  it("counts the two default amount filters like the source app", () => {
    expect(countActiveFilters(defaultExpenseFilters())).toBe(2);
  });

  it("counts every non-default control", () => {
    const filters: ExpenseFilters = {
      ...defaultExpenseFilters(),
      dateRange: "this-month",
      category: "Needs",
      search: "bill",
      sortBy: "amount",
      sortDesc: false,
    };
    expect(countActiveFilters(filters)).toBe(7);
  });
});

describe("date range presets", () => {
  it("today keeps only rows dated today", () => {
    const ids = run({ ...defaultExpenseFilters(), dateRange: "today" }).map((r) => r.id);
    expect(ids).toEqual(["1"]);
  });

  it("last 7 days spans Sep 9-15", () => {
    const ids = run({ ...defaultExpenseFilters(), dateRange: "7d" }).map((r) => r.id);
    expect(ids).toContain("1");
    expect(ids).toContain("2");
    expect(ids).not.toContain("3");
  });

  it("this month keeps September only", () => {
    const ids = run({ ...defaultExpenseFilters(), dateRange: "this-month" }).map((r) => r.id);
    expect(ids).toEqual(["1", "2"]);
  });

  it("last month keeps August only", () => {
    const ids = run({ ...defaultExpenseFilters(), dateRange: "last-month" }).map((r) => r.id);
    expect(ids.sort()).toEqual(["3", "4"]);
  });

  it("custom range bounds inclusively by day", () => {
    const ids = run({
      ...defaultExpenseFilters(),
      dateRange: "custom",
      customFrom: "2026-08-01",
      customTo: "2026-08-31",
    }).map((r) => r.id);
    expect(ids.sort()).toEqual(["3", "4"]);
  });

  it("all keeps everything", () => {
    expect(run({ ...defaultExpenseFilters(), dateRange: "all" })).toHaveLength(6);
  });
});

describe("category + amount + search", () => {
  it("filters by single 50/30/20 category", () => {
    const ids = run({ ...defaultExpenseFilters(), category: "Needs" }).map((r) => r.id);
    expect(ids.sort()).toEqual(["1", "2"]);
  });

  it("min amount excludes cheaper rows", () => {
    const ids = run({ ...defaultExpenseFilters(), minMinor: 10000 }).map((r) => r.id);
    expect(ids.sort()).toEqual(["1", "3", "5"]);
  });

  it("max amount excludes pricier rows", () => {
    const ids = run({ ...defaultExpenseFilters(), maxMinor: 7000 }).map((r) => r.id);
    expect(ids.sort()).toEqual(["2", "4", "6"]);
  });

  it("search matches description and subcategory label case-insensitively", () => {
    expect(run({ ...defaultExpenseFilters(), search: "GROCERY" }).map((r) => r.id)).toEqual(["1"]);
    expect(run({ ...defaultExpenseFilters(), search: "dining" }).map((r) => r.id)).toEqual(["3"]);
  });
});

describe("sorting", () => {
  it("sorts by date descending by default", () => {
    expect(run(defaultExpenseFilters())[0]?.id).toBe("1");
  });

  it("sorts by date ascending when toggled", () => {
    expect(run({ ...defaultExpenseFilters(), sortDesc: false })[0]?.id).toBe("6");
  });

  it("sorts by amount descending", () => {
    expect(run({ ...defaultExpenseFilters(), sortBy: "amount" })[0]?.id).toBe("5");
  });

  it("sorts by description ascending", () => {
    expect(run({ ...defaultExpenseFilters(), sortBy: "description", sortDesc: false })[0]?.id).toBe("5");
  });
});

describe("combined filters", () => {
  it("intersects every active dimension", () => {
    const ids = run({
      ...defaultExpenseFilters(),
      dateRange: "this-month",
      category: "Needs",
      search: "bill",
    }).map((r) => r.id);
    expect(ids).toEqual(["2"]);
  });
});
