import { db } from "@/lib/db";
import { subcategoryLabel } from "@/lib/categories";
import { changePercent, monthlyEquivalent, percent } from "@/lib/money";
import type { AnalyticsDto, BudgetProgressDto, DashboardDto } from "@/lib/types";

function monthStart(offset = 0): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - offset, 1);
}

function monthEnd(offset = 0): Date {
  return new Date(monthStart(offset - 1).getTime() - 1);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(date: Date): string {
  return MONTH_LABELS[date.getMonth()] ?? String(date.getMonth() + 1);
}

export async function getDashboard(): Promise<DashboardDto> {
  const [expenses, incomeSources, budgets, goals] = await Promise.all([
    db.expense.findMany({ orderBy: { date: "desc" } }),
    db.incomeSource.findMany({ where: { active: true } }),
    db.budget.findMany({ where: { subcategory: null } }),
    db.goal.findMany(),
  ]);

  const thisMonth = monthStart();
  const lastMonthStart = monthStart(1);
  const lastMonthEnd = monthEnd(1);

  const inMonth = (date: Date, from: Date, to: Date): boolean =>
    date.getTime() >= from.getTime() && date.getTime() <= to.getTime();

  const currentMonthExpenses = expenses.filter((e) => inMonth(e.date, thisMonth, new Date()));
  const priorMonthExpenses = expenses.filter((e) => inMonth(e.date, lastMonthStart, lastMonthEnd));

  const monthlyIncomeMinor = incomeSources.reduce(
    (sum, source) => sum + monthlyEquivalent(source.amountMinor, source.frequency),
    0,
  );
  const monthlyExpensesMinor = currentMonthExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const priorExpensesMinor = priorMonthExpenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const netBalanceMinor = monthlyIncomeMinor - monthlyExpensesMinor;
  const savingsRate = monthlyIncomeMinor > 0 ? (netBalanceMinor / monthlyIncomeMinor) * 100 : 0;

  // Largest expense subcategory this month.
  const bySubcategory = new Map<string, number>();
  for (const expense of currentMonthExpenses) {
    bySubcategory.set(expense.subcategory, (bySubcategory.get(expense.subcategory) ?? 0) + expense.amountMinor);
  }
  let largestExpenseSubcategory: string | null = null;
  let largestExpenseMinor = 0;
  for (const [subcategory, amount] of bySubcategory) {
    if (amount > largestExpenseMinor) {
      largestExpenseSubcategory = subcategoryLabel(subcategory);
      largestExpenseMinor = amount;
    }
  }

  // Six-month trend keyed by month, oldest first.
  const trendMap = new Map<string, { incomeMinor: number; expensesMinor: number; netMinor: number }>();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const start = monthStart(offset);
    trendMap.set(monthKey(start), { incomeMinor: 0, expensesMinor: 0, netMinor: 0 });
  }
  for (const expense of expenses) {
    const key = monthKey(expense.date);
    const bucket = trendMap.get(key);
    if (bucket) bucket.expensesMinor += expense.amountMinor;
  }
  const monthlyTrend = Array.from(trendMap.entries()).map(([month, values]) => ({
    month,
    incomeMinor: monthlyIncomeMinor,
    expensesMinor: values.expensesMinor,
    netMinor: monthlyIncomeMinor - values.expensesMinor,
  }));

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

  const budgetSurplusMinor = monthlyIncomeMinor - monthlyExpensesMinor;

  return {
    kpis: {
      monthlyIncomeMinor,
      monthlyExpensesMinor,
      netBalanceMinor,
      savingsRatePercent: Math.round(savingsRate * 10) / 10,
      incomeChangePercent: null,
      expenseChangePercent: changePercent(monthlyExpensesMinor, priorExpensesMinor),
      netChangePercent: changePercent(netBalanceMinor, monthlyIncomeMinor - priorExpensesMinor),
      activeGoals: goals.length,
      largestExpenseSubcategory,
      largestExpenseMinor,
    },
    budgets: budgetProgress,
    budgetSurplusMinor,
    recentTransactions: expenses.slice(0, 6).map((expense) => ({
      id: expense.id,
      description: expense.description,
      amountMinor: expense.amountMinor,
      category: expense.category,
      subcategory: expense.subcategory,
      date: expense.date.toISOString(),
      notes: expense.notes,
      recurring: expense.recurring,
      accountId: expense.accountId,
    })),
    incomeSources: incomeSources.map((source) => ({
      id: source.id,
      name: source.name,
      amountMinor: source.amountMinor,
      frequency: source.frequency,
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
    })),
    monthlyTrend,
  };
}

export async function getAnalytics(): Promise<AnalyticsDto> {
  const [expenses, incomeSources, investments] = await Promise.all([
    db.expense.findMany({ orderBy: { date: "asc" } }),
    db.incomeSource.findMany({ where: { active: true } }),
    db.investment.findMany(),
  ]);

  const monthlyIncomeMinor = incomeSources.reduce(
    (sum, source) => sum + monthlyEquivalent(source.amountMinor, source.frequency),
    0,
  );

  const trendMap = new Map<string, { label: string; incomeMinor: number; expensesMinor: number }>();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const start = monthStart(offset);
    trendMap.set(monthKey(start), { label: monthLabel(start), incomeMinor: 0, expensesMinor: 0 });
  }
  for (const expense of expenses) {
    const bucket = trendMap.get(monthKey(expense.date));
    if (bucket) bucket.expensesMinor += expense.amountMinor;
  }
  const monthlyTrend = Array.from(trendMap.values()).map((values) => ({
    month: values.label,
    incomeMinor: values.incomeMinor,
    expensesMinor: values.expensesMinor,
    netMinor: values.incomeMinor - values.expensesMinor,
  }));

  const totalIncomeMinor = monthlyIncomeMinor * 6;
  const totalExpensesMinor = expenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const avgIncomeMinor = Math.round(totalIncomeMinor / 6);
  const avgExpensesMinor = Math.round(totalExpensesMinor / 6);

  const subcategoryTotals = new Map<string, number>();
  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    subcategoryTotals.set(
      expense.subcategory,
      (subcategoryTotals.get(expense.subcategory) ?? 0) + expense.amountMinor,
    );
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + expense.amountMinor,
    );
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
    .map((source) => ({
      name: source.name,
      amountMinor: monthlyEquivalent(source.amountMinor, source.frequency),
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .map((source) => ({
      name: source.name,
      amountMinor: source.amountMinor,
      percent: percent(source.amountMinor, monthlyIncomeMinor),
    }));

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
        shares: holding.shares,
        avgPriceMinor: holding.avgPriceMinor,
        currentPriceMinor: holding.currentPriceMinor,
        sector: holding.sector,
      })),
    },
  };
}
