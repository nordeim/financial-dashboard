"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { mutate } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { toMinorUnits } from "@/lib/money";
import {
  EXPENSE_CATEGORIES,
  QUICK_SELECT_SUBCATEGORIES,
  subcategoriesFor,
  subcategoryLabel,
} from "@/lib/categories";

const QUICK_AMOUNTS = [1, 5, 10, 50, 100, 500];

export type TransactionKind = "expense" | "income";

interface FormData {
  description: string;
  amount: string;
  category: string;
  subcategory: string;
  date: string;
  notes: string;
  recurring: boolean;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  kind,
  defaultSubcategory,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: TransactionKind;
  defaultSubcategory?: string | null;
  onSaved?: () => void;
}) {
  const isExpense = kind === "expense";
  const [mode, setMode] = useState<"quick" | "manual">(defaultSubcategory ? "manual" : "quick");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>({
    description: "",
    amount: "",
    category: "Needs",
    subcategory: defaultSubcategory ?? "other",
    date: todayIso(),
    notes: "",
    recurring: false,
  });

  const resetForm = () => {
    setForm({
      description: "",
      amount: "",
      category: "Needs",
      subcategory: defaultSubcategory ?? "other",
      date: todayIso(),
      notes: "",
      recurring: false,
    });
    setMode(defaultSubcategory ? "manual" : "quick");
  };

  const applyQuickSelect = (subcategoryId: string, label: string) => {
    const def = QUICK_SELECT_SUBCATEGORIES.find((entry) => entry.id === subcategoryId);
    setForm((current) => ({
      ...current,
      subcategory: subcategoryId,
      category: def?.category ?? "Needs",
      description: label,
    }));
    setMode("manual");
  };

  const addQuickAmount = (units: number) => {
    setForm((current) => {
      const currentUnits = Number.parseFloat(current.amount) || 0;
      const next = Math.round((currentUnits + units) * 100) / 100;
      return { ...current, amount: String(next) };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return;
    }
    let amountMinor: number;
    try {
      amountMinor = toMinorUnits(form.amount);
    } catch {
      toast({ title: "Enter a valid positive amount", variant: "destructive" });
      return;
    }
    if (amountMinor === 0) {
      toast({ title: "Amount must be greater than zero", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    if (isExpense) {
      const result = await mutate("/api/expenses", "POST", {
        description: form.description.trim(),
        amountMinor,
        category: form.category,
        subcategory: form.subcategory,
        date: new Date(`${form.date}T12:00:00`).toISOString(),
        notes: form.notes.trim() || null,
        recurring: form.recurring,
      });
      setSubmitting(false);
      if (!result.ok) {
        toast({ title: "Could not save expense", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Expense added", description: `${form.description.trim()} recorded successfully.` });
    } else {
      const result = await mutate("/api/income", "POST", {
        name: form.description.trim(),
        amountMinor,
        frequency: form.recurring ? "monthly" : "one-time",
        active: true,
      });
      setSubmitting(false);
      if (!result.ok) {
        toast({ title: "Could not save income source", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Income source added", description: `${form.description.trim()} recorded successfully.` });
    }
    resetForm();
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isExpense ? <TrendingDown className="h-5 w-5 text-red-500" aria-hidden /> : <TrendingUp className="h-5 w-5 text-emerald-600" aria-hidden />}
            {isExpense ? "Add Expense" : "Add Income Source"}
          </DialogTitle>
          <DialogDescription>
            {isExpense
              ? "Pick a category for one-tap entry, or fill the form manually."
              : "Add a new income stream to your monthly totals."}
          </DialogDescription>
        </DialogHeader>

        {isExpense && mode === "quick" ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Quick Select Category</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {QUICK_SELECT_SUBCATEGORIES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => applyQuickSelect(entry.id, entry.label)}
                  className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  <span className="text-xl" aria-hidden>
                    {entry.emoji}
                  </span>
                  {entry.label}
                </button>
              ))}
            </div>
            <Button type="button" variant="ghost" className="mt-4 w-full text-slate-500" onClick={() => setMode("manual")}>
              Or fill manually
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="txn-description">{isExpense ? "Description" : "Income source name"}</Label>
              <Input
                id="txn-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder={isExpense ? "e.g. Weekly groceries" : "e.g. Freelance project"}
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
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Quick Add Amount</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((units) => (
                  <button
                    key={units}
                    type="button"
                    onClick={() => addQuickAmount(units)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    + ${units}
                  </button>
                ))}
              </div>
            </div>

            {isExpense ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="txn-category">Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm((current) => {
                          const first = subcategoriesFor(value as (typeof EXPENSE_CATEGORIES)[number])[0];
                          return { ...current, category: value, subcategory: first?.id ?? "other" };
                        })
                      }
                    >
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
                      value={form.subcategory}
                      onValueChange={(value) => setForm((current) => ({ ...current, subcategory: value }))}
                    >
                      <SelectTrigger id="txn-subcategory">
                        <SelectValue>{subcategoryLabel(form.subcategory)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {subcategoriesFor(form.category as (typeof EXPENSE_CATEGORIES)[number]).map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {entry.emoji} {entry.label}
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
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txn-notes">Notes (optional)</Label>
                  <Textarea
                    id="txn-notes"
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Anything worth remembering about this expense"
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div>
                    <Label htmlFor="txn-recurring" className="text-sm">
                      This is a recurring expense
                    </Label>
                    <p className="text-xs text-slate-400">Charges that repeat every month</p>
                  </div>
                  <Switch
                    id="txn-recurring"
                    checked={form.recurring}
                    onCheckedChange={(checked) => setForm((current) => ({ ...current, recurring: checked }))}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <Label htmlFor="income-recurring" className="text-sm">
                    Recurring monthly income
                  </Label>
                  <p className="text-xs text-slate-400">Counts toward your monthly income total</p>
                </div>
                <Switch
                  id="income-recurring"
                  checked={form.recurring}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, recurring: checked }))}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {isExpense ? (
                <Button type="button" variant="ghost" onClick={() => setMode("quick")} className="text-slate-500">
                  ← Back to Quick Select
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    onOpenChange(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Saving…
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" aria-hidden />
                      {isExpense ? "Add Expense" : "Add Income"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
