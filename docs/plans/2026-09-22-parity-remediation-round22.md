# Round-22 Remediation Plan — the full-stack verification round

Date: 2026-09-22 · Scope: the standard full live re-probe with the two
operator-mandated focus areas — the mobile navigation menu (behavioral +
anatomical, both sides, dev and production) and the TailwindCSS v4 audit
(production bundle + runtime cascade + dynamic-class scan) — plus the
complete interactive sweep (FAB/Quick Add both steps, Add Expense modal with
Quick Select tiles, AI Coach, Analytics chart configuration, theme
lifecycle, expense CRUD round-trip), the HTTP-layer audit (security
headers, per-route description metas, login-only head pins, robots,
sitemap), the fresh-environment gate verification, and the codebase
production-readiness review (CI workflow integrity, dependency advisories,
docs alignment).

**The live app is UNCHANGED since round 21** on every probed layer —
the fourth consecutive zero-drift head round (19, 20, 21, 22):

- **Body DOM** (signature-multiset diff, 10 surfaces): zero non-bucketed
  deltas. Every only-live/only-clone delta classifies into the documented
  buckets: seed-data counts (the live user's goals/expenses/insight
  populations differ), chart SVG data (polygon/polyline/path), theme-state
  icons (the live session rendered dark — Sun glyph; the clone light —
  Moon), the live's duplicated toaster viewport (round-4 by-design delta),
  the live's framer-motion `style` wrappers vs the clone's `entranceStyle`,
  the live's dismissed-insights empty state (Brain `w-12` +
  "No insights available yet") vs the clone's three seeded insight records
  (rows, type badges, dismiss buttons), and Next.js infra
  (`next-route-announcer`, boot scripts).
- **Desktop chrome**: byte-identical — the sidebar gradient container
  `flex flex-col flex-1 min-h-0 sidebar-gradient`, header
  `flex items-center h-16 px-6 border-b border-slate-700/30`, nav
  `flex-1 px-4 py-6 space-y-2`, bottom `p-4 space-y-3 border-t
  border-slate-700/30`, the SyncedBadge outline-variant render, the logo
  `w-6 h-6 text-emerald-400`, nav icons `w-5 h-5` size-first, the bare
  anchor > pill-div (`className` before `tabIndex`) structure, and the
  inner gradient pane with `transition-colors duration-300 font-sans`.
- **Mobile navigation — the round's first explicit focus — VERIFIED
  WORKING on both sides and byte-identical**: the drawer
  (`lg:hidden fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900`, the
  `flex flex-col h-full pt-20` wrapper, `flex-1 px-4 py-6 space-y-2` nav,
  9 links, the `p-4 border-t` bottom with the direct Sign Out) opens, a
  nav-link click navigates AND unmounts the drawer, the Menu↔X glyph swaps
  both directions, and both sides render zero console errors. Verified in
  dev (the E2E mobile specs) AND against the production build (manual
  agent-browser probe).
- **TailwindCSS v4 — the round's second explicit focus — CLEAN in dev and
  production**: the production CSS bundle carries `lg\:hidden{display:
  none}`, `.bg-slate-800` (referencing the pinned `--color-slate-800`),
  `.dark\:bg-gray-900:is(.dark *)`, and all four `fin-*` keyframes
  (`fin-card-in`/`fin-overlay-in`/`fin-scale-in`/`fin-drawer-in`) with the
  `prefers-reduced-motion` gate; NO dynamic class construction exists in
  the finara components (the only template-literal matches are
  `aria-label` attributes, not classes); and the unlayered v3 palette pin
  wins the cascade at runtime — computed-style probes return
  `#2563eb`/`#1e293b`/`#ef4444`/`#34d399` (the exact ADR-018 v3 pins),
  overriding both Tailwind v4.1.18's regenerated `@layer theme` ramp
  (`#155dfc`) and its `@supports (color:lab(0% 0 0))` re-definition.
