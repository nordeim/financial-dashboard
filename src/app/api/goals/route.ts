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
import { GOAL_PRIORITIES, normalizeGoalCategory } from "@/lib/categories";
import { ensureSeeded } from "@/lib/seed";

function toDto(goal: {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  deadline: Date | null;
  category: string | null;
  priority: string;
}) {
  return {
    id: goal.id,
    name: goal.name,
    targetAmountMinor: goal.targetAmountMinor,
    currentAmountMinor: goal.currentAmountMinor,
    deadline: goal.deadline?.toISOString() ?? null,
    category: goal.category,
    priority: goal.priority,
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
  priority?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await safeJson<GoalPayload>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const name = requireString(body.name, "Name");
    const targetAmountMinor = requireSignedInt(body.targetAmountMinor, "Target amount");
    const currentAmountMinor =
      body.currentAmountMinor === undefined ? 0 : requireSignedInt(body.currentAmountMinor, "Current amount");
    // No current-vs-target validation (round-11 live probe: a 0-current goal
    // with a -500 target saved fine; progress may also overshoot the target
    // via Add Progress — the card renders Complete at 150.0%).
    const deadline = body.deadline ? requireIsoDate(body.deadline, "Deadline") : null;
    const priority =
      typeof body.priority === "string" && GOAL_PRIORITIES.some((option) => option.id === body.priority)
        ? body.priority
        : "medium";
    const created = await db.goal.create({
      data: {
        name,
        targetAmountMinor,
        currentAmountMinor,
        deadline,
        category: normalizeGoalCategory(typeof body.category === "string" ? body.category : null),
        priority,
      },
    });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
