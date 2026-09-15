import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireNonNegativeInt, safeJson } from "@/lib/api";
import { ACCOUNT_TYPES, normalizeAccountType } from "@/lib/categories";

interface AccountPatch {
  name?: unknown;
  type?: unknown;
  institution?: unknown;
  balanceMinor?: unknown;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await safeJson<AccountPatch>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const existing = await db.account.findUnique({ where: { id } });
    if (!existing) return fail("Account not found", 404);

    if (body.type !== undefined) {
      const type = normalizeAccountType(String(body.type).toLowerCase());
      if (!ACCOUNT_TYPES.some((option) => option.id === type)) {
        return fail("Type must be one of checking, savings, credit-card, investment, other", 400);
      }
      body.type = type;
    }

    const updated = await db.account.update({
      where: { id },
      data: {
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
        type: body.type === undefined ? undefined : String(body.type),
        institution:
          typeof body.institution === "string" && body.institution.trim() ? body.institution.trim() : undefined,
        balanceMinor: body.balanceMinor === undefined ? undefined : requireNonNegativeInt(body.balanceMinor, "Balance"),
        lastSyncedAt: new Date(),
      },
    });
    return ok({
      id: updated.id,
      name: updated.name,
      type: normalizeAccountType(updated.type),
      institution: updated.institution,
      balanceMinor: updated.balanceMinor,
      currency: updated.currency,
      lastSyncedAt: updated.lastSyncedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

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