- **HTTP layer**: byte-exact vs the round-17/18/19/20/21 pins — the
  security-header edge trio (Referrer-Policy/X-Content-Type-Options/HSTS)
  plus the clone's hardening pair, the `Goals on Finara. Finara is your
  intelligent financial co-pilot, designed to bring clarity and con.`
  description template on all three metas, the login-only
  viewport-fit=cover + theme-color #000000 + sized icon pair +
  twitter:image:alt "Base44 link preview", the wildcard robots.txt, the
  9-URL sitemap, and the SPA-style HTTP 200 for unknown paths (the live
  serves the shell for every route — the clone matches).
- **Interactive sweep** (live side, all matching the pins): the FAB
  (`fixed bottom-6 right-6 z-50` wrapper with tabIndex, sage
  `w-14 h-14 rounded-full` button, plus `w-6 h-6`), the Quick Add chooser
  (overlay `z-40`, `w-full max-w-md` wrapper, plain card, title "Quick
  Add", subtitle "What would you like to add?", Add Income/Add Expense),
  the step-2 form (Back outline + Add disabled-until-filled, "Needs"
  default), the Add Expense modal (max-w-2xl + 90vh scroll, Quick Select
  tiles with the "Rent/Mortgage" label), the AI Coach (max-w-2xl h-[80vh]
  card, "AI Financial Coach", the 5 quick questions), the Analytics chart
  configuration (grid lines `stroke="#e2e8f0" stroke-dasharray="3 3"` +
  `dark:stroke-gray-600`, axis `#64748b` + `dark:stroke-gray-400`), the
  theme toggle (dark↔light, glyph swap), and an expense CRUD round-trip
  (add via Quick Select tile → row renders → native
  `confirm("Are you sure you want to delete this expense?")` → delete).
- **Gates on the fresh environment**: lint 0 · tsc 0 · unit 434/434 ·
  E2E 67/67 · build clean.
- **Codebase production-readiness**: the CI workflow is intact (hex dump
  proves the raw bytes are `branches: [main]` — the `ain]` reading in
  terminal output is a display artifact of `[m` being interpreted as an
  ANSI reset sequence; the YAML parses to `['main']`); `bun audit`
  reports exactly the PAD §10 documented tail (43 advisories, 0 critical,
  dev/CLI-time transitive trees only — nothing in the 24-package runtime
  set; `next` 16.3.5 sits above the RCE advisory floor with no newer
  security-driven update); no TODO/FIXME markers; docs counts aligned
  (434/67); `.env.example` matches the codebase (round-21 alignment
  verified); screenshots present.

Zero parity drift and zero code defects found — per the round-15/20/21
precedent the round pivots to what remains: the verification deliverables
themselves (fresh screenshots of the remediated codebase, the round-22
documentation set, and the session log), which this plan executes.

Evidence: `/home/z/my-project/captures/r22/` (outside the repo, per
convention) — the signature captures for both sides (9 views + the mobile
drawer each), the diff reports, the HTTP head dumps both sides, and the
production CSS analysis transcript.

## §A Context

Rounds 2–21 drove the clone to verified body-DOM, transport-layer,
per-route head, description, interactive-behavior, dead-code, and
environment-contract parity. The round-22 re-probe (2026-09-22,
agent-browser isolated sessions, production build on :3000 with the
repo-local DB) found the live unchanged on every layer for the fourth
consecutive round, with both operator focus areas (mobile navigation,
Tailwind v4) explicitly cleared in dev and production.

The workspace had been reset again — the repo was re-cloned over HTTPS,
the environment rebuilt from scratch (bun install, `cp .env.example .env`,
`db:push`, the Playwright chromium headless-shell rebuild). The known
`DATABASE_URL` shadow trap (the sandbox exports an absolute
`file:/home/z/my-project/db/custom.db` that would point OUTSIDE the repo)
was confirmed active and handled with `unset` on every server/gate
invocation — the round-21 `db-path.ts` contract makes the repo-local
resolution CWD-independent, but the process-env shadow precedes `.env`
loading, so the unset remains part of the local runbook.

## §B Findings (all verified against the codebase 2026-09-22)

**F1 — zero parity drift (VERIFIED, no action).** Every probed layer
matches: body DOM (10 surfaces, all deltas in documented buckets), chrome,
mobile navigation (anatomy + behavior, both sides), the Tailwind v4
production bundle, the HTTP/head layer, and the interactive sweep. The
live's fourth consecutive zero-drift round.

**F2 — the two operator focus areas: clean (VERIFIED, no action).** The
mobile navigation menu works as expected on both sides — the drawer
anatomy is byte-identical, link clicks navigate and unmount the drawer,
the Menu↔X glyph swaps, and zero console errors render in dev and
production. No TailwindCSS v4 bug exists: the drawer's utility classes
and keyframes ship in the production bundle, no dynamic class
construction exists, and the v3 palette pin wins the cascade at runtime
(computed-style verified against the CSS variables themselves, per the
round-10 lesson).

**F3 — no code defects (VERIFIED, no action).** The full gate chain is
green on the fresh environment (lint 0 · tsc 0 · 434/434 · 67/67 · build
clean); the CI workflow's raw bytes are clean; the audit tail matches the
PAD §10 documentation exactly; no TODO/FIXME markers; the round-21
artifacts (db-path contract, .env.example, SKILL.md) are all in place.

