/**
 * Domain taxonomy shared by expenses, income, goals, investments, accounts and
 * settings. Every set below mirrors the source app exactly (captured 2026-09-15
 * from the live app's own option lists) — order included, because the option
 * order is user-visible parity.
 */

import { GOAL_EMOJI } from "@/lib/ui-maps";

export const EXPENSE_CATEGORIES = ["Needs", "Wants", "Savings"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface SubcategoryDef {
  id: string;
  label: string;
  emoji: string;
  category: ExpenseCategory;
}

export const SUBCATEGORIES: readonly SubcategoryDef[] = [
  // Needs — Rent, Groceries, Utilities, Transportation, Healthcare, Other
  { id: "rent", label: "Rent", emoji: "🏠", category: "Needs" },
  { id: "groceries", label: "Groceries", emoji: "🛒", category: "Needs" },
  { id: "utilities", label: "Utilities", emoji: "⚡", category: "Needs" },
  { id: "transportation", label: "Transportation", emoji: "🚗", category: "Needs" },
  { id: "healthcare", label: "Healthcare", emoji: "🏥", category: "Needs" },
  { id: "other-needs", label: "Other", emoji: "📌", category: "Needs" },
  // Wants — Other first (the live app lists it first), then the essentials
  { id: "other-wants", label: "Other", emoji: "📌", category: "Wants" },
  { id: "dining", label: "Dining", emoji: "🍽️", category: "Wants" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", category: "Wants" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", category: "Wants" },
  { id: "subscriptions", label: "Subscriptions", emoji: "📺", category: "Wants" },
  // Savings — Other first, then the three buckets
  { id: "other-savings", label: "Other", emoji: "📌", category: "Savings" },
  { id: "emergency-fund", label: "Emergency Fund", emoji: "🚨", category: "Savings" },
  { id: "investments", label: "Investments", emoji: "📈", category: "Savings" },
  { id: "retirement", label: "Retirement", emoji: "🌴", category: "Savings" },
] as const;

/** Maps pre-remediation subcategory ids onto the live taxonomy. */
const LEGACY_SUBCATEGORY_MAP: Record<string, string> = {
  other: "other-wants", // legacy "other" lived under Wants
  debt: "other-needs",
  insurance: "other-needs",
  fitness: "other-wants",
  education: "other-wants",
  travel: "other-wants",
  emergency: "emergency-fund",
  investing: "investments",
};

export function normalizeSubcategory(id: string): string {
  return LEGACY_SUBCATEGORY_MAP[id] ?? id;
}

export function subcategoryLabel(id: string): string {
  const normalized = normalizeSubcategory(id);
  return SUBCATEGORIES.find((s) => s.id === normalized)?.label ?? "Other";
}

export function subcategoryEmoji(id: string): string {
  const normalized = normalizeSubcategory(id);
  return SUBCATEGORIES.find((s) => s.id === normalized)?.emoji ?? "📌";
}

export function subcategoriesFor(category: ExpenseCategory): SubcategoryDef[] {
  return SUBCATEGORIES.filter((s) => s.category === category);
}

/** Emoji quick-select grid shown first in the Add Expense sheet (five Needs).
 *  Tile copy is live-exact (round-5): the rent tile reads "Rent/Mortgage"
 *  while the subcategory id it stores ("rent") keeps the "Rent" label used
 *  by the selects and row badges. */
export const QUICK_SELECT_SUBCATEGORIES: readonly { id: string; label: string; emoji: string }[] = [
  { id: "rent", label: "Rent/Mortgage", emoji: "🏠" },
  { id: "groceries", label: "Groceries", emoji: "🛒" },
  { id: "utilities", label: "Utilities", emoji: "⚡" },
  { id: "transportation", label: "Transportation", emoji: "🚗" },
  { id: "healthcare", label: "Healthcare", emoji: "🏥" },
] as const;

export interface OptionDef {
  id: string;
  label: string;
}

export const ACCOUNT_TYPES: readonly OptionDef[] = [
  { id: "checking", label: "Checking" },
  { id: "savings", label: "Savings" },
  { id: "credit-card", label: "Credit Card" },
  { id: "investment", label: "Investment" },
  { id: "other", label: "Other" },
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number]["id"];

/** Maps pre-remediation account type ids onto the live taxonomy. */
const LEGACY_ACCOUNT_TYPE_MAP: Record<string, string> = {
  credit: "credit-card",
  cash: "other",
};

export function normalizeAccountType(id: string): string {
  return LEGACY_ACCOUNT_TYPE_MAP[id] ?? id;
}

export function accountTypeLabel(id: string): string {
  const normalized = normalizeAccountType(id);
  return ACCOUNT_TYPES.find((t) => t.id === normalized)?.label ?? "Other";
}

export const INCOME_FREQUENCIES = ["monthly", "weekly", "biweekly", "annual"] as const;
export type IncomeFrequency = (typeof INCOME_FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Monthly",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  annual: "Annual",
  // Legacy rows only (pre-remediation seed data).
  quarterly: "Quarterly",
  "one-time": "One-time",
};

export const INCOME_CATEGORIES: readonly OptionDef[] = [
  { id: "primary", label: "Primary Income" },
  { id: "secondary", label: "Secondary Income" },
  { id: "passive", label: "Passive Income" },
  { id: "other", label: "Other" },
] as const;

export function incomeCategoryLabel(id: string): string {
  return INCOME_CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}

export const GOAL_CATEGORIES: readonly OptionDef[] = [
  { id: "emergency", label: "Emergency" },
  { id: "vacation", label: "Vacation" },
  { id: "home", label: "Home" },
  { id: "car", label: "Car" },
  { id: "education", label: "Education" },
  { id: "retirement", label: "Retirement" },
  { id: "other", label: "Other" },
] as const;

/** Maps pre-remediation goal category labels onto the live taxonomy. */
const LEGACY_GOAL_CATEGORY_MAP: Record<string, string> = {
  "Emergency Fund": "emergency",
  "Major Purchase": "other",
  Vehicle: "car",
};

export function normalizeGoalCategory(value: string | null | undefined): string | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  const legacy = LEGACY_GOAL_CATEGORY_MAP[value];
  const match = GOAL_CATEGORIES.find((c) => c.id === legacy || c.id === lower || c.label === value);
  return match?.id ?? null;
}

