# Round-13 Parity Remediation Plan — live-site update: AI Insights redesign, animation removal, dialog/progress mechanics

Date: 2026-09-18 · Scope: the live Finara app was updated after round 12. This
round re-probes every surface, then remediates the six real deltas found.
Evidence: `/home/z/my-project/captures/r13/` (outside the repo, per
convention).

## §A Context

Rounds 2–12 drove the clone to verified parity with the live app as of
2026-09-17. Today's full re-probe (9-view signature-multiset DOM diff, both
directions, every delta chased to ground truth via computed styles, targeted
evals, and live-bundle extraction) found the live app has changed: the AI
Insights card was redesigned around a persisted insight-record model, the
page-wide entrance animations were removed, dialog titles and the Quick Add
chooser structure changed, the Add Expense quick-amount label gained a field
wrapper, and the Progress component renders an indeterminate state with a
manual transform. Everything else — login, shell, sidebar, FAB, Quick Add
step-2, AI Coach chat, Analytics controls, Settings, Import, expenses bulk
bar, KPI cards — is byte-for-byte unchanged (verified live 2026-09-18).

## §B Findings (all live-probed 2026-09-18)

**F1 — AI Insights redesign (HIGH, structural + data model).** The live
loads insights as persisted `TransactionInsight` records —
`list("-created_date", 10)` filtered by `!is_dismissed` — with a dismiss
action (`update(id, {is_dismissed: true})` removes it from view). No
creation call exists in the frontend bundle (generation is an external
backend process). New anatomy:

- Header: CardTitle "AI Insights" (Brain `w-5 h-5`) + "Ask AI" (outline sm,
  MessageCircle `w-4 h-4`, className gap-2) + refresh (ghost size-icon, NO
  extra className, RefreshCw rotates 360° while loading, disabled while
  loading).
- Body: ScrollArea h-80 > div.space-y-4.
- Row: `p-4 bg-neutral-50/50 dark:bg-gray-700/30 rounded-xl` (NO border, NO
  tone colors).
- Row header: `flex items-start justify-between mb-2` > left
  `flex items-center gap-2` [type icon `w-4 h-4 text-neutral-600
  dark:text-neutral-300` + Badge secondary with the raw insight_type text and
  per-type color classes] + right dismiss X (ghost size-icon, className
  `w-6 h-6 text-neutral-400 hover:text-neutral-600`, X `w-3 h-3`).
- Type maps (live bundle, lucide v0.475): anomaly|alert → TriangleAlert,
  red badge; trend → TrendingUp, blue; opportunity → Lightbulb, green;
  prediction → Target, purple; default → Brain, gray.
- Title: `h4 font-semibold text-neutral-900 dark:text-neutral-100 mb-2`.
  Description: `p text-sm text-neutral-600 dark:text-neutral-300 mb-2`.
- Suggested action (conditional): `div bg-blue-50 dark:bg-blue-900/20
  border border-blue-200 dark:border-blue-800 rounded-lg p-2 mt-2` > `p
  text-sm text-blue-800 dark:text-blue-300 font-medium` "💡 Suggestion: …".
- Footer: `div flex items-center justify-between mt-3 text-xs
  text-neutral-500 dark:text-neutral-400` > span "Confidence:
  {Math.round(score*100)}%" + optional span "Category: {category}".
- Empty (list empty AND not loading): brain w-12 h-12 + "No insights
  available yet" + "Add more transactions to see AI-powered insights"
  (already in the clone).
- Loading (list empty AND loading): renders NOTHING (the clone currently
  renders a "Generating insights…" block — delta). The live's entrance is
  framer-motion (opacity 0 / x −20 → 0, 0.1s stagger; exit x 20) — the clone
  has a no-framer-motion policy; CSS-replicate the entrance, skip the exit
  (documented delta).

**F2 — Entrance animations removed app-wide (HIGH, global).** Zero
`fade-in-up`/`stagger-N` elements in the live DOM (fresh-load verified),
zero CSS rules, `animationName: none`. The clone renders them everywhere
(`.fade-in-up` + `.stagger-N` classes + the `@keyframes fade-in-up`/stagger
delays in globals.css + the prefers-reduced-motion gate for them). Remove
the classes from every view, drop the CSS, keep other animations (chart
spin etc. — none exist).

