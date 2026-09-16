import { db } from "@/lib/db";
import { normalizeSubcategory, subcategoryLabel } from "@/lib/categories";
import { computeDashboardKpis, type IncomeEventInput } from "@/lib/dashboard-kpis";
import { monthlyEquivalent, percent } from "@/lib/money";
import type { AnalyticsDto, BudgetProgressDto, DashboardDto } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Short month + two-digit year axis label, e.g. "Apr 26". */
function monthAxisLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
}

export async function getDashboard(): Promise<DashboardDto> {
  const [expenses, incomeSources, budgets, goals] = await Promise.all([
    db.expense.findMany({ orderBy: { date: "desc" } }),
    db.incomeSource.findMany({ where: { active: true } }),
    db.budget.findMany({ where: { subcategory: null } }),
    db.goal.findMany(),
  ]);

  const now = new Date();

  const kpis = computeDashboardKpis({
    expenses: expenses.map((expense) => ({
      description: expense.description,
      amountMinor: expense.amountMinor,
      category: expense.category,
      subcategory: expense.subcategory,
      date: expense.date,
    })),
    incomeSources: incomeSources.map((source) => ({
      name: source.name,
      amountMinor: source.amountMinor,
      frequency: source.frequency,
    })),
    goals: goals.map((goal) => ({
      currentAmountMinor: goal.currentAmountMinor,
      targetAmountMinor: goal.targetAmountMinor,
    })),
    now,
    // Income renders in recent activity through its next-payment events so
    // the feed mixes both transaction kinds like the source app.
    recentIncomeEvents: incomeSources
      .map((source): IncomeEventInput | null => {
        const reference = source.nextPaymentDate ?? source.createdAt;
        return { name: source.name, amountMinor: source.amountMinor, category: source.category, date: reference };
      })
      .filter((event): event is IncomeEventInput => event !== null),
  });

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthExpenses = expenses.filter((expense) => expense.date >= thisMonthStart);

  const budgetProgress: BudgetProgressDto[] = budgets.map((budget) => {
    const spentMinor = currentMonthExpenses
      .filter((e) => e.category === budget.category)
      .reduce((sum, e) => sum + e.amountMinor, 0);
    return {
      category: budget.category,
      limitMinor: budget.monthlyLimitMinor,
      spentMinor,
      remainingMinor: budget.monthlyLimitMinor - spentMinor,
      percentUsed: percent(spentMinor, budget.monthlyLimitMinor),
    };
  });

  return {
    kpis: {
      monthlyIncomeMinor: kpis.monthlyIncomeMinor,
      monthlyExpensesMinor: kpis.monthlyExpensesMinor,
      netBalanceMinor: kpis.netBalanceMinor,
      savingsProgressPercent: kpis.savingsProgressPercent,
      incomeChangePercent: kpis.incomeChangePercent,
      expenseChangePercent: kpis.expenseChangePercent,
      netChangePercent: kpis.netChangePercent,
      activeGoals: kpis.activeGoals,
      largestExpenseCategory: kpis.largestExpenseCategory,
      largestExpenseMinor: kpis.largestExpenseMinor,
    },
    budgets: budgetProgress,
    budgetSurplusMinor: kpis.monthlyIncomeMinor - kpis.monthlyExpensesMinor,
    recentTransactions: kpis.recentActivity,
    incomeSources: incomeSources.map((source) => ({
      id: source.id,
      name: source.name,
      amountMinor: source.amountMinor,
      frequency: source.frequency,
      category: source.category,
      active: source.active,
      nextPaymentDate: source.nextPaymentDate?.toISOString() ?? null,
    })),
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmountMinor: goal.targetAmountMinor,
      currentAmountMinor: goal.currentAmountMinor,
      deadline: goal.deadline?.toISOString() ?? null,
      category: goal.category,
      priority: goal.priority,
    })),
    monthlyTrend: kpis.monthlyTrend,
  };
}

