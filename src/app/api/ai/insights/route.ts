import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { errorResponse, ok } from "@/lib/api";
import { formatMoney, monthlyEquivalent, percent } from "@/lib/money";
import { subcategoryLabel } from "@/lib/categories";
import { buildInsightDrafts, mergePolishedDrafts, type InsightDraft } from "@/lib/insights";
import { ensureSeeded } from "@/lib/seed";
import type { AiInsightDto, InsightType } from "@/lib/types";

/**
 * Dashboard AI Insights (round 13 redesign — live-probed 2026-09-18).
 *
 * The live app loads insights as PERSISTED records
 * (`TransactionInsight.list("-created_date", 10)` filtered to non-dismissed)
 * and dismisses them with `update(id, { is_dismissed: true })`; generation
 * is an external backend process, not part of the request path. The clone
 * mirrors the mechanics: the GET is a pure list; when the table is
 * completely empty (dismissed records still count), the deterministic
 * drafts are generated (LLM-polished when available), persisted, and
 * listed — so dismissing everything leaves the live's empty state showing
 * and refresh re-lists without regenerating.
 */

/** The Settings currency for grounding text (round 9 F6; USD default). */
async function readSettingsCurrency(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: "currency" } });
  return row?.value ?? "USD";
}

interface InsightFacts {
  drafts: InsightDraft[];
}

async function computeInsightFacts(): Promise<InsightFacts> {
  const currency = await readSettingsCurrency();
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
  const top = Array.from(bySubcategory.entries()).sort((a, b) => b[1] - a[1])[0];
  const topCategory = top ? { label: subcategoryLabel(top[0]), amountMinor: top[1] } : null;

  const budgetNotes = budgets
    .map((budget) => {
      const spent = thisMonth.filter((e) => e.category === budget.category).reduce((sum, e) => sum + e.amountMinor, 0);
      const used = percent(spent, budget.monthlyLimitMinor);
      if (used >= 90) return `${budget.category} budget is ${used.toFixed(0)}% used (${formatMoney(spent, { currency })} of ${formatMoney(budget.monthlyLimitMinor, { currency })}).`;
      return null;
    })
    .filter((note): note is string => note !== null);

  return {
    drafts: buildInsightDrafts({ monthlyIncomeMinor, monthlyExpensesMinor, topCategory, savingsRate, currency, budgetNotes }),
  };
}

function toDto(row: { id: string; insightType: string; title: string; description: string; suggestedAction: string | null; confidenceScore: number; category: string | null }): AiInsightDto {
  const insightType: InsightType =
    row.insightType === "anomaly" || row.insightType === "alert" || row.insightType === "trend" || row.insightType === "opportunity" || row.insightType === "prediction"
      ? row.insightType
      : "trend";
  return {
    id: row.id,
    insightType,
    title: row.title,
    description: row.description,
    suggestedAction: row.suggestedAction ?? undefined,
    confidenceScore: row.confidenceScore,
    category: row.category ?? undefined,
  };
}

export async function GET() {
  try {
    await ensureSeeded();

    // Generate ONCE per database: the atomic unique-key marker makes the
    // generation right exclusive (React StrictMode / concurrent tab double
    // fetches both see an empty table — only the marker winner generates;
    // losers poll briefly for the records). Dismissed records still count
    // as records, so dismissing everything keeps the empty state showing.
    const existing = await db.insight.count();
    if (existing === 0) {
      let wonGeneration = false;
      try {
        await db.setting.create({ data: { key: "_insights_generated", value: new Date().toISOString() } });
        wonGeneration = true;
      } catch {
        // Unique violation — another request is generating right now.
        wonGeneration = false;
      }
      if (wonGeneration) {
        const { drafts } = await computeInsightFacts();
        let polished = drafts;
        // Hermetic gate: the polish is an LLM rewrite (nondeterministic
        // text). The E2E webServer sets FINARA_INSIGHTS_LLM_OFF=1 so the
        // gate stays deterministic; production leaves it unset.
        if (process.env.FINARA_INSIGHTS_LLM_OFF !== "1") {
          try {
            const zai = await ZAI.create();
            const completion = await zai.chat.completions.create({
              messages: [
                {
                  role: "system",
                  content:
                    "You are Finara's AI insights engine for a personal finance dashboard. " +
                    "Rewrite each insight draft into polished, specific, user-facing text (1-2 sentences each). " +
                    "Keep the same order, insight_type, category and confidence_score values; you may add or refine " +
                    "a suggested_action string. Return ONLY a JSON array like " +
                    '[{"insight_type":"...","title":"...","description":"...","suggested_action":"...","category":"..."}] with no markdown fences.',
                },
                { role: "user", content: `DRAFTS:\n${JSON.stringify(drafts)}` },
              ],
              thinking: { type: "disabled" },
            });
            const raw = completion.choices[0]?.message?.content?.trim() ?? "";
            const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
            polished = mergePolishedDrafts(drafts, JSON.parse(stripped));
          } catch (aiError) {
            console.error("[ai/insights] falling back to deterministic drafts:", aiError);
          }
        }
        if (polished.length > 0) {
          await db.insight.createMany({
            data: polished.map((draft) => ({
              insightType: draft.insightType,
              title: draft.title,
              description: draft.description,
              suggestedAction: draft.suggestedAction ?? null,
              confidenceScore: draft.confidenceScore,
              category: draft.category ?? null,
            })),
          });
        }
      } else {
        // A concurrent request won the generation right — wait briefly for
        // its records to land so this response carries them too (the seed's
        // losing-caller poll, bounded).
        for (let attempt = 0; attempt < 40; attempt++) {
          const landed = await db.insight.count();
          if (landed > 0) break;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }

    // Live mechanics: 10 newest records, dismissed filtered out.
    const rows = await db.insight.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
    const insights = rows.filter((row) => !row.isDismissed).map(toDto);
    return ok({ insights });
  } catch (error) {
    return errorResponse(error);
  }
}
