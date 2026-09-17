import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import { DEMO_EMAIL, DEMO_FULL_NAME, DEMO_USER_ID } from "@/lib/demo-user";
import { NextResponse } from "next/server";

/**
 * GDPR export + analytics transactions CSV (round 9 — live-shape parity).
 *
 * Two formats, both live-probed 2026-09-17:
 *
 *  1. `GET /api/export` (default) — the live GDPR JSON:
 *     `{ user: {id, email, full_name, exportDate}, data: { expenses, income,
 *     savings_goals, investments, bank_accounts }, summary: {total_*} }` with
 *     snake_case fields, decimal amounts, `title` for display names, lowercase
 *     categories, Z-less microsecond `created_date`/`updated_date` and
 *     `last_updated` keeping its Z. Live does NOT export budgets or settings.
 *     Filename: `finara-export-<email>-<date>.json`.
 *
 *  2. `GET /api/export?type=transactions` — the live Analytics Export CSV:
 *     all-quoted `"Date","Description","Category","Subcategory","Amount","Type"`
 *     rows for every expense (date-only), income source (created-timestamp),
 *     and investment (current price × shares), grouped expenses → income →
 *     investments, amounts as raw decimals ("4.5", "5000").
 */

/** "2026-09-15T02:04:11.612000" — Z-less, milliseconds padded to microseconds (live shape). */
function microStamp(date: Date): string {
  return `${date.toISOString().slice(0, 23)}000`;
}

/** "2026-09-15" — the live expense/target dates are date-only strings. */
function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Raw decimal string ("4.5", "5000") — the live CSV carries unformatted numbers. */
function decimalString(minor: number): string {
  return String(minor / 100);
}

function csvRow(values: string[]): string {
  return values.map((value) => `"${value.replace(/"/g, '""')}"`).join(",");
}

export async function GET(request: Request) {
  try {
    const type = new URL(request.url).searchParams.get("type");

    const [accounts, incomeSources, expenses, goals, investments] = await Promise.all([
      db.account.findMany({ orderBy: { createdAt: "asc" } }),
      db.incomeSource.findMany({ orderBy: { createdAt: "asc" } }),
      db.expense.findMany({ orderBy: { date: "desc" } }),
      db.goal.findMany({ orderBy: { createdAt: "asc" } }),
      db.investment.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    if (type === "transactions") {
      const lines = [csvRow(["Date", "Description", "Category", "Subcategory", "Amount", "Type"])];
      for (const expense of expenses) {
        lines.push(
          csvRow([
            dateOnly(expense.date),
            expense.description,
            expense.category.toLowerCase(),
            expense.subcategory,
            decimalString(expense.amountMinor),
            "Expense",
          ]),
        );
      }
      for (const income of incomeSources) {
        lines.push(
          csvRow([
            microStamp(income.createdAt),
            income.name,
            income.category,
            "",
            decimalString(income.amountMinor),
            "Income",
          ]),
        );
      }
      for (const investment of investments) {
        lines.push(
          csvRow([
            microStamp(investment.createdAt),
            `${investment.symbol} - ${investment.name}`,
            investment.sector.toLowerCase(),
            investment.type,
            decimalString(Math.round(investment.currentPriceMinor * investment.shares)),
            "Investment",
          ]),
        );
      }
      return new NextResponse(lines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="financial-report-${dateOnly(new Date())}.csv"`,
        },
      });
    }

    const byline = { created_by_id: DEMO_USER_ID, created_by: DEMO_EMAIL, is_sample: false };
    const payload = {
      user: {
        id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        full_name: DEMO_FULL_NAME,
        exportDate: new Date().toISOString(),
      },
      data: {
        expenses: expenses.map((expense) => ({
          date: dateOnly(expense.date),
          amount: expense.amountMinor / 100,
          notes: expense.notes ?? "",
          title: expense.description,
          category: expense.category.toLowerCase(),
          subcategory: expense.subcategory,
          is_recurring: expense.recurring,
          id: expense.id,
          created_date: microStamp(expense.createdAt),
          updated_date: microStamp(expense.updatedAt),
          ...byline,
        })),
        income: incomeSources.map((income) => ({
          amount: income.amountMinor / 100,
          is_active: income.active,
          category: income.category,
          source_name: income.name,
          frequency: income.frequency,
          id: income.id,
          created_date: microStamp(income.createdAt),
          updated_date: microStamp(income.updatedAt),
          ...byline,
        })),
        savings_goals: goals.map((goal) => ({
          current_amount: goal.currentAmountMinor / 100,
          target_amount: goal.targetAmountMinor / 100,
          is_active: true,
          target_date: goal.deadline ? dateOnly(goal.deadline) : "",
          title: goal.name,
          category: goal.category ?? "other",
          priority: goal.priority,
          id: goal.id,
          created_date: microStamp(goal.createdAt),
          updated_date: microStamp(goal.updatedAt),
          ...byline,
        })),
        investments: investments.map((investment) => ({
          shares: investment.shares,
          symbol: investment.symbol,
          portfolio_percentage: investment.portfolioPercent ?? 0,
          investment_type: investment.type,
          last_updated: investment.updatedAt.toISOString(),
          name: investment.name,
          purchase_price: investment.avgPriceMinor / 100,
          current_price: investment.currentPriceMinor / 100,
          sector: investment.sector.toLowerCase(),
          id: investment.id,
          created_date: microStamp(investment.createdAt),
          updated_date: microStamp(investment.updatedAt),
          ...byline,
        })),
        bank_accounts: accounts.map((account) => ({
          bank_name: account.institution,
          account_type: account.type,
          manual_balance: account.balanceMinor / 100,
          last_updated: account.lastSyncedAt.toISOString(),
          account_name: account.name,
          id: account.id,
          created_date: microStamp(account.createdAt),
          updated_date: microStamp(account.updatedAt),
          ...byline,
        })),
      },
      summary: {
        total_expenses: expenses.length,
        total_income_sources: incomeSources.length,
        total_goals: goals.length,
        total_investments: investments.length,
        total_accounts: accounts.length,
      },
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="finara-export-${DEMO_EMAIL}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export const dynamic = "force-dynamic";
