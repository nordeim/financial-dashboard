import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Dialog form-body + icon-order source contracts (round 7, ADR-020).
 *
 * Rounds 4–6 pinned the dialog HEADERS (title rows, in-flow closes, widths,
 * scroll, card surfaces). This spec pins what lives INSIDE the forms, all
 * live-probed on 2026-09-17 (per-dialog DOM captures incl. edit-expense,
 * edit-goal, edit-investment, edit-account, edit-income) — see
 * docs/plans/2026-09-17-parity-remediation-round7.md §B/§C.
 *
 * Also pins the systemic lucide icon class ORDER: the live app renders
 * `w-X h-X [margin] [color]` on every app icon; only the shadcn Select
 * internals (chevron-down, check — src/components/ui/select.tsx) stay
 * `h-4 w-4`. The finara views must not regress to h-first order.
 *
 * These are source contracts (like design-tokens.test.ts parses CSS) because
 * the dialogs are portal/interaction-dependent; behavior stays with the
 * browser verification pass.
 */

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const finaraFiles = [
  "src/components/finara/accounts-view.tsx",
  "src/components/finara/add-transaction-dialog.tsx",
  "src/components/finara/ai-coach-dialog.tsx",
  "src/components/finara/dashboard-view.tsx",
  "src/components/finara/expense-filters-panel.tsx",
  "src/components/finara/expenses-view.tsx",
  "src/components/finara/goals-view.tsx",
  "src/components/finara/import-view.tsx",
  "src/components/finara/income-view.tsx",
  "src/components/finara/investments-view.tsx",
  "src/components/finara/login-view.tsx",
  "src/components/finara/quick-add-dialog.tsx",
  "src/components/finara/settings-view.tsx",
  "src/components/finara/sidebar.tsx",
] as const;

const sources: Record<string, string> = Object.fromEntries(
  finaraFiles.map((file) => [file, read(file)]),
);

/**
 * Extracts every lucide icon usage (`<IconName … className="…"`) from a
 * finara component source. Only these carry the live `w-X h-X [margin]`
 * order contract — sibling divs follow their own per-context live evidence
 * (e.g. the in-flow close button tail renders `h-9 w-9`, the AI-coach
 * avatar `h-7 w-7`, both live-probed).
 */
function iconClassNames(source: string): string[] {
  const lucideImports = new Set<string>();
  for (const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*"lucide-react"/g)) {
    for (const name of m[1].split(",")) {
      const trimmed = name.trim();
      if (trimmed.length > 0) lucideImports.add(trimmed);
    }
  }
  const out: string[] = [];
  for (const name of lucideImports) {
    const attrPatterns = [
      new RegExp(`<${name}\\b[^>]*?className="([^"]*)"`, "g"),
      new RegExp(`<${name}\\b[^>]*?className=\\{` + "`([^`]*)`" + `\\}`, "g"),
    ];
    for (const pattern of attrPatterns) {
      for (const m of source.matchAll(pattern)) {
        out.push(m[1]);
      }
    }
  }
  return out;
}

