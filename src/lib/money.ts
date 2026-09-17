/**
 * Money helpers — all persisted amounts are integer minor units (cents).
 * Floats never touch money arithmetic; conversion happens at the edges only.
 */

export const MINOR_PER_UNIT = 100;

/** Parse a user-entered decimal amount into integer minor units.
 *
 * Signed by design (ADR-024, round-11 live probe): the source app's number
 * inputs carry no `min` and its backend persists negative amounts (a -5.50
 * expense rendered `--$5.50` on the live row) — negatives convert, only
 * non-finite values are invalid.
 */
export function toMinorUnits(input: string | number): number {
  const parsed = typeof input === "number" ? input : Number.parseFloat(input);
  if (!Number.isFinite(parsed)) {
    throw new RangeError(`Invalid monetary amount: ${String(input)}`);
  }
  return Math.round(parsed * MINOR_PER_UNIT);
}

/** Render minor units as a localized currency string (default USD). */
export function formatMoney(
  amountMinor: number,
  options: { currency?: string; locale?: string; signed?: boolean } = {},
): string {
  const { currency = "USD", locale = "en-US", signed = false } = options;
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(Math.abs(amountMinor) / MINOR_PER_UNIT);
  if (signed && amountMinor > 0) return `+${formatted}`;
  // -0 keeps its sign like the live app's direct Intl rendering (a
  // negative-shares/zero-price holding shows "-$0.00" — round-11 probe).
  if (amountMinor < 0 || Object.is(amountMinor, -0)) return `-${formatted}`;
  return formatted;
}

/**
 * Currency symbol for a ISO code (round 9: the live income quick-amount chips
 * render `+<symbol><amount>` and follow the Settings currency). Derived from
 * Intl so it always matches what formatMoney renders for the same code.
 */
export function currencySymbol(currency: string): string {
  const parts = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? "$";
}

/**
 * Compact axis formatting was retired in round 9: the live app renders FULL
 * money strings on BOTH chart axes ($1,500.00-style on the trend, $2.00-style
 * on the category bars — r7 captures re-read). formatMoney is the only
 * formatter; there is no compact variant.
 */

/** Percentage helper safe against division by zero. */
export function percent(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/** Month-over-month change in percent; returns null when no prior value exists. */
export function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Normalizes an income source to its monthly-equivalent minor units. */
export function monthlyEquivalent(amountMinor: number, frequency: string): number {
  switch (frequency) {
    case "weekly":
      return Math.round((amountMinor * 52) / 12);
    case "biweekly":
      return Math.round((amountMinor * 26) / 12);
    case "annual":
      return Math.round(amountMinor / 12);
    // Legacy rows only — the source app's frequency set is monthly/weekly/
    // bi-weekly/annual and the seed no longer emits these values.
    case "quarterly":
      return Math.round(amountMinor / 3);
    case "one-time":
      return 0;
    default:
      return amountMinor;
  }
}
