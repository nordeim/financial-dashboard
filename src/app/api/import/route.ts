import { db } from "@/lib/db";
import { errorResponse, fail, ok, optionalString, safeJson } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";
import { normalizeFinaraExport, parseFlexibleDate } from "@/lib/import-export";

/**
 * Batch import. Two modes:
 *  - default (CSV rows): accepts pre-mapped rows (date, description, amountMinor,
 *    category, subcategory).
 *  - "finara-export": accepts a full Finara JSON export (as produced by
 *    GET /api/export) and re-inserts expenses, income sources, goals and accounts.
 * Row-level failures are reported without aborting the whole import.
 */

interface ImportRow {
  date?: unknown;
  description?: unknown;
  amountMinor?: unknown;
  category?: unknown;
  subcategory?: unknown;
}

interface ImportPayload {
  mode?: unknown;
  rows?: ImportRow[];
}

const CATEGORIES = new Set(["Needs", "Wants", "Savings"]);
const parseDate = parseFlexibleDate;

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await safeJson<ImportPayload>(request);
    if (!body) return fail("Body must be a JSON object", 400);
    if (body.mode === "finara-export") return importFinaraExport(body);
    if (!Array.isArray(body.rows)) return fail("Body must contain a rows array", 400);
    if (body.rows.length === 0) return fail("No rows to import", 400);
    if (body.rows.length > 2000) return fail("Import is capped at 2000 rows per batch", 400);

    const errors: { row: number; error: string }[] = [];
    const inserts: {
      description: string;
      amountMinor: number;
      category: string;
      subcategory: string;
      date: Date;
    }[] = [];

    body.rows.forEach((row, index) => {
      const description = typeof row.description === "string" ? row.description.trim() : "";
      if (!description) {
        errors.push({ row: index + 1, error: "Missing description" });
        return;
      }
      const amountMinor =
        typeof row.amountMinor === "number" && Number.isInteger(row.amountMinor) ? row.amountMinor : null;
      if (amountMinor === null || amountMinor < 0) {
        errors.push({ row: index + 1, error: "Invalid amount" });
        return;
      }
      const category = typeof row.category === "string" && CATEGORIES.has(row.category) ? row.category : null;
      if (!category) {
        errors.push({ row: index + 1, error: "Invalid category" });
        return;
      }
      const subcategory = optionalString(row.subcategory, 40) ?? "other";
      const date = parseDate(row.date);
      if (!date) {
        errors.push({ row: index + 1, error: "Unrecognized date format" });
        return;
      }
      inserts.push({ description, amountMinor, category, subcategory, date });
    });

    if (inserts.length > 0) {
      await db.expense.createMany({ data: inserts });
    }

    return ok({ imported: inserts.length, skipped: errors.length, errors: errors.slice(0, 25) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** finara-export mode: re-insert entities from a Finara JSON export file. */
async function importFinaraExport(payload: unknown) {
  const normalized = normalizeFinaraExport(payload);
  if (normalized.errors.some((error) => error.entity === "payload")) {
    return fail("File is not a valid Finara export", 400);
  }
  const totalRows =
    normalized.expenses.length +
    normalized.incomeSources.length +
    normalized.goals.length +
    normalized.accounts.length +
    normalized.investments.length +
    normalized.errors.length;
  if (totalRows === 0) return fail("The export file contains no importable records", 400);
  if (totalRows > 2000) return fail("Import is capped at 2000 rows per batch", 400);

  if (normalized.accounts.length > 0) await db.account.createMany({ data: normalized.accounts });
  if (normalized.incomeSources.length > 0) await db.incomeSource.createMany({ data: normalized.incomeSources });
  if (normalized.goals.length > 0) await db.goal.createMany({ data: normalized.goals });
  if (normalized.expenses.length > 0) await db.expense.createMany({ data: normalized.expenses });
  // Round 9: the live export carries investments — restored like the rest.
  if (normalized.investments.length > 0) await db.investment.createMany({ data: normalized.investments });

  const imported =
    normalized.expenses.length +
    normalized.incomeSources.length +
    normalized.goals.length +
    normalized.accounts.length +
    normalized.investments.length;
  return ok({
    imported,
    skipped: normalized.errors.length,
    errors: normalized.errors.slice(0, 25).map((error) => ({
      row: error.row,
      error: `${error.entity}: ${error.error}`,
    })),
  });
}
