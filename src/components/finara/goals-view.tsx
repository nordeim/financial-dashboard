"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pen, Plus, Target, Trash2 } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, percent, toMinorUnits } from "@/lib/money";
import { GOAL_CATEGORIES, GOAL_PRIORITIES, goalCategoryEmoji, goalCategoryLabel, goalPriorityLabel } from "@/lib/categories";
import { formatDate } from "@/lib/date-format";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { GoalDto } from "@/lib/types";

interface GoalFormState {
  name: string;
  target: string;
  deadline: string;
  category: string;
  priority: string;
}

function emptyForm(): GoalFormState {
  return { name: "", target: "", deadline: "", category: "other", priority: "medium" };
}

function daysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const target = new Date(deadline).getTime();
  if (Number.isNaN(target)) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((target - today) / (24 * 60 * 60 * 1000)));
}

export function GoalsView({ refreshKey = 0 }: { refreshKey?: number }) {
  const query = useQuery<GoalDto[]>("/api/goals");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GoalDto | null>(null);
  const [contributing, setContributing] = useState<GoalDto | null>(null);
  const [contribution, setContribution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<GoalFormState>(emptyForm());
  const { toast } = useToast();

  const goals = query.data ?? [];
  void refreshKey;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (goal: GoalDto) => {
    setEditing(goal);
    setForm({
      name: goal.name,
      target: (goal.targetAmountMinor / 100).toFixed(2),
      deadline: goal.deadline ? goal.deadline.slice(0, 10) : "",
      category: goal.category ?? "other",
      priority: goal.priority ?? "medium",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.deadline) {
      toast({ title: "Target date is required", variant: "destructive" });
      return;
    }
    let targetAmountMinor: number;
    try {
      targetAmountMinor = toMinorUnits(form.target);
    } catch {
      toast({ title: "Enter a valid positive target amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      targetAmountMinor,
      deadline: new Date(`${form.deadline}T12:00:00`).toISOString(),
      category: form.category,
      priority: form.priority,
    };
    const result = editing
      ? await mutate(`/api/goals/${editing.id}`, "PATCH", payload)
      : await mutate("/api/goals", "POST", payload);
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: editing ? "Could not update goal" : "Could not create goal", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: editing ? "Goal updated" : "Goal created",
      description: `${form.name.trim()} is now being tracked.`,
    });
    setForm(emptyForm());
    setDialogOpen(false);
    setEditing(null);
    query.refresh();
  };

  const addProgress = async (goal: GoalDto) => {
    let contributeMinor: number;
    try {
      contributeMinor = toMinorUnits(contribution);
    } catch {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const result = await mutate(`/api/goals/${goal.id}`, "PATCH", { contributeMinor });
    if (!result.ok) {
      toast({ title: "Could not add progress", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Progress added", description: `${formatMoney(contributeMinor)} added to ${goal.name}.` });
    setContribution("");
    setContributing(null);
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
          <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> New Goal
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : goals.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
          <EmptyState
            icon={Target}
            title="No Goals Set Yet"
            body="Create your first savings goal to start tracking your financial objectives"
            action={
              <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600">
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
            const remaining = daysRemaining(goal.deadline);
            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-700"
                      aria-hidden
                    >
                      {goalCategoryEmoji(goal.category)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">{goal.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold lowercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                          {goalPriorityLabel(goal.priority).toLowerCase()}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold lowercase text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                          {goalCategoryLabel(goal.category).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      onClick={() => openEdit(goal)}
                      aria-label={`Edit ${goal.name}`}
                    >
                      <Pen className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                      onClick={() => void deleteGoal(goal)}
                      aria-label={`Delete ${goal.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${goal.name} progress: ${Math.round(progress)}%`}
                  >
                    <div
                      className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-400 to-teal-500"}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                      {formatMoney(goal.currentAmountMinor)}
                    </span>
                    <span className="tabular-nums text-slate-400 dark:text-slate-500">
                      / {formatMoney(goal.targetAmountMinor)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>Target: {formatDate(goal.deadline ?? "", "MM/dd/yyyy")}</span>
                  {remaining !== null ? <span>{remaining} days remaining</span> : null}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    setContributing(goal);
                    setContribution("");
                  }}
                  disabled={complete}
                >
                  <Plus className="mr-1 h-4 w-4" aria-hidden /> {complete ? "Goal reached" : "Add Progress"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Goal" : "Create New Goal"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update your savings objective." : "Set a target amount and deadline."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Goal Title</Label>
              <Input
                id="goal-title"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                maxLength={120}
                className="dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target Amount</Label>
              <Input
                id="goal-target"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.target}
                onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}
                placeholder="0.00"
                required
                className="dark:bg-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Target Date</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                  required
                  className="dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger id="goal-category" className="dark:bg-slate-800">
                    <SelectValue>{goalCategoryLabel(form.category)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => setForm((current) => ({ ...current, priority: value }))}
              >
                <SelectTrigger id="goal-priority" className="dark:bg-slate-800">
                  <SelectValue>{goalPriorityLabel(form.priority)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GOAL_PRIORITIES.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="dark:border-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Saving…
                  </>
                ) : editing ? (
                  "Save Changes"
                ) : (
                  "Create Goal"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={contributing !== null} onOpenChange={(open) => (open ? null : setContributing(null))}>
        <DialogContent className="sm:max-w-sm dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>Add Progress</DialogTitle>
            <DialogDescription>
              Add saved funds toward {contributing?.name ?? "this goal"}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (contributing) void addProgress(contributing);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="goal-contribution">Amount to Add</Label>
              <Input
                id="goal-contribution"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={contribution}
                onChange={(event) => setContribution(event.target.value)}
                placeholder="0.00"
                required
                className="dark:bg-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setContributing(null)} className="dark:border-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                Add Amount
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
