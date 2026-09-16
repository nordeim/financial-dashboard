"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Landmark, Pen, Plus, Trash2 } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, toMinorUnits } from "@/lib/money";
import { ACCOUNT_TYPES, accountTypeLabel } from "@/lib/categories";
import { ACCOUNT_TYPE_ICONS } from "@/lib/ui-maps";
import { formatDate } from "@/lib/date-format";
import { CARD_SURFACE, EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { AccountDto } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    // Source parity: the live app confirms deletions with a native dialog.
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    const result = await mutate(`/api/accounts/${account.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not remove account", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Account removed", description: `${account.name} was disconnected.` });
    query.refresh();
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="My Accounts"
        subtitle="Manage your connected bank accounts"
        actions={
          <Button onClick={openCreate} className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
            <Plus className="mr-2 h-5 w-5" aria-hidden /> Add Account
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : accounts.length === 0 ? (
        <div className={cn(CARD_SURFACE, "p-6")}>
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            body="Add a bank account to start tracking your finances."
            action={
              <Button onClick={openCreate} className="bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90">
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Add your first account
              </Button>
            }
          />
        </div>
      ) : (
        <div className="fade-in-up grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const TypeIcon = ACCOUNT_TYPE_ICONS[account.type] ?? Landmark;
            return (
              <div key={account.id} className={cn(CARD_SURFACE, "card-hover flex h-full flex-col")}>
                <div className="flex flex-row items-start justify-between space-y-1.5 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <TypeIcon className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <div className="text-lg font-semibold tracking-tight">{account.name}</div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{account.institution}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-neutral-400 hover:text-blue-600"
                      onClick={() => openEdit(account)}
                      aria-label={`Edit ${account.name}`}
                    >
                      <Pen className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-neutral-400 hover:text-red-600"
                      onClick={() => void deleteAccount(account)}
                      aria-label={`Remove ${account.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-grow flex-col justify-end p-6 pt-0">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Balance</p>
                  <p
                    className={cn(
                      "text-3xl font-bold",
                      account.balanceMinor < 0 ? "text-red-600 dark:text-red-400" : "text-neutral-800 dark:text-neutral-100",
                    )}
                  >
                    {formatMoney(account.balanceMinor)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    Last updated: {formatDate(account.lastSyncedAt, "MM/dd/yyyy")}
                  </p>
                  <a
                    href="/Import"
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate?.("import");
                    }}
                  >
                    <Button variant="outline" className="mt-4 w-full">
                      Import Transactions
                    </Button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* Round-6 live matrix: Add Account = max-w-md, NO max-h/scroll,
            bg-card surface, black/60 overlay, plain title (no icon, no close
            button), no description, stacked fields Name → Bank → Type →
            Balance, p-6 pt-0 body, pt-4 button row (live-probed). */}
        <DialogContent
          className="max-w-md bg-card"
          backdropClassName="bg-black/60"
          showCloseButton={false}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="font-semibold leading-none tracking-tight">{editing ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
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
               
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-bank">Bank Name</Label>
              <Input
                id="account-bank"
                value={form.institution}
                onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))}
                placeholder="e.g. Chase"
                maxLength={80}
                 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                <SelectTrigger id="account-type">
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
               
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
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
                  "Add Account"
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
