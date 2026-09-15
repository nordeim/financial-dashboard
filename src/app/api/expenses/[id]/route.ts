import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireIsoDate, safeJson } from "@/lib/api";
import { normalizeSubcategory } from "@/lib/categories";

interface ExpensePatch {
  description?: unknown;
  amountMinor?: unknown;
  category?: unknown;
  subcategory?: unknown;
  date?: unknown;
  notes?: unknown;
  recurring?: unknown;
}

const CATEGORIES = new Set(["Needs", "Wants", "Savings"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await safeJson<ExpensePatch>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) return fail("Expense not found", 404);

    if (body.category !== undefined && !CATEGORIES.has(String(body.category))) {
      return fail("Category must be one of Needs, Wants, Savings", 400);
    }

    const updated = await db.expense.update({
      where: { id },
      data: {
        description:
          typeof body.description === "string" && body.description.trim() ? body.description.trim() : undefined,
        amountMinor:
          typeof body.amountMinor === "number" && Number.isInteger(body.amountMinor) && body.amountMinor >= 0
            ? body.amountMinor
            : undefined,
        category: body.category === undefined ? undefined : String(body.category),
        subcategory:
          typeof body.subcategory === "string" ? normalizeSubcategory(body.subcategory) : undefined,
        date: body.date === undefined ? undefined : requireIsoDate(body.date, "Date"),
        notes: body.notes === null ? null : typeof body.notes === "string" ? body.notes : undefined,
        recurring: typeof body.recurring === "boolean" ? body.recurring : undefined,
      },
    });
    return ok({
      id: updated.id,
      description: updated.description,
      amountMinor: updated.amountMinor,
      category: updated.category,
      subcategory: updated.subcategory,
      date: updated.date.toISOString(),
      notes: updated.notes,
      recurring: updated.recurring,
      accountId: updated.accountId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) return fail("Expense not found", 404);
    await db.expense.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
