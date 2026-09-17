# Parity Remediation Plan — Round 8 (2026-09-17)

Scope: order-sensitive DOM parity sweep across all nine views + the app shell,
real-route architecture, expenses bulk-bar/pagination functional parity, Quick
Add step-2 anatomy, mobile header/drawer pins, and two shared-primitive
corrections (Button default variant, Trash2 alias class).

Evidence: `/home/z/my-project/captures/r8-*` (18 live + 11 clone captures, the
13-row pagination experiment, bulk-bar + bulk-edit-listbox captures, Quick Add
step-2 expense/income captures, mobile drawer/header captures) plus fresh
probes this round (`/` behavior, 404 page, per-route titles, desktop sidebar
active pill + Synced badge, Bulk Edit option behavior experiment).

## §A Findings

Order deltas below are **rendered-class-order** deltas — the clone's class
multiset is already correct in most cases; the string order differs. Since
Tailwind emits CSS in stylesheet order (not class-attr order), none of these
change pixels; they are pinned for DOM-string parity with the live app, per
the established class-exact discipline (ADR-019/020).

- **F1 Shell orders (every view).** `<main>` → `flex-1 flex flex-col lg:ml-0`;
  inner gradient pane → `p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen transition-colors duration-300`;
  containers → `max-w-7xl mx-auto` / `max-w-6xl mx-auto` / `max-w-4xl mx-auto`;
  header wrapper → `flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4`
  (dashboard variant → `flex flex-col gap-4 items-start justify-between lg:flex-row lg:items-center mb-8`);
  h1 → `text-3xl lg:text-4xl font-bold text-primary-navy dark:text-white mb-2`.
- **F2 Card component merges (live uses Card, clone renders plain divs).** With
  Card base `rounded-xl border bg-card text-card-foreground shadow`, live's
  per-context rendered strings decompose to these className arguments:
  - dashboard KPI cards: `p-6 card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg`
  - income/goals/accounts + expenses-KPI cards (card-hover): `card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg`
  - analytics/expenses-list/settings cards (full re-state): `backdrop-blur-sm bg-white/80 border-0 dark:bg-gray-800/80 rounded-xl shadow-lg text-card-foreground`
  - dashboard recent-activity card (no hover): `bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg`
  - import view: `<Card>` with **no className** (plain `bg-card border rounded-xl shadow text-card-foreground`)
  The clone's `CARD_SURFACE` constant (ui-bits) is retired from views; `StatCard`,
  `GradientCard`, and `SectionCard` switch to the Card component with the
  per-context strings (21 CARD_SURFACE usages across the seven view files).
- **F3 Tile orders.** KPI tiles `w-12 h-12 rounded-xl bg-gradient-to-r from-X to-Y flex items-center justify-center`;
  hero circles `w-16 h-16 bg-white/20 rounded-full flex items-center justify-center` /
  `w-20 h-20 bg-white/20 rounded-full flex items-center justify-center`;
  accounts tile `w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl flex items-center justify-center`;
  expense row tile `w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm` (already exact).
- **F4 Gradient hero cards.** `rounded-xl bg-gradient-to-r from-X to-Y text-white border-0 shadow-lg`
  (dashboard bottom cards carry `card-hover` at string end; income hero uses `shadow-xl`;
  clone currently renders these as Card with `border-0 … shadow-lg` reordered — pin to component merges like F2).
- **F5 Margin-last text + grid + row orders.** All `mb-*`/`mt-*` classes move
  to string end (`text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1`,
  `text-2xl font-bold text-neutral-900 dark:text-white mb-3`, …); grids →
  `grid grid-cols-2 md:grid-cols-4 gap-4`, `grid md:grid-cols-2 gap-4`,
  `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` (income/accounts/goals),
  `grid grid-cols-1 gap-6 mb-8 md:grid-cols-3` (investments KPIs), `grid gap-8 lg:grid-cols-3`
  (dashboard bottom / investments holdings); `p-6 pt-0 space-y-4` / `space-y-6`
  (CardContent merges); `flex-1 min-w-0`; `flex-1 relative`; truncate-last
  headings; activity rows `flex items-center gap-3 p-3 rounded-lg bg-neutral-50/50 dark:bg-gray-700/30 hover:bg-neutral-100/50 dark:hover:bg-gray-700/50 transition-colors`;
  expense rows `flex items-center gap-4 p-4 bg-neutral-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-neutral-100/50 dark:hover:bg-gray-700/50 transition-colors`.
