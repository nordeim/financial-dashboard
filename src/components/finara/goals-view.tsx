"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Loader2, PiggyBank, Plus, Target, Trash2 } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, percent, toMinorUnits } from "@/lib/money";
import { GOAL_CATEGORIES } from "@/lib/categories";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { GoalDto } from "@/lib/types";

export function GoalsView() {
  const query = useQuery<GoalDto[]>("/api/goals");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contribution, setContribution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", target: "", current: "", deadline: "", category: "Emergency Fund" });
  const { toast } = useToast();

  const goals = query.data ?? [];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let targetAmountMinor: number;
    let currentAmountMinor: number;
    try {
      targetAmountMinor = toMinorUnits(form.target);
      currentAmountMinor = form.current ? toMinorUnits(form.current) : 0;
    } catch {
      toast({ title: "Enter valid positive amounts", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const result = await mutate("/api/goals", "POST", {
      name: form.name.trim(),
      targetAmountMinor,
      currentAmountMinor,
      deadline: form.deadline ? new Date(`${form.deadline}T12:00:00`).toISOString() : null,
      category: form.category,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Could not create goal", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Goal created", description: `${form.name.trim()} is now being tracked.` });
    setForm({ name: "", target: "", current: "", deadline: "", category: "Emergency Fund" });
    setDialogOpen(false);
    query.refresh();
  };

  const contribute = async (goal: GoalDto) => {
    let contributeMinor: number;
    try {
      contributeMinor = toMinorUnits(contribution);
    } catch {
      toast({ title: "Enter a valid contribution amount", variant: "destructive" });
      return;
    }
    const result = await mutate(`/api/goals/${goal.id}`, "PATCH", { contributeMinor });
    if (!result.ok) {
      toast({ title: "Could not add contribution", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Contribution added", description: `${formatMoney(contributeMinor)} added to ${goal.name}.` });
    setContribution("");
    setContributingId(null);
    query.refresh();
  };

  const deleteGoal = async (goal: GoalDto) => {
    const result = await mutate(`/api/goals/${goal.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not delete goal", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Goal removed", description: `${goal.name} was deleted.` });
    query.refresh();
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Savings Goals"
        subtitle="Set and track your financial objectives"
        actions={
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> New Goal
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : goals.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm">
          <EmptyState
            icon={Target}
            title="No Goals Set Yet"
            body="Create your first savings goal to start tracking your financial objectives"
            action={
              <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Create Your First Goal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const progress = percent(goal.currentAmountMinor, goal.targetAmountMinor);
            const complete = goal.currentAmountMinor >= goal.targetAmountMinor;
            return (
              <div key={goal.id} className="group relative rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        complete ? "bg-emerald-100 text-emerald-600" : "bg-violet-100 text-violet-600"
                      }`}
                    >
                      {complete ? <PiggyBank className="h-5 w-5" aria-hidden /> : <Target className="h-5 w-5" aria-hidden />}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{goal.name}</h3>
                      {goal.category ? <p className="text-xs text-slate-400">{goal.category}</p> : null}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-300 opacity-0 transition-opacity hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => void deleteGoal(goal)}
                    aria-label={`Delete ${goal.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-end justify-between">
                    <p className="text-lg font-bold tabular-nums text-slate-900">{formatMoney(goal.currentAmountMinor)}</p>
                    <p className="text-xs text-slate-400">of {formatMoney(goal.targetAmountMinor)}</p>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${goal.name} progress: ${Math.round(progress)}%`}
                  >
                    <div
                      className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{progress.toFixed(1)}% funded</span>
                    {goal.deadline ? (
                      <span className="flex items-center gap-1 text-slate-400">
                        <CalendarDays className="h-3 w-3" aria-hidden />
                        {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    ) : null}
                  </div>
                </div>

                {contributingId === goal.id ? (
                  <div className="mt-4 flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={contribution}
                      onChange={(event) => setContribution(event.target.value)}
                      placeholder="Amount (USD)"
                      aria-label={`Contribution amount for ${goal.name}`}
                    />
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => void contribute(goal)}>
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setContributingId(null); setContribution(""); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => setContributingId(goal.id)}
                    disabled={complete}
                  >
                    <Plus className="mr-1 h-4 w-4" aria-hidden />
                    {complete ? "Goal reached" : "Add contribution"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-600" aria-hidden /> New Savings Goal
            </DialogTitle>
            <DialogDescription>Define a target and optionally what you have saved so far.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Emergency Fund"
                required
                maxLength={80}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target amount (USD)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.target}
                  onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}
                  placeholder="5000.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-current">Already saved (USD)</Label>
                <Input
                  id="goal-current"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.current}
                  onChange={(event) => setForm((current) => ({ ...current, current: event.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Target date</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-category">Category</Label>
                <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                  <SelectTrigger id="goal-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Creating…
                  </>
                ) : (
                  "Create Goal"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
