import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { VIEW_PATHS, parseRoute, segmentToTitle } from "@/lib/routes";

/**
 * View-surface source contracts (round 8, ADR-021).
 *
 * Round 8 pinned two layers the earlier rounds left open:
 *  1. RENDERED-CLASS-ORDER parity on every view surface (the r8 order diff
 *     found 172 order deltas across the nine views — live builds its strings
 *     through Card/Button component merges, so the surviving order is
 *     base-classes-first with per-usage tails; see the plan §A F1–F9).
 *  2. The route architecture: the live app is an SPA over REAL paths
 *     (/Dashboard … /Settings), with `/` rendering the dashboard content and
 *     NO active nav pill, per-route document titles, a standalone 404 page,
 *     and a /login?from_url=… redirect for unauthenticated deep links
 *     (all probed 2026-09-17 — plan §A F10).
 *
 * Source contracts (dialog-forms precedent): portals/interaction stay with
 * the browser verification pass.
 */

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const src = {
  button: read("src/components/ui/button.tsx"),
  uiBits: read("src/components/finara/ui-bits.tsx"),
  sidebar: read("src/components/finara/sidebar.tsx"),
  app: read("src/components/finara/finara-app.tsx"),
  dashboard: read("src/components/finara/dashboard-view.tsx"),
  income: read("src/components/finara/income-view.tsx"),
  accounts: read("src/components/finara/accounts-view.tsx"),
  investments: read("src/components/finara/investments-view.tsx"),
  goals: read("src/components/finara/goals-view.tsx"),
  analytics: read("src/components/finara/analytics-view.tsx"),
  settings: read("src/components/finara/settings-view.tsx"),
  import: read("src/components/finara/import-view.tsx"),
  expenses: read("src/components/finara/expenses-view.tsx"),
  quickAdd: read("src/components/finara/quick-add-dialog.tsx"),
  page: read("src/app/page.tsx"),
  catchAll: read("src/app/[...view]/page.tsx"),
};

describe("routes module (F10)", () => {
  it("maps every view to its live path", () => {
    expect(VIEW_PATHS).toEqual({
      dashboard: "/Dashboard",
      income: "/Income",
      expenses: "/Expenses",
      accounts: "/Accounts",
      investments: "/Investments",
      import: "/Import",
      analytics: "/Analytics",
      goals: "/Goals",
      settings: "/Settings",
    });
  });

  it("renders `/` as the dashboard with NO active nav pill and bare title", () => {
    expect(parseRoute("/")).toEqual({
      kind: "view",
      view: "dashboard",
      active: null,
      title: "Finara",
    });
  });

  it("treats /Dashboard as the home route (bare title) but marks it active", () => {
    expect(parseRoute("/Dashboard")).toEqual({
      kind: "view",
      view: "dashboard",
      active: "dashboard",
      title: "Finara",
    });
  });

  it("titles known views `X | Finara` and marks them active", () => {
    expect(parseRoute("/Expenses")).toEqual({
      kind: "view",
      view: "expenses",
      active: "expenses",
      title: "Expenses | Finara",
    });
    expect(parseRoute("/Settings").title).toBe("Settings | Finara");
    expect(parseRoute("/Import").title).toBe("Import | Finara");
  });

  it("parses /login", () => {
    expect(parseRoute("/login").kind).toBe("login");
  });

  it("unknown paths are not-found with the raw segment + camelCase-split title", () => {
    const route = parseRoute("/NonexistentPage");
    expect(route).toEqual({
      kind: "not-found",
      segment: "NonexistentPage",
      title: "Nonexistent Page | Finara",
    });
  });

  it("splits camelCase segments for the 404 title", () => {
    expect(segmentToTitle("NonexistentPage")).toBe("Nonexistent Page");
  });

  it("serves `/` from page.tsx and everything else from the catch-all", () => {
    expect(src.page).toContain("FinaraApp");
    expect(src.page).toContain('route={{ kind: "home" }');
    expect(src.catchAll).toContain("parseRoute");
    expect(src.catchAll).toContain("generateMetadata");
  });
});

describe("button default variant carries shadow (F6)", () => {
  it("renders `bg-primary text-primary-foreground shadow hover:bg-primary/90`", () => {
    expect(src.button).toContain(
      'default: "bg-primary text-primary-foreground shadow hover:bg-primary/90"',
    );
    // The pre-round-8 shadow-less variant must not come back.
    expect(src.button).not.toContain(
      'default: "bg-primary text-primary-foreground hover:bg-primary/90"',
    );
  });
});

