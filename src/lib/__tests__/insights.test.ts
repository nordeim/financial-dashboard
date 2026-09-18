import { describe, expect, it } from "vitest";

import {
  INSIGHT_TYPES,
  buildInsightDrafts,
  mergePolishedDrafts,
  type InsightDraftInput,
} from "@/lib/insights";

/**
 * Round 13 (F1) — the live app's AI Insights became a persisted-record
 * surface (TransactionInsight entities: insight_type / title / description /
 * suggested_action / confidence_score / category / is_dismissed, listed
 * "-created_date" limit 10, filtered to non-dismissed). The clone mirrors
 * the field set with a pure draft builder that the route persists once
 * when the table is empty. These specs pin the mapping the live's card
 * anatomy renders (probed 2026-09-18, captures/r13).
 */

const input: InsightDraftInput = {
  monthlyIncomeMinor: 500000,
  monthlyExpensesMinor: 350000,
  topCategory: { label: "Dining", amountMinor: 90000 },
  savingsRate: 30,
  currency: "USD",
  budgetNotes: [],
};

describe("insights: type taxonomy matches the live insight_type set", () => {
  it("covers the live's five types", () => {
    expect([...INSIGHT_TYPES].sort()).toEqual(
      ["alert", "anomaly", "opportunity", "prediction", "trend"].sort(),
    );
  });
});

describe("insights: deterministic drafts carry the live record shape", () => {
  it("returns at most three drafts with type/title/description/confidence", () => {
    const drafts = buildInsightDrafts(input);
    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts.length).toBeLessThanOrEqual(3);
    for (const draft of drafts) {
      expect(INSIGHT_TYPES).toContain(draft.insightType);
      expect(draft.title.length).toBeGreaterThan(0);
      expect(draft.description.length).toBeGreaterThan(0);
      expect(draft.confidenceScore).toBeGreaterThan(0);
      expect(draft.confidenceScore).toBeLessThanOrEqual(1);
    }
  });

  it("maps the savings-rate draft to an opportunity when at/above the 20% benchmark", () => {
    const drafts = buildInsightDrafts(input);
    const savings = drafts.find((d) => d.title === "Savings rate check");
    expect(savings).toBeDefined();
    expect(savings?.insightType).toBe("opportunity");
    expect(savings?.description).toContain("30.0%");
  });

  it("maps a below-benchmark savings rate to a trend with a suggested action", () => {
    const drafts = buildInsightDrafts({ ...input, savingsRate: 12 });
    const savings = drafts.find((d) => d.title === "Savings rate check");
    expect(savings?.insightType).toBe("trend");
    expect(savings?.suggestedAction).toBeDefined();
  });

  it("maps the top-category draft to a trend with a category", () => {
    const drafts = buildInsightDrafts(input);
    const top = drafts.find((d) => d.title === "Top spending category");
    expect(top?.insightType).toBe("trend");
    expect(top?.category).toBe("Dining");
    expect(top?.description).toContain("$900.00");
  });

  it("maps overspending to an alert with a suggested action", () => {
    const drafts = buildInsightDrafts({ ...input, monthlyExpensesMinor: 610000, savingsRate: -22 });
    const over = drafts.find((d) => d.title === "Spending exceeds income");
    expect(over?.insightType).toBe("alert");
    expect(over?.suggestedAction).toBeDefined();
  });

  it("maps budget-watch notes to alerts", () => {
    const drafts = buildInsightDrafts({
      ...input,
      savingsRate: 30,
      budgetNotes: ["Needs budget is 95% used ($2,850.00 of $3,000.00)."],
    });
    const watch = drafts.find((d) => d.title === "Budget watch");
    expect(watch?.insightType).toBe("alert");
    expect(watch?.category).toBe("Needs");
  });

  it("emits no savings draft without income (the live shows nothing for empty data)", () => {
    const drafts = buildInsightDrafts({ ...input, monthlyIncomeMinor: 0, savingsRate: 0 });
    expect(drafts.find((d) => d.title === "Savings rate check")).toBeUndefined();
  });
});

