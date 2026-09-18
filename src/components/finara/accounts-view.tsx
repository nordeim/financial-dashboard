"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {Loader2, Landmark, Pen, Plus} from "lucide-react";
import { mutate, useQuery, useSettings } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, toMinorUnits } from "@/lib/money";
import { ACCOUNT_TYPES, accountTypeLabel } from "@/lib/categories";
import { ACCOUNT_TYPE_ICONS } from "@/lib/ui-maps";
import { formatDate } from "@/lib/date-format";
import {CARD_HOVER, CARD_PLAIN, ClassicTrash2, EmptyState, ErrorNote, LoadingRows, ViewHeader} from "@/components/finara/ui-bits";
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
  const { currency, dateFormat } = useSettings();

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
    <>
      <ViewHeader
        title="My Accounts"
        subtitle="Manage your connected bank accounts"
        actions={
          <Button onClick={openCreate} className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" aria-hidden /> Add Account
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={3} />
      ) : accounts.length === 0 ? (
        <div className={cn(CARD_PLAIN, "p-6")}>
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            body="Add a bank account to start tracking your finances."
            action={
              <Button onClick={openCreate} className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-1" aria-hidden /> Add your first account
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const TypeIcon = ACCOUNT_TYPE_ICONS[account.type] ?? Landmark;
            return (
              <div key={account.id} className={cn(CARD_HOVER, "h-full flex flex-col")}>
                <div className="space-y-1.5 p-6 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl flex items-center justify-center">
                      <TypeIcon className="w-6 h-6" aria-hidden />
                    </div>
                    <div>
                      <div className="font-semibold tracking-tight text-lg">{account.name}</div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{account.institution}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 text-neutral-400 hover:text-blue-600"
                      onClick={() => openEdit(account)}
                      aria-label={`Edit ${account.name}`}
                    >
                      <Pen className="w-4 h-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-8 h-8 text-neutral-400 hover:text-red-600"
                      onClick={() => void deleteAccount(account)}
                      aria-label={`Remove ${account.name}`}
                    >
                      <ClassicTrash2 className="w-4 h-4" aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="p-6 pt-0 flex-grow flex flex-col justify-end">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Balance</p>
                  <p
                    className={cn(
                      "text-3xl font-bold",
                      account.balanceMinor < 0 ? "text-red-600 dark:text-red-400" : "text-neutral-800 dark:text-neutral-100",
                    )}
                  >
                    {formatMoney(account.balanceMinor, { currency })}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Last updated: {formatDate(account.lastSyncedAt, dateFormat)}
                  </p>
                  <a
                    href="/Import"
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate?.("import");
                    }}
                  >
                    <Button variant="outline" className="w-full mt-4">
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
        {/* Live matrix (round-6 + round-7): Add/Edit Account = max-w-md, NO
            max-h/scroll, bg-card surface in BOTH themes (dark:bg-card kills
            the base dark:bg-gray-800 leak — live probes bg-card only),
            black/60 overlay, plain title (no icon, no close), no description,
            stacked fields Name → Bank → Type → Balance with PLAIN div
            wrappers (live renders no space-y-2 here), p-6 pt-0 body,
            justify-end gap-2 pt-4 row with a DEFAULT primary submit
            ("Save Changes" when editing) — not sage (live-probed). */}
        <DialogContent
          className="max-w-md bg-card dark:bg-card"
          backdropClassName="bg-black/60"
          showCloseButton={false}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle asChild>
              <div className="font-semibold leading-none tracking-tight">{editing ? "Edit Account" : "Add Account"}</div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Everyday Checking"
                required
                maxLength={80}
               
              />
            </div>
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={form.institution}
                onChange={(event) => setForm((current) => ({ ...current, institution: event.target.value }))}
                placeholder="e.g. Chase"
                maxLength={80}
                 
              />
            </div>
            <div>
              <Label htmlFor="account_type">Account Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                <SelectTrigger id="account_type">
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
            <div>
              <Label htmlFor="manual_balance">Current Balance</Label>
              <Input
                id="manual_balance"
                type="number"
                inputMode="decimal"
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
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Saving…
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
    </>
  );
}