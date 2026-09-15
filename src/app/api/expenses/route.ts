import { db } from "@/lib/db";
import {
  errorResponse,
  fail,
  ok,
  optionalString,
  requireIsoDate,
  requireNonNegativeInt,
  requireString,
  safeJson,
} from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";
import type { ExpenseDto } from "@/lib/types";

function toDto(expense: {
  id: string;
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  date: Date;
  notes: string | null;
  recurring: boolean;
  accountId: string | null;
}): ExpenseDto {
  return {
    id: expense.id,
    description: expense.description,
    amountMinor: expense.amountMinor,
    category: expense.category,
    subcategory: expense.subcategory,
    date: expense.date.toISOString(),
    notes: expense.notes,
    recurring: expense.recurring,
    accountId: expense.accountId,
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const expenses = await db.expense.findMany({ orderBy: { date: "desc" } });
    return ok(expenses.map(toDto));
  } catch (error) {
    return errorResponse(error);
  }
}

interface ExpensePayload {
  description?: unknown;
  amountMinor?: unknown;
  category?: unknown;
  subcategory?: unknown;
  date?: unknown;
  notes?: unknown;
  recurring?: unknown;
  accountId?: unknown;
}

const CATEGORIES = new Set(["Needs", "Wants", "Savings"]);

export async function POST(request: Request) {
  try {
    const body = await safeJson<ExpensePayload>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const description = requireString(body.description, "Description");
    const amountMinor = requireNonNegativeInt(body.amountMinor, "Amount");
    const category = requireString(body.category, "Category", 20);
    if (!CATEGORIES.has(category)) {
      return fail("Category must be one of Needs, Wants, Savings", 400);
    }
    const subcategory = requireString(body.subcategory, "Subcategory", 40);
    const date = requireIsoDate(body.date, "Date");
    const created = await db.expense.create({
      data: {
        description,
        amountMinor,
        category,
        subcategory,
        date,
        notes: optionalString(body.notes),
        recurring: body.recurring === true,
        accountId: optionalString(body.accountId, 40),
      },
    });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
