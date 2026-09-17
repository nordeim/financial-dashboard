"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { MobileTopNav, Sidebar, type ViewId } from "@/components/finara/sidebar";
import { LoginView } from "@/components/finara/login-view";
import { DashboardView } from "@/components/finara/dashboard-view";
import { IncomeView } from "@/components/finara/income-view";
import { ExpensesView } from "@/components/finara/expenses-view";
import { AccountsView } from "@/components/finara/accounts-view";
import { InvestmentsView } from "@/components/finara/investments-view";
import { ImportView } from "@/components/finara/import-view";
import { AnalyticsView } from "@/components/finara/analytics-view";
import { GoalsView } from "@/components/finara/goals-view";
import { SettingsView } from "@/components/finara/settings-view";
import { AddTransactionDialog, type TransactionKind } from "@/components/finara/add-transaction-dialog";
import { QuickAddDialog } from "@/components/finara/quick-add-dialog";
import { AiCoachDialog } from "@/components/finara/ai-coach-dialog";
import { NotFoundView } from "@/components/finara/ui-bits";
import { resetTheme, setTheme } from "@/components/finara/theme";
import type { SettingsDto } from "@/lib/types";
import { parseRoute, pathForView, type AppRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

const SESSION_KEY = "finara-demo-session";

/**
 * Route architecture (round 8, ADR-021 — live-probed 2026-09-17).
 *
 * The live Finara app is an SPA served over REAL paths (/Dashboard …
 * /Settings). The two Next page files pass the server-parsed route in; the
 * client keeps the single-mount SPA feel by intercepting link clicks
 * (preventDefault + history.pushState) and listening to popstate, exactly
 * like the live router. `/` renders the dashboard with NO active nav pill;
 * `/Dashboard` marks itself active; unknown paths render the standalone 404
 * page; unauthenticated deep links replaceState to /login?from_url=<url>,
 * and signing in returns to that from_url.
 */

/** Per-view max-width containers (source-exact, live-verified — round 8 order). */
const VIEW_CONTAINER: Record<ViewId, string> = {
  dashboard: "max-w-7xl mx-auto",
  income: "max-w-6xl mx-auto",
  expenses: "max-w-7xl mx-auto",
  accounts: "max-w-6xl mx-auto",
  investments: "max-w-7xl mx-auto",
  import: "max-w-6xl mx-auto",
  analytics: "max-w-7xl mx-auto",
  goals: "max-w-6xl mx-auto",
  settings: "max-w-4xl mx-auto",
};

interface Session {
  email: string;
  name: string;
}

function loadSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown; name?: unknown };
    if (typeof parsed.email !== "string") return null;
    return { email: parsed.email, name: typeof parsed.name === "string" ? parsed.name : parsed.email.split("@")[0]! };
  } catch {
    // Storage unavailable (sandboxed iframe / privacy mode) — session stays in memory.
    return null;
  }
}

function storeSession(session: Session | null): void {
  try {
    if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Persisting is best-effort only.
  }
}

// External store for the demo session (M-3 idiom): the server snapshot renders
// the login shape and the client snapshot (sessionStorage-backed cache) takes
// over after hydration — never a useState initializer, never effect-body setState.
let cachedSession: Session | null = null;
let cacheLoaded = false;
const sessionListeners = new Set<() => void>();

function readSessionCache(): Session | null {
  if (!cacheLoaded) {
    cacheLoaded = true;
    cachedSession = loadSession();
  }
  return cachedSession;
}

function writeSession(session: Session | null): void {
  cachedSession = session;
  cacheLoaded = true;
  storeSession(session);
  for (const listener of sessionListeners) listener();
}

function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function getServerSession(): Session | null {
  return null;
}

/** Server pages pass either a parsed AppRoute or the `{ kind: "home" }` marker. */
export type FinaraRouteInput = AppRoute | { kind: "home" };

