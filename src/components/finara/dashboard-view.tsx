"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Brain,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Landmark,
} from "lucide-react";
import { useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { subcategoryEmoji, subcategoryLabel } from "@/lib/categories";
import { formatDate } from "@/lib/date-format";
import { EmptyState, ErrorNote, GradientCard, LoadingRows, SectionCard, StatCard, SurplusBadge } from "@/components/finara/ui-bits";
import type { AiInsightDto, DashboardDto } from "@/lib/types";
import type { TransactionKind } from "@/components/finara/add-transaction-dialog";
import type { ViewId } from "@/components/finara/sidebar";

const CATEGORY_COLORS: Record<string, string> = {
  Needs: "bg-sky-500",
  Wants: "bg-violet-500",
  Savings: "bg-emerald-500",
};

export function DashboardView({
  onNavigate,
  onAddTransaction,
  onOpenAiCoach,
  refreshKey,
}: {
  onNavigate: (view: ViewId) => void;
  onAddTransaction: (kind: TransactionKind) => void;
  onOpenAiCoach: () => void;
  refreshKey: number;
}) {
  const dashboardQuery = useQuery<DashboardDto>("/api/dashboard");
  const [insights, setInsights] = useState<AiInsightDto[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const response = await fetch("/api/ai/insights", { headers: { Accept: "application/json" } });
      const payload = (await response.json()) as { ok: boolean; data?: { insights: AiInsightDto[] }; error?: string };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error ?? `Request failed with status ${response.status}`);
      }
      setInsights(payload.data.insights);
    } catch (cause) {
      setInsightsError(cause instanceof Error ? cause.message : "Unable to load insights");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // Insights load once on mount.
  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  // Refetch the dashboard when the shell bumps refreshKey (after mutations or Refresh).
  const appliedRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== appliedRefreshKey.current) {
      appliedRefreshKey.current = refreshKey;
      dashboardQuery.refresh();
    }
  }, [refreshKey, dashboardQuery]);

  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Financial Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real-time overview of your financial health</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={onOpenAiCoach}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-900 dark:text-violet-400 dark:hover:bg-violet-950"
          >
            <Brain className="mr-1 h-4 w-4" aria-hidden /> AI Coach
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              dashboardQuery.refresh();
              void loadInsights();
              toast({ title: "Dashboard refreshed", description: "All figures are up to date." });
            }}
            className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className="mr-1 h-4 w-4" aria-hidden /> Refresh
          </Button>
          <Button onClick={() => onAddTransaction("expense")} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Transaction
          </Button>
        </div>
      </div>

      {dashboardQuery.error ? (
        <ErrorNote message={dashboardQuery.error} onRetry={dashboardQuery.refresh} />
      ) : !data ? (
        <LoadingRows rows={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Monthly Income"
              value={formatMoney(data.kpis.monthlyIncomeMinor)}
              icon={TrendingUp}
              iconClass="bg-emerald-600"
              trend={data.kpis.incomeChangePercent}
            />
            <StatCard
              label="Monthly Expenses"
              value={formatMoney(data.kpis.monthlyExpensesMinor)}
              icon={TrendingDown}
              iconClass="bg-red-500"
              trend={data.kpis.expenseChangePercent}
              invertTrend
            />
            <StatCard
              label="Net Balance"
              value={formatMoney(data.kpis.netBalanceMinor)}
              icon={Wallet}
              iconClass="bg-blue-500"
              trend={data.kpis.netChangePercent}
            />
            <StatCard
              label="Savings Progress"
              value={`${data.kpis.savingsProgressPercent.toFixed(1)}%`}
              icon={Target}
              iconClass="bg-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GradientCard
              title="Largest Expense Category"
              value={data.kpis.largestExpenseCategory ?? "N/A"}
              subtitle={data.kpis.largestExpenseCategory ? formatMoney(data.kpis.largestExpenseMinor) : "$0.00"}
              icon={TrendingDown}
              gradient="bg-gradient-to-br from-orange-400 to-orange-600"
              onClick={() => onNavigate("expenses")}
              ariaLabel={`Largest expense category: ${data.kpis.largestExpenseCategory ?? "none"}. Open expenses.`}
            />
            <GradientCard
              title="Active Goals"
              value={String(data.kpis.activeGoals)}
              subtitle="Goals in progress"
              icon={Target}
              gradient="bg-gradient-to-br from-cyan-500 to-teal-600"
              onClick={() => onNavigate("goals")}
              ariaLabel={`${data.kpis.activeGoals} goals in progress. Open goals.`}
            />
            <GradientCard
              title="Bank Sync"
              value="Import Data"
              subtitle="Upload CSV files"
              icon={Landmark}
              gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              onClick={() => onNavigate("import")}
              ariaLabel="Import data. Upload CSV bank files."
            />
            <GradientCard
              title="Portfolio"
              value="Investments"
              subtitle="Track holdings"
              icon={BarChart3}
              gradient="bg-gradient-to-br from-purple-500 to-fuchsia-600"
              onClick={() => onNavigate("investments")}
              ariaLabel="Portfolio investments. Track holdings."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Budget Overview"
              badge={<SurplusBadge amountMinor={data.budgetSurplusMinor} />}
              className="lg:col-span-2"
            >
              {data.budgets.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No budget data available"
                  body="Set up your monthly budgets to see progress"
                />
              ) : (
                <div className="space-y-5">
                  {data.budgets.map((budget) => (
                    <div key={budget.category}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{budget.category}</span>
                        <span className="tabular-nums text-slate-500 dark:text-slate-400">
                          {formatMoney(budget.spentMinor)} / {formatMoney(budget.limitMinor)}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all ${CATEGORY_COLORS[budget.category] ?? "bg-slate-400"} ${budget.percentUsed > 100 ? "opacity-80" : ""}`}
                          style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                          role="progressbar"
                          aria-valuenow={Math.round(budget.percentUsed)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${budget.category} budget: ${Math.round(budget.percentUsed)}% used`}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {budget.percentUsed.toFixed(1)}% used ·{" "}
                        {budget.remainingMinor >= 0
                          ? `${formatMoney(budget.remainingMinor)} remaining`
                          : `${formatMoney(-budget.remainingMinor)} over budget`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Recent Activity">
              {data.recentTransactions.length === 0 ? (
                <EmptyState
                  icon={TrendingDown}
                  title="No recent transactions"
                  body="Add income or expenses to see activity"
                  action={
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => onAddTransaction("expense")}>
                      <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Transaction
                    </Button>
                  }
                />
              ) : (
                <ul className="max-h-96 space-y-3 overflow-y-auto pr-1 finara-scroll" aria-label="Recent transactions">
                  {data.recentTransactions.map((transaction) => {
                    const isInCOME = transaction.kind === "income";
                    return (
                      <li key={transaction.id} className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base dark:bg-slate-700"
                          aria-hidden
                        >
                          {isInCOME ? "💰" : subcategoryEmoji(transaction.subcategory ?? "")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            <span className="lowercase">
                              {isInCOME ? "income" : `${(transaction.category ?? "").toLowerCase()} · ${subcategoryLabel(transaction.subcategory ?? "").toLowerCase()}`}
                            </span>{" "}
                            · {formatDate(transaction.date, "MM/dd/yyyy")}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold tabular-nums ${
                            isInCOME ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                          }`}
                        >
                          {isInCOME ? "+" : "−"}
                          {formatMoney(transaction.amountMinor)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="AI Insights"
            actions={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenAiCoach}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-400 dark:hover:bg-violet-950"
                >
                  <Sparkles className="mr-1 h-4 w-4" aria-hidden /> Ask AI
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Regenerate insights"
                  onClick={() => void loadInsights()}
                  disabled={insightsLoading}
                  className="dark:text-slate-400"
                >
                  <RefreshCw className={`h-4 w-4 ${insightsLoading ? "animate-spin" : ""}`} aria-hidden />
                </Button>
              </div>
            }
          >
            {insightsError ? (
              <ErrorNote message={insightsError} onRetry={() => void loadInsights()} />
            ) : insightsLoading ? (
              <div className="flex items-center justify-center gap-2 py-8" role="status" aria-label="Generating insights">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" aria-hidden />
                <span className="text-sm text-slate-400 dark:text-slate-500">Generating insights…</span>
              </div>
            ) : insights.length === 0 ? (
              <EmptyState
                icon={Brain}
                title="No insights available yet"
                body="Add more transactions to see AI-powered insights"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`rounded-xl border p-4 ${
                      insight.tone === "positive"
                        ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40"
                        : insight.tone === "warning"
                          ? "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/40"
                          : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/60"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          insight.tone === "positive"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                            : insight.tone === "warning"
                              ? "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                              : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {insight.tone === "positive" ? (
                          <TrendingUp className="h-4 w-4" aria-hidden />
                        ) : insight.tone === "warning" ? (
                          <TrendingDown className="h-4 w-4" aria-hidden />
                        ) : (
                          <Brain className="h-4 w-4" aria-hidden />
                        )}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{insight.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{insight.body}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <section aria-label="Quick Actions">
            <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-50">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Button
                variant="outline"
                onClick={() => onAddTransaction("income")}
                className="h-auto justify-start gap-3 border-slate-200 px-4 py-3.5 text-left dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Add Income</span>
                  <span className="block text-xs text-slate-400">Record a new income source</span>
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onAddTransaction("expense")}
                className="h-auto justify-start gap-3 border-slate-200 px-4 py-3.5 text-left dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400">
                  <TrendingDown className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Add Expense</span>
                  <span className="block text-xs text-slate-400">Track a new purchase</span>
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("goals")}
                className="h-auto justify-start gap-3 border-slate-200 px-4 py-3.5 text-left dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-400">
                  <Target className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Set Goal</span>
                  <span className="block text-xs text-slate-400">Plan a savings objective</span>
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("analytics")}
                className="h-auto justify-start gap-3 border-slate-200 px-4 py-3.5 text-left dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400">
                  <BarChart3 className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">View Reports</span>
                  <span className="block text-xs text-slate-400">Explore your analytics</span>
                </span>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
