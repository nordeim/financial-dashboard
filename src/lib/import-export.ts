/**
 * Pure normalization for Finara JSON export files (settings-view import).
 *
 * Accepts three shapes (round 9 — the live app's export is the primary):
 *  1. The LIVE export: `{ user, data: { expenses, income, savings_goals,
 *     investments, bank_accounts }, summary }` with snake_case fields, decimal
 *     amounts, `title` for display names, and lowercase expense categories.
 *  2. The legacy clone export (`finara-export-v1`, camelCase entity keys).
 *  3. The source app's older export (PascalCase entity keys).
 *
 * Validates every row individually and returns insert-ready collections plus
 * row-level errors — invalid rows never abort the whole import.
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
export interface InvestmentInsert {
  symbol: string;
  name: string;
  type: string;
  shares: number;
  avgPriceMinor: number;
  currentPriceMinor: number;
  portfolioPercent: number | null;
  sector: string;
}

export interface NormalizedExport {
  expenses: ExpenseInsert[];
  incomeSources: IncomeInsert[];
  goals: GoalInsert[];
  accounts: AccountInsert[];
  investments: InvestmentInsert[];
  errors: ImportExportError[];
}

const EXPENSE_CATEGORIES = new Set(["Needs", "Wants", "Savings"]);
const INCOME_FREQUENCIES = new Set(["monthly", "weekly", "biweekly", "annual"]);
const INCOME_CATEGORIES = new Set(["primary", "secondary", "passive", "other"]);
const GOAL_CATEGORIES = new Set(["emergency", "vacation", "home", "car", "education", "retirement", "other"]);
const GOAL_PRIORITIES = new Set(["high", "medium", "low"]);
const ACCOUNT_TYPES = new Set(["checking", "savings", "credit-card", "investment", "other"]);
const INVESTMENT_TYPES = new Set(["stock", "etf", "bond", "crypto", "mutual-fund", "other"]);
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

/**
 * Decimal-unit money → minor units (round 9): the live export carries amounts
 * as plain decimals (`4.5`, `5000`), unlike the clone's integer minor units.
 */
function decimalMinor(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Minor units from either representation (live decimals win, then clone ints). */
function anyMinor(entry: Record<string, unknown>, decimalKeys: string[], intKeys: string[]): number | null {
  for (const key of decimalKeys) {
    if (entry[key] !== undefined) {
      const minor = decimalMinor(entry[key]);
      if (minor !== null) return minor;
    }
  }
  for (const key of intKeys) {
    if (entry[key] !== undefined) {
      const minor = intMinor(entry[key]);
      if (minor !== null) return minor;
    }
  }
  return null;
}

const CAPITALIZED_EXPENSE_CATEGORIES = new Map(
  [...EXPENSE_CATEGORIES].map((category) => [category.toLowerCase(), category]),
);

function expenseCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (EXPENSE_CATEGORIES.has(value)) return value;
  return CAPITALIZED_EXPENSE_CATEGORIES.get(value.toLowerCase()) ?? null;
}

/** First present key wins — accepts the live snake_case + clone camelCase + legacy PascalCase keys. */
function pick(entry: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (entry[key] !== undefined) return entry[key];
  }
  return undefined;
}

/** Accepts the live/clone/Pascal collection keys from the (possibly `data`-wrapped) payload. */
function entityBucket(payload: Record<string, unknown>, camel: string, pascal: string, live?: string): unknown[] {
  const source =
    live && asRows((payload.data as Record<string, unknown> | undefined)?.[live]).length > 0
      ? (payload.data as Record<string, unknown>)
      : payload;
  const buckets = [live, camel, pascal]
    .filter((key): key is string => Boolean(key))
    .map((key) => asRows(source[key]));
  return buckets.find((rows) => rows.length > 0) ?? [];
}

