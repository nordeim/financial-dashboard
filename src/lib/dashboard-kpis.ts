import { subcategoryLabel } from "@/lib/categories";
import { changePercent, formatMoney, monthlyEquivalent, percent } from "@/lib/money";

/**
 * Pure dashboard KPI computation — no database access, fully deterministic for
 * a fixed `now`. The semantics below deliberately mirror the source app:
 *
 * - Savings Progress is GOAL progress (total current / total target), not the
 *   savings rate. Verified on the live app: $2,500 added to a $10,000 goal
 *   moved the KPI to exactly 25.0%.
 * - Trend percentages fall back to the source app's placeholder values
 *   (+8.2% income / -3.1% expenses / -5.2% net, or +12.5% net once income
 *   exists) whenever real month-over-month data is unavailable. With real
 *   prior-month data the computed change wins.
 * - Largest Expense Category reports the top-level 50/30/20 bucket.
 */

export const PLACEHOLDER_TRENDS = {
  income: 8.2,
  expense: -3.1,
  netNoIncome: -5.2,
  netWithIncome: 12.5,
} as const;

export interface ExpenseInput {
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  date: Date;
}

export interface IncomeSourceInput {
  name: string;
  amountMinor: number;
  frequency: string;
}

export interface GoalInput {
  currentAmountMinor: number;
  targetAmountMinor: number;
}

export interface IncomeEventInput {
  name: string;
  amountMinor: number;
  date: Date;
}

export interface RecentActivityItem {
  id: string;
  kind: "income" | "expense";
  description: string;
  amountMinor: number;
  category: string | null;
  subcategory: string | null;
  date: string;
}

