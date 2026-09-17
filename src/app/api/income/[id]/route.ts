import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireSignedInt, safeJson } from "@/lib/api";
import { INCOME_CATEGORIES, INCOME_FREQUENCIES } from "@/lib/categories";

interface IncomePatch {
  name?: unknown;
  amountMinor?: unknown;
  frequency?: unknown;
  category?: unknown;
  active?: unknown;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await safeJson<IncomePatch>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const existing = await db.incomeSource.findUnique({ where: { id } });
    if (!existing) return fail("Income source not found", 404);

    if (body.frequency !== undefined && !(INCOME_FREQUENCIES as readonly string[]).includes(String(body.frequency))) {
      return fail("Frequency must be one of monthly, weekly, biweekly, annual", 400);
    }
    if (body.category !== undefined && !INCOME_CATEGORIES.some((option) => option.id === body.category)) {
      return fail("Category must be one of primary, secondary, passive, other", 400);
    }

    const updated = await db.incomeSource.update({
      where: { id },
      data: {
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
        amountMinor: body.amountMinor === undefined ? undefined : requireSignedInt(body.amountMinor, "Amount"),
        frequency: body.frequency === undefined ? undefined : String(body.frequency),
        category: body.category === undefined ? undefined : String(body.category),
        active: typeof body.active === "boolean" ? body.active : undefined,
      },
    });
    return ok({
      id: updated.id,
      name: updated.name,
      amountMinor: updated.amountMinor,
      frequency: updated.frequency,
      category: updated.category,
      active: updated.active,
      nextPaymentDate: updated.nextPaymentDate?.toISOString() ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await db.incomeSource.findUnique({ where: { id } });
    if (!existing) return fail("Income source not found", 404);
    await db.incomeSource.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
