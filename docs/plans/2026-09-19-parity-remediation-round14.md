# Round-14 Parity Remediation Plan — motion system, dialog overlays, login restyle, header structure, whitespace

Date: 2026-09-19 · Scope: a full re-probe of the live app (9-view signature-
multiset DOM diff both directions + a computed-style/style-attribute audit +
animation frame sampling) found the live app carries a framer-motion layer
round 13 misread, plus dialog-overlay, login-page, expenses-header, and
whitespace deltas. This round remediates the six findings.
Evidence: `/home/z/my-project/captures/r14/` (outside the repo, per
convention).

## §A Context

Rounds 2–13 drove the clone to verified parity with the live app as of
2026-09-18. Today's re-probe re-ran the established workflow — 9-view +
login signature-multiset diff, per-element style-attribute audit, MutationObserver
+ rAF computed-style animation sampling, dialog/chooser/FAB/Progress probes —
and found:

1. The live app still runs a framer-motion entrance system that round 13's
   F2 ("entrance animations removed app-wide") misdiagnosed. The round-13
   probe checked CSS `animationName` (always `none` for JS-driven animations)
   and CSS classes (`fade-in-up`/`stagger-N` — genuinely gone); the actual
   entrances live on framer-motion wrapper divs that animate INLINE STYLES.
   Every view's header row, every major card, the Dashboard action tiles,
   list rows, and the Quick Actions panel carry motion wrappers/styles that
   animate on every mount (fresh load AND SPA navigation): opacity 0→1 +
   translateY(20px)→0, ~330ms, damped-spring overshoot to ≈−2.3px, ~100ms
   stagger. The clone removed its CSS approximation in round 13 and renders
   none of the wrappers — a systemic visual + structural delta.
2. The dialog overlays' class order changed on the live (bg-black/50 moved to
   position 2, z-50 last) and every overlay carries a settled framer-motion
   inline style (`opacity: 1; transform: none;` full modals, `opacity: 1;`
   the Add Account + chooser overlays). The Quick Add chooser ANIMATES on
   open (overlay fade ~320ms + wrapper scale 0.9→1 spring) while the full
   modals open instantly (static settled styles).
3. The login page was restyled: ~10 class-order deltas, the Google button
   label gained a `<span>` wrapper, and the field icons render `h-4 w-4`
   (h-first — the login joins the Select-chevron exception group).
4. The Expenses "Expense History" CardHeader renders CardTitle + Tabs as
   DIRECT siblings on the live; the clone wraps them in an extra
   `flex flex-wrap items-center justify-between gap-2` div.
5. Systemic whitespace delta: the live renders icon+text with NO whitespace
   text node (`<svg/>Expense History (1)`); the clone's single-line JSX
   (`<Icon /> Text`) emits a leading space in ~30 elements app-wide.
6. The Quick Add chooser carries per-element class-order deltas (header row,
   option buttons) on top of the overlay changes in (2).

Everything else — shell, sidebar/mobile chrome, FAB anatomy, Quick Add
step-2, AI Coach card anatomy, Analytics controls, Settings, Import, bulk
bar, KPI cards, Progress indeterminate mechanism, dialog titles as DIVs,
insights empty state, exports — verified unchanged (2026-09-19).

## §B Findings (all live-probed 2026-09-19)

**F1 — Motion system (HIGH, systemic).** Style-attribute audit per view
(`main [style]` elements carrying opacity/transform, settled state):

- **Dashboard (18):** header row (style ON the classed div), KPI cards ×4
  (CLASSLESS wrappers), action tiles ×4 (style ON the tile roots), Budget
  Overview (classless wrapper), budget-rows container `space-y-2` (style ON
  it), Recent Activity (classless wrapper), activity rows (style ON each
  row), Quick Actions panel (style ON it), refresh-cw icon wrappers ×2
  (classless, `transform: none;`), FAB plus wrapper (classless, already
  replicated).
- **Income (3):** header row, hero container `mb-8`, income cards (classless
  wrappers per card).
- **Expenses (8):** header row, 4 summary cards (classless), `mb-6` search/
  filters container, Expense History card (classless), expense rows (style
  ON each row), FAB plus.
- **Accounts (2):** header row, account cards (classless wrappers).
- **Investments (6):** header row, 2 gradient KPIs (style ON the roots),
  Total Return + Portfolio Holdings + Sector Allocation (classless).
