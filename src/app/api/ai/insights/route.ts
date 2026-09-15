import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { errorResponse, ok } from "@/lib/api";
import { formatMoney, monthlyEquivalent, percent } from "@/lib/money";
import { subcategoryLabel } from "@/lib/categories";
import { ensureSeeded } from "@/lib/seed";
import type { AiInsightDto } from "@/lib/types";

/**
 * Dashboard AI Insights — generates up to three grounded, numbered insights
 * from the user's current-month financial facts, then phrases them with the
 * LLM. Falls back to deterministic insight text when the model is unavailable,
 * so the dashboard never renders an empty error state silently.
 */

interface InsightDraft {
  title: string;
  body: string;
  tone: AiInsightDto["tone"];
}

function deterministicInsights(
  monthlyIncomeMinor: number,
  monthlyExpensesMinor: number,
  topCategory: { label: string; amountMinor: number } | null,
  savingsRate: number,
): InsightDraft[] {
  const drafts: InsightDraft[] = [];
  if (monthlyIncomeMinor > 0) {
    drafts.push({
      title: "Savings rate check",
      body: `You are currently saving ${savingsRate.toFixed(1)}% of your income this month. ${
        savingsRate >= 20
          ? "That is at or above the 20% benchmark, keep it up."
          : "The 50/30/20 rule suggests targeting 20%; trimming wants spending is the fastest lever."
      }`,
      tone: savingsRate >= 20 ? "positive" : "neutral",
    });
  }
  if (topCategory) {
    drafts.push({
      title: "Top spending category",
      body: `${topCategory.label} is your largest category at ${formatMoney(topCategory.amountMinor)} this month, ` +
        `${percent(topCategory.amountMinor, monthlyExpensesMinor || 1).toFixed(0)}% of total spending.`,
      tone: "neutral",
    });
  }
  if (monthlyExpensesMinor > monthlyIncomeMinor) {
    drafts.push({
      title: "Spending exceeds income",
      body: `Expenses (${formatMoney(monthlyExpensesMinor)}) exceed income (${formatMoney(monthlyIncomeMinor)}) this month. ` +
        "Review discretionary categories before the month closes.",
      tone: "warning",
    });
  }
  return drafts.slice(0, 3);
}

export async function GET() {
  try {
    await ensureSeeded();
    const [expenses, incomeSources, budgets] = await Promise.all([
      db.expense.findMany({ orderBy: { date: "desc" } }),
      db.incomeSource.findMany({ where: { active: true } }),
      db.budget.findMany({ where: { subcategory: null } }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = expenses.filter((e) => e.date >= monthStart);
    const monthlyIncomeMinor = incomeSources.reduce(
      (sum, s) => sum + monthlyEquivalent(s.amountMinor, s.frequency),
      0,
    );
    const monthlyExpensesMinor = thisMonth.reduce((sum, e) => sum + e.amountMinor, 0);
    const savingsRate = monthlyIncomeMinor > 0 ? ((monthlyIncomeMinor - monthlyExpensesMinor) / monthlyIncomeMinor) * 100 : 0;

    const bySubcategory = new Map<string, number>();
    for (const expense of thisMonth) {
      bySubcategory.set(expense.subcategory, (bySubcategory.get(expense.subcategory) ?? 0) + expense.amountMinor);
    }
    const top = Array.from(bySubcategory.entries())
      .sort((a, b) => b[1] - a[1])[0];
    const topCategory = top ? { label: subcategoryLabel(top[0]), amountMinor: top[1] } : null;

    const budgetNotes = budgets
      .map((budget) => {
        const spent = thisMonth.filter((e) => e.category === budget.category).reduce((sum, e) => sum + e.amountMinor, 0);
        const used = percent(spent, budget.monthlyLimitMinor);
        if (used >= 90) return `${budget.category} budget is ${used.toFixed(0)}% used (${formatMoney(spent)} of ${formatMoney(budget.monthlyLimitMinor)}).`;
        return null;
      })
      .filter((note): note is string => note !== null);

    const drafts = deterministicInsights(monthlyIncomeMinor, monthlyExpensesMinor, topCategory, savingsRate);
    if (budgetNotes.length > 0 && drafts.length < 3) {
      drafts.push({ title: "Budget watch", body: budgetNotes.join(" "), tone: "warning" });
    }

    const facts = [
      `Monthly income: ${formatMoney(monthlyIncomeMinor)}`,
      `Expenses this month: ${formatMoney(monthlyExpensesMinor)}`,
      `Savings rate: ${savingsRate.toFixed(1)}%`,
      topCategory ? `Top category: ${topCategory.label} at ${formatMoney(topCategory.amountMinor)}` : null,
      ...budgetNotes,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    let insights: AiInsightDto[] = drafts.map((draft, index) => ({
      id: `insight-${index + 1}`,
      ...draft,
    }));

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are Finara's AI insights engine for a personal finance dashboard. " +
              "Rewrite each insight draft into polished, specific, user-facing text (1-2 sentences each). " +
              "Keep the same order and tone labels. Return ONLY a JSON array like " +
              '[{"title":"...","body":"...","tone":"positive|neutral|warning"}] with no markdown fences.',
          },
          { role: "user", content: `FACTS:\n${facts}\n\nDRAFTS:\n${JSON.stringify(drafts)}` },
        ],
        thinking: { type: "disabled" },
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(stripped) as { title?: unknown; body?: unknown; tone?: unknown }[];
      const polished = parsed
        .filter((entry) => typeof entry.title === "string" && typeof entry.body === "string")
        .slice(0, 3)
        .map((entry, index): AiInsightDto => {
          const tone: AiInsightDto["tone"] =
            entry.tone === "positive" ? "positive" : entry.tone === "warning" ? "warning" : "neutral";
          return {
            id: `insight-${index + 1}`,
            title: String(entry.title).slice(0, 80),
            body: String(entry.body).slice(0, 400),
            tone,
          };
        });
      if (polished.length > 0) insights = polished;
    } catch (aiError) {
      console.error("[ai/insights] falling back to deterministic insights:", aiError);
    }

    return ok({ insights });
  } catch (error) {
    return errorResponse(error);
  }
}
