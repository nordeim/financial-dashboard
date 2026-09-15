"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import {
  ChartPie,
  DollarSign,
  Download,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wifi,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getServerTheme, getThemeSnapshot, subscribeTheme, toggleTheme, type Theme } from "@/components/finara/theme";

// Source-exact nav items (icons verified against the live sidebar DOM 2026-09-15).
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "income", label: "Income", icon: TrendingUp },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "accounts", label: "Accounts", icon: Landmark },
  { id: "investments", label: "Investments", icon: Wallet },
  { id: "import", label: "Import", icon: Download },
  { id: "analytics", label: "Analytics", icon: ChartPie },
  { id: "goals", label: "Goals", icon: Target },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type ViewId = (typeof NAV_ITEMS)[number]["id"];

function useTheme(): Theme | null {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerTheme);
}

/** Brand block: glassy emerald dollar-sign tile + wordmark (live-exact). */
function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/20 backdrop-blur-sm",
          compact ? "h-8 w-8" : "h-10 w-10",
        )}
      >
        <DollarSign className={cn("text-emerald-400", compact ? "h-5 w-5" : "h-6 w-6")} aria-hidden />
      </div>
      {compact ? (
        <h2 className="text-lg font-bold text-primary-navy dark:text-white">Finara</h2>
      ) : (
        <div>
          <h2 className="text-xl font-bold text-white">Finara</h2>
          <p className="text-xs text-slate-400">Smart Finance Tracker</p>
        </div>
      )}
    </div>
  );
}

/** "Synced" status badge with wifi glyph (live-exact outline style). */
function SyncedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-green-300 px-2.5 py-0.5 text-xs font-semibold text-green-600 dark:border-green-600 dark:text-green-400">
      <Wifi className="h-3 w-3" aria-hidden />
      Synced
    </span>
  );
}

/** User avatar + dropdown: Dark Mode / Sign Out (live-exact surface). */
function UserMenu({
  userName,
  userEmail,
  onSignOut,
}: {
  userName: string;
  userEmail: string;
  onSignOut: () => void;
}) {
  const theme = useTheme();
  const isDark = theme === "dark";
  const initial = userName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 w-full items-center gap-3 rounded-xl bg-white/10 p-3 text-left backdrop-blur-sm transition-colors hover:bg-accent dark:bg-gray-800/50"
        aria-label={`${userName} ${userEmail}`}
      >
        <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-semibold text-slate-600 dark:text-slate-200">
            {initial}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white dark:text-gray-200">{userName}</span>
          <span className="block truncate text-xs text-slate-400 dark:text-gray-400">{userEmail}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-slate-400"
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
    <aside className="hidden w-64 shrink-0 flex-col lg:flex">
      <div className="sidebar-gradient flex min-h-0 flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-slate-700/30 px-6">
          <BrandMark />
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <ul className="space-y-2">
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
                  >
                    <span
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200",
                        isActive
                          ? "border border-emerald-400/30 bg-emerald-500/20 text-white shadow-lg backdrop-blur-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-3 border-t border-slate-700/30 p-4">
          <SyncedBadge />
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
      <div className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
        <div className="flex h-16 items-center justify-between px-4">
          <BrandMark compact />
          <div className="flex items-center gap-2">
            <SyncedBadge />
            <button
              type="button"
              onClick={() => toggleTheme()}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
            >
              {isDark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={onToggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-gray-800"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
      {/* pt-20 clears the fixed top bar (live: flex flex-col h-full pt-20). */}
      <div className="h-16" aria-hidden />
      {menuOpen ? (
        <nav
          id="mobile-nav-menu"
          aria-label="Main navigation"
          className="fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900 lg:hidden"
        >
          <div className="flex h-full flex-col pt-20">
            <ul className="flex-1 space-y-2 px-4 py-6">
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
                    >
                      <span
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-4 font-medium transition-all duration-200",
                          isActive
                            ? "border border-emerald-400/30 bg-emerald-500/20 text-white shadow-lg backdrop-blur-sm"
                            : "text-slate-300 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden />
                        <span className="text-lg">{item.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-3 border-t border-slate-700/30 p-4">
              <SyncedBadge />
              <UserMenu userName={userName} userEmail={userEmail} onSignOut={onSignOut} />
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
