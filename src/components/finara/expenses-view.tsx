"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pen,
  Plus,
  Receipt,
  Search,
  Trash2,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { subcategoryEmoji, subcategoryLabel } from "@/lib/categories";
import { CATEGORY_BADGE, CATEGORY_DOT } from "@/lib/ui-maps";
import { formatDate } from "@/lib/date-format";
import {
  applyExpenseFilters,
  countActiveFilters,
  defaultExpenseFilters,
  type ExpenseFilters,
} from "@/lib/expense-filters";
import { ExpenseFiltersPanel } from "@/components/finara/expense-filters-panel";
import { AddTransactionDialog } from "@/components/finara/add-transaction-dialog";
import { CARD_SURFACE, ClassicFilterIcon, EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { ExpenseDto } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function ExpensesView({ onAddExpense, onQuickAdd, quickAddOpen, refreshKey = 0 }: { onAddExpense: () => void; onQuickAdd: () => void; quickAddOpen: boolean; refreshKey?: number }) {
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
    // Source parity: the live app confirms deletions with a native dialog.
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
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
    if (!window.confirm(`Are you sure you want to delete ${ids.length} expense${ids.length === 1 ? "" : "s"}?`)) return;
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
    <div>
      <ViewHeader
        title="Expenses"
        subtitle="Track and categorize all your spending"
        actions={
          <Button onClick={onAddExpense} className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
            <Plus className="mr-2 h-5 w-5" aria-hidden /> Add Expense
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          {/* Summary cards (live: red gradient total Card + dotted category cards, mb-8) */}
          <div className="fade-in-up mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card className="border-0 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-red-100">Total Expenses</p>
                    <p className="text-2xl font-bold">{formatMoney(totals.total)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-200" aria-hidden />
                </div>
              </div>
            </Card>
            {(["Needs", "Wants", "Savings"] as const).map((category) => (
              <Card key={category} className={cn(CARD_SURFACE, "card-hover")}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium text-neutral-600 capitalize dark:text-neutral-400">
                        {category.toLowerCase()}
                      </p>
                      <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatMoney(totals[category])}</p>
                    </div>
                    <div className={cn("h-3 w-3 rounded-full", CATEGORY_DOT[category.toLowerCase()])} aria-hidden />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Search + Filters (live: bare on the page, mb-6, NOT inside a card) */}
          <div className="fade-in-up stagger-1 mb-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search expenses..."
                  className="h-9 pl-10"
                  aria-label="Search expenses..."
                />
              </div>
              <Button
                variant="outline"
                className="h-9 gap-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                onClick={() => {
                  setDraft(filters);
                  setFiltersOpen((open) => !open);
                }}
                aria-expanded={filtersOpen}
              >
                <ClassicFilterIcon className="h-4 w-4" /> Filters{" "}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  {activeFilterCount}
                </span>
              </Button>
            </div>

            {filtersOpen ? (
              <div>
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
                className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20"
                role="toolbar"
                aria-label="Bulk expense actions"
              >
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-neutral-600 dark:text-neutral-300">
                  <XCircle className="mr-1 h-4 w-4" aria-hidden /> Deselect All
                </Button>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  {selectedIds.size} expense{selectedIds.size === 1 ? "" : "s"} selected
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Select value={bulkCategory} onValueChange={(value) => setBulkCategory(value)}>
                    <SelectTrigger aria-label="Bulk edit" className="h-9 w-36">
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
            </div>
          </div>

          {/* Expense History (live: separate card, receipt icon title, tabs in
              the CardHeader row, NO card-hover) */}
          <Card className={cn(CARD_SURFACE, "fade-in-up stagger-2")}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 font-semibold leading-none tracking-tight text-primary-navy dark:text-white">
                  <Receipt className="h-5 w-5" aria-hidden /> Expense History ({filtered.length})
                </CardTitle>
                <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="All">All</TabsTrigger>
                    <TabsTrigger value="Needs">Needs</TabsTrigger>
                    <TabsTrigger value="Wants">Wants</TabsTrigger>
                    <TabsTrigger value="Savings">Savings</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {visible.length === 0 ? (
                <EmptyState
                  icon={TrendingDown}
                  title="No expenses yet"
                  body="Start tracking your spending to better manage your budget"
                  action={
                    <Button onClick={onAddExpense} className="bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
                      <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Your First Expense
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="space-y-4" aria-label="Expense history">
                    {visible.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center gap-4 rounded-xl bg-neutral-50/50 p-4 transition-colors hover:bg-neutral-100/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/50"
                      >
                        <Checkbox
                          checked={selectedIds.has(expense.id)}
                          onCheckedChange={() => toggleSelected(expense.id)}
                          aria-label={`Select ${expense.description}`}
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-600" aria-hidden>
                          <span className="text-lg">{subcategoryEmoji(expense.subcategory)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between">
                            <h3 className="truncate font-semibold text-neutral-900 dark:text-white">
                              {expense.description}
                            </h3>
                            <p className="ml-4 text-lg font-bold text-red-600 dark:text-red-500">
                              -{formatMoney(expense.amountMinor)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={CATEGORY_BADGE[expense.category.toLowerCase()] ?? "bg-green-100 text-green-800"}
                            >
                              {expense.category.toLowerCase()}
                            </Badge>
                            <Badge variant="outline" className="dark:border-gray-600">
                              {subcategoryLabel(expense.subcategory).toLowerCase()}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                              <Calendar className="h-3 w-3" aria-hidden />
                              <span>{formatDate(expense.date, "MM/dd/yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-neutral-400 hover:text-blue-600"
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
                            className="h-8 w-8 text-neutral-400 hover:text-red-600"
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
                        className="h-8 w-8"
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
                              <span className="text-neutral-400" aria-hidden>
                                …
                              </span>
                            ) : null}
                            <Button
                              variant={number === safePage ? "default" : "outline"}
                              size="sm"
                              className="h-8 w-8 p-0"
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
                        className="h-8 w-8"
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
            </CardContent>
          </Card>
        </>
      )}

      {/* Floating action button (live: fixed bottom-6 right-6, sage circle;
          opens the Quick Add chooser; plus rotates 45° into an X while open). */}
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
