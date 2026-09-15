"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Filter, Pen, Plus, Search, Trash2, TrendingDown, XCircle } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { subcategoryEmoji, subcategoryLabel } from "@/lib/categories";
import { formatDate } from "@/lib/date-format";
import {
  applyExpenseFilters,
  countActiveFilters,
  defaultExpenseFilters,
  type ExpenseFilters,
} from "@/lib/expense-filters";
import { ExpenseFiltersPanel } from "@/components/finara/expense-filters-panel";
import { AddTransactionDialog } from "@/components/finara/add-transaction-dialog";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { ExpenseDto } from "@/lib/types";

const PAGE_SIZE = 10;

export function ExpensesView({ onAddExpense, refreshKey = 0 }: { onAddExpense: () => void; refreshKey?: number }) {
  const query = useQuery<ExpenseDto[]>("/api/expenses");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"All" | "Needs" | "Wants" | "Savings">("All");
  const [filters, setFilters] = useState<ExpenseFilters>(defaultExpenseFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseFilters>(defaultExpenseFilters());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>("bulk-edit");
  const [page, setPage] = useState(1);
  const [editingExpense, setEditingExpense] = useState<ExpenseDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  // Plain computation — the React Compiler auto-memoizes this (manual useMemo here
  // previously broke preserve-manual-memoization because the filters spread is
  // merged with the external search state before use).
  const filtered = applyExpenseFilters(expenses, { ...filters, search }, new Date()).filter(
    (expense) => tab === "All" || expense.category === tab,
  );

  // Reset pagination/selection when the filter context changes — render-time
  // state adjustment (the React-documented pattern), not an effect.
  const [appliedContext, setAppliedContext] = useState({ filters, search, tab });
  if (appliedContext.filters !== filters || appliedContext.search !== search || appliedContext.tab !== tab) {
    setAppliedContext({ filters, search, tab });
    setPage(1);
    setSelectedIds(new Set());
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((expense) => selectedIds.has(expense.id));

  const deleteExpense = async (expense: ExpenseDto) => {
    const result = await mutate(`/api/expenses/${expense.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not delete expense", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Expense deleted", description: `${expense.description} was removed.` });
    query.refresh();
  };

  const bulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setDeleting(true);
    let failures = 0;
    for (const id of ids) {
      const result = await mutate(`/api/expenses/${id}`, "DELETE");
      if (!result.ok) failures += 1;
    }
    setDeleting(false);
    setSelectedIds(new Set());
    query.refresh();
    toast({
      title: failures === 0 ? "Expenses deleted" : "Some expenses could not be deleted",
      description: failures === 0 ? `${ids.length} expense${ids.length === 1 ? "" : "s"} removed.` : `${failures} of ${ids.length} failed.`,
      variant: failures === 0 ? undefined : "destructive",
    });
  };

  const bulkEditCategory = async (category: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0 || !["Needs", "Wants", "Savings"].includes(category)) return;
    setDeleting(true);
    let failures = 0;
    for (const id of ids) {
      const expense = expenses.find((entry) => entry.id === id);
      const result = await mutate(`/api/expenses/${id}`, "PATCH", { category });
      if (!result.ok) failures += 1;
      void expense;
    }
    setDeleting(false);
    setSelectedIds(new Set());
    setBulkCategory("bulk-edit");
    query.refresh();
    toast({
      title: failures === 0 ? "Expenses updated" : "Some expenses could not be updated",
      description:
        failures === 0 ? `${ids.length} expense${ids.length === 1 ? "" : "s"} moved to ${category}.` : `${failures} of ${ids.length} failed.`,
      variant: failures === 0 ? undefined : "destructive",
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((expense) => next.delete(expense.id));
      else visible.forEach((expense) => next.add(expense.id));
      return next;
    });
  };

  const activeFilterCount = countActiveFilters({ ...filters, search: search || filters.search });

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
            {[
              { label: "Total Expenses", value: totals.total, tone: "text-slate-900 dark:text-slate-50" },
              { label: "Needs", value: totals.Needs, tone: "text-sky-600 dark:text-sky-400" },
              { label: "Wants", value: totals.Wants, tone: "text-violet-600 dark:text-violet-400" },
              { label: "Savings", value: totals.Savings, tone: "text-emerald-600 dark:text-emerald-400" },
            ].map((card) => (
              <Card key={card.label} className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className={`mt-2 text-2xl font-bold tabular-nums ${card.tone}`}>{formatMoney(card.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search expenses..."
                    className="pl-9 dark:bg-slate-900"
                    aria-label="Search expenses..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDraft(filters);
                      setFiltersOpen((open) => !open);
                    }}
                    aria-expanded={filtersOpen}
                    className="dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Filter className="mr-1 h-4 w-4" aria-hidden /> Filters{" "}
                    <span className="ml-1 rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  </Button>
                </div>
              </div>

              {filtersOpen ? (
                <div className="mt-4">
                  <ExpenseFiltersPanel
                    filters={filters}
                    draft={draft}
                    onDraftChange={setDraft}
                    onApply={() => {
                      setFilters(draft);
                      setFiltersOpen(false);
                    }}
                    onCancel={() => setFiltersOpen(false)}
                    onClearAll={() => setDraft(defaultExpenseFilters())}
                  />
                </div>
              ) : null}

              {selectedIds.size > 0 ? (
                <div
                  className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/60"
                  role="toolbar"
                  aria-label="Bulk expense actions"
                >
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-slate-600 dark:text-slate-300">
                    <XCircle className="mr-1 h-4 w-4" aria-hidden /> Deselect All
                  </Button>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {selectedIds.size} expense{selectedIds.size === 1 ? "" : "s"} selected
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Select value={bulkCategory} onValueChange={(value) => setBulkCategory(value)}>
                      <SelectTrigger aria-label="Bulk edit" className="h-9 w-36 dark:bg-slate-900">
                        <SelectValue>Bulk Edit</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bulk-edit">Bulk Edit</SelectItem>
                        <SelectItem value="Needs">Move to Needs</SelectItem>
                        <SelectItem value="Wants">Move to Wants</SelectItem>
                        <SelectItem value="Savings">Move to Savings</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void bulkDelete()}
                      disabled={deleting}
                    >
                      <Trash2 className="mr-1 h-4 w-4" aria-hidden /> Delete ({selectedIds.size})
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
                  <TabsList className="dark:bg-slate-900">
                    <TabsTrigger value="All">All</TabsTrigger>
                    <TabsTrigger value="Needs">Needs</TabsTrigger>
                    <TabsTrigger value="Wants">Wants</TabsTrigger>
                    <TabsTrigger value="Savings">Savings</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="mt-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Expense History ({filtered.length})
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
                  <>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700" aria-label="Expense history">
                      {visible.map((expense) => (
                        <div key={expense.id} className="group flex items-center gap-3 py-3">
                          <Checkbox
                            checked={selectedIds.has(expense.id)}
                            onCheckedChange={() => toggleSelected(expense.id)}
                            aria-label={`Select ${expense.description}`}
                            className="shrink-0"
                          />
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg dark:bg-slate-700"
                            aria-hidden
                          >
                            {subcategoryEmoji(expense.subcategory)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                              {expense.description}
                            </p>
                            <p className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 lowercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                {expense.category.toLowerCase()}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 lowercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                {subcategoryLabel(expense.subcategory).toLowerCase()}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500">
                                {formatDate(expense.date, "MM/dd/yyyy")}
                                {expense.recurring ? " · recurring" : ""}
                              </span>
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            −{formatMoney(expense.amountMinor)}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => {
                                setEditingExpense(expense);
                                setEditOpen(true);
                              }}
                              aria-label={`Edit ${expense.description}`}
                            >
                              <Pen className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                              onClick={() => void deleteExpense(expense)}
                              aria-label={`Delete ${expense.description}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {pageCount > 1 ? (
                      <nav
                        className="mt-4 flex items-center justify-center gap-2"
                        aria-label="Expense history pagination"
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 dark:border-slate-700 dark:bg-slate-900"
                          disabled={safePage <= 1}
                          onClick={() => setPage((current) => Math.max(1, current - 1))}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden />
                        </Button>
                        {Array.from({ length: pageCount }, (_, index) => index + 1)
                          .filter(
                            (number) =>
                              number === 1 ||
                              number === pageCount ||
                              Math.abs(number - safePage) <= 1,
                          )
                          .map((number, index, list) => (
                            <span key={number} className="flex items-center gap-2">
                              {index > 0 && number - list[index - 1]! > 1 ? (
                                <span className="text-slate-400" aria-hidden>
                                  …
                                </span>
                              ) : null}
                              <Button
                                variant={number === safePage ? "default" : "outline"}
                                size="sm"
                                className={`h-8 w-8 p-0 ${number === safePage ? "bg-emerald-500 hover:bg-emerald-600" : "dark:border-slate-700 dark:bg-slate-900"}`}
                                onClick={() => setPage(number)}
                                aria-label={`Page ${number}`}
                                aria-current={number === safePage ? "page" : undefined}
                              >
                                {number}
                              </Button>
                            </span>
                          ))}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 dark:border-slate-700 dark:bg-slate-900"
                          disabled={safePage >= pageCount}
                          onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </Button>
                      </nav>
                    ) : null}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AddTransactionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        kind="expense"
        editing={editingExpense}
        onSaved={() => query.refresh()}
      />
    </div>
  );
}
