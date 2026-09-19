import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import {
  SITE_DESCRIPTION,
  absoluteCanonicalUrl,
  buildRouteMetadata,
  buildRouteViewport,
  siteBaseUrl,
} from "@/lib/route-metadata";

/**
 * Round-17 + round-18 site-metadata source contracts — the HTTP/metadata
 * layer (all live-probed 2026-09-19).
 *
 * Rounds 2–16 verified parity through the body-DOM signature diff; that
 * walk is structurally blind to the transport and <head> layers. The
 * round-17 HTTP-layer audit found (live-probed):
 *
 *  - F1 Security headers: the live sends Referrer-Policy
 *    strict-origin-when-cross-origin, X-Content-Type-Options nosniff and
 *    edge HSTS max-age=31536000 on every response; the clone sent none and
 *    leaked X-Powered-By. (CSP stays out of scope — a nonce strategy for
 *    Next's inline scripts is future work, documented in the PAD.)
 *  - F2/F3 Head metadata + favicon: the live carries its exact description
 *    text, per-route og:title mirroring the document title, og:url = the
 *    per-route canonical (the DASHBOARD canonical normalizes to `/` — a
 *    live quirk), og:image = the Finara logo, and the apple-mobile-web-* /
 *    mobile-web-app-capable PWA metas; the favicon IS the logo (converted
 *    to a true PNG). (The live's manifest.json link 302s to nothing — a
 *    broken base44 template asset, deliberately NOT replicated.)
 *  - F4 The per-route metadata lives in a pure seam (buildRouteMetadata)
 *    per the repo's TDD-seam principle — the page files stay thin.
 *  - F5 SEO files: the live's robots.txt is `User-agent: *` + `Allow: /`
 *    + a Sitemap line, and its sitemap.xml lists exactly 9 URLs — `/` at
 *    1.0 plus the eight non-dashboard views at 0.8/weekly — with NO
 *    /Dashboard and NO /login entry.
 *
 * The round-18 re-probe (same day) found the live head RESTRUCTURED per
 * route — the round-17 pins held for the shared fields but the per-route
 * shape diverged (all live-probed):
 *
 *  - R18-F1 The viewport/theme-color pair moved to the login route ONLY:
 *    app pages render `width=device-width, initial-scale=1.0` with no
 *    viewport-fit and no theme-color; /login renders viewport-fit=cover +
 *    theme-color #000000.
 *  - R18-F2 The icon links split per route: /login renders icon
 *    sizes="any" + apple-touch-icon sizes="180x180"; app pages render a
 *    single icon link (the live's type="image/svg+xml" is a base44
 *    mislabel on a PNG href — deliberately NOT replicated, same class as
 *    the broken manifest).
 *  - R18-F3 og:image dims/alt are login-only: app pages render a BARE
 *    og:image; /login adds width/height + og:image:alt "Base44 link
 *    preview" (the dims describe OUR asset — 480×480 — the live's 1200×630
 *    describes its CDN render; asset values are deployment properties,
 *    structure is the contract).
 *  - R18-F4 The twitter block: card summary_large_image, title = the
 *    document title, a BARE twitter:image (no dims), twitter:url = the
 *    absolute canonical (Next's Twitter type has no url field — rendered
 *    via metadata.other), and a per-route description — the FULL text on
 *    /, /Dashboard, /login and 404s but `{ViewLabel} on Finara.
 *    {SITE_DESCRIPTION.slice(0, 80)}.` on the eight non-dashboard view
 *    routes (a 98-char mid-word truncation, probed on all 8).
 *  - R18-F5 The live head carries NO keywords meta.
 */

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const LAYOUT = "src/app/layout.tsx";
const CATCH_ALL_PAGE = "src/app/[...view]/page.tsx";

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