export function normalizeFinaraExport(payload: unknown): NormalizedExport {
  const result: NormalizedExport = {
    expenses: [],
    incomeSources: [],
    goals: [],
    accounts: [],
    investments: [],
    errors: [],
  };
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    result.errors.push({ entity: "payload", row: 1, error: "File is not a Finara export object" });
    return result;
  }
  const record = payload as Record<string, unknown>;

  entityBucket(record, "expenses", "Expenses", "expenses").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    // Live exports name the display field `title`; the clone used `description`.
    const description = trimString(pick(entry, ["title", "description"]), 120);
    if (!description) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Missing description" });
      return;
    }
    const amountMinor = anyMinor(entry, ["amount"], ["amountMinor"]);
    if (amountMinor === null) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Invalid amount" });
      return;
    }
    const category = expenseCategory(entry.category);
    if (!category) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Invalid category" });
      return;
    }
    const date = parseFlexibleDate(entry.date);
    if (!date) {
      result.errors.push({ entity: "expenses", row: index + 1, error: "Unrecognized date format" });
      return;
    }
    const notes = trimString(entry.notes, 500);
    result.expenses.push({
      description,
      amountMinor,
      category,
      subcategory: trimString(entry.subcategory, 40) || "other",
      date,
      notes: notes !== "" ? notes : null,
      recurring: pick(entry, ["is_recurring", "recurring"]) === true,
    });
  });

  entityBucket(record, "incomeSources", "Income", "income").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    // Live exports name the field `source_name`; the clone used `name`.
    const name = trimString(pick(entry, ["source_name", "name"]), 80);
    if (!name) {
      result.errors.push({ entity: "incomeSources", row: index + 1, error: "Missing name" });
      return;
    }
    const amountMinor = anyMinor(entry, ["amount"], ["amountMinor"]);
    if (amountMinor === null) {
      result.errors.push({ entity: "incomeSources", row: index + 1, error: "Invalid amount" });
      return;
    }
    const frequency =
      typeof entry.frequency === "string" && INCOME_FREQUENCIES.has(entry.frequency) ? entry.frequency : "monthly";
    const category =
      typeof entry.category === "string" && INCOME_CATEGORIES.has(entry.category) ? entry.category : "primary";
    const active = pick(entry, ["is_active", "active"]) !== false;
    result.incomeSources.push({ name, amountMinor, frequency, category, active });
  });

  entityBucket(record, "goals", "Goals", "savings_goals").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    const name = trimString(pick(entry, ["title", "name"]), 80);
    if (!name) {
      result.errors.push({ entity: "goals", row: index + 1, error: "Missing name" });
      return;
    }
    const targetAmountMinor = anyMinor(entry, ["target_amount"], ["targetAmountMinor"]);
    if (targetAmountMinor === null) {
      result.errors.push({ entity: "goals", row: index + 1, error: "Invalid target amount" });
      return;
    }
    const rawCurrent = anyMinor(entry, ["current_amount"], ["currentAmountMinor"]) ?? 0;
    const currentAmountMinor = Math.min(rawCurrent, targetAmountMinor);
    // Live exports the deadline as `target_date`; the clone used `deadline`.
    const deadline = parseFlexibleDate(pick(entry, ["target_date", "deadline"]));
    const category =
      typeof entry.category === "string" && GOAL_CATEGORIES.has(entry.category) ? entry.category : null;
    const priority =
      typeof entry.priority === "string" && GOAL_PRIORITIES.has(entry.priority) ? entry.priority : "medium";
    result.goals.push({ name, targetAmountMinor, currentAmountMinor, deadline, category, priority });
  });

  entityBucket(record, "accounts", "Accounts", "bank_accounts").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    // Live exports: `account_name` / `account_type` / `bank_name` /
    // `manual_balance` / `last_updated`.
    const name = trimString(pick(entry, ["account_name", "name"]), 80);
    if (!name) {
      result.errors.push({ entity: "accounts", row: index + 1, error: "Missing name" });
      return;
    }
    const type =
      typeof pick(entry, ["account_type", "type"]) === "string" && ACCOUNT_TYPES.has(pick(entry, ["account_type", "type"]) as string)
        ? (pick(entry, ["account_type", "type"]) as string)
        : "other";
    const currency = typeof entry.currency === "string" && CURRENCIES.has(entry.currency) ? entry.currency : "USD";
    const balance = anyMinor(entry, ["manual_balance"], ["balanceMinor"]);
    if (balance === null) {
      result.errors.push({ entity: "accounts", row: index + 1, error: "Invalid balance" });
      return;
    }
    const institution = trimString(pick(entry, ["bank_name", "institution"]), 80);
    const lastSyncedAt = parseFlexibleDate(pick(entry, ["last_updated", "lastSyncedAt"])) ?? new Date();
    result.accounts.push({
      name,
      type,
      institution: institution !== "" ? institution : "Unknown institution",
      balanceMinor: balance,
      currency,
      lastSyncedAt,
    });
  });

  // Round 9: the live export carries investments (`symbol`, `name`,
  // `investment_type`, `shares`, `purchase_price`, `current_price`,
  // `portfolio_percentage`, `sector`) — restorable alongside the other four.
  entityBucket(record, "investments", "Investments", "investments").forEach((row, index) => {
    const entry = row as Record<string, unknown>;
    const symbol = trimString(pick(entry, ["symbol"]), 12).toUpperCase();
    if (!symbol) {
      result.errors.push({ entity: "investments", row: index + 1, error: "Missing symbol" });
      return;
    }
    const name = trimString(pick(entry, ["name"]), 120);
    if (!name) {
      result.errors.push({ entity: "investments", row: index + 1, error: "Missing name" });
      return;
    }
    const avgPriceMinor = anyMinor(entry, ["purchase_price"], ["avgPriceMinor"]);
    if (avgPriceMinor === null) {
      result.errors.push({ entity: "investments", row: index + 1, error: "Invalid purchase price" });
      return;
    }
    const currentPriceMinor = anyMinor(entry, ["current_price"], ["currentPriceMinor"]);
    if (currentPriceMinor === null) {
      result.errors.push({ entity: "investments", row: index + 1, error: "Invalid current price" });
      return;
    }
    const shares = typeof entry.shares === "number" && Number.isFinite(entry.shares) && entry.shares >= 0 ? entry.shares : null;
    if (shares === null) {
      result.errors.push({ entity: "investments", row: index + 1, error: "Invalid shares" });
      return;
    }
    const type =
      typeof pick(entry, ["investment_type", "type"]) === "string" && INVESTMENT_TYPES.has(pick(entry, ["investment_type", "type"]) as string)
        ? (pick(entry, ["investment_type", "type"]) as string)
        : "stock";
    const rawPercent = pick(entry, ["portfolio_percentage", "portfolioPercent"]);
    const portfolioPercent = typeof rawPercent === "number" && Number.isFinite(rawPercent) ? rawPercent : null;
    const sector = trimString(entry.sector, 40) || "other";
    result.investments.push({ symbol, name, type, shares, avgPriceMinor, currentPriceMinor, portfolioPercent, sector });
  });

  return result;
}
