"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Landmark, Pen, Plus, Trash2, Upload } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, toMinorUnits } from "@/lib/money";
import { ACCOUNT_TYPES, accountTypeLabel } from "@/lib/categories";
import { formatDate } from "@/lib/date-format";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { AccountDto } from "@/lib/types";

interface AccountFormState {
  name: string;
  type: string;
  institution: string;
  balance: string;
}

function emptyForm(): AccountFormState {
  return { name: "", type: "checking", institution: "", balance: "" };
}

export function AccountsView({ refreshKey = 0, onNavigate }: { refreshKey?: number; onNavigate?: (view: "import") => void }) {
  const query = useQuery<AccountDto[]>("/api/accounts");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccountDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AccountFormState>(emptyForm());
  const { toast } = useToast();

  const accounts = query.data ?? [];
  void refreshKey;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (account: AccountDto) => {
    setEditing(account);
    setForm({
      name: account.name,
      type: account.type,
      institution: account.institution,
      balance: (account.balanceMinor / 100).toFixed(2),
    });
    setDialogOpen(true);
  };

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
    const payload = {
      name: form.name.trim(),
      type: form.type,
      institution: form.institution.trim() || "—",
      balanceMinor,
    };
    const result = editing
      ? await mutate(`/api/accounts/${editing.id}`, "PATCH", payload)
      : await mutate("/api/accounts", "POST", payload);
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: editing ? "Could not update account" : "Could not add account", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: editing ? "Account updated" : "Account added",
      description: `${form.name.trim()} is ${editing ? "up to date." : "now connected."}`,
    });
    setForm(emptyForm());
    setDialogOpen(false);
    setEditing(null);
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
          <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Account
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            body="Add a bank account to start tracking your finances."
            action={
              <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Add your first account
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">{account.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{account.institution}</p>
                  <p className="mt-0.5 text-xs lowercase text-slate-400 dark:text-slate-500">
                    {accountTypeLabel(account.type).toLowerCase()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => openEdit(account)}
                    aria-label={`Edit ${account.name}`}
                  >
                    <Pen className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                    onClick={() => void deleteAccount(account)}
                    aria-label={`Remove ${account.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Balance</p>
                <p
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    account.balanceMinor < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-50"
                  }`}
                >
                  {formatMoney(account.balanceMinor)}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Last updated: {formatDate(account.lastSyncedAt, "MM/dd/yyyy")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => {
                  onNavigate?.("import");
                }}
              >
                <Upload className="mr-1 h-4 w-4" aria-hidden /> Import Transactions
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Account" : "Add Account"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the account details." : "Connect a bank account to track its balance."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Everyday Checking"
                required
                maxLength={80}
                className="dark:bg-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="account-type">Account Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger id="account-type" className="dark:bg-slate-800">
                    <SelectValue>{accountTypeLabel(form.type)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-bank">Bank Name</Label>
                <Input
                  id="account-bank"
                  value={form.institution}
                  onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))}
                  placeholder="e.g. Chase"
                  maxLength={80}
                  className="dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-balance">Current Balance</Label>
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
                className="dark:bg-slate-800"
              />
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
