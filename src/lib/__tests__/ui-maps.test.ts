import { describe, expect, it } from "vitest";
import {
  ACCOUNT_TYPE_ICONS,
  ACTIVITY_BADGE,
  CATEGORY_BADGE,
  CATEGORY_DOT,
  GOAL_EMOJI,
  PRIORITY_BADGE,
  SECTOR_COLORS,
} from "@/lib/ui-maps";

describe("SECTOR_COLORS (source-exact, verified on live 2026-09-15)", () => {
  it("maps every sector to its exact live hex color", () => {
    expect(SECTOR_COLORS.technology).toBe("#3B82F6"); // blue-500
    expect(SECTOR_COLORS.healthcare).toBe("#10B981"); // emerald-500
    expect(SECTOR_COLORS.finance).toBe("#8B5CF6"); // violet-500
    expect(SECTOR_COLORS.energy).toBe("#F59E0B"); // amber-500
    expect(SECTOR_COLORS.consumer).toBe("#EF4444"); // red-500
    expect(SECTOR_COLORS.industrial).toBe("#6B7280"); // gray-500
    expect(SECTOR_COLORS["real-estate"]).toBe("#06B6D4"); // cyan-500
    expect(SECTOR_COLORS.utilities).toBe("#84CC22"); // lime-500
    expect(SECTOR_COLORS.other).toBe("#D1D5DB"); // gray-300
  });

  it("covers all nine live sectors exactly once", () => {
    expect(Object.keys(SECTOR_COLORS).sort()).toEqual(
      [
        "consumer",
        "energy",
        "finance",
        "healthcare",
        "industrial",
        "other",
        "real-estate",
        "technology",
        "utilities",
      ].sort(),
    );
  });
});

describe("GOAL_EMOJI (verified on live by creating each category)", () => {
  it("maps every goal category to its live emoji", () => {
    expect(GOAL_EMOJI.emergency).toBe("🛡️");
    expect(GOAL_EMOJI.vacation).toBe("✈️");
    expect(GOAL_EMOJI.home).toBe("🏠");
    expect(GOAL_EMOJI.car).toBe("🚗");
    expect(GOAL_EMOJI.education).toBe("🎓");
    expect(GOAL_EMOJI.retirement).toBe("🏖️");
    expect(GOAL_EMOJI.other).toBe("🎯");
  });
});

describe("PRIORITY_BADGE (verified on live: high/medium/low goals)", () => {
  it("uses the live badge classes", () => {
    expect(PRIORITY_BADGE.high).toContain("bg-red-100");
    expect(PRIORITY_BADGE.high).toContain("text-red-800");
    expect(PRIORITY_BADGE.medium).toContain("bg-yellow-100");
    expect(PRIORITY_BADGE.medium).toContain("text-yellow-800");
    expect(PRIORITY_BADGE.low).toContain("bg-green-100");
    expect(PRIORITY_BADGE.low).toContain("text-green-800");
  });
});

describe("CATEGORY_DOT / CATEGORY_BADGE (verified on live expenses + budget)", () => {
  it("budget dots: needs blue, wants purple, savings emerald", () => {
    expect(CATEGORY_DOT.needs).toBe("bg-blue-500");
    expect(CATEGORY_DOT.wants).toBe("bg-purple-500");
    expect(CATEGORY_DOT.savings).toBe("bg-emerald-500");
  });

  it("expense row badges carry the live solid pill + border classes", () => {
    expect(CATEGORY_BADGE.needs).toContain("bg-blue-100");
    expect(CATEGORY_BADGE.needs).toContain("text-blue-800");
    expect(CATEGORY_BADGE.wants).toContain("bg-purple-100");
    expect(CATEGORY_BADGE.wants).toContain("text-purple-800");
    expect(CATEGORY_BADGE.savings).toContain("bg-emerald-100");
    expect(CATEGORY_BADGE.savings).toContain("text-emerald-800");
  });
});

describe("ACCOUNT_TYPE_ICONS (verified on live by creating each type)", () => {
  it("maps account types to the live lucide icons", () => {
    const names = (icon: { displayName?: string }) => icon.displayName;
    expect(names(ACCOUNT_TYPE_ICONS.checking)).toBe("Banknote");
    expect(names(ACCOUNT_TYPE_ICONS.savings)).toBe("Landmark");
    expect(names(ACCOUNT_TYPE_ICONS["credit-card"])).toBe("Banknote");
    expect(names(ACCOUNT_TYPE_ICONS.investment)).toBe("Building");
    expect(names(ACCOUNT_TYPE_ICONS.other)).toBe("Building");
  });
});

describe("ACTIVITY_BADGE (Recent Activity rows, live-verified 2026-09-15 round 4)", () => {
  it("maps income categories to their live badge colors", () => {
    expect(ACTIVITY_BADGE.primary).toBe(
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    );
    expect(ACTIVITY_BADGE.secondary).toBe(
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    );
    expect(ACTIVITY_BADGE.passive).toBe(
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    );
    expect(ACTIVITY_BADGE.other).toBe(
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    );
  });

  it("maps the 50/30/20 buckets to their live badge colors (no border variant)", () => {
    expect(ACTIVITY_BADGE.needs).toBe(
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    );
    expect(ACTIVITY_BADGE.wants).toBe(
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    );
    expect(ACTIVITY_BADGE.savings).toBe(
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    );
  });

  it("is distinct from the expense-row CATEGORY_BADGE (which carries border variants)", () => {
    expect(ACTIVITY_BADGE.wants).not.toContain("border-purple-200");
    expect(CATEGORY_BADGE.wants).toContain("border-purple-200");
    expect(CATEGORY_BADGE.wants).toContain("dark:bg-purple-900/20");
    expect(ACTIVITY_BADGE.wants).toContain("dark:bg-purple-900/30");
  });
});
