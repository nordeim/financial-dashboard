"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Brain,
  CircleCheckBig,
  CirclePlus,
  Landmark,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { ACTIVITY_BADGE, CATEGORY_DOT } from "@/lib/ui-maps";
import { formatDate } from "@/lib/date-format";
import { budgetRemainingLabel } from "@/lib/dashboard-kpis";
import { EmptyState, ErrorNote, GradientCard, LoadingRows, SectionCard, StatCard, SurplusBadge } from "@/components/finara/ui-bits";
import type { AiInsightDto, DashboardDto } from "@/lib/types";
import type { ViewId } from "@/components/finara/sidebar";
import { cn } from "@/lib/utils";

export function DashboardView({
  onNavigate,
  onQuickAdd,
  quickAddOpen,
  onOpenAiCoach,
  refreshKey,
}: {
  onNavigate: (view: ViewId) => void;
  /** FAB → Quick Add chooser (live behavior, round 4). Toggles — the FAB
   * stays on top of the z-40 chooser overlay and acts as the close button. */
  onQuickAdd: () => void;
  /** Mirrors the Quick Add dialog state so the FAB plus icon can rotate
   * into an X while open (live-verified framer-motion artifact). */
  quickAddOpen: boolean;
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
      {/* Page header (live-exact: AI Coach + Refresh outline buttons; the sage
          Add Transaction button is an anchor that navigates to /Expenses). */}
      <div className="fade-in-up mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-primary-navy lg:text-4xl dark:text-white">Financial Dashboard</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Real-time overview of your financial health</p>
        </div>
        <div className="flex gap-3">
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
          <a
            href="/Expenses"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("expenses");
            }}
          >
            <Button className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
              <CirclePlus className="mr-2 h-5 w-5" aria-hidden /> Add Transaction
            </Button>
          </a>
        </div>
      </div>

      {dashboardQuery.error ? (
        <ErrorNote message={dashboardQuery.error} onRetry={dashboardQuery.refresh} />
      ) : !data ? (
        <LoadingRows rows={6} />
      ) : (
        <>
          {/* KPI row (live: md:2 / lg:4, gap-6) */}
          <div className="fade-in-up stagger-1 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

          {/* Action tiles (live: only Bank Sync + Portfolio are interactive) */}
          <div className="fade-in-up stagger-2 grid gap-6 md:grid-cols-4 mb-8">
            <GradientCard
              title="Largest Expense Category"
              value={data.kpis.largestExpenseCategory ?? "N/A"}
              subtitle={data.kpis.largestExpenseCategory ? formatMoney(data.kpis.largestExpenseMinor) : "$0.00"}
              icon={TrendingDown}
              gradient="bg-gradient-to-r from-orange-500 to-orange-600"
              capitalizeValue
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
              href="/Import"
              ariaLabel="Import data. Upload CSV bank files."
            />
            <GradientCard
              title="Portfolio"
              value="Investments"
              subtitle="Track holdings"
              icon={Wallet}
              gradient="bg-gradient-to-r from-purple-500 to-purple-600"
              onClick={() => onNavigate("investments")}
              href="/Investments"
              ariaLabel="Portfolio investments. Track holdings."
            />
          </div>

          {/* Feature grid (live: Budget col-span-2 + right column stacks Recent Activity + AI Insights) */}
          <div className="fade-in-up stagger-3 grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <SectionCard
                title="Budget Overview"
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
                      const hasLimit = budget.limitMinor > 0;
                      const underBudget = budget.remainingMinor >= 0;
                      const remainingLabel = budgetRemainingLabel(budget.limitMinor, budget.remainingMinor);
                      const percentUsed = budget.percentUsed;
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
                                className={cn("h-4 w-4", underBudget || !hasLimit ? "text-emerald-500" : "text-red-500")}
                                aria-hidden
                              />
                              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                {formatMoney(budget.spentMinor)} / {formatMoney(budget.limitMinor)}
                              </span>
                            </div>
                          </div>
                          <div
                            className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                            role="progressbar"
                            aria-valuenow={Math.round(percentUsed)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${budget.category} budget: ${Math.round(percentUsed)}% used`}
                          >
                            <div
                              className="h-full w-full flex-1 bg-primary transition-all"
                              style={{ transform: `translateX(-${100 - Math.min(percentUsed, 100)}%)` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <span>{percentUsed.toFixed(1)}% used</span>
                            <span
                              className={cn(
                                "font-medium",
                                underBudget || !hasLimit
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {remainingLabel}
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
                  <div className="space-y-4">
                    {data.recentTransactions.slice(0, 6).map((transaction) => {
                      const isIncome = transaction.kind === "income";
                      const badgeKey = (transaction.category ?? "").toLowerCase();
                      const badgeText = badgeKey;
                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center gap-3 rounded-lg bg-neutral-50/50 p-3 transition-colors hover:bg-neutral-100/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/50"
                        >
                          {/* Live-exact: the text color lives on the circle div
                              and the glyph inherits currentColor. */}
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-600",
                              isIncome ? "text-emerald-500" : "text-red-500",
                            )}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="h-5 w-5" aria-hidden />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5" aria-hidden />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-neutral-900 dark:text-white">{transaction.description}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary" className={ACTIVITY_BADGE[badgeKey] ?? ACTIVITY_BADGE.other}>
                                {badgeText}
                              </Badge>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formatDate(transaction.date, "MM/dd/yyyy")}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "font-semibold",
                                isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                              )}
                            >
                              {isIncome ? "+" : "-"}
                              {formatMoney(transaction.amountMinor)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="AI Insights"
                icon={Brain}
                actions={
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onOpenAiCoach} className="h-8 gap-2 px-3 text-xs">
                      <MessageCircle className="h-4 w-4" aria-hidden /> Ask AI
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void loadInsights()}
                      aria-label="Refresh insights"
                      className="h-9 w-9"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                }
              >
                {insightsError ? (
                  <ErrorNote message={insightsError} onRetry={() => void loadInsights()} />
                ) : insightsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8" role="status" aria-label="Generating insights">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-500" aria-hidden />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Generating insights…</span>
                  </div>
                ) : (
                  /* Live body: fixed-height scroll area wrapping the insight feed. */
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {insights.length === 0 ? (
                        <div className="py-8 text-center">
                          <Brain
                            className="mx-auto mb-3 h-12 w-12 text-neutral-300 dark:text-neutral-600"
                            aria-hidden
                          />
                          <p className="text-neutral-500 dark:text-neutral-400">No insights available yet</p>
                          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                            Add more transactions to see AI-powered insights
                          </p>
                        </div>
                      ) : (
                        insights.map((insight) => (
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
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </SectionCard>
            </div>
          </div>

          {/* Quick Actions (live: plain mt-12 panel, NOT a Card; anchor-wrapped buttons) */}
          <div className="fade-in-up mt-12 rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:bg-gray-800/80">
            <h3 className="mb-4 text-xl font-bold text-primary-navy dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <a
                href="/Income"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate("income");
                }}
              >
                <Button variant="outline" className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                  <span className="text-sm">Add Income</span>
                </Button>
              </a>
              <a
                href="/Expenses"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate("expenses");
                }}
              >
                <Button variant="outline" className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <TrendingDown className="h-5 w-5" aria-hidden />
                  <span className="text-sm">Add Expense</span>
                </Button>
              </a>
              <a
                href="/Goals"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate("goals");
                }}
              >
                <Button variant="outline" className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                  <Target className="h-5 w-5" aria-hidden />
                  <span className="text-sm">Set Goal</span>
                </Button>
              </a>
              <a
                href="/Analytics"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate("analytics");
                }}
              >
                <Button variant="outline" className="h-16 w-full flex-col gap-2 px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                  <span className="text-sm">View Reports</span>
                </Button>
              </a>
            </div>
          </div>
        </>
      )}

      {/* FAB (live: fixed bottom-6 right-6 sage circle; opens the Quick Add
          chooser whose z-40 overlay keeps this button on top as the toggle,
          rotating the plus 45° into an X while open). */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onQuickAdd}
          aria-label="Add transaction"
          className="h-14 w-14 rounded-full bg-primary-sage px-4 py-2 text-primary-foreground shadow-xl hover:bg-primary-sage/90"
        >
          <div style={{ transform: quickAddOpen ? "rotate(45deg)" : "none" }}>
            <Plus className="h-6 w-6 text-white" aria-hidden />
          </div>
        </Button>
      </div>
    </div>
  );
}
