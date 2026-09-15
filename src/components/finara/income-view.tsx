"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, Loader2, Plus, Trash2, TrendingUp } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, monthlyEquivalent } from "@/lib/money";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { IncomeSourceDto } from "@/lib/types";

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Monthly",
  biweekly: "Every 2 weeks",
  weekly: "Weekly",
  quarterly: "Quarterly",
  "one-time": "One-time",
};

export function IncomeView({ onAddIncome, refreshKey = 0 }: { onAddIncome: () => void; refreshKey?: number }) {
  const query = useQuery<IncomeSourceDto[]>("/api/income");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  // Refetch when the shell bumps refreshKey (e.g. after the save dialog closes).
  const appliedRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== appliedRefreshKey.current) {
      appliedRefreshKey.current = refreshKey;
      query.refresh();
    }
  }, [refreshKey, query]);

  const sources = query.data ?? [];
  const activeSources = sources.filter((source) => source.active);
  const totalMonthly = activeSources.reduce(
    (sum, source) => sum + monthlyEquivalent(source.amountMinor, source.frequency),
    0,
  );

  const toggleActive = async (source: IncomeSourceDto, active: boolean) => {
    setBusyId(source.id);
    const result = await mutate(`/api/income/${source.id}`, "PATCH", { active });
    setBusyId(null);
    if (!result.ok) {
      toast({ title: "Could not update income source", description: result.error, variant: "destructive" });
      return;
    }
    query.refresh();
  };

  const deleteSource = async (source: IncomeSourceDto) => {
    setBusyId(source.id);
    const result = await mutate(`/api/income/${source.id}`, "DELETE");
    setBusyId(null);
    if (!result.ok) {
      toast({ title: "Could not delete income source", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Income source removed", description: `${source.name} was deleted.` });
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
          <Card className="border-none bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-emerald-50/90">Total Monthly Income</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-white">{formatMoney(totalMonthly)}</p>
                <p className="mt-1 text-xs text-emerald-100/80">
                  From {activeSources.length} active {activeSources.length === 1 ? "source" : "sources"}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <TrendingUp className="h-7 w-7 text-white" aria-hidden />
              </div>
            </CardContent>
          </Card>

          {sources.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sources.map((source) => (
                <Card key={source.id} className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-900">{source.name}</h3>
                          {source.active ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Active</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Paused</span>
                          )}
                        </div>
                        <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(source.amountMinor)}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                          {FREQUENCY_LABELS[source.frequency] ?? source.frequency}
                          {source.nextPaymentDate
                            ? ` · next ${new Date(source.nextPaymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        {busyId === source.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={source.active}
                              onCheckedChange={(checked) => void toggleActive(source, checked)}
                              aria-label={`${source.active ? "Pause" : "Activate"} ${source.name}`}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-400 hover:text-red-500"
                              onClick={() => void deleteSource(source)}
                              aria-label={`Delete ${source.name}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
