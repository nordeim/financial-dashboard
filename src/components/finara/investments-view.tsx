"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Loader2, Pen, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/money";
import { INVESTMENT_TYPES, SECTORS, investmentTypeLabel } from "@/lib/categories";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { InvestmentDto } from "@/lib/types";

const SECTOR_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#64748B", "#A78BFA"];

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
    const result = await mutate(`/api/investments/${holding.id}`, "DELETE");
    if (!result.ok) {
      toast({ title: "Could not remove holding", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Holding removed", description: `${holding.symbol} was removed from your portfolio.` });
    query.refresh();
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Investments"
        subtitle="Track your investment portfolio performance"
        actions={
          <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Investment
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Portfolio Value", value: formatMoney(portfolioValue), tone: "text-slate-900 dark:text-slate-50" },
              { label: "Total Gain/Loss", value: formatMoney(totalGain), tone: totalGain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
              { label: "Total Return", value: `${totalReturn.toFixed(2)}%`, tone: totalGain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
            ].map((card) => (
              <Card key={card.label} className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className={`mt-2 text-2xl font-bold tabular-nums ${card.tone}`}>{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Portfolio Holdings</h2>
              {holdings.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No investments added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-slate-700">
                        <TableHead className="text-slate-500 dark:text-slate-400">Symbol</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400">Shares</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400">Avg. Price</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400">Current Price</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400">Market Value</TableHead>
                        <TableHead className="text-slate-500 dark:text-slate-400">Gain/Loss</TableHead>
                        <TableHead className="text-right text-slate-500 dark:text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holdings.map((holding) => {
                        const marketValue = Math.round(holding.shares * holding.currentPriceMinor);
                        const gain = marketValue - Math.round(holding.shares * holding.avgPriceMinor);
                        return (
                          <TableRow key={holding.id} className="dark:border-slate-700">
                            <TableCell
                              className="font-semibold text-slate-900 dark:text-slate-100"
                              title={`${holding.symbol} — ${holding.name}`}
                            >
                              {holding.symbol}
                            </TableCell>
                            <TableCell className="tabular-nums text-slate-600 dark:text-slate-300">{holding.shares}</TableCell>
                            <TableCell className="tabular-nums text-slate-600 dark:text-slate-300">
                              {formatMoney(holding.avgPriceMinor)}
                            </TableCell>
                            <TableCell className="tabular-nums text-slate-600 dark:text-slate-300">
                              {formatMoney(holding.currentPriceMinor)}
                            </TableCell>
                            <TableCell className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                              {formatMoney(marketValue)}
                            </TableCell>
                            <TableCell
                              className={`tabular-nums font-medium ${gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {formatMoney(gain)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  onClick={() => openEdit(holding)}
                                  aria-label={`Edit ${holding.symbol}`}
                                >
                                  <Pen className="h-4 w-4" aria-hidden />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                                  onClick={() => void deleteHolding(holding)}
                                  aria-label={`Remove ${holding.symbol}`}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
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
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
            <CardContent className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Sector Allocation</h2>
              {sectorData.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No sector data available.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorData}
                          dataKey="valueMinor"
                          nameKey="sector"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={entry.sector} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatMoney(value)}
                          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-3 self-center">
                    {sectorData.map((entry, index) => (
                      <li key={entry.sector} className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length] }}
                          aria-hidden
                        />
                        <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">{entry.sector}</span>
                        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {formatMoney(entry.valueMinor)}
                        </span>
                        <span className="w-14 text-right text-xs tabular-nums text-slate-400 dark:text-slate-500">
                          {portfolioValue > 0 ? ((entry.valueMinor / portfolioValue) * 100).toFixed(2) : "0.00"}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {holdings.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
              <EmptyState
                icon={BarChart3}
                title="No Investments Yet"
                body="Add your investments to start tracking your portfolio performance."
                action={
                  <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Your First Investment
                  </Button>
                }
              />
            </div>
          ) : null}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Investment" : "Add Investment"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this holding." : "Track a stock, ETF, bond or crypto position."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-symbol">Symbol</Label>
                <Input
                  id="inv-symbol"
                  value={form.symbol}
                  onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value }))}
                  placeholder="e.g. AAPL"
                  required
                  maxLength={12}
                  className="uppercase dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-type">Type</Label>
                <Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}>
                  <SelectTrigger id="inv-type" className="dark:bg-slate-800">
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
              <Label htmlFor="inv-name">Company/Fund Name</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. Apple Inc."
                required
                maxLength={120}
                className="dark:bg-slate-800"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-shares">Shares</Label>
                <Input
                  id="inv-shares"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.0001"
                  value={form.shares}
                  onChange={(event) => setForm((current) => ({ ...current, shares: event.target.value }))}
                  placeholder="0"
                  required
                  className="dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-avg">Avg Cost</Label>
                <Input
                  id="inv-avg"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.avgPrice}
                  onChange={(event) => setForm((current) => ({ ...current, avgPrice: event.target.value }))}
                  placeholder="0.00"
                  required
                  className="dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-current">Current Price</Label>
                <Input
                  id="inv-current"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.currentPrice}
                  onChange={(event) => setForm((current) => ({ ...current, currentPrice: event.target.value }))}
                  placeholder="0.00"
                  required
                  className="dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-percent">Portfolio %</Label>
                <Input
                  id="inv-percent"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.portfolioPercent}
                  onChange={(event) => setForm((current) => ({ ...current, portfolioPercent: event.target.value }))}
                  placeholder="—"
                  className="dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-sector">Sector</Label>
                <Select value={form.sector} onValueChange={(value) => setForm((current) => ({ ...current, sector: value }))}>
                  <SelectTrigger id="inv-sector" className="dark:bg-slate-800">
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
                  "Add Investment"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
