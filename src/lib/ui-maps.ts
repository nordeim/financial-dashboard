import { Banknote, Brain, Building, Landmark, Lightbulb, Target, TrendingUp, TriangleAlert, type LucideIcon } from "lucide-react";

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

/** Priority pill classes on goal cards (live-verified: high=red, medium=yellow, low=green;
 * rendered through Badge variant="secondary" — the live pills carry no dark variants). */
export const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

/**
 * Recent Activity row badges (round 4, live-verified 2026-09-15 by creating
 * throwaway records of each category on the live app). Rendered through
 * Badge variant="secondary"; the live pills carry NO border color variant and
 * use the 900/30 dark surface (unlike the expense-row CATEGORY_BADGE).
 * Income categories: primary=green, secondary=orange, passive/other=gray.
 * Savings=emerald follows the app-wide 50/30/20 hue convention (Reasoned).
 */
export const ACTIVITY_BADGE: Record<string, string> = {
  primary: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  secondary: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  passive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  needs: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  wants: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  savings: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
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

/**
 * AI Insights maps (round 13, live-probed 2026-09-18). The live card
 * renders the RAW insight_type id as the badge text with per-type colors,
 * and maps each type to a lucide icon: anomaly|alert → TriangleAlert,
 * trend → TrendingUp, opportunity → Lightbulb, prediction → Target,
 * default (and the empty state) → Brain.
 */
export const INSIGHT_TYPE_BADGE: Record<string, string> = {
  anomaly: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  alert: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  trend: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  opportunity: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  prediction: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
};

export const INSIGHT_TYPE_ICON: Record<string, LucideIcon> = {
  anomaly: TriangleAlert,
  alert: TriangleAlert,
  trend: TrendingUp,
  opportunity: Lightbulb,
  prediction: Target,
};

/** Fallback icon for unknown types (the live's default case). */
export const INSIGHT_ICON_DEFAULT: LucideIcon = Brain;
