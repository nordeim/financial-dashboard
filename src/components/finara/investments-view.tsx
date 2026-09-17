"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, ChartColumn, ChartPie, Loader2, Pen, Plus, Trash2, TrendingUp, Wallet, X } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { INVESTMENT_TYPES, SECTORS, investmentTypeLabel } from "@/lib/categories";
import { SECTOR_COLORS } from "@/lib/ui-maps";
import { CARD_SURFACE, EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { InvestmentDto } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Normalize a live sector label ("Real Estate") to its ui-maps key ("real-estate"). */
function sectorKey(sector: string): string {
  return sector.toLowerCase().replace(/\s+/g, "-");
}

interface InvestmentFormState {
  symbol: string;
  type: string;
  name: string;
  shares: string;
  avgPrice: string;
  currentPrice: string;
  portfolioPercent: string;
  sector: string;
}

function emptyForm(): InvestmentFormState {
  return {
    symbol: "",
    type: "stock",
    name: "",
    shares: "",
    avgPrice: "",
    currentPrice: "",
    portfolioPercent: "",
    sector: "Technology",
  };
}

export function InvestmentsView({ refreshKey = 0 }: { refreshKey?: number }) {
  const query = useQuery<InvestmentDto[]>("/api/investments");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<InvestmentFormState>(emptyForm());
  const { toast } = useToast();

  const holdings = query.data ?? [];
  void refreshKey;

  const portfolioValue = holdings.reduce((sum, holding) => sum + Math.round(holding.shares * holding.currentPriceMinor), 0);
  const costBasis = holdings.reduce((sum, holding) => sum + Math.round(holding.shares * holding.avgPriceMinor), 0);
  const totalGain = portfolioValue - costBasis;
  const totalReturn = costBasis > 0 ? (totalGain / costBasis) * 100 : 0;

  const sectorData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const holding of query.data ?? []) {
      const value = Math.round(holding.shares * holding.currentPriceMinor);
      totals.set(holding.sector, (totals.get(holding.sector) ?? 0) + value);
    }
    return Array.from(totals.entries())
      .map(([sector, valueMinor]) => ({ sector, valueMinor }))
      .sort((a, b) => b.valueMinor - a.valueMinor);
  }, [query.data]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (holding: InvestmentDto) => {
    setEditing(holding);
    setForm({
      symbol: holding.symbol,
      type: holding.type ?? "stock",
      name: holding.name,
      shares: String(holding.shares),
      avgPrice: (holding.avgPriceMinor / 100).toFixed(2),
      currentPrice: (holding.currentPriceMinor / 100).toFixed(2),
      portfolioPercent: holding.portfolioPercent != null ? String(holding.portfolioPercent) : "",
      sector: holding.sector,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const shares = Number.parseFloat(form.shares);
    const avgPrice = Number.parseFloat(form.avgPrice);
    const currentPrice = Number.parseFloat(form.currentPrice);
    if (!(shares > 0) || !(avgPrice > 0) || !(currentPrice > 0)) {
      toast({ title: "Shares and prices must be positive numbers", variant: "destructive" });
      return;
    }
    const portfolioPercent = form.portfolioPercent ? Number.parseFloat(form.portfolioPercent) : null;
    setSubmitting(true);
    const payload = {
      symbol: form.symbol.trim(),
      name: form.name.trim(),
      type: form.type,
      shares,
      avgPriceMinor: Math.round(avgPrice * 100),
      currentPriceMinor: Math.round(currentPrice * 100),
      portfolioPercent: portfolioPercent != null && portfolioPercent > 0 ? portfolioPercent : null,
      sector: form.sector,
    };
    const result = editing
      ? await mutate(`/api/investments/${editing.id}`, "PATCH", payload)
      : await mutate("/api/investments", "POST", payload);
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: editing ? "Could not update investment" : "Could not add investment", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: editing ? "Holding updated" : "Holding added",
      description: `${form.symbol.trim().toUpperCase()} ${editing ? "saved" : "added to your portfolio"}.`,
    });
    setForm(emptyForm());
    setDialogOpen(false);
    setEditing(null);
    query.refresh();
  };

  const deleteHolding = async (holding: InvestmentDto) => {
    // Source parity: the live app confirms deletions with a native dialog.
    if (!window.confirm("Are you sure you want to delete this investment?")) return;
    const result = await mutate(`/api/investments/${holding.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not remove holding", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Holding removed", description: `${holding.symbol} was removed from your portfolio.` });
    query.refresh();
  };

  return (
    <div className="space-y-8">
      <ViewHeader
        title="Investments"
        subtitle="Track your investment portfolio performance"
        actions={
          <Button onClick={openCreate} className="h-9 bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" aria-hidden /> Add Investment
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          {/* KPI row (live: blue + emerald gradients, white return card, w-12 bare icons) */}
          <div className="fade-in-up grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
            <div className="rounded-xl border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-blue-100">Portfolio Value</p>
                    <p className="text-3xl font-bold">{formatMoney(portfolioValue)}</p>
                  </div>
                  <Wallet className="w-12 h-12 text-blue-200" aria-hidden />
                </div>
              </div>
            </div>
            <div className="rounded-xl border-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-emerald-100">Total Gain/Loss</p>
                    <p className="text-3xl font-bold">{formatMoney(totalGain)}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-emerald-200" aria-hidden />
                </div>
              </div>
            </div>
            <div className={cn(CARD_SURFACE)}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Return</p>
                    <p className={cn("text-3xl font-bold", totalGain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {totalReturn.toFixed(2)}%
                    </p>
                  </div>
                  {/* Live: the Total Return icon is neutral in both themes (round-5). */}
                  <ChartColumn className="w-12 h-12 text-neutral-400 dark:text-neutral-500" aria-hidden />
                </div>
              </div>
            </div>
          </div>

          {/* Holdings grid (live: table col-span-2 + sector list right) */}
          <div className="fade-in-up stagger-1 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className={cn(CARD_SURFACE)}>
                <div className="flex flex-col space-y-1.5 p-6">
                  <div className="flex items-center gap-2 font-semibold leading-none tracking-tight text-primary-navy dark:text-white">
                    <Wallet className="w-5 h-5" aria-hidden /> Portfolio Holdings
                  </div>
                </div>
                <div className="p-6 pt-0">
                  {holdings.length === 0 ? (
                    <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">No investments added yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Shares</TableHead>
                            <TableHead>Avg. Price</TableHead>
                            <TableHead>Current Price</TableHead>
                            <TableHead>Market Value</TableHead>
                            <TableHead>Gain/Loss</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {holdings.map((holding) => {
                            const marketValue = Math.round(holding.shares * holding.currentPriceMinor);
                            const gain = marketValue - Math.round(holding.shares * holding.avgPriceMinor);
                            return (
                              <TableRow key={holding.id}>
                                <TableCell className="font-medium">{holding.symbol}</TableCell>
                                <TableCell>{holding.shares}</TableCell>
                                <TableCell>{formatMoney(holding.avgPriceMinor)}</TableCell>
                                <TableCell>{formatMoney(holding.currentPriceMinor)}</TableCell>
                                <TableCell>{formatMoney(marketValue)}</TableCell>
                                <TableCell className={gain >= 0 ? "text-emerald-600" : "text-red-600"}>
                                  {formatMoney(gain)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="w-8 h-8 text-neutral-400 hover:text-blue-600"
                                      onClick={() => openEdit(holding)}
                                      aria-label={`Edit ${holding.symbol}`}
                                    >
                                      <Pen className="w-4 h-4" aria-hidden />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="w-8 h-8 text-neutral-400 hover:text-red-600"
                                      onClick={() => void deleteHolding(holding)}
                                      aria-label={`Remove ${holding.symbol}`}
                                    >
                                      <Trash2 className="w-4 h-4" aria-hidden />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sector Allocation (live: colored-dot list, fixed per-sector colors) */}
            <div>
              <div className={cn(CARD_SURFACE)}>
                <div className="flex flex-col space-y-1.5 p-6">
                  <div className="flex items-center gap-2 font-semibold leading-none tracking-tight text-primary-navy dark:text-white">
                    <ChartPie className="w-5 h-5" aria-hidden /> Sector Allocation
                  </div>
                </div>
                <div className="p-6 pt-0">
                  {sectorData.length === 0 ? (
                    <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">No sector data available.</p>
                  ) : (
                    <div className="space-y-4">
                      {sectorData.map((entry) => (
                        <div key={entry.sector} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: SECTOR_COLORS[sectorKey(entry.sector)] ?? "#6B7280" }}
                              aria-hidden
                            />
                            <span className="capitalize">{entry.sector.toLowerCase()}</span>
                          </div>
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {portfolioValue > 0 ? ((entry.valueMinor / portfolioValue) * 100).toFixed(2) : "0.00"}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {holdings.length === 0 ? (
            <div className={cn(CARD_SURFACE, "p-6")}>
              <EmptyState
                icon={BarChart3}
                title="No Investments Yet"
                body="Add your investments to start tracking your portfolio performance."
                action={
                  <Button onClick={openCreate} className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-1" aria-hidden /> Add Your First Investment
                  </Button>
                }
              />
            </div>
          ) : null}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* Round-6 live matrix: Add/Edit Investment = max-w-md + scroll,
            trending-up icon, header row + in-flow close, no description. */}
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto" showCloseButton={false} aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                <TrendingUp className="w-5 h-5" aria-hidden />
                {editing ? "Edit Investment" : "Add Investment"}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                aria-label="Close"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={form.symbol}
                  onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value }))}
                  placeholder="e.g. AAPL"
                  required
                  maxLength={12}
                  className="uppercase dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investment_type">Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger id="investment_type">
                    <SelectValue>{investmentTypeLabel(form.type)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Company/Fund Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Apple Inc."
                required
                maxLength={120}
               
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shares">Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.0001"
                  value={form.shares}
                  onChange={(event) => setForm((current) => ({ ...current, shares: event.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Avg Cost</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.avgPrice}
                  onChange={(event) => setForm((current) => ({ ...current, avgPrice: event.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_price">Current Price</Label>
                <Input
                  id="current_price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.currentPrice}
                  onChange={(event) => setForm((current) => ({ ...current, currentPrice: event.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio_percentage">Portfolio %</Label>
                <Input
                  id="portfolio_percentage"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.portfolioPercent}
                  onChange={(event) => setForm((current) => ({ ...current, portfolioPercent: event.target.value }))}
                  placeholder="—"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select value={form.sector} onValueChange={(value) => setForm((current) => ({ ...current, sector: value }))}>
                <SelectTrigger id="sector">
                  <SelectValue>{form.sector}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary-sage text-white shadow hover:bg-primary-sage/90" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Saving…
                  </>
                ) : editing ? (
                  "Update Investment"
                ) : (
                  "Add Investment"
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
