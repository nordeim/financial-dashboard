import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { budgetRemainingLabel } from "@/lib/dashboard-kpis";
import { currencySymbol, formatMoney } from "@/lib/money";
import { normalizeFinaraExport } from "@/lib/import-export";

/**
 * Functional-parity contracts (round 9, plan §B F1–F11).
 *
 * Rounds 2–8 pinned static DOM/class parity; round 9 pins BEHAVIOR the live
 * probes established this round:
 *  - Settings propagate app-wide (currency re-formats every money figure,
 *    dateFormat every date — live-probed with EUR + dd/MM/yyyy, persisted).
 *  - The GDPR export emits the live snake_case {user,data,summary} shape with
 *    the email in the filename; the finara-export restore ACCEPTS that shape.
 *  - The analytics Export downloads a live-shaped transactions CSV
 *    (financial-report-<date>.csv), and the From/To date inputs are inert
 *    (live leaves the chart untouched for any range — Bulk-Edit-class quirk).
 *  - The AI coach dialog renders the live raw class orders; its input row is
 *    a div, not a form.
 *  - The import error state is the live full replacement card (border-red-500
 *    card, CircleAlert h-16 w-16, text-xl font-bold title, default-primary
 *    Start New Import).
 *
 * Source contracts (view-surfaces precedent): interaction/browser flows stay
 * with the browser verification pass.
 */

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const src = {
  money: read("src/lib/money.ts"),
  aiCoach: read("src/components/finara/ai-coach-dialog.tsx"),
  dialog: read("src/components/ui/dialog.tsx"),
  importView: read("src/components/finara/import-view.tsx"),
  analyticsView: read("src/components/finara/analytics-view.tsx"),
  exportRoute: read("src/app/api/export/route.ts"),
  settingsView: read("src/components/finara/settings-view.tsx"),
  useApi: read("src/hooks/use-api.ts"),
  dashboardView: read("src/components/finara/dashboard-view.tsx"),
  expensesView: read("src/components/finara/expenses-view.tsx"),
  incomeView: read("src/components/finara/income-view.tsx"),
  accountsView: read("src/components/finara/accounts-view.tsx"),
  investmentsView: read("src/components/finara/investments-view.tsx"),
  goalsView: read("src/components/finara/goals-view.tsx"),
  addTransaction: read("src/components/finara/add-transaction-dialog.tsx"),
};

describe("money: currency helpers (F6/F11)", () => {
  it("exposes currencySymbol with Intl symbols", () => {
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("EUR")).toBe("€");
    expect(currencySymbol("GBP")).toBe("£");
    expect(currencySymbol("JPY")).toBe("¥");
  });

  it("formatMoney keeps USD formatting identical", () => {
    expect(formatMoney(499550)).toBe("$4,995.50");
    expect(formatMoney(450)).toBe("$4.50");
  });

  it("formatMoney renders EUR with the € symbol (live-probed shape)", () => {
    expect(formatMoney(499550, { currency: "EUR" })).toBe("€4,995.50");
    expect(formatMoney(450, { currency: "EUR" })).toBe("€4.50");
  });

  it("formatMoneyCompact is retired (live uses full money on BOTH chart axes — F11)", () => {
    expect(src.money).not.toContain("formatMoneyCompact");
  });
});

describe("dashboard-kpis: budget labels follow the currency (F6)", () => {
  it("budgetRemainingLabel accepts a currency", () => {
    expect(budgetRemainingLabel(10000, 4000, "EUR")).toBe("€40.00 remaining");
    expect(budgetRemainingLabel(10000, 2500, "EUR")).toBe("€25.00 remaining");
    expect(budgetRemainingLabel(10000, -500, "EUR")).toBe("€5.00 over budget");
  });

  it("budgetRemainingLabel keeps the USD default (limit-0 semantics unchanged)", () => {
    expect(budgetRemainingLabel(0, 0)).toBe("$0.00 remaining");
    expect(budgetRemainingLabel(10000, 4000)).toBe("$40.00 remaining");
  });
});

