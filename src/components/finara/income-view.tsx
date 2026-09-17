"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Loader2, Pen, Plus, Trash2, TrendingUp, X } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, monthlyEquivalent, toMinorUnits } from "@/lib/money";
import { FREQUENCY_LABELS, INCOME_CATEGORIES, INCOME_FREQUENCIES, incomeCategoryLabel } from "@/lib/categories";
import { CARD_SURFACE, EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { IncomeSourceDto } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    // Source parity: the live app confirms deletions with a native dialog.
    if (!window.confirm(`Are you sure you want to delete this income source?`)) return;
    const result = await mutate(`/api/income/${source.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not delete income source", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Income source deleted", description: `${source.name} was removed.` });
    query.refresh();
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="Income Sources"
        subtitle="Track and manage all your income streams"
        actions={
          <Button onClick={onAddIncome} className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
            <Plus className="w-5 h-5 mr-2" aria-hidden /> Add Income Source
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          {/* Hero total card (live: emerald gradient, text-4xl, w-20 icon circle) */}
          <div className="fade-in-up mb-8">
            <div className="rounded-xl border-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl">
              <div className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-2 text-lg font-medium text-emerald-100">Total Monthly Income</p>
                  <p className="text-4xl font-bold">{formatMoney(monthlyTotal)}</p>
                  <p className="mt-2 text-sm text-emerald-100">
                    From {sources.filter((source) => source.active).length} active sources
                  </p>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <TrendingUp className="w-10 h-10" aria-hidden />
                </div>
              </div>
              </div>
            </div>
          </div>

          {sources.length === 0 ? (
            <div className={cn(CARD_SURFACE, "p-6")}>
              <EmptyState
                icon={TrendingUp}
                title="No Income Sources Yet"
                body="Start by adding your income sources to track your financial progress"
                action={
                  <Button onClick={onAddIncome} className="bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
                    <Plus className="w-4 h-4" aria-hidden /> Add Your First Income Source
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="fade-in-up stagger-1 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <div key={source.id} className={cn(CARD_SURFACE, "card-hover")}>
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-emerald-600" aria-hidden />
                        </div>
                        <div>
                          <h3 className="truncate font-bold text-neutral-900">{source.name}</h3>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            {/* Live renders the raw category id ("primary") on the card badge. */}
                            {source.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-neutral-400 hover:text-blue-600"
                          onClick={() => startEdit(source)}
                          aria-label={`Edit ${source.name}`}
                        >
                          <Pen className="w-4 h-4" aria-hidden />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 text-neutral-400 hover:text-red-600"
                          onClick={() => void deleteSource(source)}
                          aria-label={`Delete ${source.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                          {formatMoney(source.amountMinor)}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                          <span aria-hidden>📊</span>
                          <span>{(FREQUENCY_LABELS[source.frequency] ?? source.frequency).toLowerCase()}</span>
                        </div>
                      </div>
                      <div className="border-t pt-3 dark:border-gray-700">
                        <p className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">Monthly equivalent</p>
                        <p className="text-lg font-semibold text-primary-sage">
                          {formatMoney(monthlyEquivalent(source.amountMinor, source.frequency))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {/* Round-6 live matrix: Edit Income Source = max-w-lg + scroll, dollar
            icon, header row + in-flow close, no description, p-6 pt-0 body. */}
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" showCloseButton={false} aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                <DollarSign className="w-5 h-5" aria-hidden /> Edit Income Source
              </DialogTitle>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-0">
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source_name">Income Source</Label>
              <Input
                id="source_name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
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
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
               
              />
            </div>
            <div>
              <Label className="text-sm font-medium leading-none">Quick Add Amount</Label>
              <div className="flex flex-wrap gap-2">
                {INCOME_QUICK_AMOUNTS.map((units) => (
                  <div key={units} tabIndex={0}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm((current) => {
                          const currentUnits = Number.parseFloat(current.amount) || 0;
                          return { ...current, amount: String(Math.round((currentUnits + units) * 100) / 100) };
                        })
                      }
                      className="h-8 rounded-md px-3 text-xs"
                    >
                      + ${units.toFixed(2)}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(value) => setForm((current) => ({ ...current, frequency: value }))}
                >
                  <SelectTrigger id="frequency">
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger id="category">
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
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="is_active"
                checked={form.active}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))}
              />
              <Label htmlFor="is_active" className="text-sm font-medium leading-none">
                Active Income Source
              </Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary-sage text-white shadow hover:bg-primary-sage/90" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Saving…
                  </>
                ) : (
                  "Update Income"
                )}
              </Button>
            </div>
          </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
