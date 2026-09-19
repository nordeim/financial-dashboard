import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import {
  SITE_DESCRIPTION,
  buildRouteMetadata,
  siteBaseUrl,
} from "@/lib/route-metadata";

/**
 * Round-17 site-metadata source contracts — the HTTP/metadata-layer parity
 * round (all live-probed 2026-09-19).
 *
 * Rounds 2–16 verified parity through the body-DOM signature diff; that
 * walk is structurally blind to the transport and <head> layers. The
 * round-17 HTTP-layer audit found:
 *
 *  - F1 Security headers: the live sends Referrer-Policy
 *    strict-origin-when-cross-origin, X-Content-Type-Options nosniff and
 *    edge HSTS max-age=31536000 on every response; the clone sent none and
 *    leaked X-Powered-By. (CSP stays out of scope — a nonce strategy for
 *    Next's inline scripts is future work, documented in the PAD.)
 *  - F2 Head metadata: the live carries theme-color #000000,
 *    viewport-fit=cover, its exact description text, per-route og:title
 *    mirroring the document title, og:url = the per-route canonical (the
 *    DASHBOARD canonical normalizes to `/` — a live quirk), og:image = the
 *    Finara logo, and the apple-mobile-web-* / mobile-web-app-capable
 *    PWA metas. (The live's manifest.json link 302s to nothing — a broken
 *    base44 template asset, deliberately NOT replicated.)
 *  - F3 Favicon identity: the live's favicon IS the Finara logo; the
 *    clone's finara-icon.svg was a generic emerald mark that exists
 *    nowhere on the live. Also: finara-logo.png was a JPEG mislabeled
 *    with a .png extension — converted to a true PNG (same filename).
 *  - F4 The per-route metadata lives in a pure seam (buildRouteMetadata)
 *    per the repo's TDD-seam principle — the page files stay thin.
 *  - F5 SEO files: the live's robots.txt is `User-agent: *` + `Allow: /`
 *    + a Sitemap line (NOT the clone's old per-bot list), and its
 *    sitemap.xml lists exactly 9 URLs — `/` at 1.0 plus the eight
 *    non-dashboard views at 0.8/weekly — with NO /Dashboard and NO
 *    /login entry. The clone's /sitemap.xml used to fall through the
 *    catch-all to the NotFoundView HTML.
 */

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const LAYOUT = "src/app/layout.tsx";