describe("import-export: the live GDPR export shape normalizes (F9)", () => {
  const liveExport = {
    user: { id: "u1", email: "demo@example.com", full_name: "demo", exportDate: "2026-09-17T00:00:00Z" },
    data: {
      expenses: [
        {
          date: "2026-09-15", amount: 4.5, notes: "", title: "Coffee", category: "wants",
          subcategory: "dining", is_recurring: false, id: "e1",
          created_date: "2026-09-15T02:02:36.998000", updated_date: "2026-09-15T02:02:36.998000",
          created_by_id: "u1", created_by: "demo@example.com", is_sample: false,
        },
      ],
      income: [
        {
          amount: 5000, is_active: true, category: "primary", source_name: "Salary",
          frequency: "monthly", id: "i1", created_date: "2026-09-15T02:04:11.612000",
          updated_date: "2026-09-15T02:04:11.612000", created_by_id: "u1",
          created_by: "demo@example.com", is_sample: false,
        },
      ],
      savings_goals: [
        {
          current_amount: 2500, target_amount: 10000, is_active: true,
          target_date: "2027-09-16", title: "Emergency Fund", category: "emergency",
          priority: "high", id: "g1", created_date: "2026-09-15T02:06:58.786000",
          updated_date: "2026-09-15T02:07:37.896000", created_by_id: "u1",
          created_by: "demo@example.com", is_sample: false,
        },
      ],
      investments: [
        {
          shares: 10, symbol: "AAPL", portfolio_percentage: 0, investment_type: "stock",
          last_updated: "2026-09-15T04:44:56.978Z", name: "Apple Inc.", purchase_price: 150,
          current_price: 175, sector: "technology", id: "v1",
          created_date: "2026-09-15T04:44:57.114000", updated_date: "2026-09-15T04:44:57.114000",
          created_by_id: "u1", created_by: "demo@example.com", is_sample: false,
        },
      ],
      bank_accounts: [
        {
          bank_name: "Chase", account_type: "checking", manual_balance: 3200,
          last_updated: "2026-09-15T02:11:41.997Z", account_name: "Main Checking",
          id: "a1", created_date: "2026-09-15T02:11:42.618000",
          updated_date: "2026-09-15T02:11:42.618000", created_by_id: "u1",
          created_by: "demo@example.com", is_sample: false,
        },
      ],
    },
    summary: {
      total_expenses: 1, total_income_sources: 1, total_goals: 1,
      total_investments: 1, total_accounts: 1,
    },
  };

  it("maps the snake_case live shape onto insert rows (title→description, decimals→minor, lowercase categories)", () => {
    const normalized = normalizeFinaraExport(liveExport);
    expect(normalized.errors).toEqual([]);
    expect(normalized.expenses).toHaveLength(1);
    expect(normalized.expenses[0]).toMatchObject({
      description: "Coffee",
      amountMinor: 450,
      category: "Wants",
      subcategory: "dining",
      recurring: false,
    });
    expect(normalized.incomeSources[0]).toMatchObject({
      name: "Salary",
      amountMinor: 500000,
      frequency: "monthly",
      category: "primary",
      active: true,
    });
    expect(normalized.goals[0]).toMatchObject({
      name: "Emergency Fund",
      targetAmountMinor: 1000000,
      currentAmountMinor: 250000,
      category: "emergency",
      priority: "high",
    });
    expect(normalized.accounts[0]).toMatchObject({
      name: "Main Checking",
      type: "checking",
      institution: "Chase",
      balanceMinor: 320000,
    });
  });

  it("normalizes the live investments collection (F9 — restorable)", () => {
    const normalized = normalizeFinaraExport(liveExport);
    expect(normalized.investments).toHaveLength(1);
    expect(normalized.investments[0]).toMatchObject({
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "stock",
      shares: 10,
      avgPriceMinor: 15000,
      currentPriceMinor: 17500,
      sector: "technology",
    });
  });

  it("still accepts the legacy clone camelCase shape (back-compat)", () => {
    const legacy = {
      expenses: [{ description: "Bus", amountMinor: 300, category: "Needs", subcategory: "other", date: "2026-01-01" }],
      incomeSources: [{ name: "Freelance", amountMinor: 20000, frequency: "monthly", category: "secondary", active: true }],
    };
    const normalized = normalizeFinaraExport(legacy);
    expect(normalized.errors).toEqual([]);
    expect(normalized.expenses[0]?.description).toBe("Bus");
    expect(normalized.incomeSources[0]?.name).toBe("Freelance");
  });
});

