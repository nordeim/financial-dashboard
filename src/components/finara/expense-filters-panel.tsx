"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, CalendarDays, CheckCircle2, Filter, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ExpenseFilters, type SortField, defaultExpenseFilters } from "@/lib/expense-filters";

const DATE_RANGES: { id: string; label: string }[] = [
  { id: "all", label: "Select range" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "custom", label: "Custom range" },
];

const CATEGORY_OPTIONS = ["All categories", "Needs", "Wants", "Savings"];

export function ExpenseFiltersPanel({
  filters,
  draft,
  onDraftChange,
  onApply,
  onCancel,
  onClearAll,
}: {
  filters: ExpenseFilters;
  draft: ExpenseFilters;
  onDraftChange: (next: ExpenseFilters) => void;
  onApply: () => void;
  onCancel: () => void;
  onClearAll: () => void;
}) {
  const rangeLabel =
    DATE_RANGES.find((option) => option.id === draft.dateRange)?.label ?? "Select range";

  return (
    <div
      className={cn(
        "mb-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60",
      )}
      role="group"
      aria-label="Expense filters"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CalendarDays className="w-3.5 h-3.5" aria-hidden /> Date Range
          </Label>
          <Select
            value={draft.dateRange}
            onValueChange={(value) => onDraftChange({ ...draft, dateRange: value as ExpenseFilters["dateRange"] })}
          >
            <SelectTrigger aria-label="Date range" className="w-full dark:bg-slate-900">
              <SelectValue>{rangeLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Tag className="w-3.5 h-3.5" aria-hidden /> Category
          </Label>
          <Select
            value={draft.category}
            onValueChange={(value) => onDraftChange({ ...draft, category: value as ExpenseFilters["category"] })}
          >
            <SelectTrigger aria-label="Category filter" className="w-full dark:bg-slate-900">
              <SelectValue>{draft.category}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-min" className="text-xs text-slate-500 dark:text-slate-400">
            Min Amount
          </Label>
          <Input
            id="filter-min"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={draft.minMinor === null ? "" : (draft.minMinor / 100).toString()}
            onChange={(event) => {
              const parsed = Number.parseFloat(event.target.value);
              onDraftChange({
                ...draft,
                minMinor: event.target.value === "" || Number.isNaN(parsed) ? null : Math.round(parsed * 100),
              });
            }}
            className="dark:bg-slate-900"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-max" className="text-xs text-slate-500 dark:text-slate-400">
            Max Amount
          </Label>
          <Input
            id="filter-max"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="No limit"
            value={draft.maxMinor === null ? "" : (draft.maxMinor / 100).toString()}
            onChange={(event) => {
              const parsed = Number.parseFloat(event.target.value);
              onDraftChange({
                ...draft,
                maxMinor: event.target.value === "" || Number.isNaN(parsed) ? null : Math.round(parsed * 100),
              });
            }}
            className="dark:bg-slate-900"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-sort" className="text-xs text-slate-500 dark:text-slate-400">
            Sort By
          </Label>
          <div className="flex gap-2">
            <Select
              value={draft.sortBy}
              onValueChange={(value) => onDraftChange({ ...draft, sortBy: value as SortField })}
            >
              <SelectTrigger id="filter-sort" aria-label="Sort by" className="w-full dark:bg-slate-900">
                <SelectValue>
                  {draft.sortBy === "date" ? "Date" : draft.sortBy === "amount" ? "Amount" : "Description"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={draft.sortDesc ? "Sort descending" : "Sort ascending"}
              onClick={() => onDraftChange({ ...draft, sortDesc: !draft.sortDesc })}
              className="shrink-0 dark:border-slate-700 dark:bg-slate-900"
            >
              {draft.sortDesc ? <ArrowDown className="w-4 h-4" aria-hidden /> : <ArrowUp className="w-4 h-4" aria-hidden />}
            </Button>
          </div>
        </div>

        {draft.dateRange === "custom" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="filter-from" className="text-xs text-slate-500 dark:text-slate-400">
                From
              </Label>
              <Input
                id="filter-from"
                type="date"
                value={draft.customFrom ?? ""}
                onChange={(event) => onDraftChange({ ...draft, customFrom: event.target.value || null })}
                className="dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-to" className="text-xs text-slate-500 dark:text-slate-400">
                To
              </Label>
              <Input
                id="filter-to"
                type="date"
                value={draft.customTo ?? ""}
                onChange={(event) => onDraftChange({ ...draft, customTo: event.target.value || null })}
                className="dark:bg-slate-900"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDraftChange(defaultExpenseFilters())}
          className="text-slate-500 dark:text-slate-400"
        >
          Clear All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="dark:border-slate-700 dark:bg-slate-900"
        >
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={onApply} className="bg-emerald-500 hover:bg-emerald-600">
          <CheckCircle2 className="w-4 h-4 mr-1" aria-hidden /> Apply Filters
        </Button>
      </div>
      <p className="sr-only">
        Current applied filters: {filters.search ? `search "${filters.search}", ` : ""}
        {filters.category}, {filters.dateRange}
      </p>
      <span className="sr-only">
        <Filter aria-hidden />
      </span>
    </div>
  );
}
