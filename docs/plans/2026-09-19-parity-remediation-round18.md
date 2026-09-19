# Round-18 Remediation Plan — the per-route head-structure parity round

Date: 2026-09-19 · Scope: the standard full live re-probe (9-view + login
signature-multiset diff, BOTH the sorted and the round-16 raw-order mode,
the per-element style/motion audit, the dialog/chooser/FAB/Progress/
mobile structural probes, the VLM side-by-side sweep) plus the
**HTTP-transport and document-metadata layer audit** (the round-17 lesson,
now part of the standard opener): response headers, `<head>` metadata,
robots.txt, sitemap.xml, favicon assets — the surfaces the body-DOM
signature diff is structurally blind to.

**The live app's BODY DOM is UNCHANGED since round 17** (zero
non-bucketed deltas on all 10 surfaces in both diff modes; every
structural probe matches the round-14/16 pins; VLM 4/5 EQUIVALENT with
Goals flagging only the goal-card count — the data bucket). But the
HTTP-layer audit found the live's `<head>` **restructured since round
17**: the login route now carries its own richer head block
(theme-color, viewport-fit, apple-touch-icon, og:image dimensions/alt)
while the app pages dropped theme-color and viewport-fit entirely, and
the twitter:* set follows a per-route description template with a
twitter:url the clone does not render. Five findings, all in the
transport/metadata layer — the body DOM is untouched this round.

Evidence: `/home/z/my-project/captures/r18/` (outside the repo, per
convention) — sorted + raw signature captures for both sides, the
per-view diff reports, the structural probe transcripts (motion audit,
modal/chooser/Progress/drawer rAF samples, SyncedBadge/sidebar/
user-menu), the VLM sweep screenshots + verdicts, and the HTTP-layer
probe transcripts (per-route head dumps both sides, headers, robots,
sitemap, the twitter:description table).

## §A Context

Rounds 2–17 drove the clone to verified body-DOM parity and then to
transport-layer parity (round 17: security headers, per-route og
title/url, robots/sitemap, the favicon). The round-18 re-probe
(2026-09-19, agent-browser isolated sessions, production build on
:3000 with the repo-local DB, live side dark-themed and the clone
toggled dark for theme-matched comparison):

- **Sorted + raw diffs**: every per-view delta classifies into the
  documented buckets (seed-data counts, lucide svg internals, the live's
  AI-insight empty state, the login demo-credentials affordance, infra,
  the duplicated sonner toaster, a11y additions) — ZERO non-bucketed
  deltas on all 10 surfaces, and the raw counts EQUAL the sorted counts
  everywhere (no class-order drift since round 16/17).