describe("ui-bits card surfaces (F2)", () => {
  it("retires CARD_SURFACE in favor of the three live merge strings", () => {
    expect(src.uiBits).not.toContain("export const CARD_SURFACE");
    expect(src.uiBits).toContain(
      'export const CARD_HOVER =\n  "rounded-xl text-card-foreground card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg"',
    );
    expect(src.uiBits).toContain(
      'export const CARD_PLAIN =\n  "rounded-xl text-card-foreground bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg"',
    );
    expect(src.uiBits).not.toContain("CARD_RESTATE");
  });

  it("no view file references CARD_SURFACE anymore", () => {
    for (const file of [
      src.dashboard,
      src.income,
      src.accounts,
      src.investments,
      src.goals,
      src.analytics,
      src.settings,
      src.import,
      src.expenses,
    ]) {
      expect(file).not.toContain("CARD_SURFACE");
    }
  });

  it("StatCard renders the dashboard p-6 merge and live tile order (F2/F3)", () => {
    expect(src.uiBits).toContain('className={CARD_DASHBOARD_SURFACE}');
    expect(src.uiBits).toContain(
      'className={cn("w-12 h-12 rounded-xl", iconClass, "flex items-center justify-center")}',
    );
    expect(src.uiBits).toContain('<Icon className="w-6 h-6 text-white"');
  });

  it("margin-last re-pins inside StatCard (F5)", () => {
    expect(src.uiBits).toContain(
      'className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1"',
    );
    expect(src.uiBits).toContain(
      'className="text-2xl font-bold text-neutral-900 dark:text-white mb-3"',
    );
  });

  it("ViewHeader wrapper + h1 orders (F1)", () => {
    expect(src.uiBits).toContain(
      '"flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"',
    );
    expect(src.uiBits).toContain(
      'className="text-3xl lg:text-4xl font-bold text-primary-navy dark:text-white mb-2"',
    );
  });

  it("ClassicTrash2 pins the single-alias class (F8)", () => {
    expect(src.uiBits).toContain("ClassicTrash2");
    expect(src.uiBits).toMatch(/lucide lucide-trash2/);
    expect(src.uiBits).not.toMatch(/lucide-trash-2/);
  });

  it("SectionCard icon titles drop the re-stated base classes (F7)", () => {
    expect(src.uiBits).toContain(
      '<CardTitle className="flex items-center gap-2 text-primary-navy dark:text-white">',
    );
    expect(src.uiBits).not.toContain(
      '"flex items-center gap-2 font-semibold leading-none tracking-tight text-primary-navy dark:text-white"',
    );
  });

  it("NotFoundView renders the standalone live 404 anatomy (F10)", () => {
    expect(src.uiBits).toContain('"min-h-screen flex items-center justify-center p-6 bg-slate-50"');
    expect(src.uiBits).toContain('"max-w-md w-full"');
    expect(src.uiBits).toContain('"text-center space-y-6"');
    expect(src.uiBits).toContain('"text-7xl font-light text-slate-300"');
    expect(src.uiBits).toContain('"h-0.5 w-16 bg-slate-200 mx-auto"');
    expect(src.uiBits).toContain('"text-2xl font-medium text-slate-800"');
    expect(src.uiBits).toContain('"text-slate-600 leading-relaxed"');
    expect(src.uiBits).toContain('"font-medium text-slate-700"');
    expect(src.uiBits).toContain("could not be found in this application");
    expect(src.uiBits).toContain("Go Home");
  });
});

describe("sidebar (F14/F15/F10)", () => {
  it("SyncedBadge uses the Badge component with the live tail", () => {
    expect(src.sidebar).toContain(
      'className="gap-1 text-green-600 border-green-300 dark:text-green-400 dark:border-green-600"',
    );
    expect(src.sidebar).not.toContain("inline-flex items-center gap-1 rounded-md border border-green-300");
  });

  it("nav items link to the real live routes", () => {
    expect(src.sidebar).toContain("VIEW_PATHS[item.id]");
    expect(src.sidebar).not.toContain('href="/"');
  });

  it("nav item class orders put the padding before rounded-xl (F15)", () => {
    expect(src.sidebar).toContain(
      '"flex items-center gap-3",\n          compact ? "px-4 py-4" : "px-4 py-3",\n          "rounded-xl font-medium transition-all duration-200",',
    );
  });

  it("desktop active pill order; drawer active pill has no blur", () => {
    expect(src.sidebar).toContain(
      '"bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30",',
    );
    expect(src.sidebar).toContain('compact ? undefined : "backdrop-blur-sm"');
  });

  it("mobile header orders (F14)", () => {
    expect(src.sidebar).toContain(
      '"lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-gray-700"',
    );
    expect(src.sidebar).toContain('"flex items-center justify-between h-16 px-4"');
    expect(src.sidebar).toContain(
      '"w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"',
    );
    expect(src.sidebar).toContain('className="w-8 h-8 text-gray-700 dark:text-gray-300"');
    expect(src.sidebar).toContain('className="h-9 w-9 text-gray-700 dark:text-gray-300"');
  });

  it("drawer container/inner/nav orders (F15)", () => {
    expect(src.sidebar).toContain('"lg:hidden fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900"');
    expect(src.sidebar).toContain('"flex flex-col h-full pt-20"');
    expect(src.sidebar).toContain('"flex-1 px-4 py-6 space-y-2"');
  });
});

