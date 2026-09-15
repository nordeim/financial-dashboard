import { db } from "@/lib/db";
import { errorResponse, fail, ok } from "@/lib/api";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await db.account.findUnique({ where: { id } });
    if (!existing) return fail("Account not found", 404);
    await db.account.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