export interface DashboardKpis {
  monthlyIncomeMinor: number;
  monthlyExpensesMinor: number;
  netBalanceMinor: number;
  savingsProgressPercent: number;
  incomeChangePercent: number | null;
  expenseChangePercent: number | null;
  netChangePercent: number | null;
  activeGoals: number;
  largestExpenseCategory: string | null;
  largestExpenseMinor: number;
  recentActivity: RecentActivityItem[];
  monthlyTrend: { month: string; incomeMinor: number; expensesMinor: number; netMinor: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthStart(now: Date, offset = 0): Date {
  return new Date(now.getFullYear(), now.getMonth() - offset, 1);
}

function monthEnd(now: Date, offset = 0): Date {
  return new Date(monthStart(now, offset - 1).getTime() - 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Short month + two-digit year, e.g. "Apr 26" — the source app's axis label. */
function monthAxisLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

export function computeDashboardKpis(input: {
  expenses: ExpenseInput[];
  incomeSources: IncomeSourceInput[];
  goals: GoalInput[];
  now: Date;
  recentIncomeEvents?: IncomeEventInput[];
  trendMonths?: number;
}): DashboardKpis {
  const { expenses, incomeSources, goals, now } = input;
  const trendMonths = input.trendMonths ?? 6;
  const recentIncomeEvents = input.recentIncomeEvents ?? [];

  const thisMonthStart = monthStart(now);
  const lastMonthStart = monthStart(now, 1);
  const lastMonthEnd = monthEnd(now, 1);

  const inRange = (date: Date, from: Date, to: Date): boolean =>
    date.getTime() >= from.getTime() && date.getTime() <= to.getTime();

  const currentMonthExpenses = expenses.filter((e) => inRange(e.date, thisMonthStart, now));
  const priorMonthExpenses = expenses.filter((e) => inRange(e.date, lastMonthStart, lastMonthEnd));

  const monthlyIncomeMinor = incomeSources.reduce(
    (sum, source) => sum + monthlyEquivalent(source.amountMinor, source.frequency),
    0,
  );
  const monthlyExpensesMinor = currentMonthExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const priorExpensesMinor = priorMonthExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const netBalanceMinor = monthlyIncomeMinor - monthlyExpensesMinor;

  // Goal progress — the source app's "Savings Progress" KPI.
  const totalGoalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmountMinor, 0);
  const totalGoalTarget = goals.reduce((sum, goal) => sum + goal.targetAmountMinor, 0);
  const savingsProgressPercent = totalGoalTarget > 0 ? percent(totalGoalCurrent, totalGoalTarget) : 0;

  // Largest top-level expense bucket this month.
  const categoryTotals = new Map<string, number>();
  for (const expense of currentMonthExpenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amountMinor);
  }
  let largestExpenseCategory: string | null = null;
  let largestExpenseMinor = 0;
  for (const [category, amount] of categoryTotals) {
    if (amount > largestExpenseMinor) {
      largestExpenseCategory = category;
      largestExpenseMinor = amount;
    }
  }

  // Trends: real month-over-month when the prior month has data, otherwise the
  // source app's placeholder values.
  const hasPriorExpenses = priorMonthExpenses.length > 0;
  const expenseChange = hasPriorExpenses ? changePercent(monthlyExpensesMinor, priorExpensesMinor) : null;
  const incomeChange = hasPriorExpenses ? null : null; // income is source-based, not event-based
  const netChange = hasPriorExpenses
    ? changePercent(netBalanceMinor, monthlyIncomeMinor - priorExpensesMinor)
    : null;

  // Recent activity mixes income events and expenses, newest first, capped at 6.
  const activity: RecentActivityItem[] = [
    ...recentIncomeEvents.map((event, index) => ({
      id: `income-${index}-${event.name}`,
      kind: "income" as const,
      description: event.name,
      amountMinor: event.amountMinor,
      category: null,
      subcategory: null,
      date: event.date.toISOString(),
    })),
    ...expenses.map((expense, index) => ({
      id: `expense-${index}-${expense.description}`,
      kind: "expense" as const,
      description: expense.description,
      amountMinor: expense.amountMinor,
      category: expense.category,
      subcategory: subcategoryLabel(expense.subcategory),
      date: expense.date.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Six-month trend, oldest first, keyed by month.
  const trendMap = new Map<string, { incomeMinor: number; expensesMinor: number }>();
  for (let offset = trendMonths - 1; offset >= 0; offset -= 1) {
    trendMap.set(monthKey(monthStart(now, offset)), { incomeMinor: 0, expensesMinor: 0 });
  }
  for (const expense of expenses) {
    const bucket = trendMap.get(monthKey(expense.date));
    if (bucket) bucket.expensesMinor += expense.amountMinor;
  }
  const monthlyTrend = Array.from(trendMap.entries()).map(([key, values]) => {
    const [year, month] = key.split("-");
    const labelDate = new Date(Number(year), Number(month) - 1, 1);
    return {
      month: monthAxisLabel(labelDate),
      incomeMinor: monthlyIncomeMinor,
      expensesMinor: values.expensesMinor,
      netMinor: monthlyIncomeMinor - values.expensesMinor,
    };
  });

  return {
    monthlyIncomeMinor,
    monthlyExpensesMinor,
    netBalanceMinor,
    savingsProgressPercent: Math.round(savingsProgressPercent * 10) / 10,
    incomeChangePercent: incomeChange ?? PLACEHOLDER_TRENDS.income,
    expenseChangePercent: expenseChange ?? PLACEHOLDER_TRENDS.expense,
    netChangePercent: netChange ?? (monthlyIncomeMinor > 0 ? PLACEHOLDER_TRENDS.netWithIncome : PLACEHOLDER_TRENDS.netNoIncome),
    activeGoals: goals.length,
    largestExpenseCategory,
    largestExpenseMinor,
    recentActivity: activity,
    monthlyTrend,
  };
}

/**
 * Budget-row remaining-amount label (live-verified round 4): a zero monthly
 * limit renders "$0.00 remaining" — never the over-budget wording (observed
 * on the live app with an unconfigured $0.00 budget). Real limits keep the
 * under/over phrasing.
 */
export function budgetRemainingLabel(limitMinor: number, remainingMinor: number): string {
  if (limitMinor <= 0) return `${formatMoney(0)} remaining`;
  return remainingMinor >= 0
    ? `${formatMoney(remainingMinor)} remaining`
    : `${formatMoney(-remainingMinor)} over budget`;
}
