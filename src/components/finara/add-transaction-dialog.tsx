"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, DollarSign, Receipt, X } from "lucide-react";
import { mutate, useSettings } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { currencySymbol, toMinorUnits } from "@/lib/money";
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
  // Round 9 (F6): the quick-amount chips follow the Settings currency — the
  // live expense chips render `+ USD5` (currency code + integer) and the
  // income chips `+$5.00` (symbol + decimals); EUR variants follow the same
  // templates (code/symbol swap).
  const { currency } = useSettings();
  const symbol = currencySymbol(currency);
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
      // Live pre-fills the description with the tile label (round-5 probe).
      description: def ? def.label : current.description,
      subcategory: subcategoryId,
      category: def ? "Needs" : current.category,
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
      {/* Round-6 live matrix: Add Expense = max-w-2xl + scroll; Add Income
          Source = max-w-lg + scroll. The close button lives in the header row
          (live anatomy — see quick-add-dialog.tsx), so the content-level
          absolute close is off. */}
      <DialogContent
        className={isExpense ? "max-h-[90vh] max-w-2xl overflow-y-auto" : "max-h-[90vh] max-w-lg overflow-y-auto"}
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle asChild>
              <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                {isExpense ? (
                <Receipt className="w-5 h-5" aria-hidden />
                ) : (
                <DollarSign className="w-5 h-5" aria-hidden />
                )}
                {isExpense ? (isEditing ? "Edit Expense" : "Add Expense") : "Add Income Source"}
              </div>
            </DialogTitle>
            <button
              type="button"
              onClick={() => {
                resetForms();
                onOpenChange(false);
              }}
              aria-label="Close"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </DialogHeader>

        {/* Live body wrapper: CardContent p-6 pt-0 around every mode. */}
        <div className="p-6 pt-0">
        {isExpense && mode === "quick" ? (
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Select Category</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {QUICK_SELECT_SUBCATEGORIES.map((entry) => (
                  <div key={entry.id} tabIndex={0}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyQuickSelect(entry.id)}
                      className="flex h-16 w-full flex-col gap-1 text-left items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-lg" aria-hidden>
                        {entry.emoji}
                      </span>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{entry.label}</span>
                    </Button>
                  </div>
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
              <Label htmlFor="title">Description</Label>
              <Input
                id="title"
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="e.g., Coffee, Train ticket"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            {/* Round 13 (F5, live-probed): the quick-amount label sits in
                the same space-y-2 field wrapper as every other field. */}
            <div className="space-y-2">
              <Label className="text-sm font-medium leading-none">Quick Add Amount</Label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_QUICK_AMOUNTS.map((units) => (
                  <div key={units} tabIndex={0}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addQuickAmount(units, "expense")}
                      className="h-9 px-4 py-2"
                    >
                      + {currency}{units}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={expenseForm.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category">
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
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select
                  value={expenseForm.subcategory}
                  onValueChange={(value) => setExpenseForm((current) => ({ ...current, subcategory: value }))}
                >
                  <SelectTrigger id="subcategory">
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseForm.date}
                onChange={(event) => setExpenseForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={expenseForm.notes}
                onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Any extra details..."
                maxLength={500}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_recurring"
                checked={expenseForm.recurring}
                onCheckedChange={(checked) => setExpenseForm((current) => ({ ...current, recurring: checked }))}
              />
              <Label htmlFor="is_recurring" className="text-sm font-medium leading-none">
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Saving…
                  </>
                ) : isEditing ? (
                  "Update Expense"
                ) : (
                  "Add Expense"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source_name">Income Source</Label>
              <Input
                id="source_name"
                value={incomeForm.name}
                onChange={(event) => setIncomeForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Salary, freelance project"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={incomeForm.amount}
                onChange={(event) => setIncomeForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            {/* Round 13 (F5, live-probed): the quick-amount label sits in
                the same space-y-2 field wrapper as every other field. */}
            <div className="space-y-2">
              <Label className="text-sm font-medium leading-none">Quick Add Amount</Label>
              <div className="flex flex-wrap gap-2">
                {INCOME_QUICK_AMOUNTS.map((units) => (
                  <div key={units} tabIndex={0}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addQuickAmount(units, "income")}
                      className="h-8 rounded-md px-3 text-xs"
                    >
                      +{symbol}{units.toFixed(2)}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={incomeForm.frequency}
                  onValueChange={(value) => setIncomeForm((current) => ({ ...current, frequency: value }))}
                >
                  <SelectTrigger id="frequency">
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={incomeForm.category}
                  onValueChange={(value) => setIncomeForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger id="category">
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

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is_active"
                checked={incomeForm.active}
                onCheckedChange={(checked) => setIncomeForm((current) => ({ ...current, active: checked }))}
              />
              <Label htmlFor="is_active" className="text-sm font-medium leading-none">
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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Saving…
                  </>
                ) : isEditing ? (
                  "Update Income"
                ) : (
                  "Add Income"
                )}
              </Button>
            </div>
          </form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