describe("round 17 F1: the security-header baseline (live-parity trio + hardening pair)", () => {
  it("disables the X-Powered-By header (no framework fingerprint)", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("applies the five security headers to every path", async () => {
    const headers = await nextConfig.headers?.();
    expect(headers).toBeDefined();
    const all = headers!.find((h) => h.source === "/:path*");
    expect(all, "the header block must apply to /:path* (pages AND api)").toBeDefined();
    const map = new Map(all!.headers.map((h) => [h.key, h.value]));
    // live-parity trio (probed on the live's edge responses)
    expect(map.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(map.get("X-Content-Type-Options")).toBe("nosniff");
    expect(map.get("Strict-Transport-Security")).toBe("max-age=31536000");
    // standard hardening pair (the live's edge does not set these; the app
    // uses none of the gated capabilities — an invisible addition)
    expect(map.get("X-Frame-Options")).toBe("DENY");
    expect(map.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });
});

describe("round 17 F2: the layout head metadata matches the live <head> (source contract)", () => {
  it("exports the live viewport + theme-color (viewport-fit=cover, #000000)", () => {
    const src = read(LAYOUT);
    expect(src).toContain("viewportFit: \"cover\"");
    expect(src).toContain("themeColor: \"#000000\"");
  });

  it("carries the live's exact description text (the seam constant, wired into the layout)", () => {
    expect(SITE_DESCRIPTION).toBe(
      "Finara is your intelligent financial co-pilot, designed to bring clarity and control to your personal finances. Effortlessly track income, manage expenses, set and achieve savings goals, and gain deep insights into your spending habits with our intuitive, premium dashboard.",
    );
    const src = read(LAYOUT);
    expect(src).toContain("description: SITE_DESCRIPTION");
  });

  it("uses the Finara logo as the icon (favicon + apple-touch-icon parity)", () => {
    const src = read(LAYOUT);
    expect(src).toContain('icon: "/finara-logo.png"');
    expect(src).toContain('apple: "/finara-logo.png"');
    expect(src).not.toContain("finara-icon.svg");
  });

  it("carries the live's apple/PWA metas (capable, black status bar, Finara title)", () => {
    const src = read(LAYOUT);
    expect(src).toMatch(/appleWebApp:\s*\{/);
    expect(src).toContain("capable: true");
    expect(src).toContain('statusBarStyle: "black"');
    expect(src).toContain('title: "Finara"');
  });

  it("resolves metadataBase through the siteBaseUrl seam (env + localhost fallback)", () => {
    const src = read(LAYOUT);
    expect(src).toContain("new URL(siteBaseUrl())");
  });

  it("sets the openGraph defaults (siteName, website type, the logo image)", () => {
    const src = read(LAYOUT);
    expect(src).toMatch(/openGraph:\s*\{/);
    expect(src).toContain('siteName: "Finara"');
    expect(src).toContain('type: "website"');
    expect(src).toMatch(/url:\s*"\/finara-logo\.png"/);
  });
});

describe("round 17 F4: buildRouteMetadata — the per-route title/og seam", () => {
  it("returns the COMPLETE openGraph block (Next merges metadata shallowly per key)", () => {
    const meta = buildRouteMetadata("/Goals");
    expect(meta.openGraph).toEqual({
      title: "Goals | Finara",
      description: SITE_DESCRIPTION,
      url: "/Goals",
      siteName: "Finara",
      type: "website",
      images: [{ url: "/finara-logo.png", width: 480, height: 480 }],
    });
    expect(meta.description).toBe(SITE_DESCRIPTION);
  });

  it("titles every view route 'X | Finara' with its path as the canonical", () => {
    const cases: Array<[string, string, string]> = [
      ["/Income", "Income | Finara", "/Income"],
      ["/Expenses", "Expenses | Finara", "/Expenses"],
      ["/Accounts", "Accounts | Finara", "/Accounts"],
      ["/Investments", "Investments | Finara", "/Investments"],
      ["/Import", "Import | Finara", "/Import"],
      ["/Analytics", "Analytics | Finara", "/Analytics"],
      ["/Goals", "Goals | Finara", "/Goals"],
      ["/Settings", "Settings | Finara", "/Settings"],
    ];
    for (const [path, title, canonical] of cases) {
      const meta = buildRouteMetadata(path);
      expect(meta.title).toBe(title);
      expect(meta.alternates?.canonical).toBe(canonical);
      expect(meta.openGraph?.title).toBe(title);
      expect(meta.openGraph?.url).toBe(canonical);
    }
  });

  it("the dashboard canonical normalizes to `/` (live quirk) with the bare title", () => {
    for (const path of ["/", "/Dashboard"]) {
      const meta = buildRouteMetadata(path);
      expect(meta.title).toBe("Finara");
      expect(meta.alternates?.canonical).toBe("/");
      expect(meta.openGraph?.title).toBe("Finara");
      expect(meta.openGraph?.url).toBe("/");
    }
  });

  it("the login surface keeps the bare Finara title with /login as canonical", () => {
    const meta = buildRouteMetadata("/login");
    expect(meta.title).toBe("Finara");
    expect(meta.alternates?.canonical).toBe("/login");
  });

  it("not-found routes camelCase-split their title and canonicalize the raw path", () => {
    const meta = buildRouteMetadata("/NonexistentPage");
    expect(meta.title).toBe("Nonexistent Page | Finara");
    expect(meta.alternates?.canonical).toBe("/NonexistentPage");
    expect(meta.openGraph?.title).toBe("Nonexistent Page | Finara");
  });
});

describe("round 17 F4: siteBaseUrl — the deployable site origin", () => {
  it("defaults to localhost when NEXT_PUBLIC_SITE_URL is unset", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteBaseUrl()).toBe("http://localhost:3000");
    process.env.NEXT_PUBLIC_SITE_URL = "https://finara.example.com";
    expect(siteBaseUrl()).toBe("https://finara.example.com");
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });
});

describe("round 17 F5: robots.txt + sitemap.xml (the live SEO-file shapes)", () => {
  it("robots.ts renders the live rule shape with the sitemap line", async () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const mod = await import("@/app/robots");
    const robots = mod.default();
    expect(robots.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(robots.sitemap).toBe("http://localhost:3000/sitemap.xml");
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("sitemap.ts lists exactly the 9 live URLs (no /Dashboard, no /login)", async () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const mod = await import("@/app/sitemap");
    const entries = mod.default();
    expect(entries).toHaveLength(9);
    const urls = entries.map((e) => new URL(e.url!).pathname);
    expect(urls).toContain("/");
    for (const view of [
      "/Income",
      "/Expenses",
      "/Accounts",
      "/Investments",
      "/Import",
      "/Analytics",
      "/Goals",
      "/Settings",
    ]) {
      expect(urls).toContain(view);
    }
    expect(urls).not.toContain("/Dashboard");
    expect(urls).not.toContain("/login");
    const root = entries.find((e) => new URL(e.url!).pathname === "/")!;
    expect(root.priority).toBe(1.0);
    for (const e of entries) {
      expect(e.changeFrequency).toBe("weekly");
      if (new URL(e.url!).pathname !== "/") expect(e.priority).toBe(0.8);
    }
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("the static public/robots.txt is gone (it would shadow the metadata route)", () => {
    expect(existsSync(join(process.cwd(), "public/robots.txt"))).toBe(false);
  });
});

describe("round 17 F3: favicon asset identity", () => {
  it("public/finara-logo.png is a TRUE PNG (was a mislabeled JPEG)", () => {
    const buf = readFileSync(join(process.cwd(), "public/finara-logo.png"));
    // PNG magic: 89 50 4E 47 0D 0A 1A 0A
    expect([...buf.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it("the non-live favicon mark and the dead scaffold logo are removed", () => {
    expect(existsSync(join(process.cwd(), "public/finara-icon.svg"))).toBe(false);
    expect(existsSync(join(process.cwd(), "public/logo.svg"))).toBe(false);
  });
});
