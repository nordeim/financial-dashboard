import type { Metadata, Viewport } from "next";
import { FinaraApp } from "@/components/finara/finara-app";
import { buildRouteMetadata, buildRouteViewport } from "@/lib/route-metadata";
import { parseRoute } from "@/lib/routes";

/**
 * Catch-all route (round 8, ADR-021 — live-probed 2026-09-17).
 *
 * The live Finara SPA serves real paths — /Dashboard, /Income, /Expenses,
 * /Accounts, /Investments, /Import, /Analytics, /Goals, /Settings, plus
 * /login and a standalone 404 for anything else. Static segments (src/app/api,
 * the root page) win over this catch-all, so the API routes are unaffected.
 */

type PageProps = { params: Promise<{ view: string[] }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { view } = await params;
  // Round 17: per-route title + canonical + og (the live's head mirrors the
  // document title per route; the dashboard canonical normalizes to "/").
  // Round 18: the seam also carries the per-route twitter block, the
  // login-only icons, and the login-only og:image descriptor.
  return buildRouteMetadata("/" + view.join("/"));
}

/**
 * Round 18 (live-probed 2026-09-19): the viewport/theme-color pair moved
 * to the LOGIN route only — app pages render the plain viewport. The seam
 * returns the complete object per route (deterministic regardless of
 * Next's layout→page viewport merge semantics).
 */
export async function generateViewport({ params }: PageProps): Promise<Viewport> {
  const { view } = await params;
  return buildRouteViewport("/" + view.join("/"));
}

export default async function CatchAllViewPage({ params }: PageProps) {
  const { view } = await params;
  const route = parseRoute("/" + view.join("/"));
  return <FinaraApp route={route} />;
}
