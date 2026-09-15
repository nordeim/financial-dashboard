"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/** Standard page header block used by every view. */
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Percentage trend chip with directional icon. */
export function TrendPill({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <Minus className="h-3.5 w-3.5" aria-hidden /> —
      </span>
    );
  }
  const rounded = Math.round(value * 10) / 10;
  const positive = rounded >= 0;
  const good = invert ? !positive : positive;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {positive ? "+" : ""}
      {rounded.toFixed(1)}%
    </span>
  );
}

/** KPI stat card with icon tile, label, value and optional trend. */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  trend,
  invertTrend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  trend?: number | null;
  invertTrend?: boolean;
}) {
  return (
    <Card className="border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 truncate text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
            {trend !== undefined ? (
              <div className="mt-2">
                <TrendPill value={trend} invert={invertTrend} />
              </div>
            ) : null}
          </div>
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", iconClass)}>
            <Icon className="h-6 w-6 text-white" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Colored gradient feature card used on the dashboard second row. */
export function GradientCard({
  title,
  subtitle,
  value,
  caption,
  icon: Icon,
  gradient,
  onClick,
  ariaLabel,
}: {
  title: string;
  subtitle: string;
  value?: string;
  caption?: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const content = (
    <>
      <div className="relative z-10 flex flex-col gap-1">
        <p className="text-sm font-semibold text-white/90">{title}</p>
        {value ? <p className="text-2xl font-bold text-white">{value}</p> : null}
        <p className="text-xs text-white/75">{subtitle}</p>
        {caption ? <p className="mt-1 text-xs text-white/70">{caption}</p> : null}
      </div>
      <Icon className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 text-white/30" aria-hidden />
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? `${title} ${subtitle}`}
        className={cn(
          "relative flex min-h-[140px] w-full flex-col justify-center overflow-hidden rounded-2xl p-5 text-left shadow-md transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:-translate-y-0.5",
          gradient,
        )}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={cn("relative flex min-h-[140px] flex-col justify-center overflow-hidden rounded-2xl p-5", gradient)}>
      {content}
    </div>
  );
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
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
        <Icon className="h-7 w-7 text-slate-400 dark:text-slate-400" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action}
    </div>
  );
}

/** Section card header with optional trailing badge/content. */
export function SectionCard({
  title,
  badge,
  children,
  actions,
  className,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-none shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800", className)}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
            {badge}
          </div>
          {actions}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function SurplusBadge({ amountMinor }: { amountMinor: number }) {
  const positive = amountMinor >= 0;
  return (
    <Badge
      variant="outline"
      className={
        positive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
      }
    >
      {positive ? "surplus" : "deficit"} · {formatSigned(positive ? amountMinor : -amountMinor)}
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
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900 dark:bg-red-950/40"
      role="alert"
    >
      <p className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-slate-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
