"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, DollarSign, Loader2, Pen, Plus, Target, Trash2 } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, percent, toMinorUnits } from "@/lib/money";
import { GOAL_CATEGORIES, GOAL_PRIORITIES, goalCategoryEmoji, goalCategoryLabel, goalPriorityLabel } from "@/lib/categories";
import { GOAL_TILE_GRADIENT, PRIORITY_BADGE } from "@/lib/ui-maps";
import { formatDate } from "@/lib/date-format";
import { CARD_SURFACE, EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { GoalDto } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    // Source parity: the live app confirms deletions with a native dialog.
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    const result = await mutate(`/api/goals/${goal.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not delete goal", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Goal removed", description: `${goal.name} was deleted.` });
    query.refresh();
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="Savings Goals"
        subtitle="Set and track your financial objectives"
        actions={
          <Button onClick={openCreate} className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
            <Plus className="mr-2 h-5 w-5" aria-hidden /> New Goal
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : goals.length === 0 ? (
        <div className={cn(CARD_SURFACE, "p-6")}>
          <EmptyState
            icon={Target}
            title="No Goals Set Yet"
            body="Create your first savings goal to start tracking your financial objectives"
            action={
              <Button onClick={openCreate} className="bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Create Your First Goal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="fade-in-up grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {goals.map((goal) => {
            const progress = percent(goal.currentAmountMinor, goal.targetAmountMinor);
            const complete = goal.currentAmountMinor >= goal.targetAmountMinor;
            const remaining = daysRemaining(goal.deadline);
            return (
              <div key={goal.id} className={cn(CARD_SURFACE, "card-hover")}>
                <div className="flex flex-col space-y-1.5 p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", GOAL_TILE_GRADIENT)}>
                        <span className="text-2xl" aria-hidden>
                          {goalCategoryEmoji(goal.category)}
                        </span>
                      </div>
                      <div>
                        <div className="truncate text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{goal.name}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={PRIORITY_BADGE[goal.priority ?? "medium"] ?? PRIORITY_BADGE.medium}
                          >
                            {(goal.priority ?? "medium").toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => openEdit(goal)}
                        aria-label={`Edit ${goal.name}`}
                      >
                        <Pen className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => void deleteGoal(goal)}
                        aria-label={`Delete ${goal.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-6 pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300">Progress</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-100">{progress.toFixed(1)}%</span>
                    </div>
                    <div
                      className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20"
                      role="progressbar"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${goal.name} progress: ${Math.round(progress)}%`}
                    >
                      <div
                        className="h-full w-full flex-1 bg-primary transition-all"
                        style={{ transform: `translateX(-${100 - Math.min(progress, 100)}%)` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                      <span>{formatMoney(goal.currentAmountMinor)}</span>
                      <span>{formatMoney(goal.targetAmountMinor)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-neutral-400" aria-hidden />
                    <span className="text-neutral-600 dark:text-neutral-300">
                      {remaining !== null ? `${remaining} days remaining` : "No deadline set"}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Target: {formatDate(goal.deadline ?? "", "MM/dd/yyyy")}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      setContributing(goal);
                      setContribution("");
                    }}
                    disabled={complete}
                  >
                    <DollarSign className="mr-1 h-4 w-4" aria-hidden /> {complete ? "Goal reached" : "Add Progress"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-semibold leading-none tracking-tight">{editing ? "Edit Goal" : "Create New Goal"}</DialogTitle>
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
                 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger id="goal-category">
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
                <SelectTrigger id="goal-priority">
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90" disabled={submitting}>
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
        <DialogContent className="max-h-[90vh] max-w-sm overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-semibold leading-none tracking-tight">Add Progress</DialogTitle>
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
               
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setContributing(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
                Add Amount
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
