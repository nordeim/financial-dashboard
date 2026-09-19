import type { MetadataRoute } from "next";

import { siteBaseUrl } from "@/lib/route-metadata";

/**
 * robots.txt (round 17, live-probed 2026-09-19).
 *
 * The live serves a single wildcard rule plus a sitemap line — NOT a
 * per-bot list:
 *
 *   User-agent: *
 *   Allow: /
 *   Sitemap: https://<host>/sitemap.xml
 *
 * The static public/robots.txt (the old per-bot shape) was deleted — a
 * public file would shadow this metadata route.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteBaseUrl()}/sitemap.xml`,
  };
}
