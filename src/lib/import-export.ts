/**
 * Pure normalization for Finara JSON export files (settings-view import).
 *
 * Accepts the shape produced by `GET /api/export` (`finara-export-v1`, camelCase
 * entity keys) and the source app's export (PascalCase entity keys), validates
 * every row individually, and returns insert-ready collections plus row-level
 * errors — invalid rows never abort the whole import.
 */

export interface ExportDateParse {
  (value: unknown): Date | null;
}

/** Bank-style + ISO date parsing shared with the CSV import route. */
export function parseFlexibleDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, first, second, year] = slash;
    const month = Number.parseInt(first!, 10);
    const day = Number.parseInt(second!, 10);
    if (month >= 1 && month <= 12) return new Date(Number.parseInt(year!, 10), month - 1, day, 12);
    if (day >= 1 && day <= 12 && month >= 1 && month <= 31) return new Date(Number.parseInt(year!, 10), day - 1, month, 12);
  }
  const dotted = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) {
    const [, day, month, year] = dotted;
    return new Date(Number.parseInt(year!, 10), Number.parseInt(month!, 10) - 1, Number.parseInt(day!, 10), 12);
  }
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    const [, year, month, day] = compact;
    return new Date(Number.parseInt(year!, 10), Number.parseInt(month!, 10) - 1, Number.parseInt(day!, 10), 12);
  }
  return null;
}

export interface ImportExportError {
  entity: string;
  row: number;
  error: string;
}

export interface ExpenseInsert {
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  date: Date;
  notes: string | null;
  recurring: boolean;
}
export interface IncomeInsert {
  name: string;
  amountMinor: number;
  frequency: string;
  category: string;
  active: boolean;
}
export interface GoalInsert {
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  deadline: Date | null;
  category: string | null;
  priority: string;
}
export interface AccountInsert {
  name: string;
  type: string;
  institution: string;
  balanceMinor: number;
  currency: string;
  lastSyncedAt: Date;
}

export interface NormalizedExport {
  expenses: ExpenseInsert[];
  incomeSources: IncomeInsert[];
  goals: GoalInsert[];
  accounts: AccountInsert[];
  errors: ImportExportError[];
}

const EXPENSE_CATEGORIES = new Set(["Needs", "Wants", "Savings"]);
const INCOME_FREQUENCIES = new Set(["monthly", "weekly", "biweekly", "annual"]);
const INCOME_CATEGORIES = new Set(["primary", "secondary", "passive", "other"]);
const GOAL_CATEGORIES = new Set(["emergency", "vacation", "home", "car", "education", "retirement", "other"]);
const GOAL_PRIORITIES = new Set(["high", "medium", "low"]);
const ACCOUNT_TYPES = new Set(["checking", "savings", "credit-card", "investment", "other"]);
const CURRENCIES = new Set(["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "NOK", "DKK"]);

function asRows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function trimString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function intMinor(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

/** Accepts either the export's camelCase keys or the source app's PascalCase keys. */
function entityBucket(payload: Record<string, unknown>, camel: string, pascal: string): unknown[] {
  return asRows(payload[camel]).length > 0 ? asRows(payload[camel]) : asRows(payload[pascal]);
}

export function normalizeFinaraExport(payload: unknown): NormalizedExport {
  const result: NormalizedExport = {
    expenses: [],
    incomeSources: [],
    goals: [],
    accounts: [],
    errors: [],
  };
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    result.errors.push({ entity: "payload", row: 1, error: "File is not a Finara export object" });
    return result;
  }
  const record = payload as Record<string, unknown>;

  entityBucket(record, "expenses", "Expenses").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    const description = trimString(entry.description, 120);
    if (!description) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Missing description" });
      return;
    }
    const amountMinor = intMinor(entry.amountMinor);
    if (amountMinor === null) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Invalid amount" });
      return;
    }
    const category = typeof entry.category === "string" && EXPENSE_CATEGORIES.has(entry.category) ? entry.category : null;
    if (!category) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Invalid category" });
      return;
    }
    const date = parseFlexibleDate(entry.date);
    if (!date) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Unrecognized date format" });
      return;
    }
    result.expenses.push({
      description,
      amountMinor,
      category,
      subcategory: trimString(entry.subcategory, 40) || "other",
      date,
      notes: typeof entry.notes === "string" && entry.notes.trim() !== "" ? entry.notes.trim().slice(0, 500) : null,
      recurring: entry.recurring === true,
    });
  });

  entityBucket(record, "incomeSources", "Income").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    const name = trimString(entry.name, 80);
    if (!name) {
      result.errors.push({ entity: "incomeSources", row: index + 1, error: "Missing name" });
      return;
    }
    const amountMinor = intMinor(entry.amountMinor);
    if (amountMinor === null) {
      result.errors.push({ entity: "incomeSources", row: index + 1, error: "Invalid amount" });
      return;
    }
    const frequency =
      typeof entry.frequency === "string" && INCOME_FREQUENCIES.has(entry.frequency) ? entry.frequency : "monthly";
    const category =
      typeof entry.category === "string" && INCOME_CATEGORIES.has(entry.category) ? entry.category : "primary";
    result.incomeSources.push({ name, amountMinor, frequency, category, active: entry.active !== false });
  });

  entityBucket(record, "goals", "Goals").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    const name = trimString(entry.name, 80);
    if (!name) {
      result.errors.push({ entity: "goals", row: index + 1, error: "Missing name" });
      return;
    }
    const targetAmountMinor = intMinor(entry.targetAmountMinor);
    if (targetAmountMinor === null) {
      result.errors.push({ entity: "goals", row: index + 1, error: "Invalid target amount" });
      return;
    }
    const rawCurrent = intMinor(entry.currentAmountMinor) ?? 0;
    const currentAmountMinor = Math.min(rawCurrent, targetAmountMinor);
    const deadline = parseFlexibleDate(entry.deadline);
    const category =
      typeof entry.category === "string" && GOAL_CATEGORIES.has(entry.category) ? entry.category : null;
    const priority =
      typeof entry.priority === "string" && GOAL_PRIORITIES.has(entry.priority) ? entry.priority : "medium";
    result.goals.push({ name, targetAmountMinor, currentAmountMinor, deadline, category, priority });
  });

  entityBucket(record, "accounts", "Accounts").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    const name = trimString(entry.name, 80);
    if (!name) {
      result.errors.push({ entity: "accounts", row: index + 1, error: "Missing name" });
      return;
    }
    const type = typeof entry.type === "string" && ACCOUNT_TYPES.has(entry.type) ? entry.type : "other";
    const currency = typeof entry.currency === "string" && CURRENCIES.has(entry.currency) ? entry.currency : "USD";
    const balance = intMinor(entry.balanceMinor);
    if (balance === null) {
      result.errors.push({ entity: "accounts", row: index + 1, error: "Invalid balance" });
      return;
    }
    const lastSyncedAt = parseFlexibleDate(entry.lastSyncedAt) ?? new Date();
    result.accounts.push({
      name,
      type,
      institution: trimString(entry.institution, 80) || "Unknown institution",
      balanceMinor: balance,
      currency,
      lastSyncedAt,
    });
  });

  return result;
}
