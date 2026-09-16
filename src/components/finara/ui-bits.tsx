"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Shared Finara UI primitives restyled to the source app's exact surface
 * language (round-3) and restructured to the live DOM anatomy (round 4,
 * 2026-09-15 — see docs/plans/2026-09-15-parity-remediation-round4.md).
 */

/** Source-exact card surface: translucent white, blur, no border, soft shadow. */
export const CARD_SURFACE = "rounded-xl border-0 bg-white/80 text-card-foreground shadow-lg backdrop-blur-sm dark:bg-gray-800/80";

/** Standard page header block used by every view (live-exact).
 *
 * Live renders three header anatomies:
 *  - with actions: `div.flex.flex-col.lg:flex-row.justify-between.items-start.lg:items-center.mb-8.gap-4`
 *    wrapping an inner `div > h1.mb-2 + p` plus `div.flex.gap-3` (the CTAs);
 *  - without actions (settings): a plain `div.mb-8 > h1.mb-2 + p`;
 *  - bare (import): no wrapper at all — `h1.mb-2` + `p.mb-8` directly,
 *    because the live import view never adopted the header component.
 */
export function ViewHeader({
  title,
  subtitle,
  actions,
  bare = false,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  bare?: boolean;
}) {
  if (bare) {
    return (
      <>
        <h1 className="mb-2 text-3xl font-bold text-primary-navy lg:text-4xl dark:text-white">{title}</h1>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400">{subtitle}</p>
      </>
    );
  }
  if (!actions) {
    return (
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-primary-navy lg:text-4xl dark:text-white">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{subtitle}</p>
      </div>
    );
  }
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-primary-navy lg:text-4xl dark:text-white">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{subtitle}</p>
      </div>
      {/* Round-5: live renders header actions directly in the flex row (no
          wrapper) — analytics passes its own flex-wrap wrapper (live-exact). */}
      {actions}
    </div>
  );
}

/**
 * Classic lucide "filter" glyph (angular polygon). The live app pins an older
 * lucide-react whose Filter icon is this shape; modern lucide redesigned it
 * (rounded corners) and renamed it Funnel, keeping Filter as an alias. Render
 * the live-exact SVG inline so the DOM matches the capture (round 4).
 */
export function ClassicFilterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide lucide-filter", className)}
      aria-hidden
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

/**
 * KPI trend chip — mirrors the live app exactly: ALWAYS a TrendingUp glyph
 * in emerald (the source renders the same chip for positive and negative
 * placeholder values alike; e.g. "-3.1%" still shows an up-arrow in green).
 */
export function TrendPill({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  const rounded = Math.round(value * 10) / 10;
  return (
    <div className="flex items-center gap-1">
      <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden />
      <span className="text-sm font-medium text-emerald-500">{rounded.toFixed(1)}%</span>
    </div>
  );
}

/** KPI stat card — live anatomy: plain card div (no Card substructure),
 * flex items-start justify-between, gradient icon circle without shrink-0. */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  trend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  trend?: number | null;
}) {
  return (
    <div className={cn(CARD_SURFACE, "card-hover p-6")}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
          <p className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
          {trend !== undefined ? <TrendPill value={trend} /> : null}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconClass)}>
          <Icon className="h-6 w-6 text-white" aria-hidden />
        </div>
      </div>
    </div>
  );
}

/** Colored gradient feature tile (dashboard action row) — live anatomy:
 * plain orange/cyan divs (no shadow, no h-full); the blue/purple interactive
 * tiles are DIVs with card-hover whose CONTENT is an anchor wrapping an
 * h-full inner row. Only the largest-category tile capitalizes its value. */
export function GradientCard({
  title,
  subtitle,
  value,
  icon: Icon,
  gradient,
  onClick,
  href,
  capitalizeValue = false,
  ariaLabel,
}: {
  title: string;
  subtitle: string;
  value?: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  /** Live href for the interactive tiles (e.g. "/Import"). */
  href?: string;
  capitalizeValue?: boolean;
  ariaLabel?: string;
}) {
  const inner = (
    <div className={cn("flex items-center justify-between", onClick ? "h-full" : undefined)}>
      <div>
        <p className={cn("mb-1 text-sm font-medium", titleTint(gradient))}>{title}</p>
        <p className={cn("text-2xl font-bold", capitalizeValue ? "capitalize" : undefined)}>{value}</p>
        <p className={cn("text-lg", titleTint(gradient))}>{subtitle}</p>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-8 w-8" aria-hidden />
      </div>
    </div>
  );
  if (onClick) {
    return (
      <div className={cn("card-hover rounded-2xl p-6 text-white", gradient)}>
        <a
          href={href ?? "#"}
          onClick={(event) => {
            event.preventDefault();
            onClick();
          }}
          aria-label={ariaLabel ?? `${title} ${subtitle}`}
        >
          {inner}
        </a>
      </div>
    );
  }
  return <div className={cn("rounded-2xl p-6 text-white", gradient)}>{inner}</div>;
}

function titleTint(gradient: string): string {
  if (gradient.includes("orange")) return "text-orange-100";
  if (gradient.includes("cyan")) return "text-cyan-100";
  if (gradient.includes("blue")) return "text-blue-100";
  return "text-purple-100";
}

/** Empty state with icon, heading, copy and optional CTA. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-700">
        <Icon className="h-7 w-7 text-slate-400" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{body}</p>
      {action}
    </div>
  );
}

/**
 * Section card on the source card surface, classic Card anatomy (round 4):
 * CardHeader (`flex flex-col space-y-1.5 p-6`) + CardContent (`p-6 pt-0`).
 * Two live title variants: plain cards (Budget Overview, Recent Activity)
 * use `text-xl font-bold`; icon cards (AI Insights) use the CardTitle
 * `font-semibold leading-none tracking-tight` + `flex items-center gap-2`.
 * A badge or actions node moves the title into a justify-between row.
 */
export function SectionCard({
  title,
  icon: Icon,
  badge,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
}: {
  title: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}) {
  const titleNode = Icon ? (
    <CardTitle className="flex items-center gap-2 font-semibold leading-none tracking-tight text-primary-navy dark:text-white">
      <Icon className="h-5 w-5" aria-hidden />
      {title}
    </CardTitle>
  ) : (
    <CardTitle className="text-xl font-bold tracking-tight text-primary-navy dark:text-white">{title}</CardTitle>
  );
  const trailing = badge ?? actions;
  return (
    <Card className={cn(CARD_SURFACE, className)}>
      <CardHeader className={headerClassName}>
        {trailing ? (
          <div className="flex items-center justify-between">
            {titleNode}
            {trailing}
          </div>
        ) : (
          titleNode
        )}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

/** Budget surplus pill (live: default Badge + emerald classes + trending-up
 * glyph at w-3 h-3 mr-1). */
export function SurplusBadge({ amountMinor }: { amountMinor: number }) {
  const positive = amountMinor >= 0;
  return (
    <Badge
      className={cn(
        positive
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      )}
    >
      <TrendingUp className="mr-1 h-3 w-3" aria-hidden />
      {formatSigned(positive ? amountMinor : -amountMinor)} {positive ? "surplus" : "deficit"}
    </Badge>
  );
}

function formatSigned(amountMinor: number): string {
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  return formatter.format(amountMinor / 100);
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-gray-700/50" />
      ))}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-800 dark:bg-red-900/20"
      role="alert"
    >
      <p className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
