/**
 * 50/30/20 budget taxonomy shared by expenses, budgets, and analytics.
 * Mirrors the Finara quick-select category grid.
 */

export const EXPENSE_CATEGORIES = ["Needs", "Wants", "Savings"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface SubcategoryDef {
  id: string;
  label: string;
  emoji: string;
  category: ExpenseCategory;
}

export const SUBCATEGORIES: readonly SubcategoryDef[] = [
  { id: "rent", label: "Rent/Mortgage", emoji: "🏠", category: "Needs" },
  { id: "groceries", label: "Groceries", emoji: "🛒", category: "Needs" },
  { id: "utilities", label: "Utilities", emoji: "⚡", category: "Needs" },
  { id: "transportation", label: "Transportation", emoji: "🚗", category: "Needs" },
  { id: "healthcare", label: "Healthcare", emoji: "🏥", category: "Needs" },
  { id: "insurance", label: "Insurance", emoji: "🛡️", category: "Needs" },
  { id: "debt", label: "Debt Payments", emoji: "💳", category: "Needs" },
  { id: "dining", label: "Dining Out", emoji: "🍽️", category: "Wants" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", category: "Wants" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", category: "Wants" },
  { id: "travel", label: "Travel", emoji: "✈️", category: "Wants" },
  { id: "subscriptions", label: "Subscriptions", emoji: "📺", category: "Wants" },
  { id: "fitness", label: "Fitness", emoji: "💪", category: "Wants" },
  { id: "education", label: "Education", emoji: "📚", category: "Wants" },
  { id: "emergency", label: "Emergency Fund", emoji: "🚨", category: "Savings" },
  { id: "investing", label: "Investing", emoji: "📈", category: "Savings" },
  { id: "retirement", label: "Retirement", emoji: "🌴", category: "Savings" },
  { id: "other", label: "Other", emoji: "📌", category: "Wants" },
] as const;

export function subcategoryLabel(id: string): string {
  return SUBCATEGORIES.find((s) => s.id === id)?.label ?? "Other";
}

export function subcategoryEmoji(id: string): string {
  return SUBCATEGORIES.find((s) => s.id === id)?.emoji ?? "📌";
}

export function subcategoriesFor(category: ExpenseCategory): SubcategoryDef[] {
  return SUBCATEGORIES.filter((s) => s.category === category);
}

/** Emoji quick-select grid shown first in the Add Expense dialog. */
export const QUICK_SELECT_SUBCATEGORIES: readonly SubcategoryDef[] = [
  SUBCATEGORIES[0], // Rent/Mortgage
  SUBCATEGORIES[1], // Groceries
  SUBCATEGORIES[2], // Utilities
  SUBCATEGORIES[3], // Transportation
  SUBCATEGORIES[4], // Healthcare
] as const;

export const ACCOUNT_TYPES = ["checking", "savings", "credit", "investment", "cash"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const INCOME_FREQUENCIES = ["monthly", "biweekly", "weekly", "one-time"] as const;
export type IncomeFrequency = (typeof INCOME_FREQUENCIES)[number];

export const GOAL_CATEGORIES = [
  "Emergency Fund",
  "Vacation",
  "Major Purchase",
  "Home",
  "Vehicle",
  "Education",
  "Retirement",
  "Other",
] as const;

export const SECTORS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Consumer",
  "Energy",
  "Industrial",
  "Real Estate",
  "ETF",
] as const;

export const CURRENCIES = [
  { code: "USD", label: "USD - US Dollar ($)" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "GBP", label: "GBP - British Pound (£)" },
  { code: "JPY", label: "JPY - Japanese Yen (¥)" },
  { code: "SGD", label: "SGD - Singapore Dollar (S$)" },
  { code: "AUD", label: "AUD - Australian Dollar (A$)" },
  { code: "CAD", label: "CAD - Canadian Dollar (C$)" },
] as const;

export const DATE_FORMATS = [
  { id: "MM/dd/yyyy", label: "MM/dd/yyyy (12/25/2024)" },
  { id: "dd/MM/yyyy", label: "dd/MM/yyyy (25/12/2024)" },
  { id: "yyyy-MM-dd", label: "yyyy-MM-dd (2024-12-25)" },
  { id: "dd MMM yyyy", label: "dd MMM yyyy (25 Dec 2024)" },
] as const;
