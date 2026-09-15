"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, Loader2, Plus, Wallet, CreditCard, PiggyBank, LineChart, Banknote, Trash2, RefreshCw } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, toMinorUnits } from "@/lib/money";
import { ACCOUNT_TYPES } from "@/lib/categories";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { AccountDto } from "@/lib/types";

const TYPE_META: Record<string, { icon: typeof Wallet; label: string; iconClass: string }> = {
  checking: { icon: Wallet, label: "Checking", iconClass: "bg-sky-500" },
  savings: { icon: PiggyBank, label: "Savings", iconClass: "bg-emerald-600" },
  credit: { icon: CreditCard, label: "Credit Card", iconClass: "bg-red-500" },
  investment: { icon: LineChart, label: "Investment", iconClass: "bg-violet-500" },
  cash: { icon: Banknote, label: "Cash", iconClass: "bg-amber-500" },
};

export function AccountsView() {
  const query = useQuery<AccountDto[]>("/api/accounts");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", type: "checking", institution: "", balance: "" });
  const { toast } = useToast();

  const accounts = query.data ?? [];
  const netWorth = accounts.reduce((sum, account) => sum + account.balanceMinor, 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let balanceMinor: number;
    try {
      balanceMinor = toMinorUnits(form.balance || "0");
    } catch {
      toast({ title: "Enter a valid balance", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const result = await mutate("/api/accounts", "POST", {
      name: form.name.trim(),
      type: form.type,
      institution: form.institution.trim(),
      balanceMinor,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Could not add account", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Account added", description: `${form.name.trim()} is now connected.` });
    setForm({ name: "", type: "checking", institution: "", balance: "" });
    setDialogOpen(false);
    query.refresh();
  };

  const deleteAccount = async (account: AccountDto) => {
    const result = await mutate(`/api/accounts/${account.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not remove account", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Account removed", description: `${account.name} was disconnected.` });
    query.refresh();
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="My Accounts"
        subtitle="Manage your connected bank accounts"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => query.refresh()} aria-label="Refresh accounts">
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden /> Sync
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Account
            </Button>
          </div>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm">
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            body="Add a bank account to start tracking your finances."
            action={
              <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Add your first account
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => {
              const meta = TYPE_META[account.type] ?? TYPE_META.checking!;
              return (
                <div key={account.id} className="group relative overflow-hidden rounded-2xl bg-slate-800 p-5 text-white shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.iconClass}`}>
                          <meta.icon className="h-5 w-5 text-white" aria-hidden />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{account.name}</p>
                          <p className="text-xs text-slate-400">{meta.label} · {account.institution}</p>
                        </div>
                      </div>
                      <p className={`mt-4 text-2xl font-bold tabular-nums ${account.balanceMinor < 0 ? "text-red-300" : "text-white"}`}>
                        {formatMoney(account.balanceMinor)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Last synced{" "}
                        {new Date(account.lastSyncedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-500 opacity-0 transition-opacity hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                      onClick={() => void deleteAccount(account)}
                      aria-label={`Remove ${account.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-slate-500">
            Combined net worth across connected accounts:{" "}
            <span className="font-semibold tabular-nums text-slate-900">{formatMoney(netWorth)}</span>
          </p>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-600" aria-hidden /> Add Account
            </DialogTitle>
            <DialogDescription>Connect a financial account to track its balance.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account name</Label>
              <Input
                id="account-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Everyday Checking"
                required
                maxLength={80}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="account-type">Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {TYPE_META[type]?.label ?? type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-institution">Institution</Label>
                <Input
                  id="account-institution"
                  value={form.institution}
                  onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))}
                  placeholder="e.g. Chase Bank"
                  required
                  maxLength={80}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-balance">Current balance (USD)</Label>
              <Input
                id="account-balance"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.balance}
                onChange={(event) => setForm((current) => ({ ...current, balance: event.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Adding…
                  </>
                ) : (
                  "Add Account"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