- **Import (2):** page header block, step card (both classless wrappers).
- **Analytics (4):** header row, refresh-cw wrapper, main trend card
  (classless), KPI grid `grid md:grid-cols-3 gap-6` (style ON the grid).
- **Goals (2):** header row, goal cards (classless wrappers).
- **Settings (5):** header `mb-8` wrapper, Profile Settings + Notifications
  + Export Your Data (classless), a `flex justify-end` row.
- **Login: zero motion styles** (verified — no wrappers, no entrance).

Measured animation (rAF computed-style sampling + MutationObserver frames):
`opacity 0→1` and `translateY 20px→0` run TOGETHER over ~330ms; translateY
crosses 0 at ~35–40% and overshoots to −2.33px (11.6% of 20px) before
settling; opacity follows an ease-out-strong curve (10%→0.14, 50%→0.84,
80%→0.995). Stagger rhythm ~100ms per element (Dashboard sequence measured:
header 0, KPI1–4 93/196/310/310, Budget 310, budgetRows 359, RecentActivity
393, tiles 493/610/710/809, Quick Actions 610, rows 660/710 — groups overlap;
approximated per §C/D1). List rows stagger ~50ms apart. The refresh-cw icons
spin ~360°/s while loading (wrapper transform animates) and spring back to
`transform: none` on completion.

**F2 — Dialog overlay order + settled motion styles (MEDIUM).** Live
overlays (all live-probed):

| Dialog | Overlay classes | Overlay style | Opens |
|---|---|---|---|
| Expense/Income/Goal/Investment/Progress/AI Coach | `fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50` | `opacity: 1; transform: none;` | instantly |
| Add Account | `fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4` | `opacity: 1;` | instantly |
| Quick Add chooser | `fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40` | `opacity: 1;` | fade ~320ms |

The clone's `DIALOG_OVERLAY_BASE` is `fixed inset-0 z-50 flex items-center
justify-center p-4 bg-black/50` (wrong order — its own doc comment already
records the live order) and carries no style. The Add Account overlay
additionally moves z-50 to the middle (needs a full-replacement merge —
tw-merge keeps a later full list's order, verified).

**F3 — Quick Add chooser deltas (MEDIUM).** On top of F2's overlay changes:
(a) the header row renders `flex items-center justify-between mb-6` (mb-6
LAST; clone has it first); (b) the option buttons render
`px-4 py-2 w-full justify-start gap-3 h-12` (h-12 LAST; clone has it
mid-string); (c) the width wrapper carries `style="opacity: 1; transform:
none;"` and ANIMATES on open — overlay fade 0→1 ~320ms ease-out + wrapper
scale 0.9→1 with ≈0.7% overshoot ~320ms (rAF-sampled).

**F4 — Login page restyle (MEDIUM).** Ten class-order deltas + one
structural + one exception rule:

| Element | Live (2026-09-19) |
|---|---|
| main | `min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4` |
| card | `text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl` |
| inner pad | `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10` |
| stack | `flex flex-col items-center text-center space-y-6 sm:space-y-8` |
| logo wrap | `relative group` |
| logo blur | `absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300` |
| h1 | `text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight` |
| subtitle p | `text-slate-500 text-sm sm:text-base font-medium` |
| Google label | `<span>Continue with Google</span>` (span wrap — clone renders bare text) |
| divider span | `bg-white px-3 text-slate-500 font-medium tracking-wider` |
| field icons | `h-4 w-4` (h-FIRST — new exception like the Select chevron) |

Google button classes, logo span, inputs, labels, form spacing, submit
button, bottom row, and the `sm:hidden` spacer verified unchanged.

**F5 — Expenses Expense History header structure (MEDIUM).** Live CardHeader:
`div.flex flex-col space-y-1.5 p-6` > [title div, Tabs div] as DIRECT
children. Clone: an extra `div.flex flex-wrap items-center justify-between
gap-2` wraps them. (The same wrapper in `import-view.tsx` step-2 is NOT
provable — the live's extract is quota-dead 402 and step 2 is unreachable;
leave it.) The live title text also carries NO leading space after the
Receipt icon (see F6).

