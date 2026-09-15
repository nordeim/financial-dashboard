"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
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
import { useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { subcategoryEmoji } from "@/lib/categories";
import { ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { AnalyticsDto } from "@/lib/types";

const CHART_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#64748B", "#84CC16"];

type Period = "3" | "6" | "12";

export function AnalyticsView() {
  const query = useQuery<AnalyticsDto>("/api/analytics");
  const [period, setPeriod] = useState<Period>("6");
  const { toast } = useToast();

  const trend = useMemo(() => {
    const all = query.data?.overview.monthlyTrend ?? [];
    return period === "6" ? all : all.slice(-Number.parseInt(period, 10));
  }, [query.data, period]);

  const expensesBySubcategory = useMemo(() => {
    const source = query.data?.expenses.bySubcategory ?? [];
    return source.slice(0, 8).map((entry) => ({ name: entry.label, amountMinor: entry.amountMinor, percent: entry.percent }));
  }, [query.data]);

  const topCategories = useMemo(() => query.data?.expenses.topCategories ?? [], [query.data]);

  const incomeBySource = useMemo(() => query.data?.income.bySource ?? [], [query.data]);

  const sectorData = useMemo(
    () => (query.data?.investments.sectorAllocation ?? []).map((entry) => ({ name: entry.sector, valueMinor: entry.valueMinor, percent: entry.percent })),
    [query.data],
  );

  const exportCsv = () => {
    const data = query.data;
    if (!data) return;
    const lines = ["Month,Income,Expenses,Net Savings"];
    for (const month of data.overview.monthlyTrend) {
      lines.push(
        `${month.month},${(month.incomeMinor / 100).toFixed(2)},${(month.expensesMinor / 100).toFixed(2)},${(month.netMinor / 100).toFixed(2)}`,
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "finara-analytics.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export ready", description: "finara-analytics.csv has been downloaded." });
  };

  const tooltipStyle = { borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Analytics & Reports"
        subtitle="Real-time insights into your financial performance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
              <SelectTrigger className="w-32" aria-label="Reporting period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => query.refresh()}>
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden /> Refresh
            </Button>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" aria-hidden /> Export
            </Button>
          </div>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : !query.data ? (
        <LoadingRows rows={5} />
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Income vs Expenses Trend</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => formatMoneyCompact(value)}
                        width={56}
                      />
                      <Tooltip
                        formatter={(value: number | string) => formatMoney(Number(value))}
                        contentStyle={tooltipStyle}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="incomeMinor" name="Income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGradient)" />
                      <Area type="monotone" dataKey="expensesMinor" name="Expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGradient)" />
                      <Line type="monotone" dataKey="netMinor" name="Net Savings" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-slate-500">Avg Monthly Income</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">{formatMoney(query.data.overview.avgIncomeMinor)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-slate-500">Avg Monthly Expenses</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-red-500">{formatMoney(query.data.overview.avgExpensesMinor)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-slate-500">Avg Monthly Savings</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-blue-600">{formatMoney(query.data.overview.avgSavingsMinor)}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Spending by Category</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expensesBySubcategory} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={56} />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#64748B" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) => formatMoneyCompact(value)}
                          width={56}
                        />
                        <Tooltip formatter={(value: number | string) => formatMoney(Number(value))} contentStyle={tooltipStyle} />
                        <Bar dataKey="amountMinor" name="Spending" radius={[6, 6, 0, 0]}>
                          {expensesBySubcategory.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Top Spending Categories</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCategories}
                          dataKey="amountMinor"
                          nameKey="label"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {topCategories.map((entry, index) => (
                            <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | string) => formatMoney(Number(value))} contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="income" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Income by Source</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeBySource} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatMoneyCompact(value)} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} width={140} />
                        <Tooltip formatter={(value: number | string) => formatMoney(Number(value))} contentStyle={tooltipStyle} />
                        <Bar dataKey="amountMinor" name="Monthly income" fill="#10B981" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Monthly Income Trend</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={query.data.income.monthlyTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatMoneyCompact(value)} width={56} />
                        <Tooltip formatter={(value: number | string) => formatMoney(Number(value))} contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="incomeMinor" name="Income" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="investments" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Sector Allocation</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sectorData} dataKey="valueMinor" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2} strokeWidth={0}>
                          {sectorData.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | string) => formatMoney(Number(value))} contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-5">
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">Holdings Performance</h2>
                  <div className="h-72 overflow-y-auto pr-1 finara-scroll">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="text-right">Return</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {query.data.investments.holdings.map((holding) => {
                          const value = Math.round(holding.shares * holding.currentPriceMinor);
                          const gain = value - Math.round(holding.shares * holding.avgPriceMinor);
                          const gainPct = Math.round(holding.shares * holding.avgPriceMinor) > 0 ? (gain / Math.round(holding.shares * holding.avgPriceMinor)) * 100 : 0;
                          return (
                            <TableRow key={holding.id}>
                              <TableCell className="font-semibold text-slate-900">{holding.symbol}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatMoney(value)}</TableCell>
                              <TableCell className={`text-right tabular-nums ${gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {gainPct.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
