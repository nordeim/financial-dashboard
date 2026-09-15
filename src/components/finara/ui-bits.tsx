"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * Shared Finara UI primitives restyled to the source app's exact surface
 * language (verified via live DOM capture 2026-09-15 — see
 * docs/plans/2026-09-15-parity-remediation-round3.md).
 */

/** Source-exact card surface: translucent white, blur, no border, soft shadow. */
export const CARD_SURFACE = "rounded-xl border-0 bg-white/80 text-card-foreground shadow-lg backdrop-blur-sm dark:bg-gray-800/80";

/** Standard page header block used by every view (live-exact). */
export function ViewHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-primary-navy lg:text-4xl dark:text-white">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
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
    <span className="flex items-center gap-1">
      <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden />
      <span className="text-sm font-medium text-emerald-500">{rounded.toFixed(1)}%</span>
    </span>
  );
}

/** KPI stat card with gradient icon tile, label, value and live trend chip. */
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
    <Card className={cn(CARD_SURFACE, "card-hover")}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</p>
            <p className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
            {trend !== undefined ? <TrendPill value={trend} /> : null}
          </div>
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconClass)}>
            <Icon className="h-6 w-6 text-white" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Colored gradient feature tile (dashboard action row) — live-exact anatomy. */
export function GradientCard({
  title,
  subtitle,
  value,
  icon: Icon,
  gradient,
  onClick,
  ariaLabel,
}: {
  title: string;
  subtitle: string;
  value?: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const inner = (
    <div className="flex h-full items-center justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-white/80">{title}</p>
        <p className="text-2xl font-bold text-white capitalize">{value}</p>
        <p className="text-lg text-white/80">{subtitle}</p>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-8 w-8 text-white" aria-hidden />
      </div>
    </div>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? `${title} ${subtitle}`}
        className={cn(
          "card-hover w-full rounded-2xl p-6 text-left text-white shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          gradient,
        )}
      >
        {inner}
      </button>
    );
  }
  return <div className={cn("w-full rounded-2xl p-6 text-white shadow-lg", gradient)}>{inner}</div>;
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
  action?: React.ReactNode;
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

/** Section card on the source card surface. Two live header variants:
 * feature cards (Budget Overview) use a text-xl bold title; list cards use a
 * font-semibold tracking-tight title with an optional leading icon. */
export function SectionCard({
  title,
  icon: Icon,
  badge,
  children,
  actions,
  className,
  contentClassName,
}: {
  title: React.ReactNode;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn(CARD_SURFACE, className)}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-5 w-5 text-primary-navy dark:text-white" aria-hidden /> : null}
            <h2 className="flex items-center gap-2 font-semibold leading-none tracking-tight text-primary-navy dark:text-white">
              {title}
            </h2>
            {badge}
          </div>
          {actions}
        </div>
        <div className={contentClassName}>{children}</div>
      </CardContent>
    </Card>
  );
}

/** Budget surplus pill (live: emerald-100 with trending-up glyph). */
export function SurplusBadge({ amountMinor }: { amountMinor: number }) {
  const positive = amountMinor >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold shadow transition-colors",
        positive
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      )}
    >
      <TrendingUp className="h-3 w-3" aria-hidden />
      {formatSigned(positive ? amountMinor : -amountMinor)} {positive ? "surplus" : "deficit"}
    </span>
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
