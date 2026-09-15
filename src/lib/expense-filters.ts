import { subcategoryLabel } from "@/lib/categories";

/**
 * Pure expense-list filtering — mirrors the source app's Filters panel:
 * Date Range (presets + custom), Category, Min/Max Amount, search, and sorting.
 * The badge count replicates the source app's quirk of counting the two
 * default amount fields (min 0.00 / max no-limit) as "active" filters.
 */

export type DateRangePreset = "today" | "7d" | "30d" | "this-month" | "last-month" | "custom" | "all";
export type SortField = "date" | "amount" | "description";

export interface ExpenseFilters {
  search: string;
  category: "All categories" | "Needs" | "Wants" | "Savings";
  dateRange: DateRangePreset;
  customFrom: string | null;
  customTo: string | null;
  minMinor: number | null;
  maxMinor: number | null;
  sortBy: SortField;
  sortDesc: boolean;
}

export function defaultExpenseFilters(): ExpenseFilters {
  return {
    search: "",
    category: "All categories",
    dateRange: "all",
    customFrom: null,
    customTo: null,
    minMinor: 0,
    maxMinor: null,
    sortBy: "date",
    sortDesc: true,
  };
}

/** The source app shows a "2" badge in the default state (min + max inputs). */
export function countActiveFilters(filters: ExpenseFilters): number {
  const defaults = defaultExpenseFilters();
  let count = 0;
  if (filters.search.trim() !== defaults.search) count += 1;
  if (filters.category !== defaults.category) count += 1;
  if (filters.dateRange !== defaults.dateRange) count += 1;
  if (filters.dateRange === "custom" && (filters.customFrom || filters.customTo)) count += 1;
  if (filters.minMinor !== null && filters.minMinor !== defaults.minMinor) count += 1;
  if (filters.maxMinor !== null) count += 1;
  if (filters.sortBy !== defaults.sortBy) count += 1;
  if (filters.sortDesc !== defaults.sortDesc) count += 1;
  // The source app counts the two default amount controls even untouched.
  if (filters.minMinor === defaults.minMinor && filters.maxMinor === defaults.maxMinor) count += 2;
  return count;
}

export interface FilterableExpenseRow {
  id: string;
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  date: string;
}

function dayBounds(date: Date): { start: number; end: number } | null {
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return { start, end: start + 24 * 60 * 60 * 1000 - 1 };
}

function isoDayBounds(iso: string): { start: number; end: number } | null {
  return dayBounds(new Date(iso));
}

export function resolveDateRange(
  filters: ExpenseFilters,
  now: Date,
): { from: number; to: number } | null {
  const toRange = (bounds: { start: number; end: number } | null) =>
    bounds ? { from: bounds.start, to: bounds.end } : null;
  switch (filters.dateRange) {
    case "today":
      return toRange(dayBounds(now));
    case "7d": {
      const today = dayBounds(now);
      if (!today) return null;
      return { from: today.start - 6 * 24 * 60 * 60 * 1000, to: today.end };
    }
    case "30d": {
      const today = dayBounds(now);
      if (!today) return null;
      return { from: today.start - 29 * 24 * 60 * 60 * 1000, to: today.end };
    }
    case "this-month": {
      const endOfToday = dayBounds(now);
      if (!endOfToday) return null;
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), to: endOfToday.end };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), 1).getTime() - 1;
      return { from: start, to: end };
    }
    case "custom": {
      const from = filters.customFrom ? isoDayBounds(`${filters.customFrom}T00:00:00`)?.start ?? null : null;
      const to = filters.customTo ? isoDayBounds(`${filters.customTo}T00:00:00`)?.end ?? null : null;
      if (from === null && to === null) return null;
      return { from: from ?? Number.NEGATIVE_INFINITY, to: to ?? Number.POSITIVE_INFINITY };
    }
    default:
      return null; // "all"
  }
}

export function applyExpenseFilters<T extends FilterableExpenseRow>(
  rows: readonly T[],
  filters: ExpenseFilters,
  now: Date,
): T[] {
  const term = filters.search.trim().toLowerCase();
  const range = resolveDateRange(filters, now);

  const filtered = rows.filter((row) => {
    if (filters.category !== "All categories" && row.category !== filters.category) return false;
    if (filters.minMinor !== null && row.amountMinor < filters.minMinor) return false;
    if (filters.maxMinor !== null && row.amountMinor > filters.maxMinor) return false;
    if (range) {
      const time = new Date(row.date).getTime();
      if (time < range.from || time > range.to) return false;
    }
    if (term !== "") {
      const haystack = `${row.description} ${subcategoryLabel(row.subcategory)}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case "amount":
        return filters.sortDesc ? b.amountMinor - a.amountMinor : a.amountMinor - b.amountMinor;
      case "description":
        return filters.sortDesc
          ? b.description.localeCompare(a.description)
          : a.description.localeCompare(b.description);
      default: {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filters.sortDesc ? dateB - dateA : dateA - dateB;
      }
    }
  });
  return sorted;
}
