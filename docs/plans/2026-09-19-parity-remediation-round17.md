# Round-17 Remediation Plan — the HTTP/metadata-layer parity round

Date: 2026-09-19 · Scope: the round opened with the standard full live
re-probe (9-view + login signature-multiset diff, BOTH the sorted diff and
the round-16 raw-order diff, the per-element style/motion audit, and the
dialog/chooser/FAB/Progress/mobile structural probes) plus — new this
round — an **HTTP-transport and document-metadata layer audit** (response
headers, `<head>` metadata, robots.txt, sitemap.xml, favicon assets),
surfaces the body-DOM signature diff is structurally blind to.

**The live app is UNCHANGED since round 16** (every structural probe and
both diffs match the round-16 post-fix baseline; the only live-side change
is the ACCOUNT DATA — the live user's records were reduced to a minimal
set: 1 expense, 1 income source, 1 account, 1 goal, 1 budget, ~1-2
holdings — a data difference, not app structure). The HTTP-layer audit,
however, found real parity gaps that no prior round probed. Five findings,
all fixed this round.

Evidence: `/home/z/my-project/captures/r17/` (outside the repo, per
convention) — sorted + raw signature captures for both sides, per-view
diff reports, the structural probe transcripts (modal/chooser/Progress/
drawer rAF samples), the side-by-side screenshot sweep + VLM verdicts,
and the HTTP-layer probe transcripts (headers, head metadata, robots,
sitemap).

## §A Context

Rounds 2–16 drove the clone to verified body-DOM parity; round 16 closed
the raw-order gaps. The round-17 re-probe (2026-09-19, agent-browser
isolated sessions, production build on :3000, live side dark-themed and
the clone toggled dark for theme-matched comparison):

- **Sorted + raw diffs**: every per-view delta classifies into the
  documented buckets (seed-data counts, lucide svg internals, the live's
  AI-insight empty state, the login demo-credentials affordance, infra,
  the duplicated sonner toaster, a11y additions) — ZERO non-bucketed
  deltas on all 10 surfaces, and the raw counts EQUAL the sorted counts
  everywhere (no class-order drift since round 16).
- **Structural probes**: the motion audit (19 settled elements on the
  Dashboard), the Add Expense modal (overlay/card classes + settled
  style), the FAB chooser (overlay > wrapper > card), the Progress
  indeterminate mechanism, the mobile chrome (top bar, drawer slide-in
  rAF-sampled at −300px → +35px overshoot → settle ~590ms), the
  SyncedBadge base-only render, the sidebar raw orders, the user-menu
  anatomy — ALL match the round-14/16 pins.
- **VLM sweep** (5 view pairs, dark/dark): Dashboard/Expenses/
  Investments/Analytics EQUIVALENT; Goals flagged only the card count
  (1 live vs 3 seeded — the data bucket).
- **The live account data was reset** (minimal records now) — verified
  directly on the live (1 expense "Coffee" $4.50, 1 income source,
  1 account, 1 goal, 1 budget row, 8→1-2 holdings). Data bucket.
- **The NEW HTTP-layer audit** (curl-level, both sides): the live sends
  `referrer-policy: strict-origin-when-cross-origin`,
  `x-content-type-options: nosniff`, and edge `strict-transport-security:
  max-age=31536000`; the clone sends none of these and leaks
  `X-Powered-By: Next.js`. The live's `<head>` carries per-route
  og:title/og:url (mirroring the document titles), theme-color
  `#000000`, `viewport-fit=cover`, the live's exact description text,
  apple-mobile-web-* metas, and the Finara logo as the favicon; the
  clone's head metadata diverges on every one of those fields and its
  favicon is a generic emerald mark. The live serves a real `robots.txt`
  (`User-agent: *` + `Allow: /` + a `Sitemap:` line) and a 9-URL
  `sitemap.xml` (`/` at 1.0 + the 8 non-dashboard views at 0.8, weekly —
  no `/Dashboard` entry, no `/login`); the clone's robots.txt is a
  different per-bot shape with no Sitemap line, and `/sitemap.xml` falls
  through the catch-all to render the NotFoundView HTML with HTTP 200.

## §B Findings (all live-probed 2026-09-19)

