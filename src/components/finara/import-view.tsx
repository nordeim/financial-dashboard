"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileSpreadsheet, FileUp, Loader2, Upload, X } from "lucide-react";
import { mutate } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { toMinorUnits } from "@/lib/money";
import { EXPENSE_CATEGORIES, SUBCATEGORIES, subcategoryLabel } from "@/lib/categories";
import { ErrorNote, ViewHeader } from "@/components/finara/ui-bits";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface ParsedRow {
  date: string;
  description: string;
  amount: string;
  category: string;
  subcategory: string;
}

interface ImportOutcome {
  imported: number;
  skipped: number;
  errors: { row: number; error: string }[];
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const character of line) {
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (character === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  fields.push(current.trim());
  return fields;
}

/** Heuristic column mapper: finds date/description/amount column indices. */
function mapColumns(header: string[]): { date: number; description: number; amount: number } | null {
  const findIndex = (patterns: RegExp[]): number => {
    for (const pattern of patterns) {
      const index = header.findIndex((column) => pattern.test(column.toLowerCase()));
      if (index >= 0) return index;
    }
    return -1;
  };
  const date = findIndex([/^date$/, /date/, /posted/, /time/]);
  const description = findIndex([/description/, /memo/, /payee/, /narrative/, /detail/, /name/, /merchant/]);
  const amount = findIndex([/amount/, /value/, /debit/, /sum/, /total/]);
  if (date < 0 || description < 0 || amount < 0) return null;
  return { date, description, amount };
}

/** Guess a 50/30/20 category + subcategory from the description text. */
function guessCategory(description: string): { category: string; subcategory: string } {
  const text = description.toLowerCase();
  const rules: { keywords: string[]; subcategory: string; category: string }[] = [
    { keywords: ["rent", "mortgage"], subcategory: "rent", category: "Needs" },
    { keywords: ["grocery", "groceries", "supermarket", "whole foods", "trader joe", "kroger", "aldi"], subcategory: "groceries", category: "Needs" },
    { keywords: ["electric", "water", "gas bill", "internet", "utility", "utilities", "comcast", "verizon"], subcategory: "utilities", category: "Needs" },
    { keywords: ["metro", "transit", "uber", "lyft", "fuel", "gas station", "parking", "train"], subcategory: "transportation", category: "Needs" },
    { keywords: ["pharmacy", "clinic", "dental", "doctor", "hospital", "health"], subcategory: "healthcare", category: "Needs" },
    { keywords: ["insurance"], subcategory: "insurance", category: "Needs" },
    { keywords: ["netflix", "spotify", "subscription", "hulu", "disney"], subcategory: "subscriptions", category: "Wants" },
    { keywords: ["restaurant", "cafe", "coffee", "dining", "bar", "pizza", "sushi", "brunch"], subcategory: "dining", category: "Wants" },
    { keywords: ["cinema", "movie", "theater", "concert", "entertainment"], subcategory: "entertainment", category: "Wants" },
    { keywords: ["amazon", "store", "shop", "mall", "uniqlo", "zara", "h&m"], subcategory: "shopping", category: "Wants" },
    { keywords: ["flight", "hotel", "airbnb", "travel", "airline"], subcategory: "travel", category: "Wants" },
    { keywords: ["gym", "fitness", "yoga"], subcategory: "fitness", category: "Wants" },
    { keywords: ["emergency fund"], subcategory: "emergency", category: "Savings" },
    { keywords: ["vanguard", "brokerage", "index fund", "etf", "invest", "robinhood"], subcategory: "investing", category: "Savings" },
    { keywords: ["401k", "ira", "retirement", "pension"], subcategory: "retirement", category: "Savings" },
  ];
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return { category: rule.category, subcategory: rule.subcategory };
    }
  }
  return { category: "Wants", subcategory: "other" };
}

