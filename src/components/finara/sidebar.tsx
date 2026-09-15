"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
    <div className="inline-flex items-center gap-1 rounded-md border border-green-300 px-2.5 py-0.5 text-xs font-semibold text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-green-600 dark:text-green-400">
      <Wifi className="h-3 w-3" aria-hidden />
      Synced
    </div>
  );
}

/** User avatar + dropdown: My Account / Dark Mode / Sign Out (live-exact surface). */
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
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-9 w-full items-center gap-3 rounded-xl bg-white/10 p-3 text-left backdrop-blur-sm dark:bg-gray-800/50"
          aria-label={`${userName} ${userEmail}`}
        >
          <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">{initial}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white dark:text-gray-200">{userName}</p>
            <p className="truncate text-xs text-slate-400 dark:text-gray-400">{userEmail}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toggleTheme()}>
          {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onSignOut()} className="text-red-500 focus:text-red-500">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Live nav item anatomy: plain anchor wrapping a div (tabindex=0) that
 * carries the pill classes — no ul/li, no span. */
function NavItem({
  item,
  active,
  onNavigate,
  compact = false,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onNavigate: (view: ViewId) => void;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      onClick={(event) => {
        event.preventDefault();
        onNavigate(item.id);
      }}
      aria-current={active ? "page" : undefined}
    >
      <div
        tabIndex={0}
        className={cn(
          "flex items-center gap-3 rounded-xl font-medium transition-all duration-200",
          compact ? "px-4 py-4" : "px-4 py-3",
          active
            ? cn(
                "border border-emerald-400/30 bg-emerald-500/20 text-white shadow-lg",
                // Desktop active pill carries the blur; the mobile drawer's does not (live-verified).
                compact ? undefined : "backdrop-blur-sm",
              )
            : "text-slate-300 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className={compact ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
        <span className={compact ? "text-lg" : undefined}>{item.label}</span>
      </div>
    </Link>
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
    <aside className="hidden lg:flex lg:w-64 lg:flex-col">
      <div className="sidebar-gradient flex min-h-0 flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-slate-700/30 px-6">
          <BrandMark />
        </div>
        <nav className="flex-1 space-y-2 px-4 py-6">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} active={item.id === active} onNavigate={onNavigate} />
          ))}
        </nav>
        <div className="space-y-3 border-t border-slate-700/30 p-4">
          <SyncedBadge />
          <div className="flex items-center gap-3">
            <UserMenu userName={userName} userEmail={userEmail} onSignOut={onSignOut} />
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
    <div>
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm lg:hidden dark:border-gray-700 dark:bg-gray-900/95">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <DollarSign className="h-5 w-5 text-white" aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-primary-navy dark:text-white">Finara</h2>
          </div>
          <div className="flex items-center gap-2">
            <SyncedBadge />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleTheme()}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="h-8 w-8 text-gray-700 dark:text-gray-300"
            >
              {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="h-9 w-9 text-gray-700 dark:text-gray-300"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          className="fixed inset-0 z-40 bg-slate-800 lg:hidden dark:bg-gray-900"
        >
          <div className="flex h-full flex-col pt-20">
            <nav className="flex-1 space-y-2 px-4 py-6">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} active={item.id === active} onNavigate={handleNavigate} compact />
              ))}
            </nav>
            <div className="space-y-3 border-t border-slate-700/30 p-4">
              <SyncedBadge />
              <UserMenu userName={userName} userEmail={userEmail} onSignOut={onSignOut} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
