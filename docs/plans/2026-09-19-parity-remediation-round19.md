# Round-19 Remediation Plan — the per-route description-template round

Date: 2026-09-19 · Scope: the standard full live re-probe (10-surface + login
signature-multiset diff, BOTH the sorted and the round-16 raw-order mode,
the per-element style/motion audit, the dialog/chooser/FAB/Progress/
mobile structural probes, the VLM side-by-side sweep) plus the
**HTTP-transport and document-metadata layer audit** (the round-17 lesson,
standard since round 17 — the live head has now changed three rounds in a
row): response headers, `<head>` metadata, robots.txt, sitemap.xml.

**The live app's BODY DOM is UNCHANGED since round 18** (zero
non-bucketed deltas on all 11 surfaces in both diff modes; RAW == SORTED
everywhere — no class-order drift; every structural probe matches the
round-14/16/18 pins; VLM 5/5 EQUIVALENT, the Analytics pair equivalent on
the full-page comparison — the initial viewport-crop flag was an artifact).
But the HTTP-layer audit found the live's `<head>` moved AGAIN: the
round-18 `X on Finara.` description template now applies to the MAIN
`description` and `og:description` metas on the eight non-dashboard view
routes (round 18 had it on `twitter:description` only), and `/login`
renders a `twitter:image:alt` the clone does not. Two findings, both in
the transport/metadata layer — the body DOM is untouched this round.

Evidence: `/home/z/my-project/captures/r19/` (outside the repo, per
convention) — sorted + raw signature captures for both sides, the per-view
diff report, the structural probe transcripts (motion audit, modal/
chooser/Progress/drawer rAF samples, sidebar/user-menu/SyncedBadge), the
VLM sweep screenshots + verdicts, and the HTTP-layer probe transcripts
(per-route head dumps both sides, headers, robots, sitemap, the
description table across all 8 view routes).

## §A Context

Rounds 2–18 drove the clone to verified body-DOM parity, then to
transport-layer parity (round 17: security headers, per-route og
title/url, robots/sitemap, the favicon), then to the per-route head
STRUCTURE (round 18: the login-only viewport/theme-color/icon-pair/
og-image-descriptor, the explicit twitter block with its per-route
description template + twitter:url, the keywords removal). The round-19
re-probe (2026-09-19, agent-browser isolated sessions, production build
on :3000 with the repo-local DB, both sides dark-themed):

- **Sorted + raw diffs**: every per-view delta classifies into the
  documented buckets (seed-data counts, lucide svg internals, the live's
  AI-insight empty state, infra, the sonner toaster, a11y additions, the
  login demo-credentials affordance) — ZERO non-bucketed deltas on all 11
  surfaces, and the raw counts EQUAL the sorted counts everywhere.
- **Structural probes**: the motion audit (15 settled elements on the
  live Dashboard — STRUCTURE intact; the 19→15 count delta is the live
  user's data shrinking: 2 recent-activity rows now, 1 budget row, the
  AI-insight empty state — all data-bucket, the wrapper anatomy
  unchanged), the Add Expense modal (overlay `fixed inset-0 bg-black/50
  flex items-center justify-center p-4 z-50` + settled `opacity: 1;
  transform: none;`, card `rounded-xl border text-card-foreground shadow
  w-full max-w-2xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto`,
  the div title with the full literal), the FAB chooser (z-40 overlay +
  `opacity: 1;` · wrapper `w-full max-w-md` + `opacity: 1; transform:
  none;` · the plain card · "Quick Add" / "What would you like to add?"),
  the Progress indeterminate mechanism (`data-state=indeterminate`,
  `aria-valuemax=100`, NO aria-valuenow, manual `translateX(-75.5%)`), the
  mobile chrome (top bar `lg:hidden fixed top-0 left-0 right-0 z-50
  bg-white/95 dark:bg-gray-900/95 …` + the drawer root `lg:hidden fixed
  inset-0 z-40 bg-slate-800 dark:bg-gray-900` with the slide-in
  rAF-sampled at −300px → +36.1px overshoot → settle, 2 navs / 18 links,
  the `p-4 border-t border-slate-700/30` bottom with the direct Sign Out
  button), the SyncedBadge (base-only, mobile top bar + desktop sidebar
  bottom), the sidebar raw orders (aside/container/header/nav/bottom all
  exact), the user-menu anatomy (Dark Mode + Sign Out items,
  span-wrapped labels) — ALL match the pins.
- **VLM sweep** (5 view pairs, dark/dark): Dashboard/Expenses/
  Investments/Goals EQUIVALENT; Analytics initially flagged (chart-scale
  data differences + a viewport-crop artifact hiding the below-fold
  average cards) — the full-page re-comparison returned EQUIVALENT.
- **The HTTP-layer audit** (curl-level, both sides) found the live head
  moved again since round 18 — see §B.

## §B Findings (all live-probed 2026-09-19)

