import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireNonNegativeInt, safeJson } from "@/lib/api";

interface GoalPatch {
  name?: unknown;
  targetAmountMinor?: unknown;
  currentAmountMinor?: unknown;
  contributeMinor?: unknown;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await safeJson<GoalPatch>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const existing = await db.goal.findUnique({ where: { id } });
    if (!existing) return fail("Goal not found", 404);

    const contribution =
      body.contributeMinor === undefined ? 0 : requireNonNegativeInt(body.contributeMinor, "Contribution");
    const nextCurrent = Math.min(
      existing.currentAmountMinor + contribution,
      body.targetAmountMinor !== undefined
        ? requireNonNegativeInt(body.targetAmountMinor, "Target amount")
        : existing.targetAmountMinor,
    );
    const updated = await db.goal.update({
      where: { id },
      data: {
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
        targetAmountMinor:
          body.targetAmountMinor === undefined
            ? undefined
            : requireNonNegativeInt(body.targetAmountMinor, "Target amount"),
        currentAmountMinor: body.currentAmountMinor !== undefined || contribution > 0 ? nextCurrent : undefined,
      },
    });
    return ok({
      id: updated.id,
      name: updated.name,
      targetAmountMinor: updated.targetAmountMinor,
      currentAmountMinor: updated.currentAmountMinor,
      deadline: updated.deadline?.toISOString() ?? null,
      category: updated.category,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await db.goal.findUnique({ where: { id } });
    if (!existing) return fail("Goal not found", 404);
    await db.goal.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