describe("insights: mergePolishedDrafts joins LLM output onto drafts by POSITION", () => {
  // Round-13 E2E gate finding: the LLM rewrites titles, so a title-keyed
  // join loses confidence/category (they silently fell back to 0.8 /
  // undefined whenever the polish rewrote a title). The prompt pins the
  // order — the join must be positional.
  const drafts = buildInsightDrafts(input);

  it("carries confidenceScore and category from the positional draft even when titles are rewritten", () => {
    const polished = mergePolishedDrafts(drafts, [
      { insight_type: "opportunity", title: "Great savings momentum!", description: "You are saving well." },
      { insight_type: "trend", title: "Dining dominates", description: "Dining is your top category." },
    ]);
    expect(polished).toHaveLength(2);
    expect(polished[0].title).toBe("Great savings momentum!");
    expect(polished[0].insightType).toBe("opportunity");
    // Positional carry: draft[0] confidence 0.9, NOT the 0.8 default.
    expect(polished[0].confidenceScore).toBe(drafts[0].confidenceScore);
    expect(polished[1].category).toBe(drafts[1].category);
    expect(polished[1].confidenceScore).toBe(drafts[1].confidenceScore);
  });

  it("falls back to the draft's insightType when the LLM emits an unknown type id", () => {
    const polished = mergePolishedDrafts(drafts, [
      { insight_type: "warning", title: "Rewritten", description: "Text." },
    ]);
    expect(INSIGHT_TYPES).toContain(polished[0].insightType);
    expect(polished[0].insightType).toBe(drafts[0].insightType);
  });

  it("keeps the draft's suggestedAction when the LLM omits it", () => {
    const withAction = buildInsightDrafts({ ...input, savingsRate: 12 });
    const polished = mergePolishedDrafts(withAction, [
      { insight_type: "trend", title: "Rewritten", description: "Text." },
    ]);
    expect(polished[0].suggestedAction).toBe(withAction[0].suggestedAction);
  });

  it("drops invalid entries without shifting the positions of later ones", () => {
    // Three drafts (savings below benchmark + top category + overspend).
    const three = buildInsightDrafts({ ...input, monthlyExpensesMinor: 610000, savingsRate: -22 });
    expect(three).toHaveLength(3);
    const polished = mergePolishedDrafts(three, [
      { insight_type: "trend", title: "First", description: "Valid." },
      { description: "No title — dropped, must not shift the join." },
      { insight_type: "alert", title: "Third", description: "Still draft #3's fields." },
    ]);
    expect(polished).toHaveLength(2);
    expect(polished[0].title).toBe("First");
    expect(polished[1].title).toBe("Third");
    // "Third" stays joined to drafts[2] — the dropped middle entry did not
    // shift it onto drafts[1].
    expect(polished[1].confidenceScore).toBe(three[2].confidenceScore);
    expect(polished[1].insightType).toBe("alert");
  });

  it("caps the merged set at the draft count (the LLM never adds records)", () => {
    const padded = [
      ...drafts.map((d) => ({ insight_type: d.insightType, title: d.title, description: d.description })),
      { insight_type: "anomaly", title: "Extra", description: "Beyond the drafts." },
    ];
    const polished = mergePolishedDrafts(drafts, padded);
    expect(polished.length).toBeLessThanOrEqual(drafts.length);
  });

  it("returns the drafts untouched for non-array or empty LLM output", () => {
    expect(mergePolishedDrafts(drafts, undefined)).toBe(drafts);
    expect(mergePolishedDrafts(drafts, null)).toBe(drafts);
    expect(mergePolishedDrafts(drafts, "not json")).toBe(drafts);
    expect(mergePolishedDrafts(drafts, [])).toBe(drafts);
    expect(mergePolishedDrafts(drafts, [{ title: 7, description: null }])).toBe(drafts);
  });
});
