import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { errorResponse, fail, ok, safeJson } from "@/lib/api";
import { formatMoney, monthlyEquivalent } from "@/lib/money";
import { subcategoryLabel } from "@/lib/categories";
import type { AiChatMessage } from "@/lib/types";

/**
 * AI Coach chat endpoint. The model receives a compact, current financial
 * snapshot so answers stay grounded in the user's real numbers.
 */

interface ChatPayload {
  messages?: { role?: unknown; content?: unknown }[];
}

/** The Settings currency for grounding text (round 9 F6; USD default). */
async function readSettingsCurrency(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: "currency" } });
  return row?.value ?? "USD";
}

async function snapshot(): Promise<string> {
  const currency = await readSettingsCurrency();
  const [expenses, incomeSources, budgets, goals, investments, accounts] = await Promise.all([
    db.expense.findMany({ orderBy: { date: "desc" }, take: 200 }),
    db.incomeSource.findMany({ where: { active: true } }),
    db.budget.findMany({ where: { subcategory: null } }),
    db.goal.findMany(),
    db.investment.findMany(),
    db.account.findMany(),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = expenses.filter((e) => e.date >= monthStart);

  const lines: string[] = [];
  const monthlyIncome = incomeSources.reduce(
    (sum, s) => sum + monthlyEquivalent(s.amountMinor, s.frequency),
    0,
  );
  lines.push(`Monthly income: ${formatMoney(monthlyIncome, { currency })} from ${incomeSources.length} sources (normalized to monthly equivalents).`);
  lines.push(
    incomeSources.map((s) => `  - ${s.name}: ${formatMoney(s.amountMinor, { currency })} (${s.frequency})`).join("\n"),
  );

  const monthlyExpenses = thisMonth.reduce((sum, e) => sum + e.amountMinor, 0);
  lines.push(`Expenses this month: ${formatMoney(monthlyExpenses, { currency })} across ${thisMonth.length} transactions.`);

  const bySubcategory = new Map<string, number>();
  for (const expense of thisMonth) {
    bySubcategory.set(expense.subcategory, (bySubcategory.get(expense.subcategory) ?? 0) + expense.amountMinor);
  }
  const top = Array.from(bySubcategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([subcategory, amount]) => `  - ${subcategoryLabel(subcategory)}: ${formatMoney(amount, { currency })}`);
  lines.push("Top spending categories this month:\n" + top.join("\n"));

  for (const budget of budgets) {
    const spent = thisMonth
      .filter((e) => e.category === budget.category)
      .reduce((sum, e) => sum + e.amountMinor, 0);
    lines.push(
      `Budget ${budget.category}: spent ${formatMoney(spent, { currency })} of ${formatMoney(budget.monthlyLimitMinor, { currency })} limit.`,
    );
  }

  for (const goal of goals) {
    lines.push(
      `Goal "${goal.name}": ${formatMoney(goal.currentAmountMinor, { currency })} of ${formatMoney(goal.targetAmountMinor, { currency })} saved.`,
    );
  }

  const portfolioValue = investments.reduce((sum, h) => sum + Math.round(h.shares * h.currentPriceMinor), 0);
  const costBasis = investments.reduce((sum, h) => sum + Math.round(h.shares * h.avgPriceMinor), 0);
  lines.push(
    `Investments: ${investments.length} holdings, portfolio value ${formatMoney(portfolioValue, { currency })}, ` +
      `total gain ${formatMoney(portfolioValue - costBasis, { currency })}.`,
  );

  const netWorth = accounts.reduce((sum, a) => sum + a.balanceMinor, 0);
  lines.push(`Accounts: ${accounts.length} connected, combined balance ${formatMoney(netWorth, { currency })}.`);

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await safeJson<ChatPayload>(request);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return fail("Body must contain a non-empty messages array", 400);
    }
    const history: AiChatMessage[] = [];
    for (const message of body.messages.slice(-12)) {
      const role = message.role === "assistant" ? "assistant" : "user";
      const content = typeof message.content === "string" ? message.content.slice(0, 2000) : "";
      if (content) history.push({ role, content });
    }
    if (history.length === 0) return fail("No valid messages supplied", 400);

    const context = await snapshot();
    const systemPrompt = [
      "You are Finara's AI financial coach embedded in a personal finance tracker.",
      "Answer concisely (2-6 sentences), reference the user's actual numbers when relevant,",
      "and give one actionable suggestion when appropriate. Never invent figures that are",
      "not derivable from the snapshot below. If data is missing, say so plainly.",
      "",
      "CURRENT FINANCIAL SNAPSHOT:",
      context,
    ].join("\n");

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return fail("The AI coach could not generate a response. Please try again.", 502);
    return ok({ reply });
  } catch (error) {
    console.error("[ai/chat] error:", error);
    return errorResponse(error);
  }
}
