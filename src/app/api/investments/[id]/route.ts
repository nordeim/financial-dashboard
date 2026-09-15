import { db } from "@/lib/db";
import { errorResponse, fail, ok } from "@/lib/api";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await db.investment.findUnique({ where: { id } });
    if (!existing) return fail("Investment not found", 404);
    await db.investment.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
