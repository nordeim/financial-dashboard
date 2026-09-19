import type { MetadataRoute } from "next";

import { siteBaseUrl } from "@/lib/route-metadata";

/**
 * sitemap.xml (round 17, live-probed 2026-09-19).
 *
 * The live's sitemap lists exactly 9 URLs — `/` at priority 1.0 plus the
 * eight non-dashboard views at 0.8, all weekly — with NO /Dashboard
 * entry (the dashboard canonicalizes to `/`) and NO /login. The view
 * order mirrors the live file. URLs are absolute against the site base
 * (NEXT_PUBLIC_SITE_URL — a deployment property; the shape is the parity
 * contract). Before this route existed, /sitemap.xml fell through the
 * [...view] catch-all and rendered the NotFoundView HTML with HTTP 200.
 */
const LIVE_SITEMAP_VIEWS = [
  "/Income",
  "/Expenses",
  "/Analytics",
  "/Goals",
  "/Settings",
  "/Accounts",
  "/Import",
  "/Investments",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    ...LIVE_SITEMAP_VIEWS.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