**F4 — the verification deliverables (the round's work).** The operator
prompt's remaining mandates: refreshed dev-server screenshots under
`docs/screenshots/`, the round-22 documentation set (AGENTS/CLAUDE/README/
PAD round-22 references + this plan + the session log), and the
commit/push. This round's honest verdict — a verification round — is
itself the deliverable: the evidence that the codebase is production-ready
as-is, freshly re-verified end-to-end.

**Environment lessons (recorded, not code):** detached background
processes are reaped by the sandbox between tool invocations — the E2E
gate must run in the foreground (or be re-attached); and the CI
workflow's `branches: [main]` renders as `branches: ain]` in terminal
output because `[m` is the ANSI reset escape — the hex dump is the
ground truth (the round-21 lesson, now root-caused to the escape
sequence itself).

## §C Affected surfaces

1. `docs/plans/2026-09-22-parity-remediation-round22.md` — this plan
   (§A–§G).
2. `docs/screenshots/` — refreshed dev-server captures of the verified
   codebase (login + the 9 views + the mobile drawer).
3. `docs/session_30.md` — the round-22 session log.
4. Docs alignment: AGENTS.md (the round-22 reference), CLAUDE.md (the
   ANALYZE round-22 pointer), README.md (the round-22 row), PAD (v1.21 —
   the header + §10 round-22 row).
5. Git: atomic commits + the SSH-wrapper push to main.

No source files change — the audit found nothing to remediate (the
existing 434 + 67 suite IS the executable verification record).

## §D Execution order

1. Screenshots: dev server on :3000 (repo-local DB, `DATABASE_URL` unset
   from the environment), login + 9 views + mobile drawer →
   `docs/screenshots/` (full-page captures, matching the established
   convention).
2. Docs: this plan + the session log + the AGENTS/CLAUDE/README/PAD
   round-22 references.
3. Final gate verification: lint · typecheck · unit · E2E · build (all
   green — the pre-push contract).
4. Atomic commits (the plan + screenshots + the docs alignment + the
   session log) + the SSH-wrapper push to main.

## §E TDD plan

Not applicable — zero code changes (the audit found no defects). The
TDD discipline applies to code changes; this round's verification burden
is carried by the existing executable contracts: the 434-spec unit suite
(including the round-21 db-path contract) and the 67-spec E2E gate,
both re-run green on the fresh environment as the round opened. Any
future live drift that surfaces in round 23+ resumes the red → green
discipline.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit 434/434 · build exits 0 · E2E 67/67 (the
  pre-push contract, re-verified at the round's close).
- Parity evidence: the signature-multiset diffs for all 10 surfaces with
  every delta classified into the documented buckets; the chrome/mobile/
  HTTP/interactive probes transcribed in §Summary above.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-22)

The audit and verification completed in plan order; every gate green;
no code changes (by finding, not by omission).

**The re-probe:** logged into the live (agent-browser isolated session),
captured the 9 view signatures + the mobile drawer signature on both
sides (the clone against the production build on :3000 with the
repo-local `db/custom.db`), and diffed — zero non-bucketed deltas on all
10 surfaces. The chrome probes (sidebar anatomy, SyncedBadge, nav pills,
inner pane), the mobile-navigation behavior probes (open → navigate →
close, glyph swap, console sweep), the HTTP-layer audit (headers, head
metas, robots, sitemap, the 404-status quirk), and the interactive sweep
(FAB, chooser both steps, Add Expense modal, AI Coach, Analytics charts,
theme toggle, expense CRUD round-trip) all matched the pins byte-exact.

**The two focus areas:** the mobile navigation menu verified working on
both sides (dev and production, byte-identical anatomy, zero console
errors) and the Tailwind v4 audit verified clean (the production bundle
carries every drawer utility + keyframe; no dynamic class construction;
the v3 palette pin wins at runtime — computed `#2563eb`/`#1e293b` on the
CSS variables themselves).

**Gates (final):** lint 0 · tsc 0 · unit 434/434 · build clean · E2E
67/67.

**Deliverables:** the refreshed `docs/screenshots/` (dev server: login +
the 9 views + the mobile drawer, full-page); AGENTS/CLAUDE/README/PAD
v1.21 aligned (the round-22 references); `docs/session_30.md`; this
plan's §G.

**Round 22 complete — the live re-verified at zero drift on every
probed layer (the fourth consecutive zero-drift round), both operator
focus areas explicitly cleared (the mobile navigation menu works on both
sides; no TailwindCSS v4 bug exists), and the codebase verified
production-ready end-to-end on a fresh environment with no changes
required.** The standing lessons: run the E2E gate in the foreground
(the sandbox reaps detached processes), and the hex dump is the ground
truth when terminal output looks corrupted (the `[m` ANSI-reset
artifact).
