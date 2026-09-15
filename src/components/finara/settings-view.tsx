"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Eye, EyeOff, Lock, Save, Settings as SettingsIcon, ShieldCheck, Upload } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES, DATE_FORMATS } from "@/lib/categories";
import { ErrorNote, LoadingRows, ViewHeader } from "@/components/finara/ui-bits";
import type { SettingsDto } from "@/lib/types";

const TOGGLES = [
  { key: "pushNotifications", label: "Push Notifications", description: "Receive notifications in your browser" },
  { key: "emailAlerts", label: "Email Alerts", description: "Get important alerts via email" },
  { key: "budgetWarnings", label: "Budget Warnings", description: "Alert me when approaching budget limits" },
  { key: "monthlyReports", label: "Monthly Reports", description: "Receive monthly spending summaries" },
] as const;

const TRUST_BADGES = [
  { icon: Lock, title: "Encrypted", caption: "Protected" },
  { icon: ShieldCheck, title: "Multi-Device", caption: "Synced" },
  { icon: Eye, title: "Your Eyes Only", caption: "Private" },
  { icon: ShieldCheck, title: "GDPR", caption: "Compliant" },
];

export function SettingsView() {
  const query = useQuery<SettingsDto>("/api/settings");
  const [form, setForm] = useState<SettingsDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Hydrate the editable form once data arrives; keep user edits afterwards.
  useEffect(() => {
    if (query.data && !form) setForm(query.data);
  }, [query.data, form]);

  const exportAllData = async () => {
    try {
      const response = await fetch("/api/export", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Export failed with status ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `finara-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: "Your data was downloaded as JSON." });
    } catch (cause) {
      toast({
        title: "Export failed",
        description: cause instanceof Error ? cause.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    const result = await mutate<SettingsDto>("/api/settings", "PUT", form);
    setSaving(false);
    if (!result.ok || !result.data) {
      toast({ title: "Could not save settings", description: result.error, variant: "destructive" });
      return;
    }
    setForm(result.data);
    toast({ title: "Settings saved", description: "Your preferences were updated." });
  };

  /** Round-trips a Finara JSON export file through POST /api/import (finara-export mode). */
  const importExportFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Import failed", description: "File exceeds the 10MB limit.", variant: "destructive" });
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast({ title: "Import failed", description: "The file is not valid JSON.", variant: "destructive" });
      return;
    }
    setImporting(true);
    const result = await mutate<{ imported: number; skipped: number; errors: { row: number; error: string }[]}>(
      "/api/import",
      "POST",
      { mode: "finara-export", ...(parsed as object) },
    );
    setImporting(false);
    if (importInputRef.current) importInputRef.current.value = "";
    if (!result.ok || !result.data) {
      toast({ title: "Import failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: `Imported ${result.data.imported} records`,
      description:
        result.data.skipped > 0
          ? `${result.data.skipped} records were skipped — check the Import page for details.`
          : "Expenses, income, goals and accounts were restored.",
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader title="Settings" subtitle="Customize your budget planning experience" />

      {query.error ? (
        <ErrorNote message={query.error} onRetry={query.refresh} />
      ) : !form ? (
        <LoadingRows rows={4} />
      ) : (
        <div className="space-y-4 pb-6">
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-slate-500" aria-hidden />
                <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="setting-currency">Default Currency</Label>
                  <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
                    <SelectTrigger id="setting-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setting-date-format">Date Format</Label>
                  <Select value={form.dateFormat} onValueChange={(value) => setForm({ ...form, dateFormat: value })}>
                    <SelectTrigger id="setting-date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-slate-500" aria-hidden />
                <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {TOGGLES.map((toggle) => (
                  <div key={toggle.key} className="flex items-center justify-between gap-4 py-3.5">
                    <div>
                      <Label htmlFor={`setting-${toggle.key}`} className="text-sm font-medium text-slate-800">
                        {toggle.label}
                      </Label>
                      <p className="text-xs text-slate-400">{toggle.description}</p>
                    </div>
                    <Switch
                      id={`setting-${toggle.key}`}
                      checked={form[toggle.key]}
                      onCheckedChange={(checked) => setForm({ ...form, [toggle.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-600" aria-hidden />
                <h2 className="text-lg font-semibold text-slate-900">Export Your Data</h2>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <h3 className="text-sm font-semibold text-emerald-800">GDPR Compliant Export</h3>
                <p className="mt-1 text-sm text-emerald-700">
                  Download all your data in JSON format. This includes expenses, income, goals, and account information.
                </p>
                <Button variant="outline" className="mt-3 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100" onClick={() => void exportAllData()}>
                  <Download className="mr-2 h-4 w-4" aria-hidden /> Export All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-amber-500" aria-hidden />
                <h2 className="text-lg font-semibold text-slate-900">Import Data</h2>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h3 className="text-sm font-semibold text-amber-800">Import Warning</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Importing will add data to your existing records. Make sure to backup your current data first.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 border-amber-300 bg-white text-amber-700 hover:bg-amber-100"
                  disabled={importing}
                  onClick={() => importInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" aria-hidden /> {importing ? "Importing…" : "Select Finara Export File"}
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  aria-label="Select a Finara export file to import"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importExportFile(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-violet-600" aria-hidden />
                <h2 className="text-lg font-semibold text-slate-900">Your Data Summary</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.title} className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-4 text-center">
                    <badge.icon className="h-5 w-5 text-slate-500" aria-hidden />
                    <p className="text-xs font-semibold text-slate-700">{badge.title}</p>
                    <p className="text-[10px] text-slate-400">{badge.caption}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => void handleSave()} className="bg-emerald-500 hover:bg-emerald-600" disabled={saving}>
              <Save className="mr-2 h-4 w-4" aria-hidden /> {saving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
