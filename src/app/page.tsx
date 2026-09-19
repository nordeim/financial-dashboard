import type { Metadata } from "next";
import { FinaraApp } from "@/components/finara/finara-app";
import { buildRouteMetadata } from "@/lib/route-metadata";

/** `/` (live-probed round 8): renders the dashboard content, bare title,
 *  and NO active nav pill — the home marker is normalized by FinaraApp.
 *  Round 17: the head metadata comes from the per-route seam (canonical
 *  "/" + og:title "Finara" — same as /Dashboard, the live quirk). */
export const metadata: Metadata = buildRouteMetadata("/");

export default function Home() {
  return <FinaraApp route={{ kind: "home" }} />;
}
