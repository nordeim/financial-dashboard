import { db } from "@/lib/db";
import {
  errorResponse,
  fail,
  ok,
  optionalString,
  requireIsoDate,
  requireNonNegativeInt,
  requireString,
  safeJson,
} from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

function toDto(goal: {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  deadline: Date | null;
  category: string | null;
}) {
  return {
    id: goal.id,
    name: goal.name,
    targetAmountMinor: goal.targetAmountMinor,
    currentAmountMinor: goal.currentAmountMinor,
    deadline: goal.deadline?.toISOString() ?? null,
    category: goal.category,
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const goals = await db.goal.findMany({ orderBy: { createdAt: "asc" } });
    return ok(goals.map(toDto));
  } catch (error) {
    return errorResponse(error);
  }
}

interface GoalPayload {
  name?: unknown;
  targetAmountMinor?: unknown;
  currentAmountMinor?: unknown;
  deadline?: unknown;
  category?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await safeJson<GoalPayload>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const name = requireString(body.name, "Name");
    const targetAmountMinor = requireNonNegativeInt(body.targetAmountMinor, "Target amount");
    const currentAmountMinor =
      body.currentAmountMinor === undefined ? 0 : requireNonNegativeInt(body.currentAmountMinor, "Current amount");
    if (currentAmountMinor > targetAmountMinor) {
      return fail("Current amount cannot exceed the target amount", 400);
    }
    const deadline = body.deadline ? requireIsoDate(body.deadline, "Deadline") : null;
    const created = await db.goal.create({
      data: { name, targetAmountMinor, currentAmountMinor, deadline, category: optionalString(body.category, 60) },
    });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