describe("source contracts: AI coach dialog (F1)", () => {
  it("renders the live card literal via the cardClassName passthrough", () => {
    expect(src.dialog).toContain("cardClassName?: string");
    expect(src.aiCoach).toContain(
      'cardClassName="rounded-xl border text-card-foreground shadow w-full max-w-2xl h-[80vh] bg-white dark:bg-gray-800 flex flex-col"',
    );
  });

  it("renders the live body-wrapper and message-row orders", () => {
    expect(src.aiCoach).toContain('className="p-6 pt-0 flex-1 flex flex-col min-h-0"');
    expect(src.aiCoach).toContain('className="flex gap-3 justify-end"');
    expect(src.aiCoach).toContain('className="flex gap-3 justify-start"');
    expect(src.aiCoach).toContain('className="max-w-[85%] flex flex-col items-end"');
    expect(src.aiCoach).toContain('className="rounded-2xl px-4 py-2.5 bg-slate-800 dark:bg-slate-600 text-white"');
    expect(src.aiCoach).toContain(
      'className="rounded-2xl px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"',
    );
    expect(src.aiCoach).toContain('className="mt-4 mb-4"');
  });

  it("renders the input row as a live div (not a form)", () => {
    expect(src.aiCoach).toContain('className="flex gap-2 mt-4"');
    expect(src.aiCoach).not.toContain("<form");
    expect(src.aiCoach).toContain("onKeyDown");
  });
});

describe("source contracts: import view (F3/F4/F5)", () => {
  it("renders the upload label through the Label primitive (base + indigo tail)", () => {
    expect(src.importView).toContain("from \"@/components/ui/label\"");
    expect(src.importView).toMatch(/<Label[^>]*className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"/);
    expect(src.importView).not.toContain('<label');
  });

  it("renders the live replacement error card anatomy", () => {
    expect(src.importView).toContain("border-red-500");
    expect(src.importView).toContain("flex flex-col items-center justify-center p-8");
    expect(src.importView).toContain('className="h-16 w-16 text-red-500"');
    expect(src.importView).toContain('className="mt-4 text-xl font-bold"');
    expect(src.importView).toContain("An Error Occurred");
    expect(src.importView).toContain('className="mt-2 text-neutral-500"');
    expect(src.importView).toContain('className="h-9 px-4 py-2 mt-6"');
    expect(src.importView).toContain("Start New Import");
  });

  it("retires the round-4 red-50 error box", () => {
    expect(src.importView).not.toContain("border-red-200 bg-red-50");
    expect(src.importView).not.toContain("text-red-700");
  });
});

describe("source contracts: analytics (F7/F8/F11)", () => {
  it("downloads the live transactions CSV with the live filename", () => {
    expect(src.analyticsView).toContain("/api/export?type=transactions");
    expect(src.analyticsView).toContain("financial-report-");
    expect(src.analyticsView).not.toContain("finara-analytics.csv");
    expect(src.analyticsView).not.toContain("Month,Income,Expenses,Net Savings");
  });

  it("keeps the From/To inputs inert (no trend filtering — live quirk)", () => {
    expect(src.analyticsView).not.toContain("fromDate");
    expect(src.analyticsView).not.toContain("toDate");
    expect(src.analyticsView).not.toContain("monthLabelToNumber");
    expect(src.analyticsView).toContain('placeholder="Start date"');
    expect(src.analyticsView).toContain('placeholder="End date"');
  });

  it("formats BOTH chart axes with full formatMoney (F11) and drops the compact import", () => {
    expect(src.analyticsView).not.toContain("formatMoneyCompact");
    const tickFormatters = src.analyticsView.match(/tickFormatter=\{[^}]*\}/g) ?? [];
    expect(tickFormatters.length).toBeGreaterThanOrEqual(2);
    for (const tick of tickFormatters) {
      expect(tick).toContain("formatMoney");
    }
  });
});

