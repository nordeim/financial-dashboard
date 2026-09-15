import { db } from "@/lib/db";
import { errorResponse, fail, ok, optionalString, safeJson } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

/**
 * Batch CSV import. Accepts pre-mapped rows (date, description, amountMinor,
 * category, subcategory). Each row is validated individually; row-level
 * failures are reported without aborting the whole import, and the response
 * states exactly what was imported.
 */

interface ImportRow {
  date?: unknown;
  description?: unknown;
  amountMinor?: unknown;
  category?: unknown;
  subcategory?: unknown;
}

interface ImportPayload {
  rows?: ImportRow[];
}

const CATEGORIES = new Set(["Needs", "Wants", "Savings"]);

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  // Common bank-export shapes: MM/DD/YYYY, DD.MM.YYYY, YYYYMMDD.
  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, first, second, year] = slash;
    const month = Number.parseInt(first!, 10);
    const day = Number.parseInt(second!, 10);
    if (month >= 1 && month <= 12) return new Date(Number.parseInt(year!, 10), month - 1, day, 12);
    if (day >= 1 && day <= 12 && month >= 1 && month <= 31) return new Date(Number.parseInt(year!, 10), day - 1, month, 12);
  }
  const dotted = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) {
    const [, day, month, year] = dotted;
    return new Date(Number.parseInt(year!, 10), Number.parseInt(month!, 10) - 1, Number.parseInt(day!, 10), 12);
  }
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    const [, year, month, day] = compact;
    return new Date(Number.parseInt(year!, 10), Number.parseInt(month!, 10) - 1, Number.parseInt(day!, 10), 12);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await safeJson<ImportPayload>(request);
    if (!body || !Array.isArray(body.rows)) return fail("Body must contain a rows array", 400);
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
