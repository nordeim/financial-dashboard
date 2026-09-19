"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Download, FileText, Save, Shield, TriangleAlert, Upload, User } from "lucide-react";
import { mutate, useQuery } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES, DATE_FORMATS } from "@/lib/categories";
import { DEMO_EMAIL } from "@/lib/demo-user";
import {
  CARD_PLAIN,
  ErrorNote,
  LoadingRows,
  MotionWrap,
  ViewHeader,
  entranceStyle,
} from "@/components/finara/ui-bits";
import type { SettingsDto } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOGGLES = [
  { key: "pushNotifications", label: "Push Notifications", description: "Receive notifications in your browser" },
  { key: "emailAlerts", label: "Email Alerts", description: "Get important alerts via email" },
  { key: "budgetWarnings", label: "Budget Warnings", description: "Alert me when approaching budget limits" },
  { key: "monthlyReports", label: "Monthly Reports", description: "Receive monthly spending summaries" },
] as const;

/** Live-verified data summary tiles (title on top, colored pill beneath;
 *  the Protected pill carries a small shield glyph — live-exact). */
const DATA_SUMMARY = [
  { title: "Protected", pill: "Encrypted", icon: true, pillClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { title: "Synced", pill: "Multi-Device", icon: false, pillClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { title: "Private", pill: "Your Eyes Only", icon: false, pillClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { title: "GDPR", pill: "Compliant", icon: false, pillClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
] as const;

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
      const response = await fetch("/api/export", { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Export failed with status ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      // Round 9: live embeds the account email in the export filename
      // (probed: finara-export-<email>-<date>.json).
      anchor.download = `finara-export-${DEMO_EMAIL}-${new Date().toISOString().slice(0, 10)}.json`;
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
    const result = await mutate<{ imported: number; skipped: number; errors: { row: number; error: string }[] }>(
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
        <div className="space-y-6">
          {/* Profile Settings (live: user icon header + two selects) */}
          <MotionWrap delayMs={100}>
          <div className={cn(CARD_PLAIN)}>
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                <User className="w-5 h-5" aria-hidden />
                Profile Settings
              </div>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
            </div>
          </div>
          </MotionWrap>

          {/* Notifications (live: bell icon, text-base labels, space-y-6 rows) */}
          <MotionWrap delayMs={200}>
          <div className={cn(CARD_PLAIN)}>
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                <Bell className="w-5 h-5" aria-hidden />
                Notifications
              </div>
            </div>
            <div className="p-6 pt-0 space-y-6">
              {TOGGLES.map((toggle) => (
                <div key={toggle.key} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`setting-${toggle.key}`} className="text-base font-medium">
                      {toggle.label}
                    </Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{toggle.description}</p>
                  </div>
                  <Switch
                    id={`setting-${toggle.key}`}
                    checked={form[toggle.key]}
                    onCheckedChange={(checked) => setForm({ ...form, [toggle.key]: checked })}
                  />
                </div>
              ))}
            </div>
          </div>
          </MotionWrap>

          {/* Export Your Data (live: blue info box + full-width blue button) */}
          <MotionWrap delayMs={300}>
          <div className={cn(CARD_PLAIN)}>
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                <Download className="w-5 h-5" aria-hidden />
                Export Your Data
              </div>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">GDPR Compliant Export</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Download all your data in JSON format. This includes expenses, income, goals, and account information.
                    </p>
                  </div>
                </div>
              </div>
              <Button className="h-9 px-4 py-2 w-full bg-blue-600 hover:bg-blue-700" onClick={() => void exportAllData()}>
                <Download className="w-4 h-4 mr-2" aria-hidden />
                Export All Data
              </Button>
            </div>
          </div>
          </MotionWrap>

          {/* Import Data (live: amber warning box + visible file input) */}
          <div className={cn(CARD_PLAIN)}>
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                <Upload className="w-5 h-5" aria-hidden />
                Import Data
              </div>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Import Warning</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Importing will add data to your existing records. Make sure to backup your current data first.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="importFile">Select Finara Export File</Label>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-pointer"
                  id="importFile"
                  aria-label="Select a Finara export file to import"
                  disabled={importing}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importExportFile(file);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Your Data Summary (live: text-2xl titles + colored pills) */}
          <div className={cn(CARD_PLAIN)}>
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
                <FileText className="w-5 h-5" aria-hidden />
                Your Data Summary
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DATA_SUMMARY.map((tile) => (
                <div key={tile.title} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{tile.title}</div>
                  <Badge variant="secondary" className={tile.pillClass}>
                    {tile.icon ? <Shield className="w-3 h-3 mr-1" aria-hidden /> : null}
                    {tile.pill}
                  </Badge>
                </div>
              ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end" style={entranceStyle(400)}>
            <Button onClick={() => void handleSave()} className="h-9 px-4 py-2 bg-primary-sage hover:bg-primary-sage/90 gap-2" disabled={saving}>
              <Save className="w-4 h-4" aria-hidden />
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