**F3 — Full-modal dialog titles render DIVs (MEDIUM).** Live Add Expense /
Add Income / AI Coach titles are plain `div`s (class sets unchanged). The
clone renders Radix `h2` (its DialogTitle). The Quick Add chooser title is
`h3` on the live — the clone already matches via `asChild`. Fix: render the
full-modal titles through `DialogTitle asChild` with a `div` (keeps the
aria-labelledby wiring — an a11y addition over the live, consistent with
the documented bucket).

**F4 — Quick Add chooser structure (MEDIUM).** Live: plain overlay div
(`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40`,
`style="opacity: 1"`, no animate classes) > `div.w-full.max-w-md` (motion
wrapper) > card `rounded-xl border text-card-foreground shadow bg-white
dark:bg-gray-800` (no w-full, no backdrop-blur). Clone: Radix DialogContent
carries `data-[state=*]:animate-*` utilities and merges `w-full max-w-md`
into the card (DIALOG_CARD_BASE). Also the chooser subtitle class order:
live `text-sm text-gray-600 dark:text-gray-400 mb-4`, clone
`mb-4 text-sm …`. Fix: strip the animate utilities from the chooser's
overlay, add the `w-full max-w-md` wrapper div, plain card classes, subtitle
order. The FULL modals stay direct overlay-children (live-verified).

**F5 — "Quick Add Amount" label wrapper (LOW).** Live wraps the label in
`div.space-y-2` like the other fields; the clone renders the bare Label.

**F6 — Progress renders indeterminate (MEDIUM).** Live track:
`role=progressbar data-state=indeterminate aria-valuemax=100`, NO
aria-valuenow; fill: `data-state=indeterminate` + manual
`transform: translateX(-{100-value}%)` (verified 24.5% → -75.5%, 0% →
-100% on both Dashboard budget rows and Goals). The clone passes the value
to Radix (determinate, aria-valuenow, no data-state). Fix the Progress
primitive: keep `value` out of Radix's aria computation, render the live's
data-state + manual transform. The clone's aria-LABELs stay (a11y bucket).

**Data (documented bucket, no action):** the live user deleted most records
(1 income source, 1 expense, 1 goal, 2 holdings, 1 budget @ $0, 0 insight
records). The clone's seed keeps its own data — seed-data counts remain the
classified bucket.

## §C Design decisions

**D1 — Insights as persisted records with generate-once-when-empty (F1).**
The live's generation is external to the request path. The clone's
equivalent: the GET lists records; when the table is EMPTY (no records at
all), it generates the deterministic drafts (+ LLM polish attempt) and
persists them, then lists. This preserves: the live's list mechanics
(refresh re-lists, never regenerates), the dismiss persistence, the empty
state after dismissing everything, and the working-AI delta precedent from
round 9. Seeding does NOT create insights (the live user has none — the
clone generates on the first dashboard load, like the live's external
process having run).

