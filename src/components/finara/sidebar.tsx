"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import {
  BarChart3,
  CheckCircle2,
  Landmark,
  LineChart,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Settings,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getServerTheme, getThemeSnapshot, subscribeTheme, toggleTheme, type Theme } from "@/components/finara/theme";

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

function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerTheme);
}

/** User avatar + dropdown: My Account / Dark Mode / Sign Out (source parity). */
function UserMenu({
  userName,
  userEmail,
  onSignOut,
  variant = "sidebar",
}: {
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  variant?: "sidebar" | "header";
}) {
  const theme = useTheme();
  const isDark = theme === "dark";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-lg text-left transition-colors",
          variant === "sidebar"
            ? "px-2 py-2 text-slate-200 hover:bg-white/5"
            : "px-1.5 py-1 text-slate-300 hover:bg-white/10",
        )}
        aria-label={`${userName} ${userEmail}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-white">{userName}</span>
          <span className="block truncate text-[11px] text-slate-400">{userEmail}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-slate-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-52">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toggleTheme()} className="gap-2">
          {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSignOut()} className="gap-2">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar({
  active,
  onNavigate,
  userName,
  userEmail,
  onSignOut,
}: {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-slate-800 lg:flex dark:bg-slate-900">
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
                        ? "bg-emerald-500/15 text-emerald-300 shadow-[inset_3px_0_0_0_theme(colors.emerald.500)]"
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
        <div className="space-y-3 border-t border-white/10 px-3 py-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Synced
          </span>
          <UserMenu userName={userName} userEmail={userEmail} onSignOut={onSignOut} />
        </div>
      </div>
    </aside>
  );
}

export function MobileTopNav({
  active,
  onNavigate,
  userName,
  userEmail,
  menuOpen,
  onToggleMenu,
  onSignOut,
}: {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  userName: string;
  userEmail: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onSignOut: () => void;
}) {
  const theme = useTheme();
  const isDark = theme === "dark";
  const handleNavigate = useCallback(
    (view: ViewId) => {
      onNavigate(view);
    },
    [onNavigate],
  );

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <Wallet className="h-4 w-4 text-white" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Finara</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Synced
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleTheme()}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isDark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onToggleMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav
          id="mobile-nav-menu"
          aria-label="Main navigation"
          className="absolute inset-x-0 top-[57px] z-20 border-b border-slate-700 bg-slate-800 px-3 py-3 shadow-lg lg:hidden dark:border-slate-800 dark:bg-slate-900"
        >
          <ul className="grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id}>
                  <Link
                    href="/"
                    onClick={(event) => {
                      event.preventDefault();
                      handleNavigate(item.id);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-t border-white/10 pt-3">
            <UserMenu userName={userName} userEmail={userEmail} onSignOut={onSignOut} variant="header" />
          </div>
        </nav>
      ) : null}
    </div>
  );
}