describe("round 17 F2 (r18 re-pins): the layout head metadata matches the live shared <head>", () => {
  it("carries the live's exact description text (the seam constant, wired into the layout)", () => {
    expect(SITE_DESCRIPTION).toBe(
      "Finara is your intelligent financial co-pilot, designed to bring clarity and control to your personal finances. Effortlessly track income, manage expenses, set and achieve savings goals, and gain deep insights into your spending habits with our intuitive, premium dashboard.",
    );
    const src = read(LAYOUT);
    expect(src).toContain("description: SITE_DESCRIPTION");
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

  it("sets the openGraph defaults (siteName, website type, the BARE logo image)", () => {
    const src = read(LAYOUT);
    expect(src).toMatch(/openGraph:\s*\{/);
    expect(src).toContain('siteName: "Finara"');
    expect(src).toContain('type: "website"');
    // r18 F3: the default image is the bare descriptor — dims/alt are
    // login-only (see the seam specs below)
    expect(src).toContain('images: [{ url: "/finara-logo.png" }]');
  });

  it("renders NO keywords meta (r18 F5 — the live head carries none)", () => {
    const src = read(LAYOUT);
    expect(src).not.toMatch(/keywords:/);
  });
});

describe("round 18 F1: the viewport/theme-color split (login-only, live-probed)", () => {
  it("the layout viewport is the plain app-page shape (no viewportFit, no themeColor)", () => {
    const src = read(LAYOUT);
    expect(src).toMatch(/export const viewport/);
    expect(src).not.toContain("viewportFit");
    expect(src).not.toContain("themeColor");
  });

  it("buildRouteViewport adds viewportFit=cover + theme-color ONLY on /login", () => {
    expect(buildRouteViewport("/login")).toEqual({
      width: "device-width",
      initialScale: 1,
      viewportFit: "cover",
      themeColor: "#000000",
    });
    for (const path of ["/", "/Dashboard", "/Goals", "/NonexistentPage"]) {
      expect(buildRouteViewport(path), `plain viewport for ${path}`).toEqual({
        width: "device-width",
        initialScale: 1,
      });
    }
  });

  it("the catch-all page wires generateViewport to the seam", () => {
    const src = read(CATCH_ALL_PAGE);
    expect(src).toContain("generateViewport");
    expect(src).toContain("buildRouteViewport");
  });
});

describe("round 18 F2: the per-route icon links (apple-touch-icon + sizes are login-only)", () => {
  it("the layout icons keep only the bare app-page icon link (no apple entry)", () => {
    const src = read(LAYOUT);
    expect(src).toContain('icon: "/finara-logo.png"');
    expect(src).not.toContain("apple:");
    expect(src).not.toContain("finara-icon.svg");
  });

  it("the seam gives login the sized icon pair (icon sizes=any + apple 180x180)", () => {
    const meta = buildRouteMetadata("/login");
    expect(meta.icons).toEqual({
      icon: { url: "/finara-logo.png", sizes: "any" },
      apple: { url: "/finara-logo.png", sizes: "180x180" },
    });
  });

  it("app routes carry no page-level icons (the layout's bare icon applies)", () => {
    for (const path of ["/", "/Dashboard", "/Goals", "/NonexistentPage"]) {
      expect(buildRouteMetadata(path).icons, `no icons override for ${path}`).toBeUndefined();
    }
  });
});

describe("round 17 F4 + r18 F3: buildRouteMetadata — the per-route title/og/image seam", () => {
  it("returns the COMPLETE openGraph block with the BARE image (Next merges metadata shallowly per key)", () => {
    const meta = buildRouteMetadata("/Goals");
    expect(meta.openGraph).toEqual({
      title: "Goals | Finara",
      description: SITE_DESCRIPTION,
      url: "/Goals",
      siteName: "Finara",
      type: "website",
      images: [{ url: "/finara-logo.png" }],
    });
    expect(meta.description).toBe(SITE_DESCRIPTION);
  });

  it("the login og:image carries dims + the live's alt (login-only, live-probed)", () => {
    const meta = buildRouteMetadata("/login");
    expect(meta.openGraph?.images).toEqual([
      {
        url: "/finara-logo.png",
        width: 480,
        height: 480,
        alt: "Base44 link preview",
      },
    ]);
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

describe("round 18 F4: the twitter block (per-route description, bare image, twitter:url)", () => {
  it("the eight view routes render the 'X on Finara. <80-char truncation>.' template", () => {
    const truncated = `${SITE_DESCRIPTION.slice(0, 80)}.`;
    const cases: Array<[string, string]> = [
      ["/Income", "Income on Finara. "],
      ["/Expenses", "Expenses on Finara. "],
      ["/Accounts", "Accounts on Finara. "],
      ["/Investments", "Investments on Finara. "],
      ["/Import", "Import on Finara. "],
      ["/Analytics", "Analytics on Finara. "],
      ["/Goals", "Goals on Finara. "],
      ["/Settings", "Settings on Finara. "],
    ];
    for (const [path, prefix] of cases) {
      const desc = buildRouteMetadata(path).twitter?.description;
      expect(desc, `twitter:description for ${path}`).toBe(prefix + truncated);
      expect(desc?.length).toBe(prefix.length + 80 + 1);
    }
  });

  it("home/dashboard/login/404 keep the FULL site description", () => {
    for (const path of ["/", "/Dashboard", "/login", "/NonexistentPage"]) {
      expect(
        buildRouteMetadata(path).twitter?.description,
        `full twitter:description for ${path}`,
      ).toBe(SITE_DESCRIPTION);
    }
  });

  it("every route carries card/title/bare-image (the explicit block replaces the og derivation)", () => {
    // Next's Twitter type is a union; TwitterMetadata (the base) carries no
    // card — narrow with `in` before reading it.
    const cardOf = (t: ReturnType<typeof buildRouteMetadata>["twitter"]): string | undefined =>
      t && "card" in t ? t.card : undefined;
    for (const path of ["/", "/Dashboard", "/login", "/Goals", "/NonexistentPage"]) {
      const meta = buildRouteMetadata(path);
      expect(cardOf(meta.twitter)).toBe("summary_large_image");
      expect(meta.twitter?.images).toEqual([{ url: "/finara-logo.png" }]);
      expect(meta.twitter?.title).toBe(meta.title);
    }
    const goals = buildRouteMetadata("/Goals").twitter;
    expect(goals?.title).toBe("Goals | Finara");
  });

  it("renders twitter:url (the absolute canonical) via the other escape hatch", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(buildRouteMetadata("/Goals").other?.["twitter:url"]).toBe(
      "http://localhost:3000/Goals",
    );
    expect(buildRouteMetadata("/login").other?.["twitter:url"]).toBe(
      "http://localhost:3000/login",
    );
    // the dashboard twitter:url is the BARE origin (the canonical quirk)
    expect(buildRouteMetadata("/Dashboard").other?.["twitter:url"]).toBe(
      "http://localhost:3000",
    );
    process.env.NEXT_PUBLIC_SITE_URL = "https://finara.example.com";
    expect(buildRouteMetadata("/Goals").other?.["twitter:url"]).toBe(
      "https://finara.example.com/Goals",
    );
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });
});

describe("round 18 F4: absoluteCanonicalUrl + siteBaseUrl — the absolute-canonical helpers", () => {
  it("renders the bare origin for the root canonical and joins paths otherwise", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(absoluteCanonicalUrl("/")).toBe("http://localhost:3000");
    expect(absoluteCanonicalUrl("/Goals")).toBe("http://localhost:3000/Goals");
    expect(absoluteCanonicalUrl("/login")).toBe("http://localhost:3000/login");
    // a trailing slash on the configured origin is normalized away
    process.env.NEXT_PUBLIC_SITE_URL = "https://finara.example.com/";
    expect(absoluteCanonicalUrl("/")).toBe("https://finara.example.com");
    expect(absoluteCanonicalUrl("/Goals")).toBe("https://finara.example.com/Goals");
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

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
