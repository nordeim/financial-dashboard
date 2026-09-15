/**
 * Shared domain types crossing the client/server boundary.
 * Serialized dates travel as ISO strings; money travels as integer minor units.
 */

export interface AccountDto {
  id: string;
  name: string;
  type: string;
  institution: string;
  balanceMinor: number;
  currency: string;
  lastSyncedAt: string;
}

export interface IncomeSourceDto {
  id: string;
  name: string;
  amountMinor: number;
  frequency: string;
  category: string;
  active: boolean;
  nextPaymentDate: string | null;
}

export interface ExpenseDto {
  id: string;
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  date: string;
  notes: string | null;
  recurring: boolean;
  accountId: string | null;
}

export interface BudgetDto {
  id: string;
  category: string;
  subcategory: string | null;
  monthlyLimitMinor: number;
}

export interface GoalDto {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  deadline: string | null;
  category: string | null;
  priority: string;
}

export interface InvestmentDto {
  id: string;
  symbol: string;
  name: string;
  type: string;
  shares: number;
  avgPriceMinor: number;
  currentPriceMinor: number;
  portfolioPercent: number | null;
  sector: string;
}

export interface KpiCardDto {
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
}

export interface BudgetProgressDto {
  category: string;
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentUsed: number;
}

export interface RecentActivityItemDto {
  id: string;
  kind: "income" | "expense";
  description: string;
  amountMinor: number;
  category: string | null;
  subcategory: string | null;
  date: string;
}

export interface DashboardDto {
  kpis: KpiCardDto;
  budgets: BudgetProgressDto[];
  budgetSurplusMinor: number;
  recentTransactions: RecentActivityItemDto[];
  incomeSources: IncomeSourceDto[];
  goals: GoalDto[];
  monthlyTrend: { month: string; incomeMinor: number; expensesMinor: number; netMinor: number }[];
}

export interface AnalyticsDto {
  overview: {
    monthlyTrend: { month: string; incomeMinor: number; expensesMinor: number; netMinor: number }[];
    avgIncomeMinor: number;
    avgExpensesMinor: number;
    avgSavingsMinor: number;
    totalIncomeMinor: number;
    totalExpensesMinor: number;
  };
  expenses: {
    bySubcategory: { subcategory: string; label: string; amountMinor: number; percent: number }[];
    byCategory: { category: string; amountMinor: number; percent: number }[];
    topCategories: { label: string; amountMinor: number; percent: number }[];
  };
  income: {
    bySource: { name: string; amountMinor: number; percent: number }[];
    monthlyTrend: { month: string; incomeMinor: number }[];
    totalMonthlyMinor: number;
  };
  investments: {
    portfolioValueMinor: number;
    totalGainMinor: number;
    totalReturnPercent: number;
    sectorAllocation: { sector: string; valueMinor: number; percent: number }[];
    holdings: InvestmentDto[];
  };
}

export interface SettingsDto {
  currency: string;
  dateFormat: string;
  pushNotifications: boolean;
  emailAlerts: boolean;
  budgetWarnings: boolean;
  monthlyReports: boolean;
}

export interface AiInsightDto {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
}

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}
