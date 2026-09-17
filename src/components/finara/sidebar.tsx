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
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VIEW_PATHS } from "@/lib/routes";
import { getServerTheme, getThemeSnapshot, subscribeTheme, toggleTheme, type Theme } from "@/components/finara/theme";

/**
 * Round-10 (live-probed): the live app persists its theme on the user record
 * (PUT User/me fires on every toggle), which is what restores dark after a
 * sign-out/sign-in cycle (sign-out clears the local copy). Mirror the
 * persistence with a fire-and-forget settings PUT — the local apply stays
 * synchronous and a failed PUT never blocks or reverts it.
 */
function toggleThemeAndPersist(): void {
  toggleTheme();
  // After the toggle the snapshot IS the new theme — persist exactly that.
  void fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme: getThemeSnapshot() ?? "light" }),
  }).catch(() => {
    // Best-effort persistence only — the local theme already applied.
  });
}

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
          compact ? "w-8 h-8" : "w-10 h-10",
          "bg-emerald-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-emerald-400/30",
        )}
      >
        <DollarSign className={cn("text-emerald-400", compact ? "w-5 h-5" : "w-6 h-6")} aria-hidden />
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

/** "Synced" status badge (round 8 re-pin): the live app renders the Badge
 *  component + `gap-1 text-green-600 border-green-300 dark:*` tail — base
 *  classes first, usage tail last (plan F14). */
function SyncedBadge() {
  return (
    <Badge className="gap-1 text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
      <Wifi className="w-3 h-3" aria-hidden />
      Synced
    </Badge>
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
          className="h-9 flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm w-full text-left"
          aria-label={`${userName} ${userEmail}`}
        >
          <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">{initial}</span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white dark:text-gray-200 truncate">{userName}</p>
            <p className="text-xs text-slate-400 dark:text-gray-400 truncate">{userEmail}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toggleThemeAndPersist()}>
          {isDark ? <Sun className="w-4 h-4 mr-2" aria-hidden /> : <Moon className="w-4 h-4 mr-2" aria-hidden />}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onSignOut()} className="text-red-500 focus:text-red-500">
          <LogOut className="w-4 h-4 mr-2" aria-hidden />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Live nav item anatomy: plain anchor wrapping a div (tabindex=0) that
 * carries the pill classes — no ul/li, no span. Round 8: the anchors point
 * at the REAL live routes (the SPA intercepts the click, plan F10), and the
 * padding classes sit between gap-3 and rounded-xl (live order, F15). */
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
      href={VIEW_PATHS[item.id]}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(item.id);
      }}
      aria-current={active ? "page" : undefined}
    >
      <div
        tabIndex={0}
        className={cn(
          "flex items-center gap-3",
          compact ? "px-4 py-4" : "px-4 py-3",
          "rounded-xl font-medium transition-all duration-200",
          active
            ? cn(
                // Live active-pill order (F15): bg, text, shadow, border — and
                // the desktop pill alone carries the blur.
                "bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30",
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
  /** Round 8: `/` renders the dashboard with NO active pill (plan F10). */
  active: ViewId | null;
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
  menuOpen,
  onToggleMenu,
  onSignOut,
}: {
  active: ViewId | null;
  onNavigate: (view: ViewId) => void;
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
      {/* Round 8 (F14): live mobile-header orders — container, inner row,
          brand tile, and the two ghost buttons (theme w-8 h-8, menu h-9 w-9). */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-primary-navy dark:text-white">Finara</h2>
          </div>
          <div className="flex items-center gap-2">
            <SyncedBadge />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleThemeAndPersist()}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="w-8 h-8 text-gray-700 dark:text-gray-300"
            >
              {isDark ? <Sun className="w-4 h-4" aria-hidden /> : <Moon className="w-4 h-4" aria-hidden />}
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
              {/* Round-10 (live-probed): the live menu button swaps its glyph to
                  lucide-x (w-5 h-5) while the drawer is open. */}
              {menuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
            </Button>
          </div>
        </div>
      </div>
      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          className="lg:hidden fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900"
        >
          <div className="flex flex-col h-full pt-20">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} active={item.id === active} onNavigate={handleNavigate} compact />
              ))}
            </nav>
            {/* Live drawer bottom (round-5): a direct full-width Sign Out
                button — no Synced badge, no user menu (the badge lives in the
                mobile top bar; Dark Mode has its own top-bar toggle). */}
            <div className="border-t border-slate-700/30 p-4">
              <Button
                variant="outline"
                onClick={onSignOut}
                className="w-full text-white border-slate-600 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" aria-hidden />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
