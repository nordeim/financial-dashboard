import { db } from "@/lib/db";
import { errorResponse, fail, ok, safeJson } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

/**
 * Dismiss an insight (round 13 — mirrors the live's
 * `TransactionInsight.update(id, { is_dismissed: true })`). Idempotent:
 * dismissing an already-dismissed record succeeds unchanged.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const body = await safeJson<{ is_dismissed?: unknown }>(request);
    if (body !== null && body.is_dismissed !== undefined && typeof body.is_dismissed !== "boolean") {
      return fail("is_dismissed must be a boolean", 400);
    }
    const existing = await db.insight.findUnique({ where: { id } });
    if (!existing) return fail("Insight not found", 404);
    await db.insight.update({ where: { id }, data: { isDismissed: true } });
    return ok({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
