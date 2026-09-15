import { Banknote, Building, Landmark, type LucideIcon } from "lucide-react";

/**
 * Source-exact UI maps captured from the live Finara app on 2026-09-15.
 * Every value below was verified against the live DOM (see
 * `docs/plans/2026-09-15-parity-remediation-round3.md` and the
 * `audit/round3/live-dom/` evidence archive).
 *
 * These maps are intentionally plain data: views consume them directly so
 * there is exactly one place where source-app colors, emojis and icon
 * choices live. Do not fork these values into components.
 */

/** Fixed per-sector dot colors (Investments > Sector Allocation).
 * Proven stable across rank changes on the live app — the color follows
 * the sector NAME, not its ranking. */
export const SECTOR_COLORS: Record<string, string> = {
  technology: "#3B82F6", // blue-500
  healthcare: "#10B981", // emerald-500
  finance: "#8B5CF6", // violet-500
  energy: "#F59E0B", // amber-500
  consumer: "#EF4444", // red-500
  industrial: "#6B7280", // gray-500
  "real-estate": "#06B6D4", // cyan-500
  utilities: "#84CC22", // lime-500
  other: "#D1D5DB", // gray-300
};

/** Goal card emoji — every goal tile shares the same purple gradient;
 * only the emoji distinguishes categories (live-verified). */
export const GOAL_EMOJI: Record<string, string> = {
  emergency: "🛡️",
  vacation: "✈️",
  home: "🏠",
  car: "🚗",
  education: "🎓",
  retirement: "🏖️",
  other: "🎯",
};

/** Priority pill classes on goal cards (live-verified: high=red, medium=yellow, low=green). */
export const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-transparent",
  medium: "bg-yellow-100 text-yellow-800 border-transparent",
  low: "bg-green-100 text-green-800 border-transparent",
};

/** 50/30/20 bucket dots used on budget rows and expense summary cards. */
export const CATEGORY_DOT: Record<string, string> = {
  needs: "bg-blue-500",
  wants: "bg-purple-500",
  savings: "bg-emerald-500",
};

/** Expense row category badge classes (solid soft pill + border variant). */
export const CATEGORY_BADGE: Record<string, string> = {
  needs: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  wants:
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
  savings:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
};

/** Account card tile icons by account type (live-verified). All tiles share
 * the same blue-100 surface; only the icon varies. */
export const ACCOUNT_TYPE_ICONS: Record<string, LucideIcon> = {
  checking: Banknote,
  savings: Landmark,
  "credit-card": Banknote,
  investment: Building,
  other: Building,
};

/** Shared goal tile gradient (every category uses the same purple ramp). */
export const GOAL_TILE_GRADIENT = "bg-gradient-to-r from-purple-500 to-purple-600";
