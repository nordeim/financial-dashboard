# Round-16 Remediation Plan — raw-order parity + mobile-drawer motion round

Date: 2026-09-19 · Scope: the round opened with the standard full live
re-probe (9-view + login signature-multiset diff, BOTH the sorted-class
diff of rounds 4–15 AND a new RAW-order diff — `tag|exact-class-attribute`
multisets — plus the per-element style-attribute/motion audit and the
dialog/chooser/FAB/Progress/mobile structural probes). **The live app has
been updated since round 15** (the SyncedBadge class set changed, the
inner gradient pane now carries `transition-colors duration-300` on every
view, and the sidebar/shell raw class orders differ from the clone's),
and the raw-order pass surfaced a set of order deltas the sorted diff is
structurally blind to (it sorts class lists; AGENTS.md has warned about
exactly this since round 8). Six findings, all fixed this round.

Evidence: `/home/z/my-project/captures/r16/` (outside the repo, per
convention) — sorted + raw signature captures for both sides, per-view
diff reports, sidebar/mobile HTML dumps, the drawer rAF animation sample,
and the structural probe transcripts.

## §A Context

Rounds 2–15 drove the clone to verified parity; round 15 found zero live
drift and closed production-readiness gaps instead. The round-16 re-probe
(2026-09-19, agent-browser isolated sessions, production build on :3000):

- **Sorted diff**: every per-view delta classifies into the documented
  buckets (seed-data counts, lucide svg internals, the live's insight
  empty state, the login demo-credentials affordance, infra, the
  duplicated sonner toaster, theme-state icons) — EXCEPT two new
  structural deltas: the SyncedBadge class set (F1) and a wrapper-div
  count delta around the Investments KPI row (F2).
- **Raw-order diff (new this round)**: the live's sidebar and shell
  render several class strings in a different ORDER than the clone —
  invisible to the sorted diff, never raw-pinned in rounds 4–8 (the
  round-8 order sweep pinned the shell/header/grid strings but not the
  sidebar internals or the inner gradient pane).
- **Structural probes**: the dialog overlay/card/title, the FAB chooser
  (overlay > wrapper > card > header row > ghost close), the Progress
  indeterminate mechanism, and the desktop/mobile nav chrome all still
  match the round-14 pins; the live's mobile drawer, however, now mounts
  with a framer-motion entrance (translateX −300px → 0 + fade, rAF
  sampled) that the round-14 motion system never covered.
- The live's per-view gradient panes now uniformly carry
  `transition-colors duration-300` — the round-4 "dashboard/expenses
  only" live quirk is gone (the clone already renders it on every view;
  only the class ORDER differs).

## §B Findings (all live-probed 2026-09-19)

**F1 — SyncedBadge renders the Badge BASE only (live drift, class set).**
The live's SyncedBadge — both the desktop sidebar bottom and the mobile
top bar — renders
`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1 text-green-600 border-green-300 dark:text-green-400 dark:border-green-600`
— NO `border-transparent shadow hover:bg-primary/80` (no variant classes
at all). The clone renders the default variant (those three classes
survive the merge). The live's Badge PRIMITIVE is unchanged (its other
badges still carry the default/secondary variant classes — probed: the
budget-surplus badge renders `border-transparent shadow
hover:bg-primary/80 bg-emerald-100 …`; activity badges render
`border-transparent hover:bg-secondary/80 …`), so only this consumer
changed. Fix: `variant="outline"` + the existing tail — tw-merge drops
the outline's `text-foreground` under the tail's `text-green-600`,
producing the live string BYTE-EXACTLY (verified against the repo's
`cn()` before planning).

**F2 — Investments KPI cards are motion-WRAPPED on the live (structure).**
The live wraps each of the three Investments KPI cards (Portfolio Value /
Total Gain/Loss / Total Return) in a classless framer-motion div settled
at `opacity: 1; transform: none;` — the same wrapper idiom the clone
already uses for the Holdings/Sector cards. The clone applies
`entranceStyle` directly on the KPI card roots instead (round-14 miss:
the KPI row predates the MotionWrap convention for cards and the r15
motion audit only counted the Dashboard). Fix: `MotionWrap delayMs
100/200/300` around the three cards; delays unchanged.

**F3 — MobileTopNav renders an extra wrapper div (structure).** The
clone's `MobileTopNav` returns `<div>` wrapping BOTH the mobile top bar
and the conditional drawer; the live renders the top bar and the drawer
as DIRECT children of the shell's `div.flex` (probed: both elements'
`parentElement` is the shell flex div on the live; the clone adds one
classless `div` layer). Fix: render a Fragment.

**F4 — Sidebar raw class orders (order parity, 8 strings).** Live vs
clone (RAW attribute strings, all views):
- a. Nav item icons: live `w-5 h-5` (desktop) / `w-6 h-6` (drawer) —
  clone renders `h-5 w-5` / `h-6 w-6` (an h-first ADR-020 violation that
  slipped the dialog-forms ban: the ban's regex matches literal-string
  `className` on lucide-imported components, but the nav renders
  `<item.icon className={compact ? "h-6 w-6" : "h-5 w-5"}>` — dynamic
  component + ternary, invisible to both filters).
