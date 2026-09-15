"use client";

import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  Landmark,
  LineChart,
  PiggyBank,
  Settings,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LineChart },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "accounts", label: "Accounts", icon: Landmark },
  { id: "investments", label: "Investments", icon: BarChart3 },
  { id: "import", label: "Import", icon: Upload },
  { id: "analytics", label: "Analytics", icon: Sparkles },
  { id: "goals", label: "Goals", icon: PiggyBank },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type ViewId = (typeof NAV_ITEMS)[number]["id"];

export function Sidebar({
  active,
  onNavigate,
  userName,
  userEmail,
}: {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  userName: string;
  userEmail: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-slate-800 lg:flex">
      <div className="flex h-full flex-col">
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-6 flex items-center gap-3 px-3 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 shadow-md">
              <Wallet className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-base font-bold text-white">Finara</p>
              <p className="text-[11px] text-slate-400">Smart Finance Tracker</p>
            </div>
          </div>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id}>
                  <Link
                    href="/"
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(item.id);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_theme(colors.emerald.500)]"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Synced
          </span>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-600 text-sm font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">{userName}</p>
              <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileTopNav({
  active,
  onNavigate,
  userName,
  menuOpen,
  onToggleMenu,
}: {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  userName: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Wallet className="h-4 w-4 text-white" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Finara</p>
            <p className="hidden text-[10px] text-slate-400 sm:block">Smart Finance Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-xs font-semibold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <button
            type="button"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CreditCard className="hidden" aria-hidden />
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {menuOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav id="mobile-nav-menu" aria-label="Main navigation" className="absolute inset-x-0 top-[57px] z-20 border-b border-slate-700 bg-slate-800 px-3 py-3 shadow-lg lg:hidden">
          <ul className="grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id}>
                  <Link
                    href="/"
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(item.id);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