**F6 — Icon+text whitespace (LOW, systemic).** The live renders every
icon+text pair with NO whitespace text node (probed: all Dashboard buttons,
card titles on Expenses/Investments/Analytics/Settings — `Expense History
(1)`, `Portfolio Holdings`, `Income vs Expenses Trend`, `Profile Settings`,
…). The clone's single-line JSX `<Icon /> Text` emits ` Icon+Text` (leading
space) in ~30 elements (grep `aria-hidden /> [A-Z]`). Multi-line JSX (the
dialog-title idiom) renders space-free. Whitespace-only text nodes are
invisible inside flex containers, but this is a byte-level DOM parity delta
and pollutes textContent-based assertions.

**Data bucket (no action):** live has 1 income, 1 expense, 1 goal, 2
holdings, 1 budget, 1 account, 0 insight records; the clone keeps its seed.
**Lucide bucket (no action):** live lucide 0.475 renders polylines/polygon
(TrendingUp, etc.); the clone's 0.525 renders paths.

## §C Design decisions

**D1 — CSS-replicate the motion system (no framer-motion, repo policy).**
New pure helper `entranceStyle(delayMs)` + `MotionWrap` in `ui-bits.tsx`:
the wrapper renders the live's settled inline style (`opacity: 1; transform:
"none"`) PLUS an inline `animation` referencing new `fin-card-in` keyframes
in globals.css (defined ONLY under `@media (prefers-reduced-motion:
no-preference)` — reduced-motion users skip the entrance entirely; a missing
keyframe list makes the animation a no-op). Hand-tuned keyframes from the
measured frames (0% → 35% → 50% → 65% → 80% → 100%; overshoot −2.3px at
50%), 330ms, `backwards` fill so the stagger delay holds the 0% frame.
Classless wrappers keep the signature-multiset identical to the live (the
live wrappers carry no classes); styled surfaces (header rows, tiles, rows,
panels, grids) take the style on their existing div. Delays: per-view
hand-assigned maps following the measured rhythm — header 0, cards 100ms
steps, Dashboard's feature grid at 300–400ms (observed BEFORE the tiles),
tiles 500–800ms, Quick Actions 600ms, list rows 650ms + min(i, 8)×50ms
(capped — the live's per-row stagger would take 9.8s on the clone's 98-row
seed; the cap is a documented adaptation for list lengths the live never
exercises). The trailing `animation`/`animation-delay` properties inside the
style attribute are the documented CSS-replication delta (sig-invisible).

**D2 — Overlays.** Reorder `DIALOG_OVERLAY_BASE` to the live string; new
`overlayStyle` prop threads the settled motion styles; the full modals pass
`{opacity: 1, transform: "none"}`, Add Account passes `{opacity: 1}` plus a
full-replacement `overlayClassName` (tw-merge keeps the later full list's
order — verified), the chooser passes `{opacity: 1, animation:
"fin-overlay-in 320ms ease-out"}`. The chooser's width wrapper gains
`widthWrapperStyle` (`opacity: 1; transform: none;` + `fin-scale-in`
keyframes — scale 0.9→1.007→1, 320ms).

**D3 — Login.** Re-pin every string in §B/F4; span-wrap the Google label;
switch the field icons to h-first; add the login to the h-first exception
list in the icon-order guard test. The demo-credentials affordance (clone-
only) stays.

**D4 — Expenses header.** CardTitle + Tabs become direct CardHeader
children (no wrapper); the title text drops its leading space via
multi-line JSX.

**D5 — Whitespace sweep.** Convert every single-line `<Icon /> Text` in
`src/components/finara/*` to the multi-line idiom; a new source-contract
spec greps the views for the space-emitting pattern (with a documented
exception list — e.g. `mr-1`/`mr-2` spaced icons inside flowing buttons are
separately probed where they exist; the sweep only touches pairs the live
renders space-free).

**D6 — Refresh icon wrappers.** Keep the clone's `animate-spin` mechanism
(CSS class on the wrapper while loading — visually identical to the live's
JS rotation, and CSS animations override the inline `transform: none`
during playback), but the wrapper now always carries `style={{transform:
"none"}}` (settled live parity) — and the Dashboard/Analytics header Refresh
button icon gains the wrapper it was missing entirely.

## §D File-by-file change specs

1. **`src/app/globals.css`** — add `fin-card-in`, `fin-overlay-in`,
   `fin-scale-in` keyframes under `@media (prefers-reduced-motion:
   no-preference)`.
2. **`src/components/finara/ui-bits.tsx`** — export `entranceStyle(delayMs)`
   and `MotionWrap` (classless wrapper).
3. **`src/components/ui/dialog.tsx`** — reorder `DIALOG_OVERLAY_BASE`; new
   `overlayStyle` + `widthWrapperStyle` props.
4. **`src/components/finara/dashboard-view.tsx`** — header-row style, KPI
   MotionWraps ×4, tile styles ×4, Budget/RecentActivity MotionWraps,
   budget-rows + Quick-Actions + activity-row styles, header-Refresh icon
   wrapper, insights-refresh wrapper style; F6 whitespace fixes.
5. **`src/components/finara/expenses-view.tsx`** — F5 header restructure;
   summary-card + history-card MotionWraps; `mb-6` container + row styles;
   F6 fixes.
6. **`src/components/finara/income-view.tsx`** — header + hero + card
   motion; F6.
7. **`src/components/finara/accounts-view.tsx`** — header + card motion;
   Add Account overlay full-replacement + `overlayStyle`; F6.
8. **`src/components/finara/investments-view.tsx`** — header + 5-card
   motion; F6.
9. **`src/components/finara/import-view.tsx`** — header + step-card
   wrappers; F6.
10. **`src/components/finara/analytics-view.tsx`** — header + refresh
    wrapper + trend-card + KPI-grid motion; F6.
11. **`src/components/finara/goals-view.tsx`** — header + card motion; F6.
12. **`src/components/finara/settings-view.tsx`** — header + 3-card + row
    motion; F6.
13. **`src/components/finara/quick-add-dialog.tsx`** — F3 header-row +
    option-button order, overlay/wrapper motion styles.
14. **`src/components/finara/login-view.tsx`** — F4 re-pin + span + h-first
    icons.
15. **`src/components/finara/add-transaction-dialog.tsx` +
    `ai-coach-dialog.tsx`** — `overlayStyle` settled styles.
16. **Tests (RED first)** — `functional-parity.test.ts` (motion contracts:
   wrapper style presence, entranceStyle output, overlay orders/styles,
   chooser structure, refresh wrappers), `view-surfaces.test.ts` (per-view
   wrapper placement + expenses header restructure + whitespace sweep
   greps), `login-view.test.tsx` (re-pins), `ui-primitives.test.tsx`
   (DIALOG_OVERLAY_BASE order), `dialog-forms.test.ts` (login h-first
   exception). E2E: `e2e/quick-add.spec.ts` + `e2e/dashboard.spec.ts`
   updated where structures changed (class-order assertions, new motion
   elements); the entrance animations must not break actionability
   (Playwright ignores opacity) — verified in the gate.

## §E TDD plan

Red → green per finding, dependency order: F2 overlay primitive pins →
F3 chooser pins → F1 motion helper + per-view source pins (the biggest
batch) → F4 login re-pins → F5 expenses header pins → F6 whitespace sweep
greps → E2E updates → full gate.

## §F Verification plan

- Gates: `bun run lint` · `bun run typecheck` · `bun run test` (311+, count
  moves) · `bun run test:e2e` (67+ specs) — all green before commit.
- Browser verification (agent-browser, dev build): per-view bare-div +
  style-attribute audit against the live captures; entrance animation
  smoke (opacity starts 0, settles 1); chooser open animation; refresh-icon
  spin/settle; dialog overlays settled styles; login class orders.
- Signature-multiset re-diff (fresh captures both sides) with every
  remaining delta classified (data, lucide, a11y additions, CSS-replication
  animation styles, demo-credentials affordance).
- Live etiquette: read-only probes only (throwaway UI state — dialogs
  opened/closed; no data mutations this round).

## §G Execution record (2026-09-19)

All six findings remediated red→green in plan order; every gate green.

**F1 — the entrance-motion system.** `globals.css` gained three keyframe
sets under `@media (prefers-reduced-motion: no-preference)`: `fin-card-in`
(hand-fit to the rAF-sampled live frames: opacity 0→1 + translateY 20px→0,
330ms, −2.3px overshoot at 50%), `fin-overlay-in` (chooser fade), and
`fin-scale-in` (chooser wrapper 0.9→1.007→1). `ui-bits.tsx` exports
`entranceStyle(delayMs)` — the live's settled inline style
(`opacity: 1; transform: "none"`) plus the inline animation — and
`MotionWrap` (the classless wrapper variant). `ViewHeader`'s three modes all
carry the entrance (actions row + no-actions `mb-8` via style; the bare
Import mode gained the MotionWrap it was missing entirely). Per-view
wrapper maps follow the measured stagger: Dashboard header 0 / KPIs
100–400 / Budget 300 + budget-rows 360 + Recent Activity 400 (the live's
feature grid animates BEFORE the tiles) / tiles 500–800 / Quick Actions
600 / list rows 650 + min(i, 8)×50 (the cap is a documented adaptation —
the live's per-row stagger would take 9.8s on the 98-row seed). The
GradientCard component threads a `style` prop for the tile roots. The
refresh-cw icons: the insights wrapper gained
`style={{ transform: "none" }}` and the Dashboard/Analytics header Refresh
button gained its missing wrapper entirely; the clone keeps the
`animate-spin` class mechanism while loading (CSS animations override the
inline transform during playback — visually identical to the live's JS
rotation; documented mechanism delta).

**F2 — dialog overlays.** `DIALOG_OVERLAY_BASE` reordered to the live
string (`fixed inset-0 bg-black/50 flex items-center justify-center p-4
z-50`); new `overlayStyle` + `widthWrapperStyle` props thread the settled
motion styles. All six bg-black/50 modal call sites (add-transaction,
ai-coach, goals ×2, income-edit, investments-edit) pass
`{opacity: 1, transform: "none"}`; Add Account passes `{opacity: 1}` plus
the full-replacement `overlayClassName` (tw-merge keeps a later full
list's order — verified: `fixed inset-0 bg-black/60 z-50 flex
items-center justify-center p-4`).

**F3 — the chooser.** Overlay gains `{opacity: 1}` + `fin-overlay-in`
fade; the width wrapper gains `{opacity: 1, transform: "none"}` +
`fin-scale-in`; the header row renders `flex items-center justify-between
mb-6` (mb-6 LAST); both option buttons render
`px-4 py-2 w-full justify-start gap-3 h-12` (h-12 LAST).

**F4 — the login re-pin.** All ten class orders updated (main, card,
inner pad, stack, logo wrap, logo blur, h1, subtitle, divider span,
bottom row), the Google label span-wrapped, the field icons switched to
h-FIRST (`h-4 w-4` — a new live-evidenced exception added to the
dialog-forms icon-order guard), and the img attributes reordered
(class/alt/src). The demo-credentials affordance stays (documented
clone-only bucket; the post-fix login diff is exactly its five elements).

**F5 — the Expenses header.** CardTitle + Tabs render as direct
CardHeader children (the `flex flex-wrap items-center justify-between
gap-2` wrapper removed); the title text renders via the multi-line JSX
idiom so the Receipt icon is followed by NO whitespace text node.

**F6 — the whitespace sweep.** All 53 single-line `<Icon /> Text`
instances (including two `Saving…` loaders, the Filters button, and the
step-2 Add) converted to the multi-line idiom; the sweep test bans both
the `aria-hidden /> text` and the broader capitalized-component
`/> text` patterns app-wide.

**Follow-up find during verification:** the clone's Filters button also
rendered `" Filters 2"` (leading space AND a space before the count
badge); the live renders `Filters` + `<span>2</span>` with zero
whitespace nodes — fixed and folded into the F6 sweep.

**Gates (final):** lint 0 · tsc 0 · unit 334/334 (was 311; +23) · E2E
67/67 unchanged (the entrance animations do not affect Playwright
actionability — opacity is not part of the visibility check; verified by
the full green run). Browser verification (production build): the
entrance animation's computed-style trace matches the live's sampled
curve (opacity 0→1 with −2.16px overshoot vs the live's −2.33px, same
330ms span), the chooser overlay/wrapper styles + class orders are
live-exact, the full-modal overlays carry the settled styles, the
Dashboard's three `transform: none` icon wrappers match the live, and
the login renders the re-pinned orders. Signature-multiset re-diff
(fresh captures both sides): every remaining delta classifies into the
documented buckets — seed-data counts (the live user's sparse data),
lucide-version internals (polylines/polygon), the insight empty state
(live: 0 records), the demo-credentials affordance (login diff: 30 → 5,
all five its elements), and the CSS-replication animation properties
inside the style attributes (class-invisible to the signature walk).
The round-13 "entrance animations removed" conclusion is corrected in
globals.css and the round-13 F2 test amended (the CSS-class sweep stays;
the semantics note points at the round-14 F1 block).

Evidence: `/home/z/my-project/captures/r14/` (before/after signature
diffs, animation frame samples, dialog/chooser/login dumps, the full
style-attribute audit, screenshots).
