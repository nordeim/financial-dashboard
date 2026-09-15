"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Filter, Plus, Search, TrendingDown } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { subcategoryEmoji, subcategoryLabel } from "@/lib/categories";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { ExpenseDto } from "@/lib/types";

export function ExpensesView({ onAddExpense, refreshKey = 0 }: { onAddExpense: () => void; refreshKey?: number }) {
  const query = useQuery<ExpenseDto[]>("/api/expenses");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"All" | "Needs" | "Wants" | "Savings">("All");
  const [sortDesc, setSortDesc] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  // Refetch when the shell bumps refreshKey (e.g. after the save dialog closes).
  const appliedRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== appliedRefreshKey.current) {
      appliedRefreshKey.current = refreshKey;
      query.refresh();
    }
  }, [refreshKey, query]);

  const expenses = query.data ?? [];

  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const thisMonth = expenses.filter((expense) => new Date(expense.date) >= monthStart);
  const totals = {
    total: thisMonth.reduce((sum, expense) => sum + expense.amountMinor, 0),
    Needs: thisMonth.filter((e) => e.category === "Needs").reduce((sum, e) => sum + e.amountMinor, 0),
    Wants: thisMonth.filter((e) => e.category === "Wants").reduce((sum, e) => sum + e.amountMinor, 0),
    Savings: thisMonth.filter((e) => e.category === "Savings").reduce((sum, e) => sum + e.amountMinor, 0),
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = (query.data ?? []).filter((expense) => {
      const matchesTab = tab === "All" || expense.category === tab;
      const matchesSearch =
        term === "" ||
        expense.description.toLowerCase().includes(term) ||
        subcategoryLabel(expense.subcategory).toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });
    return expanded ? sorted : sorted.slice(0, 12);
  }, [query.data, search, tab, sortDesc, expanded]);

  const deleteExpense = async (expense: ExpenseDto) => {
    const result = await mutate(`/api/expenses/${expense.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not delete expense", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Expense deleted", description: `${expense.description} was removed.` });
    query.refresh();
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Expenses"
        subtitle="Track and categorize all your spending"
        actions={
          <Button onClick={onAddExpense} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Expense
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(totals.total)}</p>
                <p className="mt-1 text-xs text-slate-400">This month · {thisMonth.length} transactions</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Needs</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-sky-600">{formatMoney(totals.Needs)}</p>
                <p className="mt-1 text-xs text-slate-400">Essentials · 50% target</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Wants</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-violet-600">{formatMoney(totals.Wants)}</p>
                <p className="mt-1 text-xs text-slate-400">Lifestyle · 30% target</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Savings</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">{formatMoney(totals.Savings)}</p>
                <p className="mt-1 text-xs text-slate-400">Future you · 20% target</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search expenses..."
                    className="pl-9"
                    aria-label="Search expenses"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSortDesc((desc) => !desc)} aria-label={`Sort by date ${sortDesc ? "oldest first" : "newest first"}`}>
                    {sortDesc ? <ChevronDown className="mr-1 h-4 w-4" aria-hidden /> : <ChevronUp className="mr-1 h-4 w-4" aria-hidden />}
                    {sortDesc ? "Newest" : "Oldest"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-slate-500" aria-label="Filters not available in this demo" onClick={() => toast({ title: "Filters", description: "Category and date filters are applied via the tabs and search above." })}>
                    <Filter className="mr-1 h-4 w-4" aria-hidden /> Filters
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
                  <TabsList>
                    <TabsTrigger value="All">All</TabsTrigger>
                    <TabsTrigger value="Needs">Needs</TabsTrigger>
                    <TabsTrigger value="Wants">Wants</TabsTrigger>
                    <TabsTrigger value="Savings">Savings</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="mt-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Expense History ({expenses.length})
                </h3>
                {visible.length === 0 ? (
                  <EmptyState
                    icon={TrendingDown}
                    title="No expenses yet"
                    body="Start tracking your spending to better manage your budget"
                    action={
                      <Button onClick={onAddExpense} className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Your First Expense
                      </Button>
                    }
                  />
                ) : (
                  <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto pr-1 finara-scroll" aria-label="Expense history">
                    {visible.map((expense) => (
                      <li key={expense.id} className="group flex items-center gap-3 py-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg" aria-hidden>
                          {subcategoryEmoji(expense.subcategory)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{expense.description}</p>
                          <p className="text-xs text-slate-400">
                            {subcategoryLabel(expense.subcategory)} ·{" "}
                            {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            {expense.recurring ? " · recurring" : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            expense.category === "Needs"
                              ? "bg-sky-50 text-sky-600"
                              : expense.category === "Wants"
                                ? "bg-violet-50 text-violet-600"
                                : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {expense.category}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                          {formatMoney(expense.amountMinor)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
                          onClick={() => void deleteExpense(expense)}
                          aria-label={`Delete ${expense.description}`}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {expenses.length > 12 ? (
                  <Button variant="ghost" className="mt-3 w-full text-slate-500" onClick={() => setExpanded((value) => !value)}>
                    {expanded ? "Show less" : `Show all ${expenses.length} expenses`}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
