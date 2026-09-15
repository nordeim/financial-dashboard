import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireNonNegativeInt, safeJson } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

const CATEGORIES = new Set(["Needs", "Wants", "Savings"]);

export async function GET() {
  try {
    await ensureSeeded();
    const budgets = await db.budget.findMany({ where: { subcategory: null }, orderBy: { category: "asc" } });
    return ok(
      budgets.map((budget) => ({
        id: budget.id,
        category: budget.category,
        subcategory: budget.subcategory,
        monthlyLimitMinor: budget.monthlyLimitMinor,
      })),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

interface BudgetPutPayload {
  budgets?: { category?: unknown; monthlyLimitMinor?: unknown }[];
}

/** Upsert the three category-level budgets in one call. */
export async function PUT(request: Request) {
  try {
    const body = await safeJson<BudgetPutPayload>(request);
    if (!body || !Array.isArray(body.budgets)) return fail("Body must contain a budgets array", 400);
    const parsed = body.budgets.map((entry) => {
      const category = typeof entry.category === "string" ? entry.category : "";
      if (!CATEGORIES.has(category)) {
        throw new ValidationErrorWrapper("Category must be one of Needs, Wants, Savings");
      }
      return { category, monthlyLimitMinor: requireNonNegativeInt(entry.monthlyLimitMinor, "Monthly limit") };
    });
    for (const entry of parsed) {
      const existing = await db.budget.findFirst({ where: { category: entry.category, subcategory: null } });
      if (existing) {
        await db.budget.update({ where: { id: existing.id }, data: { monthlyLimitMinor: entry.monthlyLimitMinor } });
      } else {
        await db.budget.create({ data: { category: entry.category, monthlyLimitMinor: entry.monthlyLimitMinor } });
      }
    }
    const budgets = await db.budget.findMany({ where: { subcategory: null }, orderBy: { category: "asc" } });
    return ok(
      budgets.map((budget) => ({
        id: budget.id,
        category: budget.category,
        subcategory: budget.subcategory,
        monthlyLimitMinor: budget.monthlyLimitMinor,
      })),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

class ValidationErrorWrapper extends Error {}
