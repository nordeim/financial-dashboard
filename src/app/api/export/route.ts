import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import { NextResponse } from "next/server";

/** GDPR-compliant full export: every entity the user owns, in JSON. */
export async function GET() {
  try {
    const [accounts, incomeSources, expenses, budgets, goals, investments, settings] = await Promise.all([
      db.account.findMany({ orderBy: { createdAt: "asc" } }),
      db.incomeSource.findMany({ orderBy: { createdAt: "asc" } }),
      db.expense.findMany({ orderBy: { date: "desc" } }),
      db.budget.findMany(),
      db.goal.findMany({ orderBy: { createdAt: "asc" } }),
      db.investment.findMany({ orderBy: { createdAt: "asc" } }),
      db.setting.findMany(),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      format: "finara-export-v1",
      accounts,
      incomeSources,
      expenses,
      budgets,
      goals,
      investments,
      settings: Object.fromEntries(
        settings
          .filter((row) => row.key !== "_seed_lock" && row.key !== "_seeded")
          .map((row) => [row.key, row.value]),
      ),
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="finara-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const dynamic = "force-dynamic";