- **Structural probes**: the motion audit (19 settled elements on the
  Dashboard), the Add Expense modal (overlay `fixed inset-0 bg-black/50
  flex items-center justify-center p-4 z-50` + settled `opacity: 1;
  transform: none;`, card `max-w-2xl … max-h-[90vh] overflow-y-auto`),
  the FAB chooser (z-40 overlay + `opacity: 1;` · wrapper `w-full
  max-w-md` + `opacity: 1; transform: none;` · plain card · "Quick
  Add" / "What would you like to add?"), the Progress indeterminate
  mechanism (`data-state=indeterminate`, no aria-valuenow, manual
  translateX −75.5% at 24.5%), the mobile chrome (top bar + drawer root
  `lg:hidden fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900` with the
  slide-in rAF-sampled at −300px → +35.5px overshoot → settle), the
  SyncedBadge base-only render, the sidebar raw orders (gradient
  container, h-16 header, both navs, both bottoms, the inner pane with
  transition-colors), the user-menu anatomy (sun/log-out items,
  span-wrapped labels) — ALL match the pins.
- **VLM sweep** (5 view pairs, dark/dark): Dashboard/Expenses/
  Investments/Analytics EQUIVALENT; Goals flagged only the card count
  (1 live vs 3 seeded — the data bucket).
- **The HTTP-layer audit** (curl-level, both sides) found the live head
  RESTRUCTURED per route since round 17 — see §B.

## §B Findings (all live-probed 2026-09-19)

**F1 — viewport + theme-color moved to the login route only.** The
live's app pages (`/`, `/Dashboard`, the 8 views, 404s) render
`<meta name="viewport" content="width=device-width, initial-scale=1.0">`
with NO viewport-fit and NO theme-color; the `/login` page renders
`width=device-width, initial-scale=1.0, viewport-fit=cover` plus
`<meta name="theme-color" content="#000000">`. The clone renders both
globally (the round-17 layout export). Fix: the layout `viewport` export
slims to `{ width, initialScale }`; a new pure seam
`buildRouteViewport(rawPath)` returns the login viewport (viewportFit
cover + themeColor #000000) for `/login` and the plain viewport
otherwise, consumed by the catch-all page's new `generateViewport`
export (returning the FULL object per route — deterministic regardless
of Next's layout→page merge semantics).

**F2 — the icon links split per route (apple-touch-icon is login-only
and both login links carry sizes).** The live's `/login` renders
`<link rel="icon" href="LOGO" sizes="any">` + `<link
rel="apple-touch-icon" href="LOGO" sizes="180x180">`; the app pages
render a single `<link rel="icon" href="LOGO" type="image/svg+xml">`
with NO apple-touch-icon. The clone renders a bare icon + a bare
apple-touch-icon on every route. Fix: the layout `icons` keeps only
`{ icon: "/finara-logo.png" }`; the seam's login metadata carries
`{ icon: { url, sizes: "any" }, apple: { url, sizes: "180x180" } }`
(page-level `icons` replaces the layout's — the same shallow-per-key
merge as openGraph). The app pages' `type="image/svg+xml"` is a base44
template mislabel (the href is a PNG) and is deliberately NOT
replicated — the same class as the broken manifest link (round 17): a
wrong mime hint on our true-PNG asset would be dishonest metadata with
zero visual effect. Documented delta.

**F3 — og:image dimensions/alt are login-only.** The live's `/login`
renders og:image + `og:image:width 1200` + `og:image:height 630` +
`og:image:alt "Base44 link preview"`; the app pages render a BARE
og:image (no dims, no alt). The clone renders og:image with 480×480
dims on every route (the round-17 shape). Fix: the seam returns the
bare image `[{ url: "/finara-logo.png" }]` for app routes and the full
descriptor `[{ url, width: 480, height: 480, alt: "Base44 link
preview" }]` for login. The dims describe OUR asset (the live's
1200×630 describes its CDN render — `?width=1200&height=630&resize=
contain`); asset values are deployment properties per the round-17
sitemap precedent, the STRUCTURE (dims+alt present on login, absent on
app pages) is the parity contract. The alt string is live content —
replicated exactly. The layout's openGraph default image slims to the
bare descriptor.

**F4 — the twitter block needs the live's shape (per-route description,
bare image, twitter:url).** The live renders on EVERY route:
twitter:title (= the og/document title), twitter:card
`summary_large_image`, twitter:image (bare — NO width/height),
twitter:url (= the absolute canonical), and twitter:description —
the FULL site description on `/`, `/Dashboard`, `/login`, and 404
routes, but on the 8 non-dashboard view routes the template
`{ViewLabel} on Finara. {SITE_DESCRIPTION.slice(0, 80)}.` (98 chars,
cut mid-word at "…clarity and con" + "." — probed on all 8). The clone
(Next's openGraph derivation) renders the full description everywhere,
twitter:image WITH width/height, and NO twitter:url. Fix: the seam
returns the complete explicit `twitter` block (`card`, `title`,
`description` via a new exported `twitterDescription(route)` helper,
bare `images`) plus `other: { "twitter:url": <absolute canonical> }` —
Next's Twitter metadata type has NO url field (verified in
next/dist/lib/metadata/types/twitter-types.d.ts), so the arbitrary-meta
escape hatch renders it. The absolute URL comes from a new
`absoluteCanonicalUrl(canonical)` helper (siteBaseUrl with
trailing-slash normalization; the dashboard canonical "/" renders the
BARE origin — matching the live's root og:url/canonical/twitter:url
shape).

**F5 — the keywords meta is not on the live.** The clone's layout
renders `<meta name="keywords" content="finance,budget,…">`; the live
head carries no keywords meta on any route. Fix: remove the `keywords`
field from layout.tsx.

**Verified UNCHANGED (non-findings):** the security headers (the live
trio + the clone's hardening pair on pages AND api), robots.txt (the
wildcard shape + sitemap line), sitemap.xml (the 9-URL set), the
per-route og:title/og:url/canonical (incl. the dashboard→root quirk),
the description text, og:site_name/og:type, the apple-mobile-web-*/
mobile-web-app-capable PWA metas, the broken manifest link (still
deliberately not replicated), and the `initial-scale=1` vs the live's
`initial-scale=1.0` (numerically identical; Next's numeric viewport
rendering — a documented framework micro-delta, unchanged from round
17).

## §C Affected surfaces

1. `src/lib/route-metadata.ts` — the seam: `buildRouteViewport` (NEW,
   F1), the login `icons` (F2), the per-route og:image shape (F3), the
   `twitter` block + `other["twitter:url"]` + `twitterDescription` +
   `absoluteCanonicalUrl` (F4), the `siteBaseUrl` trailing-slash
   normalization (F4 hardening).
2. `src/app/layout.tsx` — F1 (viewport slims), F2 (icons drop apple),
   F3 (openGraph default image bare), F5 (keywords removed).
3. `src/app/[...view]/page.tsx` — F1 (the `generateViewport` export
   delegating to `buildRouteViewport`).
4. `src/lib/__tests__/site-metadata.test.ts` — the round-18 RED specs
   (the re-pinned layout contract, the viewport split, the seam's
   twitter/icons/og-image tables).
5. Docs: AGENTS.md (the HTTP-layer invariant — the per-route head
   structure; the round-18 reference; counts), CLAUDE.md (the round-18
   ANALYZE/VERIFY references), README (the metadata row), PAD v1.17
   (§7 stale counts fixed — 348/16 files and 311/311 → the live counts;
   §10 round-18 row; the head-metadata passages), this plan's §G,
   `docs/session_22.md`.
6. `docs/screenshots/` — refreshed dev-server captures of the
   remediated codebase (login + the 9 views + the mobile drawer).
7. `.env.example` — no new env vars (`NEXT_PUBLIC_SITE_URL` already
   documented); verified aligned.

## §D Execution order

1. RED: update `src/lib/__tests__/site-metadata.test.ts` — re-pin the
   changed contracts (layout viewport/icons/keywords, the seam's
   og:image) and add the new ones (`buildRouteViewport`, the twitter
   table, `absoluteCanonicalUrl`, the login icons/og-image). Run the
   suite — expect exactly the round-18 specs red, everything else
   green.
2. GREEN, per finding: F1 (`buildRouteViewport` + the layout slim +
   the page's generateViewport) → F4 (the twitter block + helpers) →
   F3 (the og:image shapes) → F2 (the icons split) → F5 (keywords).
3. Gates: `bun run lint` · `bun run typecheck` · `bun run test`
   (378 − re-pinned + new) · `bun run build`.
4. Post-fix verification: rebuild + restart the production server;
   re-curl the per-route head on /, /Dashboard, /login, /Goals, and a
   404 (viewport/theme-color split, icon links, og:image shapes, the
   twitter set incl. url + the per-route descriptions) and re-run the
   body-DOM signature diff on the Dashboard (the body must be
   UNCHANGED — this round touches only the transport/metadata layer).
5. E2E gate: `bun run test:e2e` (67 specs — none touch the metadata
   layer, but the full gate is the pre-push contract).
6. Screenshots: dev server on :3000, login + 9 views + mobile drawer →
   `docs/screenshots/`.
7. Docs (§C.5) + atomic commits + push (SSH wrapper, main only).

## §E TDD plan

Red → green per finding. The spec changes:

- **Layout source contract (re-pinned)**: the `viewport` export carries
  NO `viewportFit`/`themeColor` (moved to the login route); `icons` is
  `{ icon: "/finara-logo.png" }` with NO apple entry; the source has no
  `keywords:` field; the openGraph default image is the bare descriptor
  (no width/height in the layout source's images array).
- **buildRouteViewport seam (NEW)**: `/login` → `{ width:
  "device-width", initialScale: 1, viewportFit: "cover", themeColor:
  "#000000" }`; `/`, `/Dashboard`, `/Goals`, `/NonexistentPage` →
  `{ width: "device-width", initialScale: 1 }` (no viewportFit, no
  themeColor).
- **The catch-all page source (NEW)**: exports `generateViewport`
  delegating to `buildRouteViewport` (a source read — the page file
  pulls the client graph).
- **The seam's og:image table (re-pinned)**: app routes (/, /Dashboard,
  /Goals, 404) → `[{ url: "/finara-logo.png" }]`; login → `[{ url,
  width: 480, height: 480, alt: "Base44 link preview" }]`.
- **The seam's twitter block (NEW)**: every route → card
  `summary_large_image`, title = the route title, bare images; the
  description table — the full SITE_DESCRIPTION on /, /Dashboard,
  /login, and 404s, and `{Label} on Finara. {SITE_DESCRIPTION.slice(0,
  80)}.` on each of the 8 non-dashboard view routes (pinned per route);
  `other["twitter:url"]` = the absolute canonical (bare origin for the
  dashboard, full path otherwise — pinned against the default base and
  an env override).
- **absoluteCanonicalUrl (NEW)**: "/" → the bare base; "/Goals" →
  base+"/Goals"; the base's trailing slash is normalized away.
- The round-17 specs that hold (headers, robots/sitemap, favicon
  identity, the title/canonical/og:url tables, siteBaseUrl) stay
  unchanged.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit green (378 − re-pins + additions) ·
  build exits 0 · E2E 67/67.
- HTTP-layer re-probe on the fresh build (curl, per route):
  - `/`, `/Dashboard`, `/Goals`, `/NonexistentPage`: NO theme-color, NO
    viewport-fit, ONE icon link (the logo, no apple-touch-icon), bare
    og:image (no dims/alt), twitter:title/card/image(bare)/url, the
    full twitter:description on /+/Dashboard+/NonexistentPage and the
    "Goals on Finara. …" template on /Goals.
  - `/login`: theme-color #000000 + viewport-fit=cover, icon
    sizes="any" + apple-touch-icon sizes="180x180", og:image with
    width/height/alt, the full twitter:description, twitter:url
    /login.
  - No `X-Powered-By`; the five security headers still on /login AND
    /api/settings; robots/sitemap unchanged (the round-17 shapes).
  - No `<meta name="keywords">` on any route.
- Body-DOM regression check: the Dashboard signature diff pre-fix vs
  post-fix is BYTE-IDENTICAL (both modes) — the round must not move
  the body DOM.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-19)

All five findings remediated red → green in plan order; every gate green.

**RED:** the re-pinned + new specs in `src/lib/__tests__/site-metadata.test.ts`
failed exactly as designed — 14 failing (the round-18 contracts: the
layout viewport/icons/keywords re-pins, `buildRouteViewport`, the
catch-all `generateViewport` wiring, the login icon pair, the og:image
shapes, the twitter description table + url, `absoluteCanonicalUrl`),
375 passing (every unchanged round-17 contract + the rest of the suite).

**GREEN (per finding):** F1 — `buildRouteViewport` added to the seam +
the layout `viewport` slimmed + the catch-all page's `generateViewport`
export; F4 — the explicit `twitter` block (card/title/bare image + the
`twitterDescription` template) + `other["twitter:url"]` +
`absoluteCanonicalUrl` (with `siteBaseUrl` trailing-slash
normalization); F3 — the seam's per-route og:image shapes (bare on app
routes, the 480×480 + "Base44 link preview" descriptor on login) + the
layout default slimmed; F2 — the layout `icons` dropped the apple entry
+ the seam's login-level sized icon pair; F5 — the `keywords` field
removed from the layout. One implementation correction caught by tsc
during GREEN: Next's `Twitter` type is a union whose base member
(`TwitterMetadata`) carries no `card` — the spec narrows with `"card" in
twitter` before reading it.

**Post-fix verification (fresh production build, repo-local DB):**
- App pages (/, /Dashboard, /Goals, /NonexistentPage): plain viewport
  (NO viewport-fit, NO theme-color), a single bare icon link, a BARE
  og:image, the full twitter description (the "Goals on Finara. …
  clarity and con." 98-char template byte-exact on /Goals), twitter:url
  = the absolute canonical (the BARE origin for the dashboard), NO
  keywords meta.
- /login: `viewport-fit=cover` + `theme-color #000000`, icon
  `sizes="any"` + apple-touch-icon `sizes="180x180"`, og:image with
  width/height + alt "Base44 link preview", the full twitter
  description (274), twitter:url /login, twitter:card
  summary_large_image.
- The round-17 pins re-verified: the five security headers on /login
  AND /api/settings with `X-Powered-By` gone; robots.txt the wildcard
  shape; sitemap.xml the 9-URL set.
- Body-DOM regression check: the clone Dashboard signature diff pre-fix
  vs post-fix is BYTE-IDENTICAL (179/179 signatures matched, both sorted
  and raw modes) — the round moved only the transport/metadata layer.

**Gates (final):** lint 0 · tsc 0 · unit 389/389 (378 + 11 net-new) ·
build clean · E2E 67/67.

**Deliverables:** AGENTS/CLAUDE/README/PAD v1.17 aligned (the
per-route head-structure invariant, the round-18 references, counts
378 → 389, the PAD §7 stale counts fixed 348/16 → 389/17 and 311 →
389, the §10 round-18 paragraph, the §11 seam entries);
`docs/screenshots/` refreshed (dev server: login + the 9 views + the
mobile drawer); this plan's §G; `docs/session_22.md`. `.env.example`
re-verified aligned (no new env vars — `NEXT_PUBLIC_SITE_URL` carries
the same role).

Evidence: `/home/z/my-project/captures/r18/` (sorted + raw captures for
live/clone pre/post, the per-view diff reports, the structural probe
transcripts, the HTTP-layer probe transcripts — per-route head dumps
both sides + the twitter:description table, the VLM sweep screenshots +
verdicts, and the E2E logs).
