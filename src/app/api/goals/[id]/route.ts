import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireIsoDate, requireSignedInt, safeJson } from "@/lib/api";
import { GOAL_PRIORITIES, normalizeGoalCategory } from "@/lib/categories";

interface GoalPatch {
  name?: unknown;
  targetAmountMinor?: unknown;
  currentAmountMinor?: unknown;
  contributeMinor?: unknown;
  deadline?: unknown;
  category?: unknown;
  priority?: unknown;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await safeJson<GoalPatch>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const existing = await db.goal.findUnique({ where: { id } });
    if (!existing) return fail("Goal not found", 404);

    if (body.priority !== undefined && !GOAL_PRIORITIES.some((option) => option.id === body.priority)) {
      return fail("Priority must be one of high, medium, low", 400);
    }

    const contribution =
      body.contributeMinor === undefined ? 0 : requireSignedInt(body.contributeMinor, "Contribution");
    // Uncapped (round-11 live probe: 150 contributed to a 100 target renders
    // Complete at 150.0%). Negative contributions stay a silent no-op — the
    // live PUT returned 200 with the current unchanged (contribution > 0
    // gate below replicates that).
    const nextCurrent = existing.currentAmountMinor + contribution;
    const updated = await db.goal.update({
      where: { id },
      data: {
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
        targetAmountMinor:
          body.targetAmountMinor === undefined
            ? undefined
            : requireSignedInt(body.targetAmountMinor, "Target amount"),
        currentAmountMinor: body.currentAmountMinor !== undefined || contribution > 0 ? nextCurrent : undefined,
        deadline: body.deadline === undefined ? undefined : body.deadline ? requireIsoDate(body.deadline, "Deadline") : null,
        category:
          body.category === undefined
            ? undefined
            : normalizeGoalCategory(typeof body.category === "string" ? body.category : null),
        priority: body.priority === undefined ? undefined : String(body.priority),
      },
    });
    return ok({
      id: updated.id,
      name: updated.name,
      targetAmountMinor: updated.targetAmountMinor,
      currentAmountMinor: updated.currentAmountMinor,
      deadline: updated.deadline?.toISOString() ?? null,
      category: updated.category,
      priority: updated.priority,
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
