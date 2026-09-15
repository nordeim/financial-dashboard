"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Brain,
  Calendar,
  CircleCheckBig,
  CirclePlus,
  Landmark,
  Loader2,
  MessageCircle,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { CATEGORY_BADGE, CATEGORY_DOT } from "@/lib/ui-maps";
import { formatDate } from "@/lib/date-format";
import { EmptyState, ErrorNote, GradientCard, LoadingRows, SectionCard, StatCard, SurplusBadge } from "@/components/finara/ui-bits";
import type { AiInsightDto, DashboardDto } from "@/lib/types";
import type { TransactionKind } from "@/components/finara/add-transaction-dialog";
import type { ViewId } from "@/components/finara/sidebar";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8">
      {/* Page header (live-exact) */}
      <div className="fade-in-up mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-primary-navy lg:text-4xl dark:text-white">Financial Dashboard</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Real-time overview of your financial health</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onOpenAiCoach} className="h-9">
            <Brain className="h-4 w-4" aria-hidden /> AI Coach
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              dashboardQuery.refresh();
              void loadInsights();
              toast({ title: "Dashboard refreshed", description: "All figures are up to date." });
            }}
            className="h-9"
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
          </Button>
          <Button onClick={() => onAddTransaction("expense")} className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
            <CirclePlus className="h-4 w-4" aria-hidden /> Add Transaction
          </Button>
        </div>
      </div>

      {dashboardQuery.error ? (
        <ErrorNote message={dashboardQuery.error} onRetry={dashboardQuery.refresh} />
      ) : !data ? (
        <LoadingRows rows={6} />
      ) : (
        <>
          {/* KPI row (live: md:2 / lg:4, gap-6) */}
          <div className="fade-in-up stagger-1 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Monthly Income"
              value={formatMoney(data.kpis.monthlyIncomeMinor)}
              icon={TrendingUp}
              iconClass="bg-gradient-to-r from-emerald-500 to-emerald-600"
              trend={data.kpis.incomeChangePercent}
            />
            <StatCard
              label="Monthly Expenses"
              value={formatMoney(data.kpis.monthlyExpensesMinor)}
              icon={TrendingDown}
              iconClass="bg-gradient-to-r from-red-500 to-red-600"
              trend={data.kpis.expenseChangePercent}
            />
            <StatCard
              label="Net Balance"
              value={formatMoney(data.kpis.netBalanceMinor)}
              icon={Wallet}
              iconClass="bg-gradient-to-r from-blue-500 to-blue-600"
              trend={data.kpis.netChangePercent}
            />
            <StatCard
              label="Savings Progress"
              value={`${data.kpis.savingsProgressPercent.toFixed(1)}%`}
              icon={Target}
              iconClass="bg-gradient-to-r from-purple-500 to-purple-600"
            />
          </div>

          {/* Action tiles (live: only Bank Sync + Portfolio are links) */}
          <div className="fade-in-up stagger-2 grid grid-cols-1 gap-6 md:grid-cols-4">
            <GradientCard
              title="Largest Expense Category"
              value={data.kpis.largestExpenseCategory ?? "N/A"}
              subtitle={data.kpis.largestExpenseCategory ? formatMoney(data.kpis.largestExpenseMinor) : "$0.00"}
              icon={TrendingDown}
              gradient="bg-gradient-to-r from-orange-500 to-orange-600"
            />
            <GradientCard
              title="Active Goals"
              value={String(data.kpis.activeGoals)}
              subtitle="Goals in progress"
              icon={Target}
              gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
            />
            <GradientCard
              title="Bank Sync"
              value="Import Data"
              subtitle="Upload CSV files"
              icon={Landmark}
              gradient="bg-gradient-to-r from-blue-500 to-blue-600"
              onClick={() => onNavigate("import")}
              ariaLabel="Import data. Upload CSV bank files."
            />
            <GradientCard
              title="Portfolio"
              value="Investments"
              subtitle="Track holdings"
              icon={Wallet}
              gradient="bg-gradient-to-r from-purple-500 to-purple-600"
              onClick={() => onNavigate("investments")}
              ariaLabel="Portfolio investments. Track holdings."
            />
          </div>

          {/* Feature grid (live: Budget col-span-2 + right column stacks Recent Activity + AI Insights) */}
          <div className="fade-in-up stagger-3 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <SectionCard
                title={<span className="text-xl font-bold">Budget Overview</span>}
                badge={<SurplusBadge amountMinor={data.budgetSurplusMinor} />}
                contentClassName="space-y-6"
              >
                {data.budgets.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="No budget data available"
                    body="Set up your monthly budgets to see progress"
                  />
                ) : (
                  <div className="space-y-6">
                    {data.budgets.map((budget) => {
                      const categoryId = budget.category.toLowerCase();
                      const underBudget = budget.remainingMinor >= 0;
                      return (
                        <div key={budget.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn("h-3 w-3 rounded-full", CATEGORY_DOT[categoryId] ?? "bg-slate-400")} aria-hidden />
                              <span className="font-medium text-neutral-800 capitalize dark:text-neutral-200">
                                {budget.category.toLowerCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CircleCheckBig
                                className={cn("h-4 w-4", underBudget ? "text-emerald-500" : "text-red-500")}
                                aria-hidden
                              />
                              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                {formatMoney(budget.spentMinor)} / {formatMoney(budget.limitMinor)}
                              </span>
                            </div>
                          </div>
                          <div
                            className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                            role="progressbar"
                            aria-valuenow={Math.round(budget.percentUsed)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${budget.category} budget: ${Math.round(budget.percentUsed)}% used`}
                          >
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <span>{budget.percentUsed.toFixed(1)}% used</span>
                            <span className={cn("font-medium", underBudget ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                              {underBudget
                                ? `${formatMoney(budget.remainingMinor)} remaining`
                                : `${formatMoney(-budget.remainingMinor)} over budget`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="space-y-8">
              <SectionCard title="Recent Activity">
                {data.recentTransactions.length === 0 ? (
                  <EmptyState
                    icon={TrendingDown}
                    title="No recent transactions"
                    body="Add income or expenses to see activity"
                  />
                ) : (
                  <ul className="space-y-4" aria-label="Recent transactions">
                    {data.recentTransactions.slice(0, 6).map((transaction) => {
                      const isIncome = transaction.kind === "income";
                      const badgeText = isIncome
                        ? (transaction.category ?? "income").toLowerCase()
                        : (transaction.category ?? "").toLowerCase();
                      return (
                        <li
                          key={transaction.id}
                          className="flex items-center gap-3 rounded-lg bg-neutral-50/50 p-3 transition-colors hover:bg-neutral-100/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-gray-600">
                            {isIncome ? (
                              <ArrowUpRight className="h-5 w-5 text-emerald-500" aria-hidden />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5 text-red-500" aria-hidden />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-neutral-900 dark:text-white">{transaction.description}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                                  isIncome
                                    ? "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : CATEGORY_BADGE[transaction.category?.toLowerCase() ?? ""] ??
                                      "border-transparent bg-green-100 text-green-800",
                                )}
                              >
                                {badgeText}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                <Calendar className="h-3 w-3" aria-hidden />
                                {formatDate(transaction.date, "MM/dd/yyyy")}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "font-semibold",
                                isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-500",
                              )}
                            >
                              {isIncome ? "+" : "-"}
                              {formatMoney(transaction.amountMinor)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="AI Insights"
                icon={Brain}
                actions={
                  <Button size="sm" variant="outline" onClick={onOpenAiCoach} className="h-8 gap-2 px-3 text-xs">
                    <MessageCircle className="h-4 w-4" aria-hidden /> Ask AI
                  </Button>
                }
              >
                {insightsError ? (
                  <ErrorNote message={insightsError} onRetry={() => void loadInsights()} />
                ) : insightsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8" role="status" aria-label="Generating insights">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-500" aria-hidden />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Generating insights…</span>
                  </div>
                ) : insights.length === 0 ? (
                  <EmptyState
                    icon={Brain}
                    title="No insights available yet"
                    body="Add more transactions to see AI-powered insights"
                  />
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className={cn(
                          "rounded-xl border p-4",
                          insight.tone === "positive"
                            ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/20"
                            : insight.tone === "warning"
                              ? "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-900/20"
                              : "border-neutral-200 bg-neutral-50/60 dark:border-gray-600 dark:bg-gray-700/30",
                        )}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg",
                              insight.tone === "positive"
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                                : insight.tone === "warning"
                                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                                  : "bg-neutral-100 text-neutral-500 dark:bg-gray-700 dark:text-neutral-300",
                            )}
                          >
                            {insight.tone === "positive" ? (
                              <TrendingUp className="h-4 w-4" aria-hidden />
                            ) : insight.tone === "warning" ? (
                              <TrendingDown className="h-4 w-4" aria-hidden />
                            ) : (
                              <Brain className="h-4 w-4" aria-hidden />
                            )}
                          </span>
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{insight.title}</h3>
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{insight.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>

          {/* Quick Actions (live: bottom, link buttons) */}
          <section aria-label="Quick Actions" className="fade-in-up">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Button
                variant="outline"
                onClick={() => onNavigate("income")}
                className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <TrendingUp className="h-5 w-5" aria-hidden />
                <span className="text-sm">Add Income</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("expenses")}
                className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <TrendingDown className="h-5 w-5" aria-hidden />
                <span className="text-sm">Add Expense</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("goals")}
                className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <Target className="h-5 w-5" aria-hidden />
                <span className="text-sm">Set Goal</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("analytics")}
                className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <TrendingUp className="h-5 w-5" aria-hidden />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </section>
        </>
      )}

      {/* Floating action button (live: fixed bottom-6 right-6, sage circle) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => onAddTransaction("expense")}
          aria-label="Add transaction"
          className="h-14 w-14 rounded-full bg-primary-sage px-4 py-2 text-primary-foreground shadow-xl hover:bg-primary-sage/90"
        >
          <CirclePlus className="h-6 w-6" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
