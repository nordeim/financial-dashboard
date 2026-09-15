import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireNonNegativeInt, safeJson } from "@/lib/api";

interface IncomePatch {
  name?: unknown;
  amountMinor?: unknown;
  active?: unknown;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await safeJson<IncomePatch>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const existing = await db.incomeSource.findUnique({ where: { id } });
    if (!existing) return fail("Income source not found", 404);
    const updated = await db.incomeSource.update({
      where: { id },
      data: {
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
        amountMinor: body.amountMinor === undefined ? undefined : requireNonNegativeInt(body.amountMinor, "Amount"),
        active: typeof body.active === "boolean" ? body.active : undefined,
      },
    });
    return ok({
      id: updated.id,
      name: updated.name,
      amountMinor: updated.amountMinor,
      frequency: updated.frequency,
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
