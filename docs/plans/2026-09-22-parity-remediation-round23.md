# Round-23 Remediation Plan — the fifth zero-drift verification round

Date: 2026-09-22 · Scope: the standard full live re-probe with the two
operator-mandated focus areas re-verified — the mobile navigation menu
(anatomical + behavioral, both sides, dev and production) and the
TailwindCSS v4 audit (production bundle + runtime cascade +
dynamic-class scan) — plus the focused interactive sweep (FAB/Quick Add
chooser/step-2/close-toggle chain), the HTTP-layer audit (security
headers, per-route description metas, login-only head pins, the 404
status quirk), the fresh-environment gate verification, and the
codebase production-readiness review (CI workflow byte integrity,
dependency advisories vs the PAD §10 tail, TODO/FIXME scan).

**The live app is UNCHANGED since round 22** on every probed layer —
the FIFTH consecutive zero-drift head round (19, 20, 21, 22, 23):

- **Body DOM** (signature-multiset diff, 10 surfaces): zero
  non-bucketed deltas. Every only-live/only-clone delta classifies into
  the documented buckets: the live user's dismissed-insights empty
  state (Brain `w-12` + "No insights available yet" + the `py-8
  text-center` container + the two `p` lines) vs the clone's three
  seeded insight records (rows, type badges with their per-type color
  sets, dismiss X buttons, suggested-action callouts, confidence
  footers, header rows, type icons), seed-data row/badge/icon counts
  (expense category badges, goal priority badges, account type icons,
  activity rows, chart-adjacent blocks), chart SVG data
  (polygon/polyline/path/line/circle), theme-state icons (the live
  session rendered dark — Sun glyph; the clone light — Moon glyph, the
  documented bucket), the live's duplicated toaster viewport (round-4
  by-design delta), the live's framer-motion `style` wrappers vs the
  clone's `entranceStyle` settles, and Next.js infra
  (`next-route-announcer`, boot scripts).
- **Desktop chrome**: byte-identical — the sidebar gradient container
  `flex flex-col flex-1 min-h-0 sidebar-gradient`, header `flex
  items-center h-16 px-6 border-b border-slate-700/30`, nav `flex-1
  px-4 py-6 space-y-2`, bottom `p-4 space-y-3 border-t
  border-slate-700/30`, the SyncedBadge outline-variant render (the
  div with the classic outline class set + the green tail
  `text-green-600 border-green-300 dark:text-green-400
  dark:border-green-600` + the wifi `w-3 h-3` glyph), the logo
  `lucide lucide-dollar-sign w-6 h-6 text-emerald-400`, nav icons
  `w-5 h-5` size-first, the bare anchor > pill-div structure (the
  anchor carries NO class attribute; the pill div carries the full
  active class set with `tabindex="0"`), and the inner gradient panes
  with `transition-colors duration-300`.
- **Mobile navigation — the operator's first explicit focus — VERIFIED
  WORKING on both sides and byte-identical**: the drawer (`lg:hidden
  fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900`, the `flex
  flex-col h-full pt-20` wrapper, `flex-1 px-4 py-6 space-y-2` nav, 9
  links, the `p-4 border-t` bottom with the direct Sign Out) opens, a
  nav-link click navigates AND unmounts the drawer, the Menu↔X glyph
  swaps both directions, and both sides render zero NEW console errors
  (the live carries only its documented Base44 backend artifacts: the
  403 app-state-check error and the cdn.tailwindcss.com production
  warning). Verified in dev (the E2E mobile specs — including the
  375px sidebar-hidden check) AND against the production build (manual
  agent-browser probe).
- **TailwindCSS v4 — the operator's second explicit focus — CLEAN in
  dev and production**: the production CSS bundle (172 KB main chunk)
  carries `lg\:hidden{display: none}`, `.bg-slate-800` with the raw
  `#1e293b` v3 hex fallback, `.dark\:bg-gray-900:is(.dark *)`, and all
  four `fin-*` keyframes (`fin-card-in`/`fin-overlay-in`/
  `fin-scale-in`/`fin-drawer-in`) with the `prefers-reduced-motion`
  gate; the unlayered v3 palette pin wins the cascade at runtime —
  computed-style probes ON THE CSS VARIABLES return
  `#2563eb`/`#1e293b`/`#ef4444`/`#34d399`/`#4b5563` (the exact
  ADR-018 pins), with zero oklch definitions leaking into the
  variables; NO dynamic class construction exists (the only
  template-literal className in the tree is layout.tsx's static
  `${inter.variable}` font variable).