- b. Sidebar logo icon: live `w-6 h-6 text-emerald-400` (size then
  color); clone renders `text-emerald-400 w-6 h-6` (the `cn()` argument
  order).
- c. Sidebar gradient container: live `flex flex-col flex-1 min-h-0
  sidebar-gradient`; clone `sidebar-gradient flex min-h-0 flex-1
  flex-col`.
- d. Sidebar header block: live `flex items-center h-16 px-6 border-b
  border-slate-700/30`; clone `flex h-16 items-center border-b
  border-slate-700/30 px-6`.
- e. Desktop nav: live `flex-1 px-4 py-6 space-y-2`; clone `flex-1
  space-y-2 px-4 py-6` (the drawer nav at the live order already — only
  the desktop nav drifted; the existing view-surfaces pin passes via the
  drawer string, a coverage gap this round closes).
- f. Sidebar bottom: live `p-4 space-y-3 border-t border-slate-700/30`;
  clone `space-y-3 border-t border-slate-700/30 p-4`.
- g. Drawer bottom: live `p-4 border-t border-slate-700/30`; clone
  `border-t border-slate-700/30 p-4`.
- h. Nav pill attribute order: live renders `class` then `tabindex`;
  the clone renders `tabindex` first (JSX prop order). Reorder the JSX
  (`className` before `tabIndex`).

**F5 — Inner gradient pane raw order + quirk retirement (order + docs).**
Live (every view): `min-h-screen bg-gradient-to-br from-slate-50
to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors
duration-300 font-sans`; clone: `min-h-screen bg-gradient-to-br
from-slate-50 to-blue-50 font-sans transition-colors duration-300
dark:from-gray-900 dark:to-gray-800`. Additionally the live now carries
`transition-colors duration-300` on ALL 9 panes — the round-4
"dashboard/expenses only" live quirk (documented in PAD §10 and AGENTS)
is retired by the live update. The clone already renders the transition
on every view (single source, `finara-app.tsx`), so only the string
order changes; the PAD §10 row and the AGENTS design-system bullet are
updated to record the retirement.

**F6 — Mobile drawer entrance motion (live behavior, rAF-sampled).** The
live's drawer mounts with `translateX(−300px) → 0` + `opacity 0 → 1`
(~330ms spring, +35px overshoot at ~200ms, settled ~567ms at
`opacity: 1; transform: none;` — sampled 2026-09-19). The clone renders
the drawer with no motion. Fix: a `fin-drawer-in` keyframe hand-fit to
the sampled frames (defined ONLY under `prefers-reduced-motion:
no-preference`, same gating discipline as the other fin-* keyframes) +
the settled inline style on the drawer div. The drawer is
conditionally-rendered on the live too (probed absent from the DOM when
closed), so the animation replays per open — the clone's `menuOpen`
conditional already matches.

## §C Affected surfaces

1. `src/components/finara/sidebar.tsx` — F1 (SyncedBadge variant), F3
   (MobileTopNav fragment), F4a/b/c/d/e/f/g/h (orders, icon sizes), F6
   (drawer settled style + animation).
2. `src/components/finara/investments-view.tsx` — F2 (MotionWrap the 3
   KPI cards).
3. `src/components/finara/finara-app.tsx` — F5 (inner pane class order).
4. `src/app/globals.css` — F6 (`fin-drawer-in` keyframes).
5. `src/lib/__tests__/view-surfaces.test.ts` — round-16 pins: the eight
   sidebar raw orders + the SyncedBadge outline variant + the
   MobileTopNav fragment + the investments MotionWrap row + the pane
   order.
6. `src/lib/__tests__/dialog-forms.test.ts` — the h-first ban extended
   to ternary/`item.icon` className shapes (the F4a coverage gap).
7. `src/lib/__tests__/functional-parity.test.ts` — round-16 motion
   contracts: the `fin-drawer-in` keyframe + the drawer's settled style.
8. `.env.example` — add `FINARA_INSIGHTS_LLM_OFF` (read by
   `src/app/api/ai/insights/route.ts` and the Playwright webServer;
   absent from the example — a setup-gap find from this round's docs
   pass).
9. Docs: AGENTS.md (sidebar-order + pane + drawer-motion invariants,
   counts), CLAUDE.md (round-16 ANALYZE reference), README (counts,
  screenshots folder), PAD v1.15 (§10 pane-quirk retirement, round-16
   rows), this plan's §G, `docs/session_18.md`.
10. `docs/screenshots/` — NEW: dev-server captures of the remediated
    codebase (login + the 9 views, light theme, desktop viewport), per
    the round's operating instructions.

## §D Execution order

1. RED: write the round-16 spec extensions (view-surfaces, dialog-forms
   ban extension, functional-parity motion contracts); run the suite —
   expect exactly the new specs red (the current sidebar/pane/investment
   sources fail the new pins), everything else green.
2. GREEN: sidebar.tsx (F1, F3, F4, F6 style) → investments-view.tsx
   (F2) → finara-app.tsx (F5) → globals.css (F6 keyframes).