export async function getAnalytics(months = 6): Promise<AnalyticsDto> {
  const windowMonths = [3, 6, 12].includes(months) ? months : 6;
  const [expenses, incomeSources, investments] = await Promise.all([
    db.expense.findMany({ orderBy: { date: "asc" } }),
    db.incomeSource.findMany({ where: { active: true } }),
    db.investment.findMany(),
  ]);

  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - (windowMonths - 1), 1);

  const monthlyIncomeMinor = incomeSources.reduce(
    (sum, source) => sum + monthlyEquivalent(source.amountMinor, source.frequency),
    0,
  );

  // Trend window: last `windowMonths` months, oldest first.
  const trendMap = new Map<string, { label: string; incomeMinor: number; expensesMinor: number }>();
  for (let offset = windowMonths - 1; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    trendMap.set(key, { label: monthAxisLabel(start), incomeMinor: 0, expensesMinor: 0 });
  }
  const windowedExpenses = expenses.filter((expense) => expense.date >= windowStart);
  for (const expense of windowedExpenses) {
    const key = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = trendMap.get(key);
    if (bucket) bucket.expensesMinor += expense.amountMinor;
  }
  const monthlyTrend = Array.from(trendMap.values()).map((values) => ({
    month: values.label,
    incomeMinor: monthlyIncomeMinor,
    expensesMinor: values.expensesMinor,
    netMinor: monthlyIncomeMinor - values.expensesMinor,
  }));

  // Source-app averaging: window total divided by the period month count.
  const totalIncomeMinor = monthlyIncomeMinor * windowMonths;
  const totalExpensesMinor = windowedExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const avgIncomeMinor = Math.round(totalIncomeMinor / windowMonths);
  const avgExpensesMinor = Math.round(totalExpensesMinor / windowMonths);

  const subcategoryTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();
  for (const expense of windowedExpenses) {
    const subcategory = normalizeSubcategory(expense.subcategory);
    subcategoryTotals.set(subcategory, (subcategoryTotals.get(subcategory) ?? 0) + expense.amountMinor);
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amountMinor);
  }
  const bySubcategory = Array.from(subcategoryTotals.entries())
    .map(([subcategory, amountMinor]) => ({
      subcategory,
      label: subcategoryLabel(subcategory),
      amountMinor,
      percent: percent(amountMinor, totalExpensesMinor),
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor);
  const byCategory = Array.from(categoryTotals.entries())
    .map(([category, amountMinor]) => ({
      category,
      amountMinor,
      percent: percent(amountMinor, totalExpensesMinor),
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor);

  const incomeBySource = incomeSources
    .map((source) => {
      const equivalent = monthlyEquivalent(source.amountMinor, source.frequency);
      return { name: source.name, amountMinor: equivalent, percent: percent(equivalent, monthlyIncomeMinor) };
    })
    .sort((a, b) => b.amountMinor - a.amountMinor);

  const portfolioValueMinor = investments.reduce(
    (sum, holding) => sum + Math.round(holding.shares * holding.currentPriceMinor),
    0,
  );
  const costBasisMinor = investments.reduce(
    (sum, holding) => sum + Math.round(holding.shares * holding.avgPriceMinor),
    0,
  );
  const totalGainMinor = portfolioValueMinor - costBasisMinor;

  const sectorTotals = new Map<string, number>();
  for (const holding of investments) {
    const value = Math.round(holding.shares * holding.currentPriceMinor);
    sectorTotals.set(holding.sector, (sectorTotals.get(holding.sector) ?? 0) + value);
  }
  const sectorAllocation = Array.from(sectorTotals.entries())
    .map(([sector, valueMinor]) => ({
      sector,
      valueMinor,
      percent: percent(valueMinor, portfolioValueMinor),
    }))
    .sort((a, b) => b.valueMinor - a.valueMinor);

  return {
    overview: {
      monthlyTrend,
      avgIncomeMinor,
      avgExpensesMinor,
      avgSavingsMinor: avgIncomeMinor - avgExpensesMinor,
      totalIncomeMinor,
      totalExpensesMinor,
    },
    expenses: {
      bySubcategory,
      byCategory,
      topCategories: bySubcategory.slice(0, 5),
    },
    income: {
      bySource: incomeBySource,
      monthlyTrend: monthlyTrend.map((m) => ({ month: m.month, incomeMinor: m.incomeMinor })),
      totalMonthlyMinor: monthlyIncomeMinor,
    },
    investments: {
      portfolioValueMinor,
      totalGainMinor,
      totalReturnPercent: costBasisMinor > 0 ? (totalGainMinor / costBasisMinor) * 100 : 0,
      sectorAllocation,
      holdings: investments.map((holding) => ({
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        type: holding.type,
        shares: holding.shares,
        avgPriceMinor: holding.avgPriceMinor,
        currentPriceMinor: holding.currentPriceMinor,
        portfolioPercent: holding.portfolioPercent,
        sector: holding.sector,
      })),
    },
  };
}