describe("app shell + route sync (F1/F10)", () => {
  it("shell orders: main, gradient pane, containers", () => {
    expect(src.app).toContain('className="flex-1 flex flex-col lg:ml-0"');
    expect(src.app).toContain(
      '"p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen"',
    );
    expect(src.app).toContain('"max-w-7xl mx-auto"');
    expect(src.app).toContain('"max-w-6xl mx-auto"');
    expect(src.app).toContain('"max-w-4xl mx-auto"');
    expect(src.app).not.toContain('"mx-auto max-w-7xl"');
  });

  it("navigates with pushState and listens to popstate", () => {
    expect(src.app).toContain("history.pushState");
    expect(src.app).toContain("popstate");
  });

  it("unauthenticated deep links redirect to /login?from_url=", () => {
    expect(src.app).toContain("from_url");
  });

  it("unknown routes render NotFoundView outside the shell", () => {
    expect(src.app).toContain("NotFoundView");
  });
});

describe("dashboard view (F19/F4/F5/F6)", () => {
  it("header uses the standard live order", () => {
    expect(src.dashboard).toContain(
      'fade-in-up flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4',
    );
  });

  it("KPI grid, gradient row and bottom grid orders", () => {
    expect(src.dashboard).toContain(
      'fade-in-up stagger-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8',
    );
    expect(src.dashboard).toContain('fade-in-up stagger-2 grid md:grid-cols-4 gap-6 mb-8');
    expect(src.dashboard).toContain('fade-in-up stagger-3 grid lg:grid-cols-3 gap-8');
    expect(src.dashboard).toContain('"grid grid-cols-2 md:grid-cols-4 gap-4"');
    expect(src.dashboard).toContain('"lg:col-span-2 space-y-8"');
  });

  it("Quick Actions panel + button orders", () => {
    expect(src.dashboard).toContain(
      'fade-in-up mt-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-6',
    );
    expect(src.dashboard).toContain(
      '"px-4 py-2 w-full h-16 flex-col gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"',
    );
  });

  it("AI Insights empty state pins", () => {
    expect(src.dashboard).toContain('"text-center py-8"');
    expect(src.dashboard).toContain(
      '<Brain className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" aria-hidden />',
    );
    expect(src.dashboard).toContain('"text-sm text-neutral-400 dark:text-neutral-500 mt-1"');
  });

  it("activity rows, budget track and hero circles (F5/F9/F3)", () => {
    expect(src.dashboard).toContain(
      '"flex items-center gap-3 p-3 rounded-lg bg-neutral-50/50 dark:bg-gray-700/30 hover:bg-neutral-100/50 dark:hover:bg-gray-700/50 transition-colors"',
    );
    expect(src.dashboard).toContain(
      '"relative w-full overflow-hidden rounded-full h-2 bg-gray-200 dark:bg-gray-700"',
    );
    expect(src.uiBits).toContain(
      '"w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"',
    );
  });

  it("sage CTA relies on the size default (no re-stated h-9)", () => {
    expect(src.dashboard).toContain(
      'className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg"',
    );
    expect(src.dashboard).not.toContain(
      'className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90"',
    );
  });

  it("Add Transaction stays an /Expenses anchor", () => {
    expect(src.dashboard).toContain('href="/Expenses"');
  });
});