- **HTTP layer**: byte-exact vs the round-17→22 pins — the
  security-header edge trio (Referrer-Policy
  strict-origin-when-cross-origin / X-Content-Type-Options nosniff /
  HSTS max-age=31536000) plus the clone's documented hardening pair
  (X-Frame-Options DENY + Permissions-Policy), the `Goals on Finara.
  Finara is your intelligent financial co-pilot, designed to bring
  clarity and con.` description template on all three metas
  (description/og:description/twitter:description), the login-only
  viewport-fit=cover + theme-color #000000 + sized icon pair (icon
  sizes="any" + apple-touch-icon 180x180) + og:image dims/alt +
  twitter:image:alt "Base44 link preview", the per-route twitter:url,
  canonical, and the SPA-style HTTP 200 for unknown paths (the live
  serves the shell for every route — the clone matches).
- **Interactive sweep** (both sides, all matching): the FAB (`fixed
  bottom-6 right-6 z-50` wrapper with tabIndex=0, the sage `w-14 h-14
  rounded-full bg-primary-sage` button with the plus `w-6 h-6
  text-white`), the Quick Add chooser (overlay `fixed inset-0
  bg-black/50 flex items-center justify-center p-4 z-40`, the
  `w-full max-w-md` wrapper, title "Quick Add", subtitle "What would
  you like to add?", Add Income/Add Expense), the step-2 form (the
  "Needs" default segmented tab, Back, Add disabled-until-filled), and
  the FAB acting as the close toggle (click with the chooser open →
  overlay unmounts; the plus glyph settles unchanged on both sides).
- **Gates on the fresh environment**: lint 0 · tsc 0 · unit 434/434 ·
  E2E 67/67 (3.4m, serial, zero console errors across all 9 views) ·
  build clean.
- **Codebase production-readiness**: the CI workflow's raw bytes are
  clean (`branches: [main]` literal — marker-safe byte check + YAML
  parse both confirm; the recurring `ain]` reading is the display
  artifact of `[m` being interpreted as an ANSI reset, re-demonstrated
  this round when the artifact ate the `[main]` token inside this
  session's OWN output labels); `bun audit` reports exactly the PAD §10
  documented tail (43 advisories — 30 high / 12 moderate / 1 low — all
  in dev/CLI-time transitive trees; the 24-package runtime set carries
  ZERO advisories); no TODO/FIXME markers; the round-21/22 artifacts
  (db-path contract, aligned .env.example, SKILL.md) all in place; the
  live user's theme state left as found (dark — verified before and
  after the probe).

Zero parity drift and zero code defects found — per the
round-15/20/21/22 precedent the round pivots to what remains: the
verification deliverables themselves (fresh dev-server screenshots of
the verified codebase, the round-23 documentation set, and the session
log), which this plan executes.

Evidence: `/home/z/my-project/captures/r23/` (outside the repo, per
convention) — the signature captures for both sides (9 views + the
mobile drawer each) and the HTTP head dumps both sides.

## §A Context

Rounds 2–22 drove the clone to verified body-DOM, transport-layer,
per-route head, description, interactive-behavior, dead-code,
environment-contract, and full-stack-verification parity. The round-23
re-probe (2026-09-22, agent-browser isolated sessions, production
build on :3000 with the repo-local DB) found the live unchanged on
every layer for the fifth consecutive round, with both operator focus
areas (mobile navigation, Tailwind v4) explicitly cleared in dev and
production.

The workspace was NOT reset this round — the round-22 environment
survived (node_modules, db/custom.db, the Playwright chromium
headless-shell). A `git pull` fast-forwarded the repo to `61d2e9a`
(the operator's session-log follow-up commit adding `docs/session_31.md`
— the round-22 session transcript). The known `DATABASE_URL` shadow
trap (the sandbox exports an absolute `file:/home/z/my-project/db/custom.db`
that would point OUTSIDE the repo) was confirmed active and handled
with `unset` on every server/gate invocation — the round-21 `db-path.ts`
contract makes the repo-local resolution CWD-independent, but the
process-env shadow precedes `.env` loading, so the unset remains part
of the local runbook.

## §B Findings (all verified against the codebase 2026-09-22)

**F1 — zero parity drift (VERIFIED, no action).** Every probed layer
matches: body DOM (10 surfaces, all deltas in documented buckets),
chrome, mobile navigation (anatomy + behavior, both sides), the
Tailwind v4 production bundle, the HTTP/head layer, and the focused
interactive sweep. The live's fifth consecutive zero-drift round.

**F2 — the two operator focus areas: clean (VERIFIED, no action).**
The mobile navigation menu works as expected on both sides — the
drawer anatomy is byte-identical, link clicks navigate and unmount the
drawer, the Menu↔X glyph swaps, and zero NEW console errors render in
dev and production. No TailwindCSS v4 bug exists: the drawer's utility
classes and keyframes ship in the production bundle, no dynamic class
construction exists, and the v3 palette pin wins the cascade at
runtime (computed-style verified against the CSS variables
themselves, per the round-10 lesson).

