import type { ViewId } from "@/components/finara/sidebar";

/**
 * Live route architecture (round 8, ADR-021 — probed 2026-09-17).
 *
 * The live Finara app is an SPA served over REAL paths: /Dashboard …
 * /Settings. `/` renders the dashboard content with NO active nav pill;
 * /Dashboard is the home route (bare title) and IS marked active. Unknown
 * paths render a standalone 404 page whose title camelCase-splits the raw
 * segment ("NonexistentPage" → "Nonexistent Page | Finara"). Unauthenticated
 * deep links redirect to /login?from_url=<url> and login returns there.
 */

export const VIEW_PATHS: Record<ViewId, string> = {
  dashboard: "/Dashboard",
  income: "/Income",
  expenses: "/Expenses",
  accounts: "/Accounts",
  investments: "/Investments",
  import: "/Import",
  analytics: "/Analytics",
  goals: "/Goals",
  settings: "/Settings",
};

const PATH_TO_VIEW: Record<string, ViewId> = Object.fromEntries(
  (Object.keys(VIEW_PATHS) as ViewId[]).map((view) => [VIEW_PATHS[view].toLowerCase(), view]),
) as Record<string, ViewId>;

export type AppRoute =
  | { kind: "view"; view: ViewId; active: ViewId | null; title: string }
  | { kind: "login"; title: string }
  | { kind: "not-found"; segment: string; title: string };

/** Home route (bare document title — live-probed for `/` and `/Dashboard`). */
const HOME_VIEWS = new Set<string>(["/", "/dashboard"]);

/** camelCase segment → spaced title ("NonexistentPage" → "Nonexistent Page"). */
export function segmentToTitle(segment: string): string {
  const spaced = segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function parseRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const lower = clean.toLowerCase();

  if (clean === "/" || lower === "/dashboard") {
    return {
      kind: "view",
      view: "dashboard",
      // `/` shows no active pill; `/Dashboard` marks itself active (probed).
      active: clean === "/" ? null : "dashboard",
      title: "Finara",
    };
  }
  if (lower === "/login") {
    // Round-12 live probe (round-8 left the login title unprobed): the live
    // app titles its login surface bare "Finara" — in BOTH the direct-visit
    // and the unauth-redirect-from-deep-link cases.
    return { kind: "login", title: "Finara" };
  }
  const view = PATH_TO_VIEW[lower];
  if (view) {
    const label = view.charAt(0).toUpperCase() + view.slice(1);
    return { kind: "view", view, active: view, title: `${label} | Finara` };
  }
  const segment = clean.split("/").filter(Boolean).pop() ?? "";
  return { kind: "not-found", segment, title: `${segmentToTitle(segment)} | Finara` };
}

/** The path a client-side navigation should push for a view. */
export function pathForView(view: ViewId): string {
  return VIEW_PATHS[view];
}