describe("source contracts: export route (F7/F9)", () => {
  it("serves the live transactions CSV shape", () => {
    expect(src.exportRoute).toContain('"Date","Description","Category","Subcategory","Amount","Type"');
    expect(src.exportRoute).toContain("type=transactions");
  });

  it("emits the live GDPR shape (user/data/summary, snake_case, 5 collections)", () => {
    expect(src.exportRoute).toContain("exportDate");
    expect(src.exportRoute).toContain("full_name");
    expect(src.exportRoute).toContain("savings_goals");
    expect(src.exportRoute).toContain("bank_accounts");
    expect(src.exportRoute).toContain("total_income_sources");
    expect(src.exportRoute).toContain("created_by");
  });

  it("names the GDPR file with the account email", () => {
    expect(src.settingsView).toContain("finara-export-${");
  });
});

describe("source contracts: settings propagation (F6)", () => {
  it("exposes a useSettings hook", () => {
    expect(src.useApi).toContain("useSettings");
    expect(src.useApi).toContain('"/api/settings"');
  });

  it("AI routes ground their facts in the settings currency (no $ leak under EUR)", () => {
    const insights = read("src/app/api/ai/insights/route.ts");
    const chat = read("src/app/api/ai/chat/route.ts");
    for (const source of [insights, chat]) {
      expect(source).toContain("readSettingsCurrency");
      const bareCalls = source.match(/formatMoney\([^,)]+\)/g) ?? [];
      expect(bareCalls).toEqual([]);
    }
  });

  const viewSources: [string, string][] = [
    ["dashboard", src.dashboardView],
    ["expenses", src.expensesView],
    ["income", src.incomeView],
    ["accounts", src.accountsView],
    ["investments", src.investmentsView],
    ["goals", src.goalsView],
    ["analytics", src.analyticsView],
  ];

  it.each(viewSources)("%s view consumes useSettings", (_name, source) => {
    expect(source).toContain("useSettings");
  });

  it("expenses rows format dates through the settings dateFormat", () => {
    expect(src.expensesView).not.toContain('"MM/dd/yyyy"');
    expect(src.expensesView).toContain("dateFormat");
  });

  it("quick-amount chips follow the currency (expense code, income symbol)", () => {
    expect(src.addTransaction).toContain("+ {currency}{units}");
    expect(src.addTransaction).toContain("+{symbol}");
    expect(src.addTransaction).not.toContain("+ USD{units}");
  });
});