describe("icon class order (live: w-X h-X, margin after)", () => {
  it("renders no h-first size pairs on finara lucide icons", () => {
    // Live-evidenced exceptions (exact strings): the import dropzone's
    // CloudUpload renders `mx-auto h-12 w-12 text-gray-400` and the import
    // error card's CircleAlert renders `h-16 w-16 text-red-500` (round 9);
    // the login field icons render `h-4 w-4` (round-14 re-probe — the
    // live restyled the login page; Mail/Lock join the h-first group).
    const allowHFirstClass =
      /^(?:mx-auto h-12 w-12 text-gray-400|h-16 w-16 text-red-500|absolute left-3 top-1\/2 transform -translate-y-1\/2 h-4 w-4 text-slate-500)$/;
    const offenders: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      if (!file.includes("import-view") && !file.includes("login-view")) {
        for (const cls of iconClassNames(source)) {
          const m = cls.match(/h-\d+(?:\.\d+)? w-\d+(?:\.\d+)?/);
          if (m) offenders.push(`${file}: "${cls}"`);
        }
        continue;
      }
      for (const cls of iconClassNames(source)) {
        const m = cls.match(/h-\d+(?:\.\d+)? w-\d+(?:\.\d+)?/);
        if (m && !allowHFirstClass.test(cls)) offenders.push(`${file}: "${cls}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("renders no margin-first icon sizing (mr-2 h-5 w-5 …)", () => {
    const offenders: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      for (const cls of iconClassNames(source)) {
        if (/\b[m][trblxy]?-\d+(?:\.\d+)? h-\d+(?:\.\d+)? w-\d+(?:\.\d+)?/.test(cls)) {
          offenders.push(`${file}: "${cls}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the live size-first spelling on representative icons", () => {
    expect(sources["src/components/finara/dashboard-view.tsx"]).toContain('"w-5 h-5"');
    expect(sources["src/components/finara/sidebar.tsx"]).toContain('"w-5 h-5"');
  });
});

describe("div tile/dot class orders (per-context live evidence)", () => {
  it("category dots render w-3 h-3 rounded-full", () => {
    expect(sources["src/components/finara/dashboard-view.tsx"]).toContain('"w-3 h-3 rounded-full"');
    expect(sources["src/components/finara/expenses-view.tsx"]).toContain('"w-3 h-3 rounded-full"');
  });

  it("tiles render the live w-12 h-12 orders", () => {
    expect(sources["src/components/finara/accounts-view.tsx"]).toContain(
      '"w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl flex items-center justify-center"',
    );
    expect(sources["src/components/finara/income-view.tsx"]).toContain(
      '"w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"',
    );
  });

  it("sidebar logo tile renders the live order", () => {
    expect(sources["src/components/finara/sidebar.tsx"]).toContain(
      "bg-emerald-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-emerald-400/30",
    );
  });

  it("ai-coach avatar tile renders the live h-7 w-7 order", () => {
    expect(sources["src/components/finara/ai-coach-dialog.tsx"]).toContain(
      '"h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center mt-0.5"',
    );
  });

  it("expense row tiles render the live order", () => {
    expect(sources["src/components/finara/expenses-view.tsx"]).toContain(
      '"w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm"',
    );
  });

  it("dashboard activity circles render the live order", () => {
    expect(sources["src/components/finara/dashboard-view.tsx"]).toContain(
      '"w-10 h-10 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center"',
    );
  });
});

describe("user menu anatomy (sidebar.tsx)", () => {
  const sidebar = sources["src/components/finara/sidebar.tsx"];

  it("trigger button carries the live-ordered class string", () => {
    expect(sidebar).toContain(
      '"h-9 flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm w-full text-left"',
    );
  });

  it("avatar span and text block match the live order", () => {
    expect(sidebar).toContain('"relative flex shrink-0 overflow-hidden rounded-full w-8 h-8"');
    expect(sidebar).toContain('"flex-1 min-w-0"');
    expect(sidebar).toContain('"text-sm font-medium text-white dark:text-gray-200 truncate"');
    expect(sidebar).toContain('"text-xs text-slate-400 dark:text-gray-400 truncate"');
  });

  it("menu item icons are w-4 h-4 mr-2 with span-wrapped labels", () => {
    expect(sidebar).toMatch(/w-4 h-4 mr-2/);
    expect(sidebar).toContain('<span>{isDark ? "Light Mode" : "Dark Mode"}</span>');
    expect(sidebar).toContain('<span>Sign Out</span>');
  });
});

describe("add-transaction-dialog form body", () => {
  const file = sources["src/components/finara/add-transaction-dialog.tsx"];

  it("expense quick-amount chips stay the live default size", () => {
    expect(file).toContain('className="h-9 px-4 py-2"');
  });

  it("income quick-amount chips are the live compact size", () => {
    // live: Button outline + h-8 rounded-md px-3 text-xs inside div tabIndex
    // (the income-mode chip map; the edit dialog carries its own copy)
    expect(file.match(/h-8 rounded-md px-3 text-xs/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it("income active switch row carries pt-2", () => {
    expect(file).toContain('"flex items-center space-x-2 pt-2"');
  });

  it("form grids render gap-4 in the live order", () => {
    expect(file).toContain('"grid grid-cols-1 md:grid-cols-2 gap-4"');
    expect(file).toContain('"grid grid-cols-2 gap-4"');
    expect(file).toContain('"grid grid-cols-2 sm:grid-cols-3 gap-3"');
  });

  it("submits carry the live edit labels", () => {
    expect(file).toContain('"Update Expense"');
    expect(file).toContain('"Update Income"');
  });

  it("uses the live label ids", () => {
    for (const id of ["title", "amount", "category", "subcategory", "date", "notes", "is_recurring"]) {
      expect(file).toContain(`"${id}"`);
    }
    for (const id of ["source_name", "frequency", "is_active"]) {
      expect(file).toContain(`"${id}"`);
    }
  });
});

describe("income-view edit dialog form body", () => {
  const file = sources["src/components/finara/income-view.tsx"];

  it("quick-amount chips are Button outline at the live compact size", () => {
    expect(file).toContain('"h-8 rounded-md px-3 text-xs"');
    expect(file).not.toMatch(/rounded-lg border border-slate-200 bg-slate-50/);
  });

  it("Quick Add Amount is a Label, not a muted p", () => {
    expect(file).toContain('<Label className="text-sm font-medium leading-none">Quick Add Amount</Label>');
    expect(file).not.toContain("mb-2 text-xs font-medium");
  });

  it("active row is the live plain label+switch row", () => {
    expect(file).toContain('"flex items-center space-x-2 pt-2"');
    expect(file).not.toContain("rounded-lg border border-slate-200 px-4 py-3");
    expect(file).not.toContain("Counts toward your monthly income total");
  });

  it("buttons row is flex gap-3 pt-4 with flex-1 Update Income", () => {
    expect(file).toContain('"flex gap-3 pt-4"');
    expect(file).toContain('"Update Income"');
    expect(file).not.toContain('"Save Changes"');
  });

  it("uses the live label ids", () => {
    for (const id of ["source_name", "amount", "frequency", "category", "is_active"]) {
      expect(file).toContain(`"${id}"`);
    }
  });
});

describe("investments-view dialog form body", () => {
  const file = sources["src/components/finara/investments-view.tsx"];

  it("renders the live grid structure (pairs, gap-4)", () => {
    expect(file.match(/"grid grid-cols-2 gap-4"/g)?.length).toBe(3);
    expect(file).not.toContain("grid grid-cols-3");
  });

  it("buttons row is flex gap-3 pt-4 with flex-1 and live submit tail", () => {
    expect(file).toContain('"flex gap-3 pt-4"');
    expect(file).toContain('"Update Investment"');
    expect(file).not.toContain('"Save Changes"');
    // dialog submit uses `shadow` (not shadow-lg — the header add-button
    // legitimately keeps shadow-lg, live-probed)
    expect(file).toContain('"flex-1 bg-primary-sage text-white shadow hover:bg-primary-sage/90"');
  });

  it("uses the live label ids", () => {
    for (const id of [
      "symbol",
      "investment_type",
      "name",
      "shares",
      "purchase_price",
      "current_price",
      "portfolio_percentage",
      "sector",
    ]) {
      expect(file).toContain(`"${id}"`);
    }
  });
});

describe("goals-view dialog form bodies", () => {
  const file = sources["src/components/finara/goals-view.tsx"];

  it("goal grid pairs category + priority at gap-4", () => {
    expect(file).toContain('"grid grid-cols-2 gap-4"');
    // no gap-3 grids remain anywhere in the goal dialogs
    expect(file).not.toContain("grid grid-cols-2 gap-3");
  });

  it("buttons rows are the live flex gap-3 pattern", () => {
    expect(file.match(/"flex gap-3 pt-4"/g)?.length).toBe(1);
    expect(file).toContain('"flex gap-3"');
  });

  it("submits carry the live labels and sage tails without text-white", () => {
    expect(file).toContain('"Update Goal"');
    expect(file).toContain('"Create Goal"');
    expect(file).toContain("Add Amount");
    expect(file).not.toContain('"Save Changes"');
    expect(file).toContain('"flex-1 bg-primary-sage shadow hover:bg-primary-sage/90"');
    expect(file).toContain('"flex-1 text-primary-foreground bg-primary-sage shadow hover:bg-primary-sage/90"');
  });

  it("uses the live label ids", () => {
    for (const id of ["title", "target_amount", "target_date", "category", "priority", "amount"]) {
      expect(file).toContain(`"${id}"`);
    }
  });
});

describe("accounts-view dialog form body", () => {
  const file = sources["src/components/finara/accounts-view.tsx"];

  it("card kills the leaked dark background (bg-card in both themes)", () => {
    expect(file).toContain("dark:bg-card");
  });

  it("field wrappers are plain divs (no space-y-2)", () => {
    expect(file).not.toContain('"space-y-2"');
  });

  it("submit is the default primary button with live labels", () => {
    const dialog = file.slice(file.indexOf('<Dialog'));
    expect(dialog).not.toContain("bg-primary-sage");
    expect(dialog).toContain('<Button type="submit" disabled={submitting}>');
    expect(file).toContain('"Save Changes"');
    expect(file).toContain('"Add Account"');
  });

  it("uses the live label ids", () => {
    for (const id of ["account_name", "bank_name", "account_type", "manual_balance"]) {
      expect(file).toContain(`"${id}"`);
    }
  });
});