- **F6 Button tails + default-variant shadow.** Live Button **default variant
  includes `shadow`**: `bg-primary text-primary-foreground shadow hover:bg-primary/90`
  (proven by import sample-data button rendering `… shadow hover:bg-primary/90 h-9 px-4 py-2`
  with no className, and settings export/save decompositions). Per-button tails:
  - sage header CTAs: className `bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg` (size default provides `h-9 px-4 py-2`; drop the clone's redundant `h-9`)
  - settings export: className `h-9 px-4 py-2 w-full bg-blue-600 hover:bg-blue-700`
  - settings save: className `h-9 px-4 py-2 bg-primary-sage hover:bg-primary-sage/90 gap-2`
  - dashboard "This Month" outline: className `h-9 px-4 py-2 gap-2` (gap-2 re-passed → moves to tail)
  - import sample-data: **no className** (variant shadow covers it)
  - dashboard AI-coach "View All": `h-8 rounded-md px-3 text-xs gap-2` (sm size + gap-2 tail)
  - analytics filter chips: `h-9 px-4 py-2 gap-2` tails
  - goals "Add Progress" full-width: `h-8 rounded-md px-3 text-xs w-full mt-4`
  - accounts "Import transactions": `h-9 px-4 py-2 w-full mt-4`
- **F7 CardTitle icon rows.** className `flex items-center gap-2 text-primary-navy dark:text-white`
  only — CardTitle base supplies `font-semibold leading-none tracking-tight`
  (clone re-states them, pushing them after the flex classes).
- **F8 Trash2 alias class.** Clone's lucide-react@0.525 emits dual
  `lucide-trash-2 lucide-trash2`; live emits single `lucide-trash2`. Add a
  `ClassicTrash2` pinned icon (same precedent as `ClassicFilter`) with the
  live path set and class generation `lucide lucide-trash2 …`, and swap all
  Trash2 usages (expenses/income/accounts/goals/investments rows + dialogs).
- **F9 Progress tracks + dots.** `relative w-full overflow-hidden rounded-full h-2 bg-gray-200 dark:bg-gray-700`
  (dashboard budget) / `relative w-full overflow-hidden rounded-full bg-primary/20 h-2`
  (goals); legend dots `w-3 h-3 rounded-full`.
- **F10 Real-route architecture.** Live is an SPA over real paths: `/Dashboard`,
  `/Income`, `/Expenses`, `/Accounts`, `/Investments`, `/Import`, `/Analytics`,
  `/Goals`, `/Settings`. Probed behaviors:
  - `/` unauthenticated → redirects to `/login?from_url=<full url>`; after
    login → returns to from_url
  - `/` authenticated → renders the Dashboard content with **no active nav pill**
  - document titles: `/` and `/Dashboard` → `Finara`; other known views →
    `X | Finara`; unknown → `<Segment> | Finara` (probed: `Nonexistent Page | Finara`)
  - unknown paths → standalone 404 page (outside the app shell): `min-h-screen flex items-center justify-center p-6 bg-slate-50`
    > `max-w-md w-full` > `text-center space-y-6` > [`space-y-2` > `text-7xl font-light text-slate-300` 404 +
    `h-0.5 w-16 bg-slate-200 mx-auto` divider] > [`space-y-3` > `text-2xl font-medium text-slate-800` Page Not Found +
    `text-slate-600 leading-relaxed` "The page <span class="font-medium text-slate-700">"<Segment>"</span> could not be found in this application."]
    > `pt-6` > plain-styled Go Home button (home glyph `w-4 h-4 mr-2`, navigates to `/`)
  - navigation is client-side (SPA): links are real `<a href>` intercepted by
    the router; back/forward work
- **F11 Expenses: NO pagination.** Live renders all filtered rows (13-row
  experiment capture, no pager). Remove the clone's pagination nav, `PAGE_SIZE`,
  and the `visible` slice.
- **F12 Expenses bulk bar (live-exact rewrite).** Blue info bar
  `bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4`
  > `flex items-center justify-between` > left `flex items-center gap-4`
  [Select All ghost-sm button with custom dash-checkbox (`w-4 h-4 border-2 border-current rounded flex items-center justify-center`
  > `w-2 h-0.5 bg-current`) + `Select All ({filtered.length})`; when all
  selected the SAME button renders lucide `SquareCheckBig w-4 h-4` +
  `Deselect All`] + span `text-sm text-blue-700 dark:text-blue-300 font-medium`
  `{n} expenses selected` (**always plural**, probed "1 expenses selected") >
  right `flex items-center gap-2` [Bulk Edit = SelectTrigger `w-auto gap-2`
  with `PenLine w-4 h-4` + SelectValue placeholder "Bulk Edit"; options
  Change Category / Update Date / Mark as Recurring — **functionally inert on
  live** (probed: trigger resets to placeholder, no dialog, no mutation)] +
  Delete outline-sm `text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20`
  with `Trash2` + `Delete ({n})` + native confirm `Are you sure you want to
  delete {n} expenses?` + X ghost-icon `w-8 h-8` clearing selection. The clone's
  emerald toolbar / Move-to-Needs/Wants/Savings select is retired. Select All
  toggles all *filtered* rows.
- **F13 Quick Add step-2.** Back → outline + `flex-1` (`h-9 px-4 py-2 flex-1`);
  Add → `text-primary-foreground shadow h-9 px-4 py-2 flex-1 bg-primary-sage hover:bg-primary-sage/90`
  with `Check w-4 h-4 mr-1` before the label and **disabled until description
  and amount are both filled** (probed); drop clone-only `maxLength`/`min`
  (live inputs are bare `required` placeholders); keep aria-labels (documented
  a11y bucket). Chooser step-1 header/close remain as pinned in round 6/7.
- **F14 Mobile header.** Container `lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-gray-700`;
  inner `flex items-center justify-between h-16 px-4`; brand tile `w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center`;
  theme toggle ghost `w-8 h-8 text-gray-700 dark:text-gray-300`; menu ghost
  `h-9 w-9 text-gray-700 dark:text-gray-300`. **SyncedBadge re-pin (desktop +
  mobile):** Badge component + className `gap-1 text-green-600 border-green-300 dark:text-green-400 dark:border-green-600`
  (renders the live base-first order; current hand-written div is retired).
- **F15 Mobile drawer.** Container `lg:hidden fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900`;
  inner `flex flex-col h-full pt-20`; nav `flex-1 px-4 py-6 space-y-2`; nav
  items = real-route anchors (F10); compact item `flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all duration-200 …`
  with inactive `text-slate-300 hover:bg-white/10 hover:text-white` and active
  `bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30` (no
  backdrop blur in the drawer — clone already branches this). Drawer Sign Out
  button already live-exact.
- **F16 Import view.** Main card → plain `<Card>` (no glass override — kills
  the clone-only glass surface); CardContent merge `p-6 pt-0 space-y-4`;
  dropzone `p-6 border-2 border-dashed rounded-lg text-center`; upload label
  `text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer`;
  sample-data button → plain default Button (F6).
- **F17 Analytics.** KPI grid `grid gap-6 md:grid-cols-3`; filter row
  `flex gap-3 flex-wrap`; date Input `flex h-9 … w-auto` (h-9 early);
  trending-down-red icon `w-8 h-8 text-red-200 rotate-180`; cards use the F2
  full-restate pattern.
- **F18 Settings.** Five cards → F2 full-restate pattern; section grids
  `grid md:grid-cols-2 gap-4` / `grid grid-cols-2 md:grid-cols-4 gap-4`;
  info boxes `bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4`
  (amber variant same shape); shield/alert icons `w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5`;
  export-file Input `flex h-9 w-full … cursor-pointer` (cursor-pointer tail);
  buttons per F6.
- **F19 Dashboard structure.** KPI grid `gap-6 grid grid-cols-1 lg:grid-cols-4 mb-8 md:grid-cols-2`;
  gradient row `gap-6 grid mb-8 md:grid-cols-4`; bottom `gap-8 grid lg:grid-cols-3`
  + main column `lg:col-span-2 space-y-8`; Quick Actions panel stays a plain
  div but re-pinned to `backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 mt-12 p-6 rounded-2xl shadow-lg`
  (drop `fade-in-up` per live string; keep stagger discipline documented);
  Quick Actions buttons `px-4 py-2 w-full h-16 flex-col gap-2 hover:bg-emerald-50 …`
  (live order); AI Insights empty state `py-8 text-center` with brain
  `dark:text-neutral-600 h-12 … mb-3 mx-auto text-neutral-300 w-12` and
  `p[dark:text-neutral-400 text-neutral-500]` + `dark:text-neutral-500 mt-1 text-neutral-400 text-sm`;
  "Add Transaction" remains an `<a href="/Expenses">` (route-aware after F10).

## §B Key decisions

1. **Routes via catch-all + SPA interception (not per-route folders).** Keep
   the single `<FinaraApp/>` tree: `src/app/page.tsx` serves `/`
   (`initialView="dashboard"`, no active pill) and a new
   `src/app/[...view]/page.tsx` maps `/Dashboard`…`/Settings`, `/login`, and
   unknown segments (`view="not-found"`). `FinaraApp` gains a `route` prop and
   syncs with `history.pushState` (navigate) + `popstate` (back/forward);
   anchor clicks keep `preventDefault` (live is an SPA too). Per-route
   document titles via `generateMetadata` in the two page files. Unauthenticated
   load → `replaceState('/login?from_url=<path>')`; login submit → navigate to
   from_url or `/`; authenticated `/login` → redirect to from_url or `/`.
   This preserves the one-mount SPA (no RSC round-trips on nav) while giving
   real URLs, deep links, back/forward, and the live 404.
2. **Button default variant gains `shadow`** (button.tsx) — the merge
   forensics in F6 show live's default variant carries shadow. Update
   `ui-primitives.test.tsx` pins accordingly and strip now-redundant
   `className="shadow"` passes.
3. **Views adopt the Card component** with the per-context className strings
   (F2) instead of the plain-div `CARD_SURFACE`; `CARD_SURFACE` is deleted
   after all consumers migrate.
4. **Bulk Edit stays inert** — live's dropdown options trigger nothing
   (probed). The clone reproduces the anatomy and the no-op selection reset
   (uncontrolled select that returns to placeholder), documented as
   live-verified inert behavior, not a bug.
5. **`fade-in-up` / stagger classes** on section cards: live strings don't
   carry them (documented bucket since round 2). Where a re-pinned element's
   live string lacks them, they move to a wrapper the live DOM also has, or
   are dropped if no wrapper exists. Quick Actions panel (F19) drops it.
6. **aria-labels stay** (documented a11y bucket); `maxlength`/`min` go (they
   are functional deltas vs live's bare inputs).

## §C File-by-file specifications

### C.1 `src/components/ui/button.tsx` (+ `ui-primitives.test.tsx`)

- default variant → `bg-primary text-primary-foreground shadow hover:bg-primary/90`.
- No other variant changes.

### C.2 `src/components/finara/ui-bits.tsx`

- Delete `CARD_SURFACE`. `StatCard` renders `<Card className={…}>` per F2
  context (dashboard `p-6 card-hover …`; other views `card-hover …`);
  `GradientCard` adopts the F4 merges; `SectionCard` takes a `surface` prop
  selecting the F2 pattern (hover / plain-glass / full-restate).
- `ViewHeader`: wrapper + h1 orders per F1 (dashboard variant prop).
- Add `ClassicTrash2` (F8): lucide path set, class `lucide lucide-trash2`.
- Margin-last re-pins inside KPICard/EmptyState/ErrorNote/LoadingRows.

### C.3 `src/app/page.tsx` + new `src/app/[...view]/page.tsx` + `finara-app.tsx`

- Route table `{ "/Dashboard": "dashboard", … }`; `/login` → login surface;
  unknown → `not-found`.
- `generateMetadata`: `/`,`/Dashboard` → `Finara`; `/login` → `Login | Finara`
  (unprobed — matches the app's title convention; documented); known →
  `X | Finara`; unknown → `<Segment> | Finara`.
- `FinaraApp({ route })`: derive `view`+`active` from route; `navigate()`
  pushState; `popstate` listener; unauthenticated replaceState to
  `/login?from_url=`; login success → from_url or `/`; authenticated at
  `/login` → pushState to from_url or `/`; `view === "not-found"` → render
  `NotFoundView` standalone (no sidebar/main).
- New `NotFoundView` in ui-bits (F10 anatomy, plain home-glyph svg button
  `inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500`
  → navigates to `/`).
- Shell orders per F1 (main/pane/containers/header).

### C.4 `sidebar.tsx`

- `SyncedBadge` → Badge + `gap-1 text-green-600 border-green-300 dark:text-green-400 dark:border-green-600`.
- `NavItem` → real `href={VIEW_PATH[item.id]}` (keep preventDefault+navigate).
- Desktop active pill order `bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30 backdrop-blur-sm`;
  inactive `text-slate-300 hover:bg-white/10 hover:text-white`; item base
  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200`.
- Mobile header orders per F14; theme toggle `w-8 h-8`; drawer container/
  inner/nav orders per F15; compact item `px-4 py-4` placement + active
  without blur.

### C.5 `dashboard-view.tsx`

- Header variant order (F1); KPI grid/gradient row/bottom grid (F19);
  Quick Actions panel string + button orders (F19); AI Insights empty state
  (F19); activity rows + progress track (F5/F9); CardTitle rows (F7);
  "This Month" outline button tail (F6); "Add Transaction" anchor keeps
  `/Expenses` href (now routed); hero tiles (F3); gradient cards via Card
  merges (F4).

### C.6 Per-view sweeps (income / accounts / investments / goals / analytics / settings / import)

- Apply F1–F9, F16–F18 per the delta report's per-view ORDER lines: header
  wrapper/h1, hero cards + tiles, Card merges, `space-y-*` → grid patterns,
  margin-last texts, truncate-last headings, CardTitle rows, badge order
  (expenses subcategory badge className gains `text-xs`), progress tracks,
  button tails, `pt-3 border-t` orders, `w-3 h-3` dots, investments summary
  grid `gap-6 grid grid-cols-1 mb-8 md:grid-cols-3` + holdings `gap-8 grid lg:grid-cols-3`.

### C.7 `expenses-view.tsx`

- Remove pagination (F11): delete nav block, `PAGE_SIZE`, `pageCount`,
  `visible` slice, `safePage`/`setPage` state, ChevronLeft/ChevronRight imports.
- Bulk bar rewrite per F12 (Select All/Deselect All toggle + SquareCheckBig
  import; always-plural count; inert Bulk Edit select with Change Category/
  Update Date/Mark as Recurring options; red Delete; X clear).
- Row wrapper order (F5); subcategory badge `text-xs dark:border-gray-600` (F5);
  keep search icon `text-gray-400` + confirm texts (already live-exact).
- Replace Trash2 with ClassicTrash2 (F8).

### C.8 `quick-add-dialog.tsx`

- Step-2 buttons per F13 (+ `Check` icon import); disabled-until-valid via
  `description.trim()` + parsed amount; drop `maxLength`/`min`.

## §D TDD plan (red → green)

New spec `src/lib/__tests__/view-surfaces.test.ts` (source contracts, per the
dialog-forms precedent) + additions to `ui-primitives.test.tsx`:

1. button.tsx default variant includes `shadow` (render assert).
2. ui-bits: no `CARD_SURFACE` export; KPICard/SectionCard render Card with the
   four F2 strings; ViewHeader orders; ClassicTrash2 class string.
3. Route table + metadata mapping (paths ↔ views ↔ titles) and NotFoundView
   source pins.
4. sidebar: SyncedBadge string; NavItem href per item; mobile header/drawer
   class orders.
5. Per-view ORDER pins: for each delta-report ORDER line, assert the live
   string is produced by the source (renderToStaticMarkup of the view with
   mocked data, or source-regex pins for large views — same split as round 7).
6. expenses: no `PAGE_SIZE`/`nav`/pagination source; bulk-bar source pins
   (Select All/Deselect All branches, inert options, Delete classes, confirm
   template).
7. quick-add step-2: Back/Add class strings, Check icon, disabled expression,
   no maxLength/min.

Browser-only behavior (route navigation, popstate, confirm flows, bulk select)
stays with the §E verification pass per the established split.

## §E Execution & verification

- [T1] RED: write the new specs; expect only them failing.
- [T2] button.tsx variant + ui-primitives pin update (+ any `className="shadow"` cleanup).
- [T3] ui-bits: Card adoption, ViewHeader, ClassicTrash2, EmptyState orders.
- [T4] Routes: catch-all page, FinaraApp route sync, NotFoundView, titles, login from_url flow.
- [T5] sidebar + mobile header/drawer re-pins.
- [T6] dashboard-view sweep.
- [T7] income/accounts/investments/goals sweeps.
- [T8] analytics/settings/import sweeps.
- [T9] expenses: pagination removal + bulk bar rewrite.
- [T10] quick-add step-2.
- [T11] GREEN: full suite + `bun run lint && bun run typecheck && bun run test && bun run build`.
- [T12] Browser verification: dev server; exercise every route (deep link +
  client nav + back/forward), `/` no-pill, unknown path 404, titles; expenses
  select-all/deselect/bulk-delete-confirm flow; quick-add step-2 disabled
  state; dark-mode pass; zero console errors.
- [T13] DOM re-diff vs the r8 live captures; residual classification.
- [T14] Docs: AGENTS.md (route map + order rules + bulk-bar matrix), CLAUDE.md,
  README (test count), PAD v1.7 + ADR-021 (route architecture + order-parity
  contract + button/Card merge forensics), this plan's execution record.
- [T15] Atomic Conventional Commits on main; push via `docs/ssh_git_wrapper_v3.py`.

## §F Validation of this plan against the codebase (pre-execution)

- `finara-app.tsx` shell lines 152–165 carry the F1 orders to re-pin; `navigate`
  (line 105) is the single place to add pushState; sign-out (line 126) resets
  view — becomes route-aware.
- `sidebar.tsx` NavItem (149–176) already branches compact/active and the
  drawer branch correctly omits blur; only href + class orders change.
- `ui-bits.tsx` line 16 `CARD_SURFACE` has 21 consumers across the seven view
  files (grep) — all listed in C.5–C.8; `ClassicFilterIcon` (line 73) is the
  precedent for `ClassicTrash2`; KPI card is `StatCard` (line 113), hero is
  `GradientCard` (line 146).
- `expenses-view.tsx`: pagination block 408–460; bulk bar 272–306; rows
  343–405; `Trash2` imports/usages enumerated (10 rendered rows in dev DB).
- `quick-add-dialog.tsx` step-2 form 165–208 — all F13 targets present.
- `button.tsx` variant line 15; `ui-primitives.test.tsx` pins the current
  string (must be updated in the same commit as T2).
- Risk: button default-variant shadow changes EVERY default Button render —
  full test suite + browser pass will catch strays (T11/T12).
- Risk: catch-all route must not shadow `/api` (App Router resolves static
  segments first — `src/app/api` wins over `[...view]`); verified pattern.
- Risk: `pushState` in a client component must guard `typeof window` (SSR) —
  same pattern as theme.ts store.
- Unprobed (documented): `/login` document title; Select All dash→check
  transition at exactly-all-selected (implemented per probed Deselect All
  branch); Bulk Edit options' intended behavior (live-inert — reproduced).

## §G Execution & verification record

**TDD red phase:** 54 specs in `src/lib/__tests__/view-surfaces.test.ts` (routes
module unit contracts + per-view source contracts) + the ui-primitives default-
variant pin — all failing initially (the routes module did not exist), all 156
existing tests stayed green.

**Green phase (task order T2–T10):**
- T2 button.tsx: default variant → `bg-primary text-primary-foreground shadow hover:bg-primary/90` (merge forensics: the import sample-data button renders the variant+size with no className); ui-primitives pin tightened; import-view's redundant `className="shadow"` removed.
- T3 ui-bits: `CARD_SURFACE` retired for `CARD_DASHBOARD_SURFACE` / `CARD_HOVER` / `CARD_PLAIN` (raw-capture-verified orders); StatCard tile `w-12 h-12 rounded-xl ${iconClass} flex…`; ViewHeader orders; `ClassicTrash2` (single-alias class, ClassicFilterIcon precedent); `NotFoundView` (standalone live 404 anatomy).
- T4 routes: `src/lib/routes.ts` (VIEW_PATHS/parseRoute/segmentToTitle); `src/app/page.tsx` (home marker, bare title); `src/app/[...view]/page.tsx` catch-all + generateMetadata; FinaraApp accepts a `route` prop, navigates via `history.pushState`, listens to `popstate`, replaceState's unauthenticated deep links to `/login?from_url=…`, returns to from_url on sign-in, and renders NotFoundView outside the shell for unknown paths.
- T5 sidebar: SyncedBadge → Badge + live tail; NavItem hrefs → real routes; item/base/active class orders; mobile header + drawer orders; `active: ViewId | null` (the no-pill `/`).
- T6–T8 per-view sweeps via the persisted `scripts/r8-view-sweep.py` + targeted fixes: grids to true live orders, gradient heroes `rounded-xl bg-gradient… border-0 shadow-lg`, margin-last texts, `flex-1 min-w-0`/truncate-last/`mt-1` rows, CardTitle icon rows, sage CTAs without re-stated h-9, settings label/input/button orders, import plain Card + dropzone/label orders, Trash2 → ClassicTrash2 everywhere. **Root `space-y-8` wrappers removed** in six views (live renders sections as direct container children; margin collapsing keeps visuals identical).
- T9 expenses: pagination fully removed (PAGE_SIZE/slice/nav/state); bulk bar rewritten to the live blue anatomy (Select All ⇄ Deselect All with the dash-checkbox div ⇄ SquareCheckBig, always-plural count, inert Bulk Edit select with Change Category/Update Date/Mark as Recurring, red outline Delete, X clear); always-plural bulk confirm.
- T10 quick-add step-2: Back `flex-1`, Add `flex-1 bg-primary-sage hover:bg-primary-sage/90` + Check glyph + disabled-until-valid; `maxLength`/`min` dropped.

**Post-diff corrections (the T13 re-diff caught phantom pins built on the
signature diff's SORTED classes):** every LIVE-ONLY order was re-extracted from
the raw captures. The dashboard "variant" header, the Quick Actions panel
order, the AI-Insights empty-state "alphabetical" strings, and the
"CARD_RESTATE" pattern were all artifacts — corrected to the raw truth
(standard header order; `mt-12 bg-white/80 … p-6`; normal lucide Brain;
settings/analytics/expenses cards = CARD_PLAIN order). Hand-written icon-title
divs carry the FULL `font-semibold leading-none tracking-tight flex …` literal
(only the CardTitle component renders the short-className merge). The expenses
category cards append `card-hover` at the string tail (unlike income/goals/
accounts where it sits early) — pinned per-capture. The gradient/search/
analytics button tails drop redundant h-9 passes.

**Gates:** lint 0 · tsc 0 · **210/210 tests** (156 + 54 new) · `next build` 0
(catch-all `[...view]` registered alongside every /api route).

**Browser verification (executed, dev server):** every route deep-links and
client-navigates (pushState) with exact live titles (`/`,`/Dashboard` →
"Finara"; views → "X | Finara"; unknown → "Nonexistent Page | Finara");
back/forward via popstate; `/` renders the dashboard with NO active pill and
/Dashboard marks itself active; unauthenticated deep links replaceState to
`/login?from_url=…` and sign-in returns there (a hydration race that clobbered
authenticated reloads was found and fixed — the effect now reads the live
session store); unknown paths render the standalone 404 page whose Go Home
returns to `/`; expenses renders all 97 dev rows with no pager; the bulk bar
matches the live anatomy (dash-checkbox Select All (97) ⇄ SquareCheckBig
Deselect All, "1 expenses selected", inert Bulk Edit that resets to the
placeholder with no mutation, Delete (n) confirm "Are you sure you want to
delete N expenses?", X clears); Quick Add step-2 renders Back/Add flex-1 with
the Check glyph and stays disabled until both fields are filled; dark-mode
computed checks pass (gray-800/80 cards, gray-900 gradient); zero console
errors/warnings.

**DOM re-diff (fresh clone captures vs the r8 live captures):** **0 order
deltas across all nine views** (from 172 at round start). Remaining
LIVE-ONLY/CLONE-ONLY signatures classify entirely into documented buckets:
clone fade-in-up/stagger animation prefixes, live framer-motion wrapper divs
(the bare `mb-8`/`mb-6`/style wrappers), data-count differences (97 vs 1
expense rows, AI tips vs empty insights, goal status badges, account icon
mix), Radix portal internals, and the clone's aria-label a11y additions.
