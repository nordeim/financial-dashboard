"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
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
import { cn } from "@/lib/utils";

const SESSION_KEY = "finara-demo-session";

/** Per-view max-width containers (source-exact, live-verified 2026-09-15). */
const VIEW_CONTAINER: Record<ViewId, string> = {
  dashboard: "mx-auto max-w-7xl",
  income: "mx-auto max-w-6xl",
  expenses: "mx-auto max-w-7xl",
  accounts: "mx-auto max-w-6xl",
  investments: "mx-auto max-w-7xl",
  import: "mx-auto max-w-6xl",
  analytics: "mx-auto max-w-7xl",
  goals: "mx-auto max-w-6xl",
  settings: "mx-auto max-w-4xl",
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

export function FinaraApp() {
  const session = useSyncExternalStore(subscribeSession, readSessionCache, getServerSession);
  const [view, setView] = useState<ViewId>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [txnDialogOpen, setTxnDialogOpen] = useState(false);
  const [txnKind, setTxnKind] = useState<TransactionKind>("expense");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useCallback((next: ViewId) => {
    setView(next);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const openAddTransaction = useCallback((kind: TransactionKind) => {
    setTxnKind(kind);
    setTxnDialogOpen(true);
  }, []);

  const handleSignIn = (email: string) => {
    writeSession({ email, name: email.split("@")[0] ?? "you" });
  };

  const handleSignOut = () => {
    writeSession(null);
    setView("dashboard");
    setMobileMenuOpen(false);
  };

  if (!session) {
    return <LoginView onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans transition-colors duration-300 dark:from-gray-900 dark:to-gray-800">
      {/* Live shell anatomy: flex row > aside + main(flex col) > pt-16 wrapper
          (clears the fixed mobile top bar) > gradient canvas > max-w container. */}
      <div className="flex">
        <Sidebar
          active={view}
          onNavigate={navigate}
          userName={session.name}
          userEmail={session.email}
          onSignOut={handleSignOut}
        />

        <MobileTopNav
          active={view}
          onNavigate={navigate}
          menuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen((open) => !open)}
          onSignOut={handleSignOut}
        />

        <main id="main-content" className="flex flex-1 flex-col lg:ml-0">
          <div className="flex-1 pt-16 lg:pt-0">
            {/* Live-exact quirk (round 4): only the dashboard and expenses
                content panes carry the theme-fade transition classes; the
                other seven views' inner gradient divs do not. */}
            <div
              className={cn(
                "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 lg:p-8 dark:from-gray-900 dark:to-gray-800",
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

      <AddTransactionDialog
        open={txnDialogOpen}
        onOpenChange={setTxnDialogOpen}
        kind={txnKind}
        onSaved={bumpRefresh}
      />

      <AiCoachDialog
        open={aiCoachOpen}
        onOpenChange={setAiCoachOpen}
      />
    </div>
  );
}