describe("theme lifecycle (round 10 F1/F3 — live-probed sign-out/sign-in/toggle flows)", () => {
  const themeModule = read("src/components/finara/theme.ts");
  const finaraApp = read("src/components/finara/finara-app.tsx");
  const sidebar = read("src/components/finara/sidebar.tsx");
  const settingsRoute = read("src/app/api/settings/route.ts");
  const schema = read("prisma/schema.prisma");
  const globals = read("src/app/globals.css");

  it("theme.ts exposes resetTheme() that applies light and clears the stored key (live sign-out semantics)", () => {
    expect(themeModule).toContain("export function resetTheme");
    // the reset must remove the persisted key and apply light in-memory,
    // WITHOUT re-persisting (the live key stays absent until the next toggle)
    expect(themeModule).toMatch(/function resetTheme[\s\S]*?localStorage\.removeItem\(STORAGE_KEY\)/);
    expect(themeModule).toMatch(/function resetTheme[\s\S]*?applyThemeClass\("light"\)/);
  });

  it("handleSignOut resets the theme (single seam covers user-menu + mobile-drawer paths)", () => {
    expect(finaraApp).toMatch(/handleSignOut[\s\S]{0,400}resetTheme\(\)/);
  });

  it("handleSignIn applies the fetched server theme (live User.theme hydration)", () => {
    expect(finaraApp).toMatch(/handleSignIn[\s\S]{0,900}\/api\/settings/);
    expect(finaraApp).toMatch(/handleSignIn[\s\S]{0,900}setTheme/);
  });

  it("both theme toggle call sites persist the theme server-side (fire-and-forget PUT)", () => {
    // The two ARROW call sites (user-menu item + mobile top-bar button); the
    // function definition line does not match this pattern.
    const toggleSites = sidebar.match(/=> toggleThemeAndPersist\(\)/g) ?? [];
    expect(toggleSites.length).toBe(2);
    expect(sidebar).toMatch(/function toggleThemeAndPersist[\s\S]*?toggleTheme\(\)/);
    expect(sidebar).toMatch(/function toggleThemeAndPersist[\s\S]*?\/api\/settings/);
  });

  it("the settings API round-trips the theme with enum validation and a light default", () => {
    expect(settingsRoute).toMatch(/theme:\s*"light"/);
    expect(settingsRoute).toMatch(/[\"']light[\"'],\s*[\"']dark[\"']/);
    expect(settingsRoute).toMatch(/body\.theme/);
  });

  it("the mobile menu icon swaps Menu↔X with the drawer (live: lucide-menu ⇄ lucide-x w-5 h-5)", () => {
    expect(sidebar).toMatch(/menuOpen\s*\?\s*<X className="w-5 h-5"/);
    expect(sidebar).toMatch(/<Menu className="w-5 h-5"/);
  });

  it("globals.css carries the corrected neutral primary tokens (round-10 variable-level probe)", () => {
    expect(globals).toMatch(/--primary:\s*#171717;/);
    expect(globals).toMatch(/--primary-foreground:\s*#fafafa;/);
    expect(globals).toMatch(/--ring:\s*#d4d4d4;/);
    expect(globals).toMatch(/--destructive:\s*#7f1d1d;/);
    expect(globals).toMatch(/--destructive-foreground:\s*#fafafa;/);
  });
});

describe("round 11 F1: chart tooltip style (live renders a borderless ghost tooltip)", () => {
  it("replicates the live's effective rendering: transparent bg, NO border, inherited text", () => {
    // Corrected round-11 evidence (computed-style probe + pixel crop, both
    // themes): the live's tokens are raw HSL triples (Tailwind v3
    // convention), so its inline var() color refs are defined-but-INVALID —
    // background computes transparent, the border SHORTHAND invalidates
    // entirely (computed style none / width 0 — no border renders), and
    // color inherits. The live tooltip is a pure borderless text overlay
    // (#fafafa text on dark, #0a0a0a on light, 8px radius, 16px font).
    // The clone replicates that effective rendering directly.
    expect(src.analyticsView).toContain('backgroundColor: "transparent"');
    expect(src.analyticsView).toContain('border: "none"');
    expect(src.analyticsView).toContain("borderRadius: 8");
    expect(src.analyticsView).not.toContain('color: "var(--foreground');
    expect(src.analyticsView).not.toContain('backgroundColor: "var(--background');
  });

  it("drops the old hardcoded slate border, radius 12 and fontSize 12", () => {
    expect(src.analyticsView).not.toContain("#E2E8F0");
    expect(src.analyticsView).not.toContain("borderRadius: 12");
    expect(src.analyticsView).not.toContain("fontSize: 12");
  });

  it("renders exactly ONE legend — the Overview chart, bare, no icon override (round-11 probe)", () => {
    // Live legend census: Overview 1 legend (16px inherited, default icon);
    // Expenses tab 0/2 charts; Investments tab 0/1 chart.
    expect(src.analyticsView.match(/<Legend/g)?.length ?? 0).toBe(1);
    expect(src.analyticsView).toContain("<Legend />");
    expect(src.analyticsView).not.toContain("iconType");
    expect(src.analyticsView).not.toContain("wrapperStyle");
  });
});

describe("round 11 F2: negative-amount acceptance (live accepts at every layer)", () => {
  const filtersPanel = read("src/components/finara/expense-filters-panel.tsx");
  const apiLib = read("src/lib/api.ts");
  const routes = {
    accounts: read("src/app/api/accounts/route.ts"),
    accountsId: read("src/app/api/accounts/[id]/route.ts"),
    budgets: read("src/app/api/budgets/route.ts"),
    expenses: read("src/app/api/expenses/route.ts"),
    expensesId: read("src/app/api/expenses/[id]/route.ts"),
    goals: read("src/app/api/goals/route.ts"),
    goalsId: read("src/app/api/goals/[id]/route.ts"),
    income: read("src/app/api/income/route.ts"),
    incomeId: read("src/app/api/income/[id]/route.ts"),
    investments: read("src/app/api/investments/route.ts"),
    investmentsId: read("src/app/api/investments/[id]/route.ts"),
  };

  it("numeric inputs carry no min attribute (live: no min on any form)", () => {
    const viewSources: [string, string][] = [
      ["accountsView", src.accountsView],
      ["addTransaction", src.addTransaction],
      ["filtersPanel", filtersPanel],
      ["goalsView", src.goalsView],
      ["incomeView", src.incomeView],
      ["investmentsView", src.investmentsView],
    ];
    for (const [name, source] of viewSources) {
      expect(source, name).not.toContain('min="0"');
    }
  });

  it("toMinorUnits converts negatives instead of throwing", () => {
    expect(src.money).not.toContain("parsed < 0");
  });

  it("the API guards are signed (requireSignedInt/requireFiniteNumber), not non-negative", () => {
    expect(apiLib).toContain("export function requireSignedInt");
    expect(apiLib).toContain("export function requireFiniteNumber");
    expect(apiLib).not.toContain("requireNonNegativeInt");
    expect(apiLib).not.toContain("requirePositiveNumber");
  });

  it("every amount route validates through the signed guards", () => {
    for (const [name, source] of Object.entries(routes)) {
      expect(source, name).not.toContain("requireNonNegativeInt");
      expect(source, name).not.toContain("requirePositiveNumber");
    }
    expect(routes.expensesId).not.toContain(">= 0");
  });

  it("investment form matches the live attrs: shares step 0.01, optional current price, portfolio step 0.1", () => {
    const shares = src.investmentsView.match(/id="shares"[\s\S]{0,220}/)?.[0] ?? "";
    expect(shares).toContain('step="0.01"');
    const current = src.investmentsView.match(/id="current_price"[\s\S]{0,260}/)?.[0] ?? "";
    expect(current).not.toContain("required");
    const portfolio = src.investmentsView.match(/id="portfolio_percentage"[\s\S]{0,240}/)?.[0] ?? "";
    expect(portfolio).toContain('step="0.1"');
  });

  it("goal POST applies no current-vs-target validation (live: 0 current with -500 target saved)", () => {
    const goalsRoute = read("src/app/api/goals/route.ts");
    expect(goalsRoute).not.toContain("cannot exceed");
    expect(goalsRoute).not.toContain("currentAmountMinor > targetAmountMinor");
  });

  it("goal PATCH never caps contributions (live: 150 current on a 100 target renders Complete 150.0%)", () => {
    const goalsIdRoute = read("src/app/api/goals/[id]/route.ts");
    expect(goalsIdRoute).not.toContain("Math.min");
  });

  it("negative progress contributions stay a silent no-op (live: PUT 200, current unchanged)", () => {
    const goalsIdRoute = read("src/app/api/goals/[id]/route.ts");
    expect(goalsIdRoute).toContain("contribution > 0");
  });

  it("goal Complete state: progress-based emerald badge + card ring; Add Progress removed (live re-probe at 100% and 150%)", () => {
    // Round-11 corrected evidence (post-reload, settled server state — the
    // earlier "button stays enabled" reading came from a transient pre-refresh
    // DOM): at progress >= 100 the live card gains
    // ring-2 ring-emerald-200 dark:ring-emerald-700, the badge row gains a
    // default-variant Badge with the emerald palette + lucide circle-check-big
    // w-3 h-3 mr-1 icon, and the Add Progress button is REMOVED entirely.
    expect(src.goalsView).toContain("const complete = progress >= 100;");
    expect(src.goalsView).toContain(
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-100"
    );
    expect(src.goalsView).toContain("CircleCheckBig");
    expect(src.goalsView).toContain('"w-3 h-3 mr-1"');
    expect(src.goalsView).toContain("ring-2 ring-emerald-200 dark:ring-emerald-700");
    expect(src.goalsView).toContain("{!complete && (");
    expect(src.goalsView).not.toContain("disabled={complete}");
    expect(src.goalsView).not.toContain("Goal reached");
  });

  it("investment submit has no positivity gate; empty current price falls back to 0; portfolio % passes through", () => {
    expect(src.investmentsView).not.toContain("must be positive");
    expect(src.investmentsView).not.toMatch(/!\(shares > 0\)/);
    expect(src.investmentsView).toMatch(/form\.currentPrice\s*\?/);
    expect(src.investmentsView).not.toContain("portfolioPercent != null && portfolioPercent > 0");
  });
});

describe("round 12: login-surface title contract (live-probed — round-8 left the login title unprobed)", () => {
  const app = read("src/components/finara/finara-app.tsx");

  it("unauthenticated deep links apply the login ROUTE, not just the URL rewrite (title follows)", () => {
    // Live probe 2026-09-17 (captures/r12): loading /Goals or any deep link
    // logged out redirects to /login?from_url=… AND titles the page bare
    // "Finara" — the source app's login surface always carries the bare
    // title. The clone's redirect effect only rewrote the URL, leaving the
    // deep-link title ("Goals | Finara") in place. The render-time
    // adjustment (the documented guarded-setState pattern) keeps the route
    // and title truthful.
    expect(app).toContain('route.kind !== "login" && !readSessionCache()');
    expect(app).toContain('applyRoute(parseRoute("/login"))');
    // The title itself is synced post-commit (the App Router hydrates <title>
    // from the React tree and resets render-phase document.title writes).
    expect(app).toContain('document.title = route.title;');
  });

  it("the redirect effect re-arms on route changes so browser-back re-gates like the live", () => {
    expect(app).toMatch(/\}, \[session, route\]\);/);
  });
});

describe("round 12: import route accepts signed amounts (ADR-024 layer missed by round 11)", () => {
  it("the rows-mode amount validation keeps the integer guard but drops the negativity rejection", () => {
    const importRoute = read("src/app/api/import/route.ts");
    expect(importRoute).not.toContain("amountMinor < 0");
    expect(importRoute).toContain("Number.isInteger");
  });
});

describe("round 12: the FAB stays clickable while its chooser is open (live-probed)", () => {
  it("the Quick Add chooser renders NON-MODAL — no Radix body pointer-events lock", () => {
    // Live probe (captures/r12): with the chooser open, elementFromPoint at
    // the FAB's center resolves INSIDE the FAB (z-50 stays above the z-40
    // chooser and remains the close toggle). The clone's Radix modal lock
    // set pointer-events:none on <body>, deadening the FAB — modal={false}
    // removes the lock (the live's chooser is plain divs, no lock).
    const quickAdd = read("src/components/finara/quick-add-dialog.tsx");
    expect(quickAdd).toContain("modal={false}");
    // Non-modal Radix ALSO dismisses on outside focus — the FAB takes focus
    // on mousedown, so its click would close-then-reopen the chooser
    // (traced: onOpenChange(false) fires before the click toggle). Both
    // outside paths are suppressed; the FAB is the only outside actor.
    expect(quickAdd).toContain("onInteractOutside={(event) => {");
    expect(quickAdd).toContain("event.preventDefault();");
  });
});