export function ImportView() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setParseError(null);
    setOutcome(null);
    if (file.size > MAX_FILE_BYTES) {
      setParseError("File exceeds the 10MB limit.");
      return;
    }
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setParseError("Only CSV files are supported in this demo.");
      return;
    }
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        setParseError("The file needs a header row plus at least one data row.");
        return;
      }
      const header = splitCsvLine(lines[0]!);
      const mapping = mapColumns(header);
      if (!mapping) {
        setParseError("Could not find date, description and amount columns in the header row.");
        return;
      }
      const parsed: ParsedRow[] = [];
      for (const line of lines.slice(1)) {
        const fields = splitCsvLine(line);
        const date = fields[mapping.date] ?? "";
        const description = fields[mapping.description] ?? "";
        const rawAmount = (fields[mapping.amount] ?? "").replace(/[$,\s]/g, "");
        const negativeAmount = rawAmount.startsWith("(") && rawAmount.endsWith(")");
        const cleaned = rawAmount.replace(/[()\-]/g, "");
        const units = Number.parseFloat(cleaned);
        if (!description || !Number.isFinite(units)) continue;
        const guess = guessCategory(description);
        parsed.push({
          date,
          description,
          amount: negativeAmount ? String(-units) : String(units),
          category: guess.category,
          subcategory: guess.subcategory,
        });
      }
      if (parsed.length === 0) {
        setParseError("No importable rows were found.");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setStep(2);
    } catch {
      setParseError("The file could not be read.");
    }
  };

  const updateRow = (index: number, patch: Partial<ParsedRow>) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const runImport = async () => {
    setImporting(true);
    const payloadRows = rows.map((row) => {
      let amountMinor = 0;
      try {
        amountMinor = toMinorUnits(row.amount);
      } catch {
        amountMinor = 0;
      }
      return {
        date: row.date,
        description: row.description,
        amountMinor,
        category: row.category,
        subcategory: row.subcategory,
      };
    });
    const result = await mutate<ImportOutcome>("/api/import", "POST", { rows: payloadRows });
    setImporting(false);
    if (!result.ok || !result.data) {
      toast({ title: "Import failed", description: result.error, variant: "destructive" });
      return;
    }
    setOutcome(result.data);
    setStep(3);
    toast({
      title: `Imported ${result.data.imported} transactions`,
      description: result.data.skipped > 0 ? `${result.data.skipped} rows were skipped.` : "All rows imported successfully.",
    });
  };

  const reset = () => {
    setStep(1);
    setRows([]);
    setFileName(null);
    setOutcome(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <ViewHeader title="Import Transactions" subtitle="Upload a CSV from your bank to quickly add expenses." />

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <ol className="mb-6 flex items-center gap-2 text-sm" aria-label="Import steps">
            {["Upload File", "Review & Categorize", "Done"].map((label, index) => {
              const stepNumber = index + 1;
              const isActive = step === stepNumber;
              const isDone = step > stepNumber;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isDone ? "bg-emerald-500 text-white" : isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : stepNumber}
                  </span>
                  <span className={isActive ? "font-semibold text-slate-900" : "text-slate-400"}>{label}</span>
                  {index < 2 ? <span className="mx-1 h-px w-8 bg-slate-200" aria-hidden /> : null}
                </li>
              );
            })}
          </ol>

          {parseError ? <ErrorNote message={parseError} onRetry={reset} /> : null}

          {step === 1 ? (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <FileUp className="h-7 w-7 text-emerald-600" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Step 1: Upload File</p>
                <p className="mt-1 text-xs text-slate-400">Drag & drop your bank CSV here, or browse</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white"
              >
                <Upload className="mr-2 h-4 w-4" aria-hidden /> Upload a file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv"
                className="sr-only"
                aria-label="Choose a CSV file to import"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
              <p className="text-xs text-slate-400">CSV, XLS, XLSX up to 10MB</p>
              <Button
                type="button"
                disabled
                className="pointer-events-none bg-slate-300 text-slate-500"
                aria-hidden
              >
                Upload and Extract
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden />
                  <span className="font-semibold">{fileName}</span>
                  <span className="text-slate-400">· {rows.length} transactions detected</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={reset}>
                    <X className="mr-1 h-4 w-4" aria-hidden /> Cancel
                  </Button>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => void runImport()} disabled={importing}>
                    {importing ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> Importing…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden /> Import {rows.length} Transactions
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Categories were guessed from descriptions — adjust any row before importing.
              </p>
              <div className="max-h-96 overflow-auto rounded-xl border border-slate-100 finara-scroll">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs tabular-nums text-slate-500">{row.date}</TableCell>
                        <TableCell className="max-w-56 truncate text-sm">{row.description}</TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">{row.amount}</TableCell>
                        <TableCell>
                          <Select value={row.category} onValueChange={(value) => updateRow(index, { category: value })}>
                            <SelectTrigger className="h-8 w-28 text-xs" aria-label={`Category for row ${index + 1}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPENSE_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.subcategory}
                            onValueChange={(value) => updateRow(index, { subcategory: value })}
                          >
                            <SelectTrigger className="h-8 w-40 text-xs" aria-label={`Subcategory for row ${index + 1}`}>
                              <SelectValue>{subcategoryLabel(row.subcategory)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {SUBCATEGORIES.filter((entry) => entry.category === row.category).map((entry) => (
                                <SelectItem key={entry.id} value={entry.id}>
                                  {entry.emoji} {entry.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {step === 3 && outcome ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Import Complete</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {outcome.imported} transactions were imported{outcome.skipped > 0 ? `, ${outcome.skipped} rows were skipped` : ""}.
                </p>
              </div>
              {outcome.errors.length > 0 ? (
                <ul className="max-h-40 w-full max-w-md space-y-1 overflow-y-auto rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-700" aria-label="Skipped rows">
                  {outcome.errors.map((entry) => (
                    <li key={`${entry.row}-${entry.error}`}>
                      Row {entry.row}: {entry.error}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={reset}>
                  Import another file
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
