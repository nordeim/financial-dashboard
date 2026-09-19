import type { Metadata, Viewport } from "next";

import { VIEW_PATHS, parseRoute } from "@/lib/routes";
import type { AppRoute } from "@/lib/routes";

/**
 * Per-route <head> metadata seam (round 17, live-probed 2026-09-19;
 * per-route head structure re-probed round 18, same day).
 *
 * The live app's server-rendered head mirrors the document title per
 * route and canonicalizes every path: og:title is the same string as the
 * <title> (bare "Finara" on /, /Dashboard and /login; "Goals | Finara"
 * on view routes; even the 404 route camelCase-splits its segment), and
 * og:url is the per-route canonical — the full path for views, /login
 * and not-found routes, EXCEPT the dashboard, whose canonical normalizes
 * to "/" (a live quirk: /Dashboard and / are the same page to the live's
 * template). This module is the pure seam that computes those, so the
 * page files stay thin wrappers (the repo's TDD-seam principle — the
 * page components pull the client React graph and cannot be imported in
 * unit tests).
 *
 * Round 18: the live head is PER-ROUTE STRUCTURED. The app pages (/, the
 * views, 404s) render the plain viewport (no viewport-fit, no
 * theme-color), a single bare icon link, a BARE og:image, and a
 * twitter:url + per-route twitter:description; ONLY /login carries
 * viewport-fit=cover, theme-color #000000, the sized icon pair (icon
 * sizes="any" + apple-touch-icon sizes="180x180"), and the og:image
 * descriptor (width/height + the live's "Base44 link preview" alt).
 * The live's twitter:description template on the eight non-dashboard
 * view routes is `{ViewLabel} on Finara. {SITE_DESCRIPTION.slice(0,
 * 80)}.` — a 98-char mid-word truncation (probed on all 8); home,
 * /Dashboard, /login and 404s carry the full description.
 *
 * NOTE: Next merges metadata SHALLOWLY per top-level key — a page-level
 * `openGraph`/`icons` REPLACES the layout's entirely — so this seam
 * returns the COMPLETE openGraph block (title/url plus the
 * description/siteName/type/images defaults), not just the per-route
 * fields. Next's Twitter metadata type has NO url field, so twitter:url
 * renders through the arbitrary-meta escape hatch (`other`).
 */

/**
 * The deployable origin: set NEXT_PUBLIC_SITE_URL in production. A
 * trailing slash on the configured value is normalized away (absolute
 * URL joins would double-slash otherwise).
 */
export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
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

/**
 * The absolute URL for a canonical path (twitter:url and friends — the
 * `other` escape hatch gets NO metadataBase resolution, so the absoluting
 * happens here). The root canonical renders the BARE origin, matching
 * the live's root og:url/canonical/twitter:url shape.
 */
export function absoluteCanonicalUrl(canonical: string): string {
  const base = siteBaseUrl();
  return canonical === "/" ? base : `${base}${canonical}`;
}

/**
 * The live's per-route twitter:description (round-18 probe): the eight
 * non-dashboard view routes render `{ViewLabel} on Finara.` + the
 * description truncated at exactly 80 chars (mid-word) + "."; every
 * other surface (/, /Dashboard, /login, 404s) carries the full text.
 */
function twitterDescription(route: AppRoute): string {
  if (route.kind === "view" && route.view !== "dashboard") {
    const label = route.view.charAt(0).toUpperCase() + route.view.slice(1);
    return `${label} on Finara. ${SITE_DESCRIPTION.slice(0, 80)}.`;
  }
  return SITE_DESCRIPTION;
}

/**
 * The per-route viewport (round-18 probe): ONLY /login carries
 * viewport-fit=cover + theme-color #000000; every other surface renders
 * the plain viewport. Returned COMPLETE per route so the result is
 * deterministic regardless of Next's layout→page merge semantics.
 */
export function buildRouteViewport(rawPath: string): Viewport {
  if (parseRoute(rawPath).kind === "login") {
    return {
      width: "device-width",
      initialScale: 1,
      viewportFit: "cover",
      themeColor: "#000000",
    };
  }
  return { width: "device-width", initialScale: 1 };
}

/** Build the per-route Metadata (title + description + canonical + the full og/twitter blocks). */
export function buildRouteMetadata(rawPath: string): Metadata {
  const route = parseRoute(rawPath);
  const canonical = canonicalPath(rawPath, route.kind, route.kind === "view" ? route.view : undefined);
  const isLogin = route.kind === "login";

  const metadata: Metadata = {
    title: route.title,
    description: SITE_DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      title: route.title,
      description: SITE_DESCRIPTION,
      url: canonical,
      siteName: "Finara",
      type: "website",
      // Round 18: app pages render the BARE og:image; only /login carries
      // the descriptor (dims describe OUR 480×480 asset — the live's
      // 1200×630 describes its CDN render; asset values are deployment
      // properties, structure is the parity contract). The alt is the
      // live's exact template string.
      images: isLogin
        ? [{ url: "/finara-logo.png", width: 480, height: 480, alt: "Base44 link preview" }]
        : [{ url: "/finara-logo.png" }],
    },
    // Round 18: the explicit twitter block replaces Next's openGraph
    // derivation — bare image (the live renders NO twitter:image dims)
    // and the per-route description template.
    twitter: {
      card: "summary_large_image",
      title: route.title,
      description: twitterDescription(route),
      images: [{ url: "/finara-logo.png" }],
    },
    // Next's Twitter metadata type has no url field — the arbitrary-meta
    // escape hatch renders <meta name="twitter:url"> (live-probed: the
    // absolute canonical, bare origin for the dashboard).
    other: { "twitter:url": absoluteCanonicalUrl(canonical) },
  };

  if (isLogin) {
    // Round 18: the sized icon pair is login-only (the layout keeps the
    // bare app-page icon; page-level icons replace the layout's — the
    // same shallow-per-key merge as openGraph). The live's app-page icon
    // `type="image/svg+xml"` is a base44 mislabel on a PNG href and is
    // deliberately NOT replicated (same class as the broken manifest).
    metadata.icons = {
      icon: { url: "/finara-logo.png", sizes: "any" },
      apple: { url: "/finara-logo.png", sizes: "180x180" },
    };
  }

  return metadata;
}
