"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { mutate } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { toMinorUnits } from "@/lib/money";
import {
  EXPENSE_CATEGORIES,
  FREQUENCY_LABELS,
  INCOME_CATEGORIES,
  INCOME_FREQUENCIES,
  QUICK_SELECT_SUBCATEGORIES,
  subcategoriesFor,
  subcategoryLabel,
} from "@/lib/categories";
import type { ExpenseDto } from "@/lib/types";

export type TransactionKind = "expense" | "income";

/** Quick-add chips mirror the source app's labels exactly. */
const EXPENSE_QUICK_AMOUNTS = [1, 5, 10, 50, 100, 500];
const INCOME_QUICK_AMOUNTS = [1, 5, 10, 50, 100, 500];

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
  subcategory: string;
  date: string;
  notes: string;
  recurring: boolean;
}

interface IncomeFormData {
  name: string;
  amount: string;
  frequency: string;
  category: string;
  active: boolean;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function defaultExpenseForm(): ExpenseFormData {
  return { description: "", amount: "", category: "Needs", subcategory: "other-needs", date: todayIso(), notes: "", recurring: false };
}

function defaultIncomeForm(): IncomeFormData {
  return { name: "", amount: "", frequency: "monthly", category: "primary", active: true };
}

/**
 * Centered add/edit transaction modal (live-exact: the source app uses a
 * centered max-w-2xl dialog, NOT a side drawer). Expense mode opens in
 * Quick Select first, then swaps to the manual form in the same dialog.
 */
export function AddTransactionDialog({
  open,
  onOpenChange,
  kind,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: TransactionKind;
  /** Expense row being edited; null/undefined = create mode. */
  editing?: ExpenseDto | null;
  onSaved?: () => void;
}) {
  const isExpense = kind === "expense";
  const isEditing = isExpense && editing !== null && editing !== undefined;
  const [mode, setMode] = useState<"quick" | "manual">("quick");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>(defaultExpenseForm());
  const [incomeForm, setIncomeForm] = useState<IncomeFormData>(defaultIncomeForm());

  // Prefill when opened in edit mode — render-time state adjustment keyed on the
  // (open, row-id) pair, the React-documented pattern instead of a prefill effect.
  // Re-running on refetch (same id) is deliberately avoided so in-flight edits are
  // never clobbered; closing resets the tracker so the row can be re-edited.
  const editingId = editing?.id ?? null;
  const [prefillState, setPrefillState] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  if (prefillState.open !== open || prefillState.id !== editingId) {
    setPrefillState({ open, id: editingId });
    if (open && isEditing && editing) {
      setExpenseForm({
        description: editing.description,
        amount: (editing.amountMinor / 100).toFixed(2),
        category: editing.category,
        subcategory: editing.subcategory,
        date: editing.date.slice(0, 10),
        notes: editing.notes ?? "",
        recurring: editing.recurring,
      });
      setMode("manual");
    }
  }

  const resetForms = () => {
    setExpenseForm(defaultExpenseForm());
    setIncomeForm(defaultIncomeForm());
    setMode(isEditing ? "manual" : "quick");
  };

  const applyQuickSelect = (subcategoryId: string) => {
    const def = QUICK_SELECT_SUBCATEGORIES.find((entry) => entry.id === subcategoryId);
    setExpenseForm((current) => ({
      ...current,
      subcategory: subcategoryId,
      category: def?.category ?? "Needs",
    }));
    setMode("manual");
  };

  const addQuickAmount = (units: number, target: "expense" | "income") => {
    const key = target === "expense" ? setExpenseForm : setIncomeForm;
    key((current) => {
      const currentUnits = Number.parseFloat(current.amount) || 0;
      const next = Math.round((currentUnits + units) * 100) / 100;
      return { ...current, amount: String(next) };
    });
  };

  const handleExpenseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!expenseForm.description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return;
    }
    let amountMinor: number;
    try {
      amountMinor = toMinorUnits(expenseForm.amount);
    } catch {
      toast({ title: "Enter a valid positive amount", variant: "destructive" });
      return;
    }
    if (amountMinor === 0) {
      toast({ title: "Amount must be greater than zero", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      description: expenseForm.description.trim(),
      amountMinor,
      category: expenseForm.category,
      subcategory: expenseForm.subcategory,
      date: new Date(`${expenseForm.date}T12:00:00`).toISOString(),
      notes: expenseForm.notes.trim() || null,
      recurring: expenseForm.recurring,
    };
    const result = isEditing && editing
      ? await mutate(`/api/expenses/${editing.id}`, "PATCH", payload)
      : await mutate("/api/expenses", "POST", payload);
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: isEditing ? "Could not update expense" : "Could not save expense", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: isEditing ? "Expense updated" : "Expense added",
      description: `${expenseForm.description.trim()} recorded successfully.`,
    });
    resetForms();
    onOpenChange(false);
    onSaved?.();
  };

  const handleIncomeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!incomeForm.name.trim()) {
      toast({ title: "Income source name is required", variant: "destructive" });
      return;
    }
    let amountMinor: number;
    try {
      amountMinor = toMinorUnits(incomeForm.amount);
    } catch {
      toast({ title: "Enter a valid positive amount", variant: "destructive" });
      return;
    }
    if (amountMinor === 0) {
      toast({ title: "Amount must be greater than zero", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const result = await mutate("/api/income", "POST", {
      name: incomeForm.name.trim(),
      amountMinor,
      frequency: incomeForm.frequency,
      category: incomeForm.category,
      active: incomeForm.active,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Could not save income source", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Income source added", description: `${incomeForm.name.trim()} recorded successfully.` });
    resetForms();
    onOpenChange(false);
    onSaved?.();
  };

  const handleCategoryChange = (value: string) => {
    setExpenseForm((current) => {
      const stillValid = subcategoriesFor(value as (typeof EXPENSE_CATEGORIES)[number]).some(
        (entry) => entry.id === current.subcategory,
      );
      return { ...current, category: value, subcategory: stillValid ? current.subcategory : "other-wants" };
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForms();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary-navy dark:text-white">
            {isExpense ? (
              <TrendingDown className="h-5 w-5" aria-hidden />
            ) : (
              <TrendingUp className="h-5 w-5" aria-hidden />
            )}
            {isExpense ? (isEditing ? "Edit Expense" : "Add Expense") : "Add Income Source"}
          </DialogTitle>
          <DialogDescription>
            {isExpense
              ? "Pick a category for one-tap entry, or fill the form manually."
              : "Add a new income stream to your monthly totals."}
          </DialogDescription>
        </DialogHeader>

        {isExpense && mode === "quick" ? (
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Select Category</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {QUICK_SELECT_SUBCATEGORIES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => applyQuickSelect(entry.id)}
                    className="flex h-16 w-full flex-col gap-1 border border-gray-200 bg-white px-4 py-2 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <span className="text-lg" aria-hidden>
                      {entry.emoji}
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{entry.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-4 w-full text-gray-600 dark:text-gray-400"
              onClick={() => setMode("manual")}
            >
              Or fill manually
            </Button>
          </div>
        ) : isExpense ? (
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="txn-description">Description</Label>
              <Input
                id="txn-description"
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="e.g., Coffee, Train ticket"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txn-amount">Amount (USD)</Label>
              <Input
                id="txn-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium leading-none">Quick Add Amount</p>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_QUICK_AMOUNTS.map((units) => (
                  <button
                    key={units}
                    type="button"
                    onClick={() => addQuickAmount(units, "expense")}
                    className="h-9 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    + USD{units}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="txn-category">Category</Label>
                <Select value={expenseForm.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="txn-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="txn-subcategory">Subcategory</Label>
                <Select
                  value={expenseForm.subcategory}
                  onValueChange={(value) => setExpenseForm((current) => ({ ...current, subcategory: value }))}
                >
                  <SelectTrigger id="txn-subcategory">
                    <SelectValue>{subcategoryLabel(expenseForm.subcategory)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriesFor(expenseForm.category as (typeof EXPENSE_CATEGORIES)[number]).map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txn-date">Date</Label>
              <Input
                id="txn-date"
                type="date"
                value={expenseForm.date}
                onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="txn-notes">Notes (optional)</Label>
              <Input
                id="txn-notes"
                value={expenseForm.notes}
                onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Any extra details..."
                maxLength={500}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="txn-recurring"
                checked={expenseForm.recurring}
                onCheckedChange={(checked) => setExpenseForm((current) => ({ ...current, recurring: checked }))}
              />
              <Label htmlFor="txn-recurring" className="text-sm font-medium leading-none">
                This is a recurring expense
              </Label>
            </div>

            {!isEditing ? (
              <Button type="button" variant="outline" className="w-full" onClick={() => setMode("quick")}>
                ← Back to Quick Select
              </Button>
            ) : null}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForms();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary-sage text-white shadow hover:bg-primary-sage/90" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Saving…
                  </>
                ) : (
                  "Add Expense"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income-name">Income Source</Label>
              <Input
                id="income-name"
                value={incomeForm.name}
                onChange={(event) => setIncomeForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Salary, freelance project"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount (USD)</Label>
              <Input
                id="income-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={incomeForm.amount}
                onChange={(event) => setIncomeForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium leading-none">Quick Add Amount</p>
              <div className="flex flex-wrap gap-2">
                {INCOME_QUICK_AMOUNTS.map((units) => (
                  <button
                    key={units}
                    type="button"
                    onClick={() => addQuickAmount(units, "income")}
                    className="h-9 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    + ${units.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="income-frequency">Frequency</Label>
                <Select
                  value={incomeForm.frequency}
                  onValueChange={(value) => setIncomeForm((current) => ({ ...current, frequency: value }))}
                >
                  <SelectTrigger id="income-frequency">
                    <SelectValue>{FREQUENCY_LABELS[incomeForm.frequency] ?? "Monthly"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_FREQUENCIES.map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {FREQUENCY_LABELS[frequency]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-category">Category</Label>
                <Select
                  value={incomeForm.category}
                  onValueChange={(value) => setIncomeForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger id="income-category">
                    <SelectValue>
                      {INCOME_CATEGORIES.find((option) => option.id === incomeForm.category)?.label ?? "Primary Income"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_CATEGORIES.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="income-active"
                checked={incomeForm.active}
                onCheckedChange={(checked) => setIncomeForm((current) => ({ ...current, active: checked }))}
              />
              <Label htmlFor="income-active" className="text-sm font-medium leading-none">
                Active Income Source
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForms();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary-sage text-white shadow hover:bg-primary-sage/90" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Saving…
                  </>
                ) : (
                  "Add Income"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
