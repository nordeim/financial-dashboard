import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/date-format";

const ISO = "2026-09-15T12:00:00.000Z";

describe("formatDate", () => {
  it("renders MM/dd/yyyy", () => {
    expect(formatDate(ISO, "MM/dd/yyyy")).toBe("09/15/2026");
  });

  it("renders dd/MM/yyyy", () => {
    expect(formatDate(ISO, "dd/MM/yyyy")).toBe("15/09/2026");
  });

  it("renders yyyy-MM-dd", () => {
    expect(formatDate(ISO, "yyyy-MM-dd")).toBe("2026-09-15");
  });

  it("renders dd MMM yyyy", () => {
    expect(formatDate(ISO, "dd MMM yyyy")).toBe("15 Sep 2026");
  });

  it("renders MMM dd, yyyy", () => {
    expect(formatDate(ISO, "MMM dd, yyyy")).toBe("Sep 15, 2026");
  });

  it("falls back to MM/dd/yyyy for unknown formats", () => {
    expect(formatDate(ISO, "nope" as never)).toBe("09/15/2026");
  });
});

describe("formatDate local-time semantics", () => {
  it("uses local date parts, not UTC, so 23:00 UTC stays on its day", () => {
    // 2026-09-15T23:30Z is still Sep 15 in UTC+8 — the local parts win.
    expect(formatDate("2026-09-15T23:30:00.000Z", "yyyy-MM-dd")).toBe("2026-09-15");
  });
});