export function goalCategoryLabel(id: string | null | undefined): string {
  return GOAL_CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}

export function goalCategoryEmoji(id: string | null | undefined): string {
  // Live-verified emoji map (2026-09-15): see src/lib/ui-maps.ts GOAL_EMOJI.
  return GOAL_EMOJI[id ?? "other"] ?? "🎯";
}

export const GOAL_PRIORITIES: readonly OptionDef[] = [
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
] as const;

export function goalPriorityLabel(id: string | null | undefined): string {
  return GOAL_PRIORITIES.find((p) => p.id === id)?.label ?? "Medium";
}

export const INVESTMENT_TYPES: readonly OptionDef[] = [
  { id: "stock", label: "Stock" },
  { id: "etf", label: "ETF" },
  { id: "bond", label: "Bond" },
  { id: "crypto", label: "Crypto" },
  { id: "mutual-fund", label: "Mutual Fund" },
  { id: "other", label: "Other" },
] as const;

export function investmentTypeLabel(id: string | null | undefined): string {
  return INVESTMENT_TYPES.find((t) => t.id === id)?.label ?? "Stock";
}

export const SECTORS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Energy",
  "Consumer",
  "Industrial",
  "Real Estate",
  "Utilities",
  "Other",
] as const;

/** Maps pre-remediation sector values onto the live taxonomy. */
export function normalizeSector(value: string): string {
  return value === "ETF" ? "Technology" : value;
}

export const CURRENCIES = [
  { code: "USD", label: "USD - US Dollar ($)" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "GBP", label: "GBP - British Pound (£)" },
  { code: "CAD", label: "CAD - Canadian Dollar (C$)" },
  { code: "AUD", label: "AUD - Australian Dollar (A$)" },
  { code: "JPY", label: "JPY - Japanese Yen (¥)" },
  { code: "CHF", label: "CHF - Swiss Franc (Fr)" },
  { code: "SEK", label: "SEK - Swedish Krona (kr)" },
  { code: "NOK", label: "NOK - Norwegian Krone (kr)" },
  { code: "DKK", label: "DKK - Danish Krone (kr)" },
] as const;

export const DATE_FORMATS = [
  { id: "MM/dd/yyyy", label: "MM/dd/yyyy (12/25/2024)" },
  { id: "dd/MM/yyyy", label: "dd/MM/yyyy (25/12/2024)" },
  { id: "yyyy-MM-dd", label: "yyyy-MM-dd (2024-12-25)" },
  { id: "dd MMM yyyy", label: "dd MMM yyyy (25 Dec 2024)" },
  { id: "MMM dd, yyyy", label: "MMM dd, yyyy (Dec 25, 2024)" },
] as const;
