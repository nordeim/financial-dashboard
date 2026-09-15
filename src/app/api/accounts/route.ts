import { db } from "@/lib/db";
import {
  errorResponse,
  fail,
  ok,
  requireNonNegativeInt,
  requireString,
  safeJson,
} from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";
import type { AccountDto } from "@/lib/types";

const ACCOUNT_TYPES = new Set(["checking", "savings", "credit", "investment", "cash"]);

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
    type: account.type,
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
    const type = requireString(body.type, "Type", 20).toLowerCase();
    if (!ACCOUNT_TYPES.has(type)) {
      return fail("Type must be one of checking, savings, credit, investment, cash", 400);
    }
    const institution = requireString(body.institution, "Institution");
    const balanceMinor = requireNonNegativeInt(body.balanceMinor, "Balance");
    const created = await db.account.create({ data: { name, type, institution, balanceMinor } });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