**F1 — the `X on Finara.` description template now applies to the MAIN
`description` and `og:description` metas on the eight view routes.** The
live's eight non-dashboard view routes (probed on all 8: /Income,
/Expenses, /Accounts, /Investments, /Import, /Analytics, /Goals,
/Settings) render `<meta name="description" content="{ViewLabel} on
Finara. {SITE_DESCRIPTION.slice(0, 80)}.">` — the SAME 98-char mid-word
truncation (`… bring clarity and con.`) the round-18 probe found on
twitter:description — and `og:description` carries the identical string.
`/`, `/Dashboard`, `/login`, and 404 routes keep the FULL
SITE_DESCRIPTION on all three description metas (re-verified). The clone
(the round-18 seam) renders the FULL text on `description` and
`og:description` everywhere — only `twitter:description` carries the
template. Fix: the seam's private `twitterDescription(route)` helper
generalizes to `routeDescription(route)` and feeds ALL THREE metas
(`description`, `openGraph.description`, `twitter.description`) — the
live now renders one per-route description string everywhere it emits a
description.

**F2 — `/login` renders `twitter:image:alt "Base44 link preview"`.** The
live's login route carries `<meta name="twitter:image:alt" content="Base44
link preview">` alongside the og:image descriptor (width/height/alt —
pinned round 18); the app pages render NO twitter:image:alt (their
twitter:image is bare, like their og:image). The clone renders the bare
twitter:image on every route including /login. Fix: the seam's login
twitter block carries `images: [{ url, alt: "Base44 link preview" }]`;
app routes keep the bare `[{ url }]`. (No twitter:image width/height
metas on ANY route — the live's og:image dims stay og-only.)

**Verified UNCHANGED (non-findings):** the security headers (the live
trio on every response; the clone's hardening pair + no X-Powered-By),
robots.txt (the wildcard shape + sitemap line), sitemap.xml (the 9-URL
set, / at 1.0 + the eight views at 0.8/weekly), the per-route
og:title/og:url/canonical (incl. the dashboard→root quirk), the title
set, twitter:card/title/url, the viewport/theme-color split
(login-only), the icon links (the login sized pair; the app pages'
single icon), the og:image shapes (login descriptor vs app bare), the
PWA metas (apple-mobile-web-*, mobile-web-app-capable), the broken
manifest link (still deliberately not replicated), and the
`initial-scale=1` vs `1.0` framework micro-delta.

## §C Affected surfaces

1. `src/lib/route-metadata.ts` — the seam: F1 (`routeDescription`
   generalizing `twitterDescription`, wired into `description` +
   `openGraph.description` + `twitter.description`), F2 (the login
   twitter image alt).
2. `src/lib/__tests__/site-metadata.test.ts` — the round-19 RED specs
   (the re-pinned openGraph/description tables; the login
   twitter-image-alt spec; the per-route description table).
3. Docs: AGENTS.md (the HTTP-layer invariant — the per-route description
   template applies to all three description metas; the round-19
   reference), CLAUDE.md (the round-19 VERIFY counts), README (the
   metadata row + counts), PAD v1.18 (§7 counts, §10 round-19 row, the
   head-metadata passages, §11 seam entries), this plan's §G,
   `docs/session_24.md`.
4. `docs/screenshots/` — refreshed dev-server captures of the remediated
   app (login + the 9 views + the mobile drawer).
5. `.env.example` — no new env vars; re-verified aligned.

## §D Execution order

1. RED: update `src/lib/__tests__/site-metadata.test.ts` — re-pin the
   changed contracts (the /Goals openGraph block + description carry the
   template) and add the new ones (the per-route description table for
   `description`/`og:description`, the login twitter image alt). Run the
   suite — expect exactly the round-19 specs red, everything else green.
2. GREEN, per finding: F1 (`routeDescription` + the three call sites) →
   F2 (the login twitter image alt).
3. Gates: `bun run lint` · `bun run typecheck` · `bun run test`
   (389 − re-pinned + new) · `bun run build`.
4. Post-fix verification: rebuild + restart the production server;
   re-curl the per-route head on /, /Dashboard, /login, /Goals, and a 404
   (the description template on the view routes' description/og:description,
   the login twitter:image:alt) and re-run the body-DOM signature diff on
   the Dashboard (the body must be UNCHANGED — this round touches only
   the transport/metadata layer).
5. E2E gate: `bun run test:e2e` (67 specs — none touch the metadata
   layer, but the full gate is the pre-push contract).
6. Screenshots: dev server on :3000, login + 9 views + mobile drawer →
   `docs/screenshots/`.
7. Docs (§C.3) + atomic commits + push (SSH wrapper, main only).

## §E TDD plan

Red → green per finding. The spec changes:

- **The per-route description table (re-pinned + extended)**: the eight
  view routes → `description` AND `openGraph.description` AND
  `twitter.description` all equal `{ViewLabel} on Finara.
  {SITE_DESCRIPTION.slice(0, 80)}.` (98 chars, pinned per route); `/`,
  `/Dashboard`, `/login`, and 404s → all three equal the FULL
  SITE_DESCRIPTION.
- **The /Goals openGraph block (re-pinned)**: `openGraph.description`
  carries the template (the round-17/18 spec pinned SITE_DESCRIPTION
  there); the block stays COMPLETE (title/url/siteName/type/images
  unchanged — the shallow-merge discipline).
- **The login twitter image (NEW)**: `buildRouteMetadata("/login")
  .twitter?.images` = `[{ url: "/finara-logo.png", alt: "Base44 link
  preview" }]`; the app routes' twitter images stay `[{ url:
  "/finara-logo.png" }]` (bare — no alt, no dims).
- The round-18 specs that hold (the viewport split, the icon pair, the
  og:image shapes, twitter:card/title/url, absoluteCanonicalUrl, the
  layout source contract, headers, robots/sitemap, favicon identity,
  siteBaseUrl) stay unchanged.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit green (389 − re-pins + additions) ·
  build exits 0 · E2E 67/67.
- HTTP-layer re-probe on the fresh build (curl, per route):
  - `/Goals`, `/Income` (spot-check all 8 in the evidence transcript):
    `description` + `og:description` = the 98-char template
    byte-exact; `twitter:description` unchanged (the same template).
  - `/`, `/Dashboard`, `/login`, `/NonexistentPage`: all three
    description metas = the FULL text.
  - `/login`: `twitter:image:alt` = "Base44 link preview"; app pages:
    no twitter:image:alt.
  - The round-17/18 pins re-verified: the five security headers, no
    X-Powered-By, robots/sitemap shapes, the viewport/theme-color
    split, the icon links, the og:image shapes, twitter:url.
- Body-DOM regression check: the clone Dashboard signature diff pre-fix
  vs post-fix is BYTE-IDENTICAL (both modes) — the round must not move
  the body DOM.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-19)

Both findings remediated red → green in plan order; every gate green.

**RED:** the re-pinned + new specs in `src/lib/__tests__/site-metadata.test.ts`
failed exactly as designed — 3 failing (the re-pinned /Goals openGraph block
+ description, the F1 per-route description table, the F2 login
twitter-image alt), 389 passing (every unchanged round-17/18 contract +
the rest of the suite, including the new "home/dashboard/login/404 keep
the FULL text on description AND og:description" spec — those routes
already carried the full text).

**GREEN (per finding):** F1 — the seam's private `twitterDescription`
generalized to `routeDescription(route)` and wired into all three
description fields (`description`, `openGraph.description`,
`twitter.description` — one per-route string everywhere); F2 — the seam's
login twitter block carries `images: [{ url, alt: "Base44 link preview"
}]` (the app routes keep the bare `[{ url }]`). One implementation note
validated during planning: Next renders `twitter:image:alt` from the
twitter images' `alt` field (verified in the framework source —
`node_modules/next/dist/lib/metadata/metadata.js`), so no escape hatch
was needed.

**Post-fix verification (fresh production build, repo-local DB):**
- /Goals + /Income: `description` + `og:description` +
  `twitter:description` all byte-identical to the live's template
  strings (98/99 chars, compared programmatically).
- /login: `twitter:image:alt "Base44 link preview"` present (byte-equal
  to the live); NO `twitter:image:width`/`twitter:image:height` on
  either side (the og dims stay og-only).
- The round-17/18 pins re-verified: the five security headers with
  `X-Powered-By` gone, robots.txt the wildcard shape, sitemap.xml the
  9-URL set, the viewport/theme-color split, the login icon pair, the
  og:image shapes, twitter:url/card/title.
- Body-DOM regression check: the clone signature diff pre-fix vs
  post-fix is BYTE-IDENTICAL (525/525 on the Dashboard root, 268/268 on
  Goals, both modes) — the round moved only the transport/metadata
  layer.

**Environment notes:** the sandbox's pre-set `DATABASE_URL` shell
variable (an absolute path to a non-existent parent-workspace DB)
shadowed the repo `.env` — the known round-17/18 trap, handled by
`unset DATABASE_URL` on every server/test invocation. The fresh clone
also needed `bunx playwright install chromium` (the E2E runner's
chromium_headless_shell-1234 was missing from the reset workspace cache
— the first E2E run failed 67/67 on `browserType.launch` before the
install; not a code regression). One live-probe incident: the first
mobile-drawer attempt clicked the top bar's FIRST button — the theme
toggle — flipping the live account to light; caught via the VLM theme
mismatch, toggled back to dark via the user menu, and the VLM
screenshots retaken dark-verified (the DOM signature captures are
class-attribute-based and theme-independent — unaffected).

**Gates (final):** lint 0 · tsc 0 · unit 392/392 (389 + 3 net-new) ·
build clean · E2E 67/67.

**Deliverables:** AGENTS/CLAUDE/README/PAD v1.18 aligned (the
per-route-description invariant, the round-19 references, counts
389 → 392, the §10 round-19 paragraph, the §11 seam entries);
`docs/screenshots/` refreshed (dev server: login + the 9 views + the
mobile drawer); this plan's §G; `docs/session_24.md`. `.env.example`
re-verified aligned (no new env vars — `NEXT_PUBLIC_SITE_URL` carries
the same role).