describe("income view (F2/F3/F4/F5/F6)", () => {
  it("source grid replaces the space-y stack", () => {
    expect(src.income).toContain(
      'fade-in-up stagger-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    );
    expect(src.income).not.toContain('"space-y-8"');
  });

  it("hero card + tile + margin orders", () => {
    expect(src.income).toContain(
      '"rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-xl"',
    );
    expect(src.income).toContain('"w-20 h-20 bg-white/20 rounded-full flex items-center justify-center"');
    expect(src.income).toContain('"text-emerald-100 text-lg font-medium mb-2"');
    expect(src.income).toContain('"text-emerald-100 text-sm mt-2"');
    expect(src.income).toContain('"flex items-start justify-between mb-4"');
    expect(src.income).toContain('"pt-3 border-t dark:border-gray-700"');
    expect(src.income).toContain('"text-sm text-neutral-500 dark:text-neutral-400 mb-1"');
  });

  it("sage CTA tail", () => {
    expect(src.income).toContain(
      'className="bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg"',
    );
    expect(src.income).not.toContain('className="h-9 bg-primary-sage text-white shadow-lg hover:bg-primary-sage/90"');
  });
});

describe("accounts view (F2/F3/F5)", () => {
  it("cards carry card-hover with the live merge order", () => {
    expect(src.accounts).toContain('cn(CARD_HOVER, "h-full flex flex-col")');
  });

  it("grid replaces the stack; header/footer merges", () => {
    expect(src.accounts).toContain(
      'fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    );
    expect(src.accounts).toContain('"space-y-1.5 p-6 flex flex-row items-start justify-between"');
    expect(src.accounts).toContain('"p-6 pt-0 flex-grow flex flex-col justify-end"');
    expect(src.accounts).toContain('"text-xs text-neutral-400 dark:text-neutral-500 mt-1"');
    expect(src.accounts).toContain('className="w-full mt-4"');
  });
});

describe("investments view (F2/F4/F5/F9)", () => {
  it("KPI + holdings grids", () => {
    expect(src.investments).toContain('fade-in-up grid grid-cols-1 md:grid-cols-3 gap-6 mb-8');
    expect(src.investments).toContain('fade-in-up stagger-1 grid lg:grid-cols-3 gap-8');
    expect(src.investments).not.toContain('"space-y-8"');
  });

  it("gradient heroes, icon rows, dots and margins", () => {
    expect(src.investments).toContain(
      '"rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg"',
    );
    expect(src.investments).toContain(
      '"rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg"',
    );
    expect(src.investments).toContain('"text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-1"');
    expect(src.investments).toContain('"w-3 h-3 rounded-full"');
  });
});

describe("goals view (F2/F5/F9)", () => {
  it("cards + progress track orders", () => {
    // Round-11: complete cards merge the emerald ring onto CARD_HOVER
    // (live-probed post-reload at 100% and 150%).
    expect(src.goals).toContain('className={cn(CARD_HOVER, complete && "ring-2 ring-emerald-200 dark:ring-emerald-700")}');
    expect(src.goals).toContain(
      'fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8',
    );
    expect(src.goals).toContain('"relative w-full overflow-hidden rounded-full bg-primary/20 h-2"');
    expect(src.goals).toContain('"tracking-tight text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate"');
    expect(src.goals).toContain('"flex items-center gap-2 mt-1"');
    expect(src.goals).toContain('"p-6 pt-0 space-y-4"');
    expect(src.goals).toContain('className="w-full mt-4"');
  });
});

describe("analytics view (F17/F2/F5)", () => {
  it("KPI grid + filter row + card restate surface", () => {
    expect(src.analytics).toContain(
      'fade-in-up stagger-1 grid md:grid-cols-3 gap-6',
    );
    expect(src.analytics).toContain('"flex gap-3 flex-wrap"');
    expect(src.analytics).not.toContain('<div className="space-y-8">');
  });

  it("icon orders", () => {
    expect(src.analytics).toContain('"w-8 h-8 text-red-200 rotate-180"');
  });
});

describe("settings view (F18/F2/F5/F6)", () => {
  it("restate cards, grids, info boxes, icons and buttons", () => {
    expect(src.settings).toContain('cn(CARD_PLAIN, "fade-in-up")');
    expect(src.settings).toContain('"grid md:grid-cols-2 gap-4"');
    expect(src.settings).toContain('"grid grid-cols-2 md:grid-cols-4 gap-4"');
    expect(src.settings).toContain(
      '"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"',
    );
    expect(src.settings).toContain(
      '"bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"',
    );
    expect(src.settings).toContain('"w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"');
    expect(src.settings).toContain('"w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"');
    expect(src.settings).toContain('"font-semibold text-blue-800 dark:text-blue-200 mb-1"');
    expect(src.settings).toContain('"font-semibold text-amber-800 dark:text-amber-200 mb-1"');
    expect(src.settings).toContain('"text-2xl font-bold text-gray-900 dark:text-white mb-1"');
    expect(src.settings).toContain('"p-6 pt-0 space-y-4"');
    expect(src.settings).toContain('"p-6 pt-0 space-y-6"');
    expect(src.settings).toContain('"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-pointer"');
  });

  it("export + save button tails (F6)", () => {
    expect(src.settings).toContain(
      'className="h-9 px-4 py-2 w-full bg-blue-600 hover:bg-blue-700"',
    );
    expect(src.settings).toContain(
      'className="h-9 px-4 py-2 bg-primary-sage hover:bg-primary-sage/90 gap-2"',
    );
  });
});

describe("import view (F16)", () => {
  it("plain card + content/dropzone/label/button orders", () => {
    expect(src.import).toContain(
      '"fade-in-up rounded-xl border bg-card text-card-foreground shadow"',
    );
    expect(src.import).toContain('"p-6 pt-0 space-y-4"');
    expect(src.import).toContain('"p-6 border-2 border-dashed rounded-lg text-center"');
    expect(src.import).toContain(
      'className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"',
    );
  });
});

describe("expenses view (F11/F12/F5)", () => {
  it("has no pagination", () => {
    expect(src.expenses).not.toContain("PAGE_SIZE");
    expect(src.expenses).not.toContain("pageCount");
    expect(src.expenses).not.toContain("aria-label=\"Expense history pagination\"");
    expect(src.expenses).not.toContain("ChevronLeft");
    expect(src.expenses).not.toContain("ChevronRight");
  });

  it("bulk bar is the live blue anatomy (F12)", () => {
    expect(src.expenses).toContain(
      '"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"',
    );
    expect(src.expenses).toContain('"flex items-center gap-4"');
    expect(src.expenses).toContain('"text-sm text-blue-700 dark:text-blue-300 font-medium"');
    expect(src.expenses).toContain("Select All (${filtered.length})");
    expect(src.expenses).toContain("Deselect All");
    expect(src.expenses).toContain("SquareCheckBig");
    expect(src.expenses).toContain('"w-4 h-4 border-2 border-current rounded flex items-center justify-center"');
    expect(src.expenses).toContain('"w-2 h-0.5 bg-current"');
    expect(src.expenses).toContain("expenses selected");
    expect(src.expenses).toContain('PenLine');
    expect(src.expenses).toContain("Change Category");
    expect(src.expenses).toContain("Update Date");
    expect(src.expenses).toContain("Mark as Recurring");
    expect(src.expenses).toContain(
      '"text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"',
    );
    expect(src.expenses).toContain("Delete ({selectedIds.size})");
    expect(src.expenses).toContain(
      "Are you sure you want to delete ${ids.length} expenses?",
    );
  });

  it("retires the emerald toolbar + Move-to-Select", () => {
    expect(src.expenses).not.toContain("border-emerald-200 bg-emerald-50");
    expect(src.expenses).not.toContain("Move to Needs");
    expect(src.expenses).not.toContain("Deselect All</Button>");
  });

  it("row + badge orders (F5)", () => {
    expect(src.expenses).toContain(
      '"flex items-center gap-4 p-4 bg-neutral-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-neutral-100/50 dark:hover:bg-gray-700/50 transition-colors"',
    );
    expect(src.expenses).toContain('className="text-xs dark:border-gray-600"');
    expect(src.expenses).toContain('"flex-1 relative"');
    expect(src.expenses).toContain('"flex items-start justify-between mb-1"');
    expect(src.expenses).toContain('"font-semibold text-neutral-900 dark:text-white truncate"');
    expect(src.expenses).toContain('"text-lg font-bold text-red-600 dark:text-red-500 ml-4"');
    expect(src.expenses).toContain('"flex items-center gap-2 flex-wrap"');
  });

  it("uses ClassicTrash2, not the dual-class lucide Trash2 (F8)", () => {
    expect(src.expenses).toContain("ClassicTrash2");
    expect(src.expenses).not.toMatch(/\bTrash2\b/);
  });
});

describe("quick add step-2 (F13)", () => {
  it("Back gains flex-1; Add carries the live tail + Check icon + valid gate", () => {
    expect(src.quickAdd).toContain('className="flex-1"');
    expect(src.quickAdd).toContain(
      'className="flex-1 bg-primary-sage hover:bg-primary-sage/90"',
    );
    expect(src.quickAdd).toContain("<Check ");
    expect(src.quickAdd).toMatch(/disabled=\{submitting \|\|/);
  });

  it("drops clone-only maxlength/min", () => {
    expect(src.quickAdd).not.toContain("maxLength");
    expect(src.quickAdd).not.toContain('min="0"');
  });
});