**F1 — Security headers (HTTP-layer parity + production posture).** The
live sends `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Content-Type-Options: nosniff`, and `Strict-Transport-Security:
max-age=31536000` (via its Cloudflare/Caddy edge) on every response; the
clone sends none of them and additionally leaks `X-Powered-By: Next.js`.
Fix: `next.config.ts` — `poweredByHeader: false` + a `headers()` block
applying to `/:path*`: the live-parity trio plus the standard hardening
pair the live's edge doesn't set (`X-Frame-Options: DENY`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()` — the app
uses none of those capabilities). HSTS over plain HTTP is ignored by
spec-compliant browsers, so it is safe unconditionally. CSP is
deliberately out of scope (Next inline scripts would need a nonce
strategy — documented as future work in the PAD).

**F2 — Head metadata parity (per-route og, theme-color, viewport,
apple/PWA metas, description text).** The live's server-rendered `<head>`
probes (all paths):
- viewport: `width=device-width, initial-scale=1.0, viewport-fit=cover`;
  the clone renders `width=device-width, initial-scale=1` (no
  viewport-fit).
- `<meta name="theme-color" content="#000000">`; the clone has none.
- description (root): "Finara is your intelligent financial co-pilot,
  designed to bring clarity and control to your personal finances.
  Effortlessly track income, manage expenses, set and achieve savings
  goals, and gain deep insights into your spending habits with our
  intuitive, premium dashboard."; the clone's differs.
- og:title mirrors the per-route document title — bare `Finara` on `/`,
  `/Dashboard`, `/login`; `Goals | Finara` on `/Goals`; even the 404
  route gets `Nonexistent Page | Finara`. The clone renders the static
  layout default ("Finara — Smart Finance Tracker") everywhere.
- og:url is the per-route canonical — the full path for views/login/404s,
  but the ROOT for `/Dashboard` (a live quirk: the dashboard canonical
  normalizes to `/`). The clone has no og:url at all.
- og:image: the Finara logo (1200×630 render on the live's CDN) + width/
  height; og:site_name "Finara"; og:type website. The clone has no
  og:image.
- apple-mobile-web-app-status-bar-style "black", apple-mobile-web-app-
  title "Finara", mobile-web-app-capable "yes", apple-touch-icon (the
  logo). The clone has none of these.
- The live's `manifest.json` link 302-redirects to nothing (broken
  base44 template asset) — NOT replicated (documented delta; a broken
  manifest reference would be replicating a bug with zero visual effect).

Fix: `src/app/layout.tsx` — a `viewport` export (viewportFit cover,
themeColor #000000), the live's description text, `icons` pointing at
the Finara logo, `appleWebApp` metas, `metadataBase` (from the new
`NEXT_PUBLIC_SITE_URL` env, default `http://localhost:3000`), and
openGraph defaults (siteName/type/image). Per-route og:title + canonical
via a new pure seam `buildRouteMetadata(rawPath)` (see F4) consumed by
the catch-all's `generateMetadata` and the home page's metadata.

**F3 — Favicon identity (asset parity).** The live's favicon is the
Finara logo PNG (`sizes="any"`); the clone's is a generic emerald SVG
mark (`public/finara-icon.svg`) that exists nowhere on the live. Fix:
point the layout `icons` at `/finara-logo.png` (the login page's logo
asset — verified visually the same logo as the live's favicon) and
delete the now-unused `finara-icon.svg`. Also: `finara-logo.png` is a
JPEG mislabeled with a .png extension (480×480) — convert the file to a
true PNG (same filename/URL, zero code impact) so the content-type is
honest; and delete the dead scaffold asset `public/logo.svg` (zero
references).

**F4 — Per-route metadata seam (structure).** The per-route og:title/
og:url logic belongs in a pure, unit-testable module per the repo's
TDD-seam principle (the page files import React components — importing
them in Vitest would pull the client graph). Fix: new
`src/lib/route-metadata.ts` exporting `buildRouteMetadata(rawPath):
Metadata` — parses the route via the existing `parseRoute` and returns
`{ title, alternates: { canonical }, openGraph: { title, url } }`:
- view routes: title `X | Finara` (existing), canonical = the view path
  EXCEPT the dashboard canonical is `/` (the live quirk);
- login: title `Finara`, canonical `/login`;
- not-found: title `Segment | Finara` (existing camelCase split),
  canonical = the cleaned requested path;
- `/` (home): title `Finara`, canonical `/`.
Both the catch-all `generateMetadata` and the home page's `metadata`
consume the seam (the home page keeps its literal metadata object shape
— it is the `/` case).

**F5 — robots.txt + sitemap.xml (SEO-file parity).** The live serves:
- `robots.txt`: `User-agent: *` / `Allow: /` / `Sitemap:
  https://finara-c636f309.base44.app/sitemap.xml` (single wildcard
  block + sitemap line). The clone's static `public/robots.txt` is a
  per-bot list (Googlebot/Bingbot/Twitterbot/facebookexternalhit/*)
  with NO sitemap line.
- `sitemap.xml`: 9 URLs — `/` (priority 1.0) + Income/Expenses/
  Analytics/Goals/Settings/Accounts/Import/Investments (0.8, weekly);
  NO `/Dashboard` and NO `/login` entry. The clone serves the 404 HTML
  page at `/sitemap.xml` (the catch-all renders NotFoundView with
  HTTP 200 — the live's SPA also 200s unknown paths, so the status
  matches, but the CONTENT must be the sitemap XML).

Fix: Next metadata routes — `src/app/robots.ts` (the live's rule shape
+ a host-aware sitemap URL resolved against `NEXT_PUBLIC_SITE_URL`) and
`src/app/sitemap.ts` (the 9-URL set with the live's priorities and
changefreq). DELETE `public/robots.txt` (the static file would shadow
the metadata route). The sitemap URLs are absolute against the site
base — the host itself is a deployment property (shape is the parity
contract; the live's URLs carry ITS host, the clone's carry its own).

## §C Affected surfaces

1. `next.config.ts` — F1 (poweredByHeader off + the security-header
   baseline).
2. `src/app/layout.tsx` — F2 (viewport export, description, icons,
   appleWebApp, metadataBase, openGraph defaults).
3. `src/lib/route-metadata.ts` — NEW (F4, the pure per-route metadata
   seam).
4. `src/app/[...view]/page.tsx` — F4 (generateMetadata consumes the
   seam).
5. `src/app/page.tsx` — F4 (home metadata via the seam's `/` case).
6. `src/app/robots.ts` — NEW (F5); `src/app/sitemap.ts` — NEW (F5).
7. `public/` — F3/F5 (delete `finara-icon.svg`, `logo.svg`,
   `robots.txt`; convert `finara-logo.png` to a true PNG).
8. `.env.example` — F2 (document `NEXT_PUBLIC_SITE_URL`).
9. `src/lib/__tests__/site-metadata.test.ts` — NEW (the round-17 RED
   specs: the config header contract, the layout source contract, the
   route-metadata seam, the robots/sitemap shapes, the PNG magic bytes).
10. Docs: AGENTS.md (the HTTP-layer parity invariant + the new seams,
    counts), CLAUDE.md (round-17 ANALYZE/VERIFY references), README
    (env-var table, security section, counts, features row), PAD v1.16
    (§6 security headers, §8 env vars, §10 round-17 rows), this plan's
    §G, `docs/session_20.md`.
11. `docs/screenshots/` — refreshed dev-server captures of the
    remediated codebase (login + the 9 views + the mobile drawer).

## §D Execution order

1. RED: write `src/lib/__tests__/site-metadata.test.ts` (the five
   finding contracts); run the suite — expect exactly the new specs red
   (the current config/layout/pages/public assets fail the pins),
   everything else green.
2. GREEN, per finding: F1 (next.config.ts) → F4 (route-metadata.ts +
   the two page files) → F2 (layout.tsx) → F5 (robots.ts + sitemap.ts +
   delete public/robots.txt) → F3 (asset swap + PNG conversion + dead
   deletions).
3. Gates: `bun run lint` · `bun run typecheck` · `bun run test`
   (359 + new specs) · `bun run build`.
4. Post-fix verification: rebuild + restart the production server;
   re-curl the HTTP layer (headers present on `/` + `/api/*`, robots/
   sitemap shapes, the head metadata per route) and re-run the body-DOM
   signature diff on the Dashboard (the body must be UNCHANGED — this
   round touches only the transport/metadata layer).
5. E2E gate: `bun run test:e2e` (67 specs — none touch the metadata
   layer, but the full gate is the pre-push contract).
6. Screenshots: dev server on :3000, login + 9 views + mobile drawer →
   `docs/screenshots/`.
7. Docs + `.env.example` + atomic commits + push (SSH wrapper, main
   only).

## §E TDD plan

Red → green per finding. The new specs pin:
- **next.config contract**: import the config, assert `poweredByHeader
  === false` and the `headers()` baseline (the five security headers on
  `/:path*`).
- **layout source contract**: read `src/app/layout.tsx`; pin the
  viewport export (viewportFit cover, themeColor #000000), the live's
  description text, `icons.icon === "/finara-logo.png"`, the appleWebApp
  block, `metadataBase` reading `NEXT_PUBLIC_SITE_URL` with the
  localhost fallback, and the openGraph image/siteName/type.
- **route-metadata seam**: import `buildRouteMetadata`; pin the per-
  route titles, the canonical table (dashboard → `/`, views → their
  paths, login → `/login`, 404 → the raw path), and the og:title/og:url
  mapping (all nine views + login + a 404 + the home case).
- **robots/sitemap contracts**: import both metadata routes; pin the
  single-wildcard rule + sitemap line (localhost default) and the exact
  9-URL set with priorities/changefreq (no `/Dashboard`, no `/login`).
- **asset contracts**: `public/finara-logo.png` starts with the PNG
  magic bytes (a TRUE PNG after conversion); the deleted assets
  (`finara-icon.svg`, `logo.svg`, `robots.txt`) are gone.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit (359 + new) green · build exits 0 · E2E
  67/67.
- HTTP-layer re-probe on the fresh build (curl):
  - `curl -sI /login` shows Referrer-Policy / X-Content-Type-Options /
    Strict-Transport-Security / X-Frame-Options / Permissions-Policy and
    NO `X-Powered-By`; same on `/api/settings` (headers apply to the
    API routes too).
  - `curl -s /robots.txt` matches the live shape (single wildcard +
    Sitemap line).
  - `curl -s /sitemap.xml` is the 9-URL XML (content-type application/
    xml; `/` 1.0 + the eight views 0.8 weekly; no /Dashboard, no
    /login).
  - Per-route head: `curl -s /Goals | grep og:title` → `Goals | Finara`
    + og:url `/Goals`; `/Dashboard` → og:title `Finara` + og:url the
    root; `/NonexistentPage` → `Nonexistent Page | Finara`; the
    favicon link points at `/finara-logo.png`.
- Body-DOM regression check: the Dashboard signature diff against the
  round-17 live capture is UNCHANGED from the pre-fix run (this round
  must not move the body DOM).
- Browser spot-check: the tab favicon renders the Finara logo.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-19)

All five findings remediated red → green in plan order; every gate green.

**RED:** the new `src/lib/__tests__/site-metadata.test.ts` failed at import
(route-metadata.ts did not exist) — the designed red for a new-module TDD
cycle; 359 pre-existing specs stayed green.

**GREEN (per finding):** F4 — `src/lib/route-metadata.ts` created
(`buildRouteMetadata` + `siteBaseUrl`), both page files switched to the
seam; F1 — `next.config.ts` gained `poweredByHeader: false` + the
five-header baseline on `/:path*`; F2 — `layout.tsx` gained the `viewport`
export (viewportFit cover, themeColor #000000), the live description
(`SITE_DESCRIPTION`), the logo icons, `appleWebApp`, `metadataBase`, and
the openGraph defaults; F5 — `app/robots.ts` + `app/sitemap.ts` created,
`public/robots.txt` deleted; F3 — `finara-logo.png` converted to a true
PNG (PIL, pixel-identical), `finara-icon.svg`/`logo.svg` deleted. Two
implementation corrections caught by the specs/types during GREEN:
Next's sitemap field is `changeFrequency` (not `changefreq` — tsc
caught it), and the page-level openGraph REPLACES the layout's (Next
merges metadata shallowly per key — the first curl verification showed
og:image/site_name/type missing, so the seam was fixed to return the
COMPLETE openGraph block, with a new spec pinning that behavior).

**Post-fix verification (fresh production build):**
- Security headers present on `/login` AND `/api/settings` (the live's
  trio + the hardening pair), `X-Powered-By` gone.
- `robots.txt` renders the live wildcard shape + the Sitemap line;
  `sitemap.xml` serves the 9-URL XML as `application/xml`.
- Per-route head: `/Dashboard` → title/og "Finara" + canonical root (the
  live quirk); `/login` → "Finara" + `/login`; `/Goals` → "Goals |
  Finara" + `/Goals`; `/NonexistentPage` → "Nonexistent Page | Finara" +
  the raw path; theme-color, viewport-fit=cover, the live description,
  og:image (the logo, 480×480), og:site_name, og:type, the apple/PWA
  metas, and the logo favicon all render.
- Body-DOM regression check: the clone Dashboard signature diff pre-fix
  vs post-fix is BYTE-IDENTICAL (179/179 signatures matched, both sorted
  and raw modes) — the round moved only the transport/metadata layer.

**Gates (final):** lint 0 · tsc 0 · unit 378/378 (359 + 19 new
site-metadata specs) · build clean · E2E 67/67.

**Deliverables:** `.env.example` documents `NEXT_PUBLIC_SITE_URL`;
AGENTS/CLAUDE/README/PAD v1.16 aligned (counts, the HTTP-layer invariant,
the round-17 references, the security-headers row, the env tables, the
stale CI counts fixed 275→378 / 66→67); `docs/screenshots/` refreshed
(dev server: login + the 9 views + the mobile drawer); this plan's §G;
`docs/session_20.md`.

Evidence: `/home/z/my-project/captures/r17/` (sorted + raw captures for
live/clone pre/post, the per-view diff reports, the structural probe
transcripts — modal/chooser/Progress/drawer rAF samples — the HTTP-layer
probe transcripts, the side-by-side screenshot sweep + VLM verdicts, and
the E2E logs).
