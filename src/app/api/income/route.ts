import { db } from "@/lib/db";
import {
  errorResponse,
  fail,
  ok,
  requireIsoDate,
  requireSignedInt,
  requireString,
  safeJson,
} from "@/lib/api";
import { INCOME_CATEGORIES, INCOME_FREQUENCIES } from "@/lib/categories";
import { ensureSeeded } from "@/lib/seed";
import type { IncomeSourceDto } from "@/lib/types";

function toDto(source: {
  id: string;
  name: string;
  amountMinor: number;
  frequency: string;
  category: string;
  active: boolean;
  nextPaymentDate: Date | null;
}): IncomeSourceDto {
  return {
    id: source.id,
    name: source.name,
    amountMinor: source.amountMinor,
    frequency: source.frequency,
    category: source.category,
    active: source.active,
    nextPaymentDate: source.nextPaymentDate?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const sources = await db.incomeSource.findMany({ orderBy: { createdAt: "asc" } });
    return ok(sources.map(toDto));
  } catch (error) {
    return errorResponse(error);
  }
}

interface IncomePayload {
  name?: unknown;
  amountMinor?: unknown;
  frequency?: unknown;
  category?: unknown;
  active?: unknown;
  nextPaymentDate?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await safeJson<IncomePayload>(request);
    if (!body) return errorResponse(new Error("Invalid JSON body"));
    const name = requireString(body.name, "Name");
    const amountMinor = requireSignedInt(body.amountMinor, "Amount");
    const frequency = requireString(body.frequency, "Frequency", 20);
    if (!(INCOME_FREQUENCIES as readonly string[]).includes(frequency)) {
      return fail("Frequency must be one of monthly, weekly, biweekly, annual", 400);
    }
    const category =
      typeof body.category === "string" && INCOME_CATEGORIES.some((option) => option.id === body.category)
        ? body.category
        : "primary";
    const nextPaymentDate = body.nextPaymentDate ? requireIsoDate(body.nextPaymentDate, "Next payment date") : null;
    const created = await db.incomeSource.create({
      data: { name, amountMinor, frequency, category, active: body.active !== false, nextPaymentDate },
    });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