**D2 — Insight DTO.** `AiInsightDto` moves to the live's field set:
`insightType` ("anomaly" | "alert" | "trend" | "opportunity" |
"prediction"), `title`, `description`, `suggestedAction?`,
`confidenceScore` (0..1), `category?`. The dismiss endpoint:
`PATCH /api/ai/insights/[id]` with `{ is_dismissed: true }` (mirror of the
live's update call). Prisma gains an `Insight` model.

**D3 — CSS instead of framer-motion.** The insight-row entrance (fade +
slide-left, 0.1s stagger) is replicated with a small CSS keyframe applied
per row (animation-delay = index × 0.1s), gated by prefers-reduced-motion.
The exit animation is skipped (documented delta — the row disappears
immediately; the live slides it out).

**D4 — Progress primitive.** Render `data-state="indeterminate"` and the
manual transform (value tracked outside Radix's aria). The clone keeps its
aria-label additions per the documented a11y bucket.

## §D File-by-file change specs

1. **`prisma/schema.prisma`** — new `Insight` model: `id Int @id
   @default(autoincrement())`, `insightType String`, `title String`,
   `description String`, `suggestedAction String?`, `confidenceScore
   Float`, `category String?`, `isDismissed Boolean @default(false)`,
   `createdDate DateTime @default(now())`.
2. **`src/lib/types.ts`** — `AiInsightDto` → D2 shape.
3. **`src/app/api/ai/insights/route.ts`** — rewrite: list (take 10,
   orderBy createdDate desc, mirror the live's fetch-then-filter), generate
   + persist only when the table is empty, return `ok({ insights })`.
   Move the draft generation into `src/lib/insights.ts` (pure module —
   testable seam) with the new field mapping (type, confidence,
   suggestedAction, category).
4. **`src/app/api/ai/insights/[id]/route.ts`** (new) — PATCH dismiss
   (`is_dismissed: true`), idempotent.
5. **`src/lib/ui-maps.ts`** — `INSIGHT_TYPE_ICON` class map +
   `INSIGHT_TYPE_BADGE` color map (live strings) + test pins.
6. **`src/components/finara/dashboard-view.tsx`** — F1 UI rewrite (card
   anatomy, dismiss, Ask AI, rotating refresh, blank-while-loading,
   CSS entrance) + F2 (remove fade/stagger classes).
7. **`src/components/ui/progress.tsx`** — F6 indeterminate + manual
   transform.
8. **`src/components/ui/dialog.tsx`** — F4: allow a plain-structure mode
   (overlay without animate utilities + optional width wrapper div) via
   existing per-call-site props; keep DIALOG_CARD_BASE for full modals.
9. **`src/components/finara/quick-add-dialog.tsx`** — F4 structure +
   subtitle class order.
10. **`src/components/finara/{expenses,income,goals,accounts,investments,
    import,analytics,settings}-view.tsx` + `add-transaction-dialog.tsx` +
    `login-view.tsx` (if present)** — F2: remove every `fade-in-up` /
    `stagger-N` class.
11. **`src/app/globals.css`** — remove `.fade-in-up`/`.stagger-*` rules +
   `fade-in-up` keyframes; add the insight-row entrance keyframe (D3).
12. **`src/components/finara/add-transaction-dialog.tsx`** — F5 wrapper +
    F3 div title (all full-modal dialogs switch their titles to
    `DialogTitle asChild` + div).
13. **Tests** — RED first for every behavior change:
    - `src/lib/__tests__/functional-parity.test.ts`: insights list/dismiss
      contracts, generate-once-when-empty, blank loading, Progress
      indeterminate pin, dialog title tag pins.
    - `src/lib/__tests__/view-surfaces.test.ts`: strip fade/stagger pins,
      chooser wrapper + subtitle order, QA label wrapper.
    - `src/lib/__tests__/ui-maps.test.ts`: INSIGHT maps.
    - `src/lib/__tests__/ui-primitives.test.tsx`: Progress + dialog
      structure updates.
    - `src/lib/__tests__/insights.test.ts` (new): pure generation module.
    - `e2e/dashboard.spec.ts`: insights spec (cards render, dismiss works,
      refresh re-lists, empty state after dismissing all).
14. **Docs** — plan §G execution record; AGENTS.md (insights architecture,
    animation removal, Progress mechanism, dialog title rule); CLAUDE.md
    (round-13 ANALYZE reference, VERIFY additions); README (AI Insights
    feature row, tests count); PAD v1.12 (§7 insights, §10 resolved rows,
    §11 key files); `docs/session_13.md`.

## §E TDD plan

Red → green per finding, in dependency order: F1 types+module+routes (pure
module spec first, then route-level contracts in functional-parity) → F1
view (source-contract pins) → F2 (view-surfaces pin updates + grep-clean
assertion) → F3/F4/F5 (dialog source pins) → F6 (primitive pin + DOM
contract) → E2E updates last, then the full gate.

## §F Verification plan

- Gates: `bun run lint` · `bun run typecheck` · `bun run test` (275+,
  count moves with the new specs) · `bun run test:e2e` (66+ specs green,
  updated where the contracts changed) — all green before commit.
- Live-DOM re-diff: fresh capture of Dashboard/Expenses (post-fix) with
  every remaining only-live/only-clone delta classified (infra, a11y
  additions, lucide internals, data counts, documented deltas).
- Computed-style spot checks: insights card classes, Progress
  data-state/transform, dialog title tags, chooser structure.
- Live etiquette: no live mutations this round (read-only probes; the
  chooser/dialog interactions opened and closed UI state only).

## §G Execution record (2026-09-18)

All six findings remediated red→green in plan order; every gate green.

**F1 — insights as persisted records.** `prisma/schema.prisma` gained the
`Insight` model (`insightType/title/description/suggestedAction?
/confidenceScore/category?/isDismissed@default(false)/createdDate`).
`src/lib/insights.ts` (new pure seam) builds the deterministic drafts
(titles: "Savings rate check" / "Top spending category" / "Spending exceeds
income" / "Budget watch"; confidence 0.9/0.85/0.75/0.8; capped at 3).
`src/app/api/ai/insights/route.ts` became a pure list (take 10, newest
first, fetch-then-filter dismissed) that generates+persists ONLY when the
table is completely empty, guarded by an atomic `_insights_generated`
unique-key marker (React StrictMode double-fetch raced two concurrent
generations into duplicate rows — the seed's marker pattern fixed it).
`src/app/api/ai/insights/[id]/route.ts` (new) PATCHes
`{ isDismissed: true }` idempotently. `AiInsightDto` moved to the live field
set. The dashboard section renders the live anatomy (type icon + raw-id
badge via `INSIGHT_TYPE_ICON`/`INSIGHT_TYPE_BADGE` maps, dismiss X, h4
title, description, blue suggested-action callout, Confidence %/Category
footer, empty state, blank-while-loading, CSS entrance
`.insight-row` gated by prefers-reduced-motion — the live's framer-motion
exit animation is a documented delta).

**F2 — animations removed.** Every `fade-in-up`/`stagger-N` class stripped
from all views; globals.css keyframes+delays dropped.

**F3 — full-modal titles are DIVs.** `DialogTitle asChild` wraps a div in
add-transaction + ai-coach dialogs (aria-labelledby wiring kept — a11y
addition bucket). Quick Add chooser stays h3.

**F4 — chooser structure.** dialog.tsx overlay base drops the animate
utilities; the chooser renders plain overlay > `div.w-full.max-w-md` >
plain card; subtitle class order matches the live. Full modals stay direct
overlay children.

**F5 — Quick Add Amount label** wrapped in `div.space-y-2`.

**F6 — Progress primitive.** value stays out of Radix's aria computation:
`data-state="indeterminate"` + manual `translateX(-{100-value}%)` on the
fill, no aria-valuenow (Dashboard budget + Goals both consume the
primitive).

**E2E-gate follow-up (found during the gate).** Two real defects surfaced
by the failing specs: (1) the insights LLM polish rewrote titles
nondeterministically — one run's polished text substring-collided with the
`Largest Expense Category` KPI assertion, breaking gate hermeticity; (2)
the polish joined drafts by TITLE, so any rewritten title silently lost
its confidence/category (fell back to 0.8/undefined). Fixes: the polish is
env-gated (`FINARA_INSIGHTS_LLM_OFF=1` pinned in the playwright webServer
env — production leaves it unset), and the join moved into the pure seam
`mergePolishedDrafts(drafts, polished)` — positional (the prompt pins
order), drops invalid entries without shifting, caps at the draft count,
carries confidence/category/suggestedAction/type-fallback from the
positional draft. The EUR spec now scopes its app-wide `$` sweep to
exclude the persisted insight record text (`h4 ~ p` — insight rows are the
dashboard's only h4s; the live's records keep their creation-time text
too), and the dashboard KPI/section label assertions use `exact: true`.

**Gates (final):** lint 0 · tsc 0 · unit 311/311 (was 275; +36) · E2E
67/67 (was 66; +1 net: 2 insights specs added, 1 KPI assertion hardened)
· two consecutive full-suite green runs (hermeticity confirmed). Post-fix
DOM spot checks (dev build): insights row/badge/icon/dismiss-X/callout/
footer classes live-exact, dismiss → empty state → refresh re-lists without
regenerating, budget bars `data-state=indeterminate` + manual transforms,
modal titles DIVs, chooser overlay>wrapper>card structure, 0 fade classes.
Evidence: `/home/z/my-project/captures/r13/` (view sigs, modal sigs,
screenshots, spot-check scripts).