**F3 — no code defects (VERIFIED, no action).** The full gate chain is
green on the environment (lint 0 · tsc 0 · 434/434 · 67/67 · build
clean); the CI workflow's raw bytes are clean (marker-safe byte
verification); the audit tail matches the PAD §10 documentation
exactly (43/0-runtime); no TODO/FIXME markers; the round-21/22
artifacts (db-path contract, .env.example, SKILL.md) are all in place.

**F4 — the verification deliverables (the round's work).** The
operator prompt's remaining mandates: refreshed dev-server screenshots
under `docs/screenshots/`, the round-23 documentation set
(AGENTS/CLAUDE/README/PAD round-23 references + this plan + the
session log), and the commit/push. This round's honest verdict — a
verification round — is itself the deliverable: the evidence that the
codebase is production-ready as-is, freshly re-verified end-to-end.

**Environment lesson (re-demonstrated, not code):** the `[m` ANSI-reset
display artifact is not limited to file contents — it eats the token
inside ANY output stream, including this session's own printed labels
(a `print('literal [main] present:', ...)` label rendered as `literal
ain] present`). The defense is the same as rounds 21–22: never trust
the rendering of a `[`-prefixed token in terminal output; assert on
the bytes with marker-safe comparisons (construct the needle from
concatenated fragments) and let the boolean result speak.

## §C Affected surfaces

1. `docs/plans/2026-09-22-parity-remediation-round23.md` — this plan
   (§A–§G).
2. `docs/screenshots/` — refreshed dev-server captures of the verified
   codebase (login + the 9 views + the mobile drawer).
3. `docs/session_32.md` — the round-23 session log.
4. Docs alignment: AGENTS.md (the round-23 plan reference), CLAUDE.md
   (the ANALYZE round-23 pointer), README.md (the 23-rounds row), PAD
   (v1.22 — the header + §10 round-23 row), financial-dashboard_SKILL.md
   (last_updated + the 23-round history row + the ANSI-artifact
   lesson extension).
5. Git: atomic commits + the SSH-wrapper push to main.

No source files change — the audit found nothing to remediate (the
existing 434 + 67 suite IS the executable verification record).

## §D Execution order

1. Screenshots: dev server on :3000 (repo-local DB, `DATABASE_URL`
   unset from the environment), login + 9 views + mobile drawer →
   `docs/screenshots/` (full-page captures, matching the established
   convention).
2. Docs: this plan + the session log + the AGENTS/CLAUDE/README/PAD/
   SKILL.md round-23 references.
3. Final gate verification: lint · typecheck · unit · E2E · build (all
   green — the pre-push contract).
4. Atomic commits (the plan + session log, the screenshots, the docs
   alignment) + the SSH-wrapper push to main.

## §E TDD plan

Not applicable — zero code changes (the audit found no defects). The
TDD discipline applies to code changes; this round's verification
burden is carried by the existing executable contracts: the 434-spec
unit suite (including the round-21 db-path contract) and the 67-spec
E2E gate, both re-run green on the environment as the round opened.
Any future live drift that surfaces in round 24+ resumes the red →
green discipline.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit 434/434 · build exits 0 · E2E 67/67 (the
  pre-push contract, re-verified at the round's close).
- Parity evidence: the signature-multiset diffs for all 10 surfaces
  with every delta classified into the documented buckets; the
  chrome/mobile/HTTP/interactive probes transcribed in §Summary
  above.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-22)

The audit and verification completed in plan order; every gate green;
no code changes (by finding, not by omission).

**The re-probe:** logged into the live (agent-browser isolated
session), captured the 9 view signatures + the mobile drawer signature
on both sides (the clone against the production build on :3000 with
the repo-local `db/custom.db`), and diffed — zero non-bucketed deltas
on all 10 surfaces. The chrome probes (sidebar anatomy, SyncedBadge,
nav pills, inner panes), the mobile-navigation behavior probes (open →
navigate → close, glyph swap, console sweep), the HTTP-layer audit
(headers, head metas, the 404-status quirk), and the focused
interactive sweep (FAB, chooser, step-2, the FAB close-toggle) all
matched the pins byte-exact.

**The two focus areas:** the mobile navigation menu verified working
on both sides (dev and production, byte-identical anatomy, zero new
console errors) and the Tailwind v4 audit verified clean (the
production bundle carries every drawer utility + keyframe; no dynamic
class construction; the v3 palette pin wins at runtime — computed
`#2563eb`/`#1e293b` on the CSS variables themselves).

**Gates:** lint 0 · tsc 0 · unit 434/434 · build clean · E2E 67/67.

**Deliverables:** the re-captured `docs/screenshots/` (dev server:
login + the 9 views + the mobile drawer, full-page) — every one of the
11 fresh captures came out **byte-identical to round 22's** (git object
hashes match; same code, deterministic seed, same-day date-relative
surfaces), so git carries no delta and the round-22 captures stand as
the current record; AGENTS/CLAUDE/
README/PAD v1.22/SKILL.md aligned (the round-23 references);
`docs/session_32.md`; this plan's §G.
