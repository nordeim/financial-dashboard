"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pen, Plus, Trash2, TrendingUp } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, monthlyEquivalent, toMinorUnits } from "@/lib/money";
import { FREQUENCY_LABELS, INCOME_CATEGORIES, INCOME_FREQUENCIES, incomeCategoryLabel } from "@/lib/categories";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { IncomeSourceDto } from "@/lib/types";

const INCOME_QUICK_AMOUNTS = [1, 5, 10, 50, 100, 500];

interface IncomeFormState {
  name: string;
  amount: string;
  frequency: string;
  category: string;
  active: boolean;
}

function emptyForm(): IncomeFormState {
  return { name: "", amount: "", frequency: "monthly", category: "primary", active: true };
}

export function IncomeView({ onAddIncome, refreshKey = 0 }: { onAddIncome: () => void; refreshKey?: number }) {
  const query = useQuery<IncomeSourceDto[]>("/api/income");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSourceDto | null>(null);
  const [form, setForm] = useState<IncomeFormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Refetch when the shell bumps refreshKey (e.g. after the add sheet closes).
  const appliedRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== appliedRefreshKey.current) {
      appliedRefreshKey.current = refreshKey;
      query.refresh();
    }
  }, [refreshKey, query]);

  const sources = query.data ?? [];
  const monthlyTotal = sources
    .filter((source) => source.active)
    .reduce((sum, source) => sum + monthlyEquivalent(source.amountMinor, source.frequency), 0);

  const startEdit = (source: IncomeSourceDto) => {
    setEditing(source);
    setForm({
      name: source.name,
      amount: (source.amountMinor / 100).toFixed(2),
      frequency: source.frequency,
      category: source.category ?? "primary",
      active: source.active,
    });
    setEditOpen(true);
  };

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    if (!form.name.trim()) {
      toast({ title: "Income source name is required", variant: "destructive" });
      return;
    }
    let amountMinor: number;
    try {
      amountMinor = toMinorUnits(form.amount);
    } catch {
      toast({ title: "Enter a valid positive amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const result = await mutate(`/api/income/${editing.id}`, "PATCH", {
      name: form.name.trim(),
      amountMinor,
      frequency: form.frequency,
      category: form.category,
      active: form.active,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Could not update income source", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Income source updated", description: `${form.name.trim()} saved successfully.` });
    setEditOpen(false);
    setEditing(null);
    query.refresh();
  };

  const deleteSource = async (source: IncomeSourceDto) => {
    const result = await mutate(`/api/income/${source.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not delete income source", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Income source deleted", description: `${source.name} was removed.` });
    query.refresh();
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Income Sources"
        subtitle="Track and manage all your income streams"
        actions={
          <Button onClick={onAddIncome} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Income Source
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          <Card className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Monthly Income</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {formatMoney(monthlyTotal)}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                From {sources.filter((source) => source.active).length} active source
                {sources.filter((source) => source.active).length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          {sources.length === 0 ? (
            <Card className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
              <CardContent className="p-5">
                <EmptyState
                  icon={TrendingUp}
                  title="No Income Sources Yet"
                  body="Start by adding your income sources to track your financial progress"
                  action={
                    <Button onClick={onAddIncome} className="bg-emerald-500 hover:bg-emerald-600">
                      <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Your First Income Source
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sources.map((source) => (
                <Card key={source.id} className="border-none shadow-sm transition-shadow hover:shadow-md dark:border dark:border-slate-700 dark:bg-slate-800">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg dark:bg-emerald-900"
                          aria-hidden
                        >
                          📊
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
                            {source.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold lowercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                              {incomeCategoryLabel(source.category).toLowerCase()}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold lowercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                              {(FREQUENCY_LABELS[source.frequency] ?? source.frequency).toLowerCase()}
                            </span>
                            {!source.active ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold lowercase text-slate-400 dark:bg-slate-700 dark:text-slate-400">
                                paused
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          onClick={() => startEdit(source)}
                          aria-label={`Edit ${source.name}`}
                        >
                          <Pen className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                          onClick={() => void deleteSource(source)}
                          aria-label={`Delete ${source.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                          {formatMoney(source.amountMinor)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Monthly equivalent</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatMoney(monthlyEquivalent(source.amountMinor, source.frequency))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md dark:bg-slate-900 dark:text-slate-100">
          <SheetHeader className="px-6 pb-2 pt-6">
            <SheetTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" aria-hidden /> Edit Income Source
            </SheetTitle>
            <SheetDescription>Update the amount, frequency or category.</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitEdit} className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="edit-income-name">Income Source</Label>
              <Input
                id="edit-income-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                maxLength={120}
                className="dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-income-amount">Amount (USD)</Label>
              <Input
                id="edit-income-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
                className="dark:bg-slate-800"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Quick Add Amount</p>
              <div className="flex flex-wrap gap-2">
                {INCOME_QUICK_AMOUNTS.map((units) => (
                  <button
                    key={units}
                    type="button"
                    onClick={() =>
                      setForm((current) => {
                        const currentUnits = Number.parseFloat(current.amount) || 0;
                        return { ...current, amount: String(Math.round((currentUnits + units) * 100) / 100) };
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950"
                  >
                    + ${units.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-income-frequency">Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(value) => setForm((current) => ({ ...current, frequency: value }))}
                >
                  <SelectTrigger id="edit-income-frequency" className="dark:bg-slate-800">
                    <SelectValue>{FREQUENCY_LABELS[form.frequency] ?? "Monthly"}</SelectValue>
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
                <Label htmlFor="edit-income-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger id="edit-income-category" className="dark:bg-slate-800">
                    <SelectValue>{incomeCategoryLabel(form.category)}</SelectValue>
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
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
              <div>
                <Label htmlFor="edit-income-active" className="text-sm">
                  Active Income Source
                </Label>
                <p className="text-xs text-slate-400">Counts toward your monthly income total</p>
              </div>
              <Switch
                id="edit-income-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="dark:border-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
