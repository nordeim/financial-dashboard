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
import { AiCoachDialog } from "@/components/finara/ai-coach-dialog";

const SESSION_KEY = "finara-demo-session";

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
  };

  if (!session) {
    return <LoginView onSignIn={handleSignIn} />;
  }

  return (
    <div className="relative flex min-h-screen bg-slate-100">
      <Sidebar active={view} onNavigate={navigate} userName={session.name} userEmail={session.email} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopNav
          active={view}
          onNavigate={navigate}
          userName={session.name}
          menuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen((open) => !open)}
        />

        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {view === "dashboard" ? (
            <DashboardView
              onNavigate={navigate}
              onAddTransaction={() => openAddTransaction("expense")}
              onOpenAiCoach={() => setAiCoachOpen(true)}
              refreshKey={refreshKey}
            />
          ) : null}
          {view === "income" ? <IncomeView onAddIncome={() => openAddTransaction("income")} refreshKey={refreshKey} /> : null}
          {view === "expenses" ? <ExpensesView onAddExpense={() => openAddTransaction("expense")} refreshKey={refreshKey} /> : null}
          {view === "accounts" ? <AccountsView /> : null}
          {view === "investments" ? <InvestmentsView /> : null}
          {view === "import" ? <ImportView /> : null}
          {view === "analytics" ? <AnalyticsView /> : null}
          {view === "goals" ? <GoalsView /> : null}
          {view === "settings" ? <SettingsView /> : null}
        </main>

        <footer className="mt-auto border-t border-slate-200/70 bg-white/60 px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <p>Finara — Smart Finance Tracker</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md px-2 py-1 font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              Sign out
            </button>
          </div>
        </footer>
      </div>

      <AddTransactionDialog
        open={txnDialogOpen}
        onOpenChange={setTxnDialogOpen}
        kind={txnKind}
        onSaved={bumpRefresh}
      />

      <AiCoachDialog
        open={aiCoachOpen}
        onOpenChange={setAiCoachOpen}
        onQuickAction={(action) => {
          switch (action) {
            case "add-income":
              openAddTransaction("income");
              break;
            case "add-expense":
              openAddTransaction("expense");
              break;
            case "set-goal":
              navigate("goals");
              break;
            case "view-reports":
              navigate("analytics");
              break;
          }
        }}
      />
    </div>
  );
}
