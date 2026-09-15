"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Loader2, Plus, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, percent } from "@/lib/money";
import { SECTORS } from "@/lib/categories";
import { EmptyState, ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { InvestmentDto } from "@/lib/types";

const SECTOR_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#64748B"];

export function InvestmentsView() {
  const query = useQuery<InvestmentDto[]>("/api/investments");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", shares: "", avgPrice: "", currentPrice: "", sector: "Technology" });
  const { toast } = useToast();

  const holdings = query.data ?? [];
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const shares = Number.parseFloat(form.shares);
    const avgPrice = Number.parseFloat(form.avgPrice);
    const currentPrice = Number.parseFloat(form.currentPrice);
    if (!(shares > 0) || !(avgPrice > 0) || !(currentPrice > 0)) {
      toast({ title: "Shares and prices must be positive numbers", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const result = await mutate("/api/investments", "POST", {
      symbol: form.symbol.trim(),
      name: form.name.trim(),
      shares,
      avgPriceMinor: Math.round(avgPrice * 100),
      currentPriceMinor: Math.round(currentPrice * 100),
      sector: form.sector,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast({ title: "Could not add investment", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Holding added", description: `${form.symbol.trim().toUpperCase()} added to your portfolio.` });
    setForm({ symbol: "", name: "", shares: "", avgPrice: "", currentPrice: "", sector: "Technology" });
    setDialogOpen(false);
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
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Investment
          </Button>
        }
      />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : query.loading && !query.data ? (
        <LoadingRows rows={4} />
      ) : holdings.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm">
          <EmptyState
            icon={BarChart3}
            title="No Investments Yet"
            body="Add your investments to start tracking your portfolio performance."
            action={
              <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="mr-1 h-4 w-4" aria-hidden /> Add Your First Investment
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Portfolio Value</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(portfolioValue)}</p>
                <p className="mt-1 text-xs text-slate-400">{holdings.length} holdings</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Total Gain/Loss</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${totalGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {totalGain >= 0 ? "+" : ""}
                  {formatMoney(totalGain)}
                </p>
                <p className="mt-1 text-xs text-slate-400">Unrealized</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-slate-500">Total Return</p>
                <p className={`mt-2 flex items-center gap-1.5 text-2xl font-bold tabular-nums ${totalReturn >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {totalReturn >= 0 ? <TrendingUp className="h-5 w-5" aria-hidden /> : <TrendingDown className="h-5 w-5" aria-hidden />}
                  {totalReturn.toFixed(2)}%
                </p>
                <p className="mt-1 text-xs text-slate-400">Since purchase</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="border-none shadow-sm xl:col-span-2">
              <CardContent className="p-5">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Portfolio Holdings</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Avg. Price</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Gain/Loss</TableHead>
                        <TableHead className="w-12" aria-label="Actions">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holdings.map((holding) => {
                        const value = Math.round(holding.shares * holding.currentPriceMinor);
                        const gain = value - Math.round(holding.shares * holding.avgPriceMinor);
                        const gainPct = percent(gain, Math.round(holding.shares * holding.avgPriceMinor));
                        return (
                          <TableRow key={holding.id} className="group">
                            <TableCell>
                              <p className="font-semibold text-slate-900">{holding.symbol}</p>
                              <p className="text-xs text-slate-400">{holding.name}</p>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{holding.shares.toLocaleString("en-US")}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatMoney(holding.avgPriceMinor)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatMoney(holding.currentPriceMinor)}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{formatMoney(value)}</TableCell>
                            <TableCell className={`text-right tabular-nums ${gain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {gain >= 0 ? "+" : ""}
                              {formatMoney(gain)}
                              <span className="ml-1 text-xs text-slate-400">({gainPct.toFixed(1)}%)</span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-300 opacity-0 transition-opacity hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
                                onClick={() => void deleteHolding(holding)}
                                aria-label={`Remove ${holding.symbol}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Sector Allocation</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        dataKey="valueMinor"
                        nameKey="sector"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={entry.sector} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | string) => formatMoney(Number(value))}
                        contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {sectorData.map((entry, index) => (
                    <li key={entry.sector} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length] }} aria-hidden />
                        {entry.sector}
                      </span>
                      <span className="tabular-nums text-slate-400">{percent(entry.valueMinor, portfolioValue).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-600" aria-hidden /> Add Investment
            </DialogTitle>
            <DialogDescription>Track a new holding in your portfolio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-symbol">Symbol</Label>
                <Input
                  id="inv-symbol"
                  value={form.symbol}
                  onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                  placeholder="AAPL"
                  required
                  maxLength={12}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-shares">Shares</Label>
                <Input
                  id="inv-shares"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.001"
                  value={form.shares}
                  onChange={(event) => setForm((current) => ({ ...current, shares: event.target.value }))}
                  placeholder="10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-name">Company / fund name</Label>
              <Input
                id="inv-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Apple Inc."
                required
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-avg">Avg. price (USD)</Label>
                <Input
                  id="inv-avg"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.avgPrice}
                  onChange={(event) => setForm((current) => ({ ...current, avgPrice: event.target.value }))}
                  placeholder="142.50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-current">Current price (USD)</Label>
                <Input
                  id="inv-current"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.currentPrice}
                  onChange={(event) => setForm((current) => ({ ...current, currentPrice: event.target.value }))}
                  placeholder="228.80"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-sector">Sector</Label>
              <Select value={form.sector} onValueChange={(value) => setForm((current) => ({ ...current, sector: value }))}>
                <SelectTrigger id="inv-sector">
                  <SelectValue />
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