3. Gates: `bun run lint` · `bun run typecheck` · `bun run test` (348 +
   new specs) · `bun run build`.
4. Post-fix verification: restart the production server on the fresh
   build, re-run BOTH diffs (sorted + raw) against the same live
   captures — the six findings' deltas must be gone; every remaining
   delta must classify into the documented buckets.
5. E2E gate: `bun run test:e2e` (67 specs — the sidebar/mobile surfaces
   are covered by the mobile + console sweeps; a red run is a
   regression, never a flake).
6. Screenshots: dev server on :3000, login + 9 views → PNG files under
   `docs/screenshots/`.
7. Docs + `.env.example` + atomic commits + push (SSH wrapper, main
   only).

## §E TDD plan

Red → green per finding: the view-surfaces pins (F1/F3/F4/F5 orders +
F2 wrappers) go red against the current sources first; the dialog-forms
ban extension (F4a's ternary gap) goes red on the nav icon ternary; the
functional-parity motion contracts (F6) go red on the missing keyframe +
drawer style. Implementation follows the pins. The regression tests then
guard the raw orders permanently — a future edit that re-sorts a pinned
class string fails the unit gate.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit (348 + new) green · build exits 0 · E2E
  67/67.
- Post-fix signature re-diff (sorted AND raw) against the round-16 live
  captures: the SyncedBadge pair, the Investments wrapper-div delta, the
  MobileTopNav extra div, all eight sidebar order pairs, and the inner
  pane pair are GONE; remaining deltas classify into the documented
  buckets only.
- Browser spot-checks: the drawer opens with the slide-in spring; the
  SyncedBadge renders the live string (computed class attribute); the
  Investments KPI row carries the three motion wrappers.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-19)

All six findings remediated red→green in plan order; every gate green.

**RED:** 12 spec failures exactly as designed — the 11 new round-16
specs (view-surfaces: sidebar orders / nav icons / pill attr order /
SyncedBadge outline / MobileTopNav fragment / pane order / Investments
MotionWraps; dialog-forms: the dynamic/ternary h-first ban; functional-
parity: fin-drawer-in keyframes + drawer style + entranceStyle
signature) plus the amended round-14 keyframes-list spec. 347 pre-existing
specs stayed green.

**GREEN (per finding):** F1 — `SyncedBadge` → `variant="outline"` + the
unchanged tail (tw-merge verified byte-exact against the live string
BEFORE implementation, via the repo's own `cn()`); F2 — the three
Investments KPI cards wrapped `MotionWrap delayMs 100/200/300`, the
direct `entranceStyle` usages and the now-unused import removed; F3 —
`MobileTopNav` renders a Fragment (the top bar and the drawer become
direct children of the shell's `div.flex`); F4 — all eight raw orders
re-pinned (nav icons `w-5 h-5`/`w-6 h-6`, logo `cn(size, color)`,
gradient container, header block, desktop nav, both bottom blocks,
nav-pill `className` before `tabIndex`); F5 — the inner pane re-ordered
(`dark:` pair before the transition/font tail); F6 — the `fin-drawer-in`
keyframe hand-fit to the rAF frames (0% −300px → 35% −84px → 60% +35px
→ 75% −4.3px → 100% 0, with the sampled opacities) + `entranceStyle(0,
"fin-drawer-in")` on the drawer div; `entranceStyle` gained the
`animationName` parameter (default `fin-card-in` — backward compatible).

**Post-fix verification (production build, fresh server):** BOTH diffs
re-run against the same round-16 live captures. Sorted: the SyncedBadge
pair is gone on every view (only-live −2 everywhere), the MobileTopNav
wrapper div is gone (only-clone −3 net), Investments clean. Raw-order:
ZERO non-bucketed only-live signatures on 8 of 9 views; the Dashboard's
sole remainder is the AI-insight empty-state wrapper (`div|text-center
py-8`) — the documented data bucket (the live account has no insight
records). Every residual delta classifies: infra, theme-state icons
(sun/moon — the live account renders dark, the clone demo light),
lucide internals, the duplicated sonner toaster, seed-data counts.

**Gates (final):** lint 0 · tsc 0 · unit 359/359 (+11) · build clean ·
E2E 67/67 (3.3m, single run — one earlier attempt died to a stale
server port EADDRINUSE + a wiped Playwright browser cache, both
environment issues fixed before the clean run: `bunx playwright install
chromium` after the workspace reset).

**Deliverables:** `docs/screenshots/` — 11 dev-server captures (login,
the 9 views at 1280×800, the mobile drawer at 390×844); `.env.example`
now documents `FINARA_INSIGHTS_LLM_OFF`; AGENTS/CLAUDE/README/PAD
v1.15/session_18 aligned (incl. the stale README Next version 16.1.3 →
16.3.5 and the retired §10 pane-quirk row).

Evidence: `/home/z/my-project/captures/r16/` (sorted + raw captures for
live/clone-pre/clone-post, the per-view diff reports, sidebar/mobile
HTML dumps, the drawer rAF sample, the E2E logs, build/server logs).
