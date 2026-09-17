"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {Clock, DollarSign, Loader2, Pen, Plus, Target, TrendingUp} from "lucide-react";
import { mutate, useQuery, useSettings } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, percent, toMinorUnits } from "@/lib/money";
import { GOAL_CATEGORIES, GOAL_PRIORITIES, goalCategoryEmoji, goalCategoryLabel, goalPriorityLabel } from "@/lib/categories";
import { GOAL_TILE_GRADIENT, PRIORITY_BADGE } from "@/lib/ui-maps";
import { formatDate } from "@/lib/date-format";
import {CARD_HOVER, CARD_PLAIN, ClassicTrash2, EmptyState, ErrorNote, LoadingRows, ViewHeader} from "@/components/finara/ui-bits";
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
  const { currency, dateFormat } = useSettings();

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
    toast({ title: "Progress added", description: `${formatMoney(contributeMinor, { currency })} added to ${goal.name}.` });
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
    <>
      <ViewHeader
        title="Savings Goals"
        subtitle="Set and track your financial objectives"
        actions={
          <Button onClick={openCreate} className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" aria-hidden /> New Goal
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : goals.length === 0 ? (
        <div className={cn(CARD_PLAIN, "p-6")}>
          <EmptyState
            icon={Target}
            title="No Goals Set Yet"
            body="Create your first savings goal to start tracking your financial objectives"
            action={
              <Button onClick={openCreate} className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-1" aria-hidden /> Create Your First Goal
              </Button>
            }
          />
        </div>
      ) : (
        <div className="fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((goal) => {
            const progress = percent(goal.currentAmountMinor, goal.targetAmountMinor);
            const complete = goal.currentAmountMinor >= goal.targetAmountMinor;
            const remaining = daysRemaining(goal.deadline);
            return (
              <div key={goal.id} className={CARD_HOVER}>
                <div className="flex flex-col space-y-1.5 p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12", GOAL_TILE_GRADIENT, "rounded-xl flex items-center justify-center")}>
                        <span className="text-2xl" aria-hidden>
                          {goalCategoryEmoji(goal.category)}
                        </span>
                      </div>
                      <div>
                        <div className="tracking-tight text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">{goal.name}</div>
                        <div className="flex items-center gap-2 mt-1">
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
                        className="w-8 h-8 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => openEdit(goal)}
                        aria-label={`Edit ${goal.name}`}
                      >
                        <Pen className="w-4 h-4" aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => void deleteGoal(goal)}
                        aria-label={`Delete ${goal.name}`}
                      >
                        <ClassicTrash2 className="w-4 h-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300">Progress</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-100">{progress.toFixed(1)}%</span>
                    </div>
                    <div
                      className="relative w-full overflow-hidden rounded-full bg-primary/20 h-2"
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
                      <span>{formatMoney(goal.currentAmountMinor, { currency })}</span>
                      <span>{formatMoney(goal.targetAmountMinor, { currency })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-neutral-400" aria-hidden />
                    <span className="text-neutral-600 dark:text-neutral-300">
                      {remaining !== null ? `${remaining} days remaining` : "No deadline set"}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Target: {formatDate(goal.deadline ?? "", dateFormat)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      setContributing(goal);
                      setContribution("");
                    }}
                    disabled={complete}
                  >
                    <DollarSign className="w-4 h-4 mr-1" aria-hidden /> {complete ? "Goal reached" : "Add Progress"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* Round-6 live matrix: New/Edit Goal = max-w-md, NO max-h/scroll,
            dark:bg-gray-900 dark:text-white card, target icon, NO close
            button, no description, p-6 pt-0 body. Labels carry
            dark:text-neutral-300 and inputs dark:bg-gray-800 dark:text-white
            dark:border-gray-700 (live-probed). */}
        <DialogContent className="max-w-md dark:bg-gray-900 dark:text-white" showCloseButton={false} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
              <Target className="w-5 h-5" aria-hidden />
              {editing ? "Edit Goal" : "Create New Goal"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="dark:text-neutral-300">Goal Title</Label>
              <Input
                id="title"
                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                maxLength={120}
               
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_amount" className="dark:text-neutral-300">Target Amount</Label>
              <Input
                id="target_amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                value={form.target}
                onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}
                placeholder="0.00"
                required
               
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date" className="dark:text-neutral-300">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                value={form.deadline}
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                required

              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="dark:text-neutral-300">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                >
                  <SelectTrigger id="category" className="dark:bg-gray-800 dark:text-white dark:border-gray-700">
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
              <div className="space-y-2">
                <Label htmlFor="priority" className="dark:text-neutral-300">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm((current) => ({ ...current, priority: value }))}
                >
                  <SelectTrigger id="priority" className="dark:bg-gray-800 dark:text-white dark:border-gray-700">
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
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary-sage shadow hover:bg-primary-sage/90" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Saving…
                  </>
                ) : editing ? (
                  "Update Goal"
                ) : (
                  "Create Goal"
                )}
              </Button>
            </div>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={contributing !== null} onOpenChange={(open) => (open ? null : setContributing(null))}>
        {/* Round-6 live matrix: Add Progress = max-w-sm, NO max-h/scroll,
            dark:bg-gray-900 dark:text-white card, trending-up icon, NO close
            button, no description, p-6 pt-0 body. */}
        <DialogContent className="max-w-sm dark:bg-gray-900 dark:text-white" showCloseButton={false} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
              <TrendingUp className="w-5 h-5" aria-hidden />
              Add Progress
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (contributing) void addProgress(contributing);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="amount" className="dark:text-neutral-300">Amount to Add</Label>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                value={contribution}
                onChange={(event) => setContribution(event.target.value)}
                placeholder="0.00"
                required
               
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setContributing(null)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 text-primary-foreground bg-primary-sage shadow hover:bg-primary-sage/90">
                Add Amount
              </Button>
            </div>
          </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}