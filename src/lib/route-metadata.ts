import type { Metadata } from "next";

import { VIEW_PATHS, parseRoute } from "@/lib/routes";

/**
 * Per-route <head> metadata seam (round 17, live-probed 2026-09-19).
 *
 * The live app's server-rendered head mirrors the document title per
 * route and canonicalizes every path: og:title is the same string as the
 * <title> (bare "Finara" on /, /Dashboard and /login; "Goals | Finara"
 * on view routes; even the 404 route camelCase-splits its segment), and
 * og:url is the per-route canonical — the full path for views, /login
 * and not-found routes, EXCEPT the dashboard, whose canonical normalizes
 * to "/" (a live quirk: /Dashboard and / are the same page to the live's
 * template). This module is the pure seam that computes both, so the
 * page files stay thin wrappers (the repo's TDD-seam principle — the
 * page components pull the client React graph and cannot be imported in
 * unit tests).
 *
 * NOTE: Next merges metadata SHALLOWLY per top-level key — a page-level
 * `openGraph` REPLACES the layout's entirely — so this seam returns the
 * COMPLETE openGraph block (title/url plus the description/siteName/
 * type/images defaults), not just the per-route fields.
 */

/** The deployable origin: set NEXT_PUBLIC_SITE_URL in production. */
export function siteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** The live root description (byte-exact, probed 2026-09-19). */
export const SITE_DESCRIPTION =
  "Finara is your intelligent financial co-pilot, designed to bring clarity and control to your personal finances. Effortlessly track income, manage expenses, set and achieve savings goals, and gain deep insights into your spending habits with our intuitive, premium dashboard.";

/** The per-route canonical path (the dashboard canonical is "/" — live quirk). */
function canonicalPath(rawPath: string, kind: string, view?: string): string {
  if (kind === "view") {
    return view === "dashboard" ? "/" : VIEW_PATHS[view as keyof typeof VIEW_PATHS];
  }
  if (kind === "login") return "/login";
  // not-found: canonicalize the cleaned requested path (like the live).
  return rawPath.replace(/\/+$/, "") || "/";
}

/** Build the per-route Metadata (title + description + canonical + the full og block). */
export function buildRouteMetadata(rawPath: string): Metadata {
  const route = parseRoute(rawPath);
  const canonical = canonicalPath(rawPath, route.kind, route.kind === "view" ? route.view : undefined);
  return {
    title: route.title,
    description: SITE_DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: route.title,
      description: SITE_DESCRIPTION,
      url: canonical,
      siteName: "Finara",
      type: "website",
      images: [{ url: "/finara-logo.png", width: 480, height: 480 }],
    },
  };
}
