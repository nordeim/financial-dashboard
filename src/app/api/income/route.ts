import { db } from "@/lib/db";
import {
  errorResponse,
  fail,
  ok,
  requireIsoDate,
  requireNonNegativeInt,
  requireString,
  safeJson,
} from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";
import type { IncomeSourceDto } from "@/lib/types";

function toDto(source: {
  id: string;
  name: string;
  amountMinor: number;
  frequency: string;
  active: boolean;
  nextPaymentDate: Date | null;
}): IncomeSourceDto {
  return {
    id: source.id,
    name: source.name,
    amountMinor: source.amountMinor,
    frequency: source.frequency,
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
  active?: unknown;
  nextPaymentDate?: unknown;
}

const FREQUENCIES = new Set(["monthly", "biweekly", "weekly", "one-time"]);

export async function POST(request: Request) {
  try {
    const body = await safeJson<IncomePayload>(request);
    if (!body) return errorResponse(new Error("Invalid JSON body"));
    const name = requireString(body.name, "Name");
    const amountMinor = requireNonNegativeInt(body.amountMinor, "Amount");
    const frequency = requireString(body.frequency, "Frequency", 20);
    if (!FREQUENCIES.has(frequency)) {
      return fail("Frequency must be one of monthly, biweekly, weekly, one-time", 400);
    }
    const nextPaymentDate = body.nextPaymentDate ? requireIsoDate(body.nextPaymentDate, "Next payment date") : null;
    const created = await db.incomeSource.create({
      data: { name, amountMinor, frequency, active: body.active !== false, nextPaymentDate },
    });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
