"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChartColumn, ChartPie, Download, RefreshCw, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery, useSettings } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { SECTOR_COLORS } from "@/lib/ui-maps";
import { CARD_PLAIN, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import { Input } from "@/components/ui/input";
import type { AnalyticsDto } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#64748B", "#84CC16"];

/** Normalize a live sector label ("Real Estate") to its ui-maps key ("real-estate"). */
function sectorKey(sector: string): string {
  return sector.toLowerCase().replace(/\s+/g, "-");
}

type Period = "3" | "6" | "12";

export function AnalyticsView() {
  const [period, setPeriod] = useState<Period>("6");
  const query = useQuery<AnalyticsDto>(`/api/analytics?months=${period}`);
  const { toast } = useToast();
  const { currency } = useSettings();

  // The server windows the aggregates by the period select. Round 9: the
  // From/To date inputs are live-INERT (any range leaves the charts
  // untouched — probed 2026-09-17, the same unfinished-wiring class as the
  // expenses Bulk Edit options), so no client-side trend filtering exists.
  const trend = useMemo(() => {
    const all = query.data?.overview.monthlyTrend ?? [];
    return all;
  }, [query.data]);

  const expensesBySubcategory = useMemo(() => {
    const source = query.data?.expenses.bySubcategory ?? [];
    return source.slice(0, 8).map((entry) => ({ name: entry.label, amountMinor: entry.amountMinor, percent: entry.percent }));
  }, [query.data]);

  const topCategories = useMemo(() => query.data?.expenses.topCategories ?? [], [query.data]);

  const sectorData = useMemo(
    () => (query.data?.investments.sectorAllocation ?? []).map((entry) => ({ name: entry.sector, valueMinor: entry.valueMinor, percent: entry.percent })),
    [query.data],
  );

  const exportCsv = async () => {
    // Round 9 live probe: the Export button downloads a TRANSACTIONS csv
    // ("Date,Description,Category,Subcategory,Amount,Type" — every expense,
    // income source and holding), built server-side by /api/export, named
    // financial-report-<date>.csv — NOT a monthly-trend summary.
    try {
      const response = await fetch("/api/export?type=transactions", { cache: "no-store" });
      if (!response.ok) throw new Error(`Export failed with status ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const today = new Date().toISOString().slice(0, 10);
      anchor.download = `financial-report-${today}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: `financial-report-${today}.csv has been downloaded.` });
    } catch (cause) {
      toast({
        title: "Export failed",
        description: cause instanceof Error ? cause.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Round-11 corrected live probe (computed styles + pixel crops, both
  // themes): the live tooltip's inline style references var(--background)/
  // var(--border)/var(--foreground), but its theme tokens are raw HSL
  // triples (Tailwind v3 convention) — defined yet INVALID as direct color
  // values. The whole border shorthand invalidates (computed style none,
  // width 0 — NO border renders), the background computes transparent and
  // the text color inherits: a pure borderless text overlay (#fafafa on
  // dark, #0a0a0a on light) with an 8px radius and 16px inherited font. We
  // replicate that effective rendering (the var() fallbacks never fire).
  const tooltipStyle = {
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 8,
  };

  return (
    <>
      <ViewHeader
        title="Analytics & Reports"
        subtitle="Real-time insights into your financial performance"
        actions={
          /* Live wraps the analytics actions in its own flex row (round-5
             capture: div.flex.gap-3.flex-wrap) — the only view with a wrapper. */
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              {/* Live renders value="" and never consumes the range (F8) —
                  uncontrolled inputs keep the exact live behavior. */}
              <Input type="date" aria-label="Start date" placeholder="Start date" className="w-auto" />
              <Input type="date" aria-label="End date" placeholder="End date" className="w-auto" />
            </div>
            <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
              <SelectTrigger className="w-32" aria-label="Reporting period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => query.refresh()} className="gap-2">
              <RefreshCw className="w-4 h-4" aria-hidden /> Refresh
            </Button>
            <Button variant="outline" onClick={exportCsv} className="gap-2">
              <Download className="w-4 h-4" aria-hidden /> Export
            </Button>
          </div>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : !query.data ? (
        <LoadingRows rows={5} />
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className={cn(CARD_PLAIN)}>
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                  <TrendingUp className="w-5 h-5" aria-hidden /> Income vs Expenses Trend
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      {/* Live chart config (round-5 capture): both grid directions,
                          visible axis + tick lines (#64748b), dark-mode grid via
                          dark:stroke-gray-600 on each line (className propagates
                          through recharts filterProps), lowercase hex throughout. */}
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-600" />
                      <XAxis dataKey="month" stroke="#64748b" className="dark:stroke-gray-400" tick={{ fill: "#64748b" }} />
                      <YAxis
                        stroke="#64748b"
                        className="dark:stroke-gray-400"
                        tick={{ fill: "#64748b" }}
                        tickFormatter={(value: number) => formatMoney(value, { currency })}
                        width={84}
                      />
                      <Tooltip formatter={(value: number | string) => formatMoney(Number(value), { currency })} contentStyle={tooltipStyle} />
                      {/* Live: the ONLY chart legend — default icon and
                          inherited 16px text (round-11 probe: no font style
                          is passed on the legend). */}
                      <Legend />
                      <Line type="monotone" dataKey="incomeMinor" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="expensesMinor" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="netMinor" name="Net Savings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">Avg Monthly Income</p>
                      <p className="text-2xl font-bold">{formatMoney(query.data.overview.avgIncomeMinor, { currency })}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-200" aria-hidden />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium mb-1">Avg Monthly Expenses</p>
                      <p className="text-2xl font-bold">{formatMoney(query.data.overview.avgExpensesMinor, { currency })}</p>
                    </div>
                    {/* Live quirk: the expenses average tile flips the trending-up
                        glyph 180° (renders as a down-arrow) in red-200. */}
                    <TrendingUp className="w-8 h-8 text-red-200 rotate-180" aria-hidden />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Avg Monthly Savings</p>
                      <p className="text-2xl font-bold">{formatMoney(query.data.overview.avgSavingsMinor, { currency })}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-200" aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-8">
            <div className={cn(CARD_PLAIN)}>
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                  <ChartPie className="w-5 h-5" aria-hidden /> Spending by Category
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesBySubcategory}
                        dataKey="amountMinor"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {expensesBySubcategory.map((entry) => (
                          <Cell key={entry.name} fill={CHART_COLORS[expensesBySubcategory.indexOf(entry) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | string) => formatMoney(Number(value), { currency })} contentStyle={tooltipStyle} />
                      {/* Live Expenses-tab charts carry NO legend (round-11
                          probe: zero legends on both the pie and the bar). */}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={cn(CARD_PLAIN)}>
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                  <ChartColumn className="w-5 h-5" aria-hidden /> Top Spending Categories
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCategories} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-600" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        className="dark:stroke-gray-400"
                        tick={{ fill: "#64748b" }}
                        tickFormatter={(value: number) => formatMoney(value, { currency })}
                      />
                      <YAxis type="category" dataKey="label" stroke="#64748b" className="dark:stroke-gray-400" tick={{ fill: "#64748b" }} width={140} />
                      <Tooltip formatter={(value: number | string) => formatMoney(Number(value), { currency })} contentStyle={tooltipStyle} />
                      <Bar dataKey="amountMinor" name="Spending" radius={[0, 6, 6, 0]}>
                        {topCategories.map((entry, index) => (
                          <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Source parity quirk (live-verified round 4): the Income tab has a
              trigger but NO content element at all — live renders only three
              TabsContent divs (overview / expenses / investments). Clicking
              Income shows the empty pane in both apps. */}

          <TabsContent value="investments" className="space-y-8">
            <div className={cn(CARD_PLAIN)}>
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                  <ChartPie className="w-5 h-5" aria-hidden /> Portfolio Allocation by Sector
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sectorData} dataKey="valueMinor" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} strokeWidth={0}>
                        {sectorData.map((entry) => (
                          <Cell key={entry.name} fill={SECTOR_COLORS[sectorKey(entry.name)] ?? "#6B7280"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | string) => formatMoney(Number(value), { currency })} contentStyle={tooltipStyle} />
                      {/* Live Investments-tab donut carries NO legend either
                          (round-11 probe) — the sector list beside it serves
                          that role. */}
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}