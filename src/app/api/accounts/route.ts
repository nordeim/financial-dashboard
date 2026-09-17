import { db } from "@/lib/db";
import {
  errorResponse,
  fail,
  ok,
  requireSignedInt,
  requireString,
  safeJson,
} from "@/lib/api";
import { ACCOUNT_TYPES, normalizeAccountType } from "@/lib/categories";
import { ensureSeeded } from "@/lib/seed";
import type { AccountDto } from "@/lib/types";

function toDto(account: {
  id: string;
  name: string;
  type: string;
  institution: string;
  balanceMinor: number;
  currency: string;
  lastSyncedAt: Date;
}): AccountDto {
  return {
    id: account.id,
    name: account.name,
    type: normalizeAccountType(account.type),
    institution: account.institution,
    balanceMinor: account.balanceMinor,
    currency: account.currency,
    lastSyncedAt: account.lastSyncedAt.toISOString(),
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const accounts = await db.account.findMany({ orderBy: { createdAt: "asc" } });
    return ok(accounts.map(toDto));
  } catch (error) {
    return errorResponse(error);
  }
}

interface AccountPayload {
  name?: unknown;
  type?: unknown;
  institution?: unknown;
  balanceMinor?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await safeJson<AccountPayload>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const name = requireString(body.name, "Name");
    const type = normalizeAccountType(requireString(body.type, "Type", 20).toLowerCase());
    if (!ACCOUNT_TYPES.some((option) => option.id === type)) {
      return fail("Type must be one of checking, savings, credit-card, investment, other", 400);
    }
    const institution = requireString(body.institution, "Institution");
    const balanceMinor = requireSignedInt(body.balanceMinor, "Balance");
    const created = await db.account.create({ data: { name, type, institution, balanceMinor } });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
