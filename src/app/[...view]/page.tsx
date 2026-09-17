import type { Metadata } from "next";
import { FinaraApp } from "@/components/finara/finara-app";
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
  return { title: parseRoute("/" + view.join("/")).title };
}

export default async function CatchAllViewPage({ params }: PageProps) {
  const { view } = await params;
  const route = parseRoute("/" + view.join("/"));
  return <FinaraApp route={route} />;
}
