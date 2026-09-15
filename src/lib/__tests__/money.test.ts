import { describe, expect, it } from "vitest";
import { changePercent, formatMoney, monthlyEquivalent, percent, toMinorUnits } from "@/lib/money";

describe("toMinorUnits", () => {
  it("converts decimal strings to integer minor units", () => {
    expect(toMinorUnits("4.50")).toBe(450);
    expect(toMinorUnits("5000")).toBe(500000);
    expect(toMinorUnits(12.99)).toBe(1299);
  });

  it("rejects negative, NaN and non-finite input", () => {
    expect(() => toMinorUnits("-1")).toThrow();
    expect(() => toMinorUnits("abc")).toThrow();
    expect(() => toMinorUnits(Number.NaN)).toThrow();
    expect(() => toMinorUnits(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("formatMoney", () => {
  it("formats USD with two decimals", () => {
    expect(formatMoney(450)).toBe("$4.50");
    expect(formatMoney(500000)).toBe("$5,000.00");
  });

  it("renders negative amounts with a leading minus", () => {
    expect(formatMoney(-450)).toBe("-$4.50");
  });

  it("renders positive amounts with a plus when signed", () => {
    expect(formatMoney(500000, { signed: true })).toBe("+$5,000.00");
    expect(formatMoney(0, { signed: true })).toBe("$0.00");
  });
});

describe("percent", () => {
  it("computes a ratio in percent", () => {
    expect(percent(2500, 10000)).toBe(25);
  });

  it("is safe against division by zero", () => {
    expect(percent(10, 0)).toBe(0);
  });
});

describe("changePercent", () => {
  it("computes month-over-month change", () => {
    expect(changePercent(1100, 1000)).toBeCloseTo(10);
    expect(changePercent(900, 1000)).toBeCloseTo(-10);
  });

  it("returns null when there is no prior value", () => {
    expect(changePercent(500, 0)).toBeNull();
    expect(changePercent(0, 0)).toBeNull();
  });
});

describe("monthlyEquivalent", () => {
  it("passes monthly amounts through unchanged", () => {
    expect(monthlyEquivalent(250000, "monthly")).toBe(250000);
  });

  it("normalizes weekly income over 52 weeks", () => {
    expect(monthlyEquivalent(520000, "weekly")).toBe(Math.round((520000 * 52) / 12));
  });

  it("normalizes bi-weekly income over 26 paychecks", () => {
    expect(monthlyEquivalent(480000, "biweekly")).toBe(Math.round((480000 * 26) / 12));
  });

  it("normalizes annual income down to a twelfth", () => {
    expect(monthlyEquivalent(120000, "annual")).toBe(10000);
    expect(monthlyEquivalent(1200000, "annual")).toBe(100000);
  });
});