export function FinaraApp({ route: initialRoute }: { route: FinaraRouteInput }) {
  const session = useSyncExternalStore(subscribeSession, readSessionCache, getServerSession);
  const [route, setRoute] = useState<AppRoute>(
    initialRoute.kind === "home" ? parseRoute("/") : initialRoute,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [txnDialogOpen, setTxnDialogOpen] = useState(false);
  const [txnKind, setTxnKind] = useState<TransactionKind>("expense");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const view: ViewId = route.kind === "view" ? route.view : "dashboard";
  // `/` renders the dashboard with NO active pill (live-probed); /Dashboard
  // and the other view paths mark themselves active.
  const active: ViewId | null = route.kind === "view" ? route.active : null;

  const applyRoute = useCallback((next: AppRoute) => {
    setRoute(next);
    document.title = next.title;
  }, []);

  const navigateToPath = useCallback(
    (path: string) => {
      if (typeof window === "undefined") return;
      if (window.location.pathname !== path) {
        window.history.pushState({}, "", path);
      }
      applyRoute(parseRoute(path));
    },
    [applyRoute],
  );

  const navigate = useCallback(
    (next: ViewId) => {
      navigateToPath(pathForView(next));
      setMobileMenuOpen(false);
      setQuickAddOpen(false);
      window.scrollTo({ top: 0 });
    },
    [navigateToPath],
  );

  // Back/forward: the live SPA re-renders from the URL on popstate.
  useEffect(() => {
    const onPopState = () => applyRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyRoute]);

  // Unauthenticated deep link → /login?from_url=<current> (live-probed).
  // The effect reads the LIVE store (not the render snapshot): on a full
  // reload the hydration render still sees the null server snapshot, and
  // redirecting then would clobber the URL of an authenticated visitor.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readSessionCache()) return;
    if (window.location.pathname === "/login") return;
    const from = encodeURIComponent(window.location.pathname + window.location.search);
    window.history.replaceState({}, "", `/login?from_url=${from}`);
  }, [session]);

  // Signing in returns to the deep link that brought us to the login page;
  // signing out falls back to the unauthenticated redirect above.
  const handleSignIn = (email: string) => {
    writeSession({ email, name: email.split("@")[0] ?? "you" });
    if (typeof window !== "undefined") {
      const target = fromUrlTarget(window.location.search) ?? "/";
      navigateToPath(target);
    }
    // Round-10 (live-probed): the source app re-applies the SERVER-side user
    // theme after sign-in (its User/me hydration) — sign-out cleared the local
    // copy. The session renders immediately; the theme lands asynchronously,
    // exactly like the live flow.
    fetch("/api/settings", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<{ ok: boolean; data?: SettingsDto }>) : null))
      .then((payload) => {
        if (payload?.ok && payload.data) setTheme(payload.data.theme);
      })
      .catch(() => {
        // Offline/unavailable — the locally stored (or default) theme stands.
      });
  };

  const handleSignOut = () => {
    writeSession(null);
    // Round-10 (live-probed): the source app's sign-out clears the persisted
    // theme and drops the dark class, so the login page always renders light.
    // Both sign-out surfaces (user menu + mobile drawer) route through here.
    resetTheme();
    setMobileMenuOpen(false);
    setQuickAddOpen(false);
    setRoute(parseRoute("/"));
    // The unauthenticated effect replaceState's to /login?from_url=… right
    // after this; reset the local route so the re-login lands on the shell.
  };

  // Authenticated visits to /login bounce to from_url (or the dashboard) —
  // a render-time route adjustment (the React-documented pattern, like the
  // expenses filter-context reset): setState-in-effect is lint-banned here.
  const [appliedLoginRedirect, setAppliedLoginRedirect] = useState(false);
  if (session && route.kind === "login" && !appliedLoginRedirect) {
    setAppliedLoginRedirect(true);
    const target = fromUrlTarget(window.location.search) ?? "/";
    if (window.location.pathname === "/login") {
      window.history.pushState({}, "", target);
    }
    applyRoute(parseRoute(target));
  }

  const bumpRefresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const openAddTransaction = useCallback((kind: TransactionKind) => {
    setTxnKind(kind);
    setTxnDialogOpen(true);
  }, []);

  if (!session) {
    return <LoginView onSignIn={handleSignIn} />;
  }

  if (route.kind === "not-found") {
    return <NotFoundView segment={route.segment} onGoHome={() => navigateToPath("/")} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans transition-colors duration-300 dark:from-gray-900 dark:to-gray-800">
      {/* Live shell anatomy: flex row > aside + main(flex col) > pt-16 wrapper
          (clears the fixed mobile top bar) > gradient canvas > max-w container. */}
      <div className="flex">
        <Sidebar
          active={active}
          onNavigate={navigate}
          userName={session.name}
          userEmail={session.email}
          onSignOut={handleSignOut}
        />

        <MobileTopNav
          active={active}
          onNavigate={navigate}
          menuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen((open) => !open)}
          onSignOut={handleSignOut}
        />

        <main id="main-content" className="flex-1 flex flex-col lg:ml-0">
          <div className="flex-1 pt-16 lg:pt-0">
            {/* Live-exact quirk (round 4): only the dashboard and expenses
                content panes carry the theme-fade transition classes; the
                other seven views' inner gradient divs do not. */}
            <div
              className={cn(
                "p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen",
                view === "dashboard" || view === "expenses" ? "transition-colors duration-300" : null,
              )}
            >
              <div className={VIEW_CONTAINER[view]}>
                {view === "dashboard" ? (
                  <DashboardView
                    onNavigate={navigate}
                    onQuickAdd={() => setQuickAddOpen((v) => !v)}
                    quickAddOpen={quickAddOpen}
                    onOpenAiCoach={() => setAiCoachOpen(true)}
                    refreshKey={refreshKey}
                  />
                ) : null}
                {view === "income" ? <IncomeView onAddIncome={() => openAddTransaction("income")} refreshKey={refreshKey} /> : null}
                {view === "expenses" ? <ExpensesView onAddExpense={() => openAddTransaction("expense")} onQuickAdd={() => setQuickAddOpen((v) => !v)} quickAddOpen={quickAddOpen} refreshKey={refreshKey} /> : null}
                {view === "accounts" ? <AccountsView refreshKey={refreshKey} onNavigate={() => navigate("import")} /> : null}
                {view === "investments" ? <InvestmentsView refreshKey={refreshKey} /> : null}
                {view === "import" ? <ImportView /> : null}
                {view === "analytics" ? <AnalyticsView /> : null}
                {view === "goals" ? <GoalsView refreshKey={refreshKey} /> : null}
                {view === "settings" ? <SettingsView /> : null}
              </div>
            </div>
          </div>
        </main>
      </div>

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} onSaved={bumpRefresh} />

      {/* Round 9 (F6): mount-on-open — this dialog lives at the shell level
          and would otherwise keep its mount-time useSettings data forever
          (stale quick-amount chips after a currency change). Rendering it
          only while open remounts it per open, so the chips always reflect
          the current Settings currency like the live app. */}
      {txnDialogOpen ? (
        <AddTransactionDialog
          open={txnDialogOpen}
          onOpenChange={setTxnDialogOpen}
          kind={txnKind}
          onSaved={bumpRefresh}
        />
      ) : null}

      <AiCoachDialog
        open={aiCoachOpen}
        onOpenChange={setAiCoachOpen}
      />
    </div>
  );
}

/** Extract a same-origin path from a ?from_url=… query (falls back to null). */
function fromUrlTarget(search: string): string | null {
  const raw = new URLSearchParams(search).get("from_url");
  if (!raw) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname || "/";
  } catch {
    return null;
  }
}
