"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Pen, PenLine, Plus, Receipt, Search, SquareCheckBig, TrendingDown, X } from "lucide-react";
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
import {CARD_HOVER, CARD_PLAIN, ClassicFilterIcon, ClassicTrash2, EmptyState, ErrorNote, LoadingRows, ViewHeader} from "@/components/finara/ui-bits";
import type { ExpenseDto } from "@/lib/types";
import { cn } from "@/lib/utils";


export function ExpensesView({ onAddExpense, onQuickAdd, quickAddOpen, refreshKey = 0 }: { onAddExpense: () => void; onQuickAdd: () => void; quickAddOpen: boolean; refreshKey?: number }) {
  const query = useQuery<ExpenseDto[]>("/api/expenses");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"All" | "Needs" | "Wants" | "Savings">("All");
  const [filters, setFilters] = useState<ExpenseFilters>(defaultExpenseFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseFilters>(defaultExpenseFilters());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  // Reset the selection when the filter context changes — render-time state
  // adjustment (the React-documented pattern), not an effect. (Round 8: live
  // has NO pagination — every filtered row renders.)
  const [appliedContext, setAppliedContext] = useState({ filters, search, tab });
  if (appliedContext.filters !== filters || appliedContext.search !== search || appliedContext.tab !== tab) {
    setAppliedContext({ filters, search, tab });
    setSelectedIds(new Set());
  }

  const allSelected = filtered.length > 0 && filtered.every((expense) => selectedIds.has(expense.id));

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
    if (!window.confirm(`Are you sure you want to delete ${ids.length} expenses?`)) return;
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



  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) filtered.forEach((expense) => next.delete(expense.id));
      else filtered.forEach((expense) => next.add(expense.id));
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
          <Button onClick={onAddExpense} className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" aria-hidden /> Add Expense
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
          <div className="fade-in-up grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold">{formatMoney(totals.total)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-200" aria-hidden />
                </div>
              </div>
            </Card>
            {(["Needs", "Wants", "Savings"] as const).map((category) => (
              <Card key={category} className={cn(CARD_PLAIN, "card-hover")}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-1 capitalize">
                        {category.toLowerCase()}
                      </p>
                      <p className="text-xl font-bold text-neutral-900 dark:text-white">{formatMoney(totals[category])}</p>
                    </div>
                    <div className={cn("w-3 h-3 rounded-full", CATEGORY_DOT[category.toLowerCase()])} aria-hidden />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Search + Filters (live: bare on the page, mb-6, NOT inside a card) */}
          <div className="fade-in-up stagger-1 mb-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search expenses..."
                  className="pl-10"
                  aria-label="Search expenses..."
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                onClick={() => {
                  setDraft(filters);
                  setFiltersOpen((open) => !open);
                }}
                aria-expanded={filtersOpen}
              >
                <ClassicFilterIcon className="w-4 h-4" /> Filters{" "}
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
              /* Round 8 (F12 — live-probed 2026-09-17): blue info bar with a
                 Select All ⇄ Deselect All toggle (dash checkbox ⇄ SquareCheckBig),
                 an always-plural count, an INERT Bulk Edit select (live's options
                 trigger nothing — probed), a red outline Delete, and an X clear. */
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={toggleSelectAll}>
                      {allSelected ? (
                        <SquareCheckBig className="w-4 h-4" aria-hidden />
                      ) : (
                        <div className="w-4 h-4 border-2 border-current rounded flex items-center justify-center" aria-hidden>
                          <div className="w-2 h-0.5 bg-current"></div>
                        </div>
                      )}
                      {allSelected ? "Deselect All" : `Select All (${filtered.length})`}
                    </Button>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {selectedIds.size} expenses selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select>
                      <SelectTrigger className="w-auto gap-2" aria-label="Bulk edit">
                        <PenLine className="w-4 h-4" aria-hidden />
                        <SelectValue placeholder="Bulk Edit">Bulk Edit</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="change-category">Change Category</SelectItem>
                        <SelectItem value="update-date">Update Date</SelectItem>
                        <SelectItem value="mark-recurring">Mark as Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
                      onClick={() => void bulkDelete()}
                      disabled={deleting}
                    >
                      <ClassicTrash2 className="w-4 h-4" aria-hidden /> Delete ({selectedIds.size})
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => setSelectedIds(new Set())}
                      aria-label="Clear selection"
                    >
                      <X className="w-4 h-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            </div>
          </div>

          {/* Expense History (live: separate card, receipt icon title, tabs in
              the CardHeader row, NO card-hover) */}
          <Card className={cn(CARD_PLAIN, "fade-in-up stagger-2")}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-primary-navy dark:text-white">
                  <Receipt className="w-5 h-5" aria-hidden /> Expense History ({filtered.length})
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
              {filtered.length === 0 ? (
                <EmptyState
                  icon={TrendingDown}
                  title="No expenses yet"
                  body="Start tracking your spending to better manage your budget"
                  action={
                    <Button onClick={onAddExpense} className="bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
                      <Plus className="w-4 h-4 mr-1" aria-hidden /> Add Your First Expense
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="space-y-4" aria-label="Expense history">
                    {filtered.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center gap-4 p-4 bg-neutral-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-neutral-100/50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedIds.has(expense.id)}
                          onCheckedChange={() => toggleSelected(expense.id)}
                          aria-label={`Select ${expense.description}`}
                        />
                        <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm" aria-hidden>
                          <span className="text-lg">{subcategoryEmoji(expense.subcategory)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                              {expense.description}
                            </h3>
                            <p className="text-lg font-bold text-red-600 dark:text-red-500 ml-4">
                              -{formatMoney(expense.amountMinor)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={CATEGORY_BADGE[expense.category.toLowerCase()] ?? "bg-green-100 text-green-800"}
                            >
                              {expense.category.toLowerCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs dark:border-gray-600">
                              {subcategoryLabel(expense.subcategory).toLowerCase()}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                              <Calendar className="w-3 h-3" aria-hidden />
                              <span>{formatDate(expense.date, "MM/dd/yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-neutral-400 hover:text-blue-600"
                            onClick={() => {
                              setEditingExpense(expense);
                              setEditOpen(true);
                            }}
                            aria-label={`Edit ${expense.description}`}
                          >
                            <Pen className="w-4 h-4" aria-hidden />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-neutral-400 hover:text-red-600"
                            onClick={() => void deleteExpense(expense)}
                            aria-label={`Delete ${expense.description}`}
                          >
                            <ClassicTrash2 className="w-4 h-4" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Floating action button (live: fixed bottom-6 right-6, sage circle;
          opens the Quick Add chooser; plus rotates 45° into an X while open). */}
      <div className="fixed bottom-6 right-6 z-50" tabIndex={0}>
        <Button
          onClick={onQuickAdd}
          aria-label="Add transaction"
          className="text-primary-foreground px-4 py-2 w-14 h-14 rounded-full bg-primary-sage hover:bg-primary-sage/90 shadow-xl"
        >
          <div style={{ transform: quickAddOpen ? "rotate(45deg)" : "none" }}>
            <Plus className="w-6 h-6 text-white" aria-hidden />
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
