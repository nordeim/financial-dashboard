# Finara Clone — Parity Remediation Plan (Round 5)

**Date:** 2026-09-16
**Goal:** Close the residual visual/functional gap with `https://finara-c636f309.base44.app` identified by the fresh round-5 audit: fix the empty Recent-Activity income badges (functional bug), align the app's effective typeface with the live app's computed system-font rendering, restore the live chart configuration (grid lines, axis lines, dark-mode grid colors, default legend icons), restructure the AI Coach chat to the live bubble anatomy, match the live modal title/content class sets, and finish the per-view class-exact details (grid margins, header action placement, icon sizes, mobile drawer bottom, badge texts) — producing a fully functioning, production-grade, enterprise-polished clone.
**Method:** TDD (failing tests first for every testable seam), class-exact restyles copied from the captured live DOM, computed-style verification for typography and chart colors, all four gates (`lint` / `typecheck` / `test` / `build`) green before push, browser E2E + DOM re-diff as acceptance.
**Source of truth:** `audit/round5/` (outside the repo) — 9 live view DOM captures (light) + 4 dark-mode captures + live modal/dialog/drawer/menu captures + computed-style probes (font stack, chart tick size/fill, dark grid stroke). All live probe data (chat messages, theme state) was ephemeral or restored; no live DB rows were created this round.
**Predecessors:** round-2 (`2026-09-15-parity-remediation-round2.md`), round-3 (`2026-09-15-parity-remediation-round3.md`), round-4 (`2026-09-15-parity-remediation-round4.md`).

---

## A. Round-5 audit summary (all live-verified 2026-09-16)

### A.1 Findings by severity

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| F1 | **High (functional)** | Recent Activity income rows render an **empty badge** (no text, gray fallback) — `IncomeEventInput` lacks `category`, so `ACTIVITY_BADGE[null]` misses and `badgeText` is `""`. Live renders the income source's category ("primary" in a green badge) | live dashboard capture; `dashboard-kpis.ts:154-162`; clone DOM shows `<div class="…bg-gray-100…"></div>` with no text |
| F2 | **High (functional/text)** | Income source card badge renders **"primary income"** (label lowercased); live renders the raw category id **"primary"** | live income capture; clone income capture; `income-view.tsx:176-178` |
| F3 | **High (visual, dark mode)** | Analytics trend chart: clone hides axis lines + tick lines (`axisLine={false} tickLine={false}`), disables vertical grid lines (`vertical={false}`), and its grid lines do not restyle in dark mode. Live renders **visible axis + tick lines** (stroke `#64748b`), **both grid directions**, and each grid line carries `dark:stroke-gray-600` (computed `rgb(75,85,99)` in dark — verified) | live analytics capture + dark computed-style probe; `analytics-view.tsx:178-183` |
| F4 | **High (systemic, computed style)** | **Effective typeface**: live renders the whole app in the Tailwind default system stack (`ui-sans-serif, system-ui, sans-serif, …` — computed on h1/button/chart text) because the root div's `font-sans` overrides the body's Inter `@import`. The clone maps `--font-sans: var(--font-inter)` → everything renders Inter. Also: live chart tick labels compute to **16px** (no explicit fontSize — SVG default); the clone forces `fontSize: 12` (12px). Live money values do **not** use tabular-nums | computed-style probes on live h1/button/tick; `layout.tsx`, `globals.css:9`, `analytics-view.tsx` tick objects |
| F5 | **High (structural)** | Mobile drawer bottom: clone renders Synced badge + user dropdown button (`space-y-3 border-t … p-4`); live renders a **direct full-width Sign Out button** (`p-4 border-t border-slate-700/30`, outline button `w-full text-white border-slate-600 hover:bg-white/10 hover:text-white`, log-out icon `w-4 h-4 mr-2`). No Synced badge / user button in the live drawer (the badge lives in the mobile top bar, which the clone already has) | live mobile drawer capture (390×844); clone capture; `sidebar.tsx:285-288` |
| F6 | **Medium (structural)** | View headers: clone wraps the header action button in an extra `div.flex.gap-3` on income/expenses/accounts/investments/goals; live puts the button **directly** in the header flex row | per-view captures; `ui-bits.tsx:63` |
| F7 | **Medium (class-exact)** | Dialog titles: `DialogTitle` base carries `text-lg` (live modal titles = classic CardTitle set with **no** `text-lg`); QuickAdd's `h3` duplicates `text-lg font-semibold` (base + own) and uses `dark:text-gray-100` (live: `dark:text-white`) | live modal captures; `dialog.tsx` DialogTitle, `quick-add-dialog.tsx:127` |
| F8 | **Medium (class-exact)** | DialogContent base carries `max-h-[90vh] overflow-y-auto` on **all** dialogs; live only has them on the Add Expense modal — Quick Add (`max-w-md`) and AI Coach (`h-[80vh] flex flex-col`) contents have neither | live quick-add/ai-coach captures; `dialog.tsx:50-52` |
| F9 | **Medium (text/visual)** | Add Expense modal: clone adds a `DialogDescription` ("Pick a category for one-tap entry…") that live does not render; quick-select buttons lack `items-center` (live centers tile content); title icon is `TrendingDown` (live: `Receipt`); income dialog title icon is `TrendingUp` (live: `DollarSign`); the rent tile label is "Rent" — live renders **"Rent/Mortgage"** on the tile while the subcategory select still shows "Rent" (id `rent`); quick-select does **not pre-fill the description** — live sets the description input to the tile label (verified with Rent/Mortgage and Groceries probes) | live add-expense modal captures (quick + manual states) + probes; `add-transaction-dialog.tsx:121-128,238-250`, `categories.ts:72-79` |
| F10 | **Medium (visual)** | AI Coach: user bubble is emerald (`bg-emerald-500`) — live is **slate-800** (`bg-slate-800 dark:bg-slate-600`, wrapper `max-w-[85%] flex flex-col items-end`, inner `p.text-sm.leading-relaxed`); assistant bubble lacks the live prose-markdown wrapper (`text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0` + `p.my-1.leading-relaxed…`); quick-questions label is `text-xs font-medium text-slate-500` (live: `text-sm text-gray-600 dark:text-gray-400 mb-2`); suggestion chips are custom rounded-full violet-hover buttons (live: outline Button `h-8 rounded-md px-3 text-xs`); send button is `bg-primary-sage` (live: default `bg-primary`); avatar tile carries extra `shrink-0`; body lacks the `p-6 pt-0 flex-1 flex flex-col min-h-0` wrapper; ScrollArea lacks `pr-4`; visible "AI is thinking…" bubble (live renders nothing while waiting — verified); header has a DialogDescription (live: none) | live ai-coach captures (incl. sent-message probe); `ai-coach-dialog.tsx` |
| F11 | **Medium (class-exact)** | Grids: dashboard KPI grid missing `mb-8`; dashboard tiles grid has extra `grid-cols-1` and missing `mb-8` (live: `grid md:grid-cols-4 gap-6 mb-8`); investments KPI grid missing `mb-8`; goals summary grid missing `mb-8`; analytics KPI grid has extra `grid-cols-1` (live: `grid md:grid-cols-3 gap-6`) | grid comparator across all 9 views |
| F12 | **Low (class-exact)** | Icon deltas: mobile menu icon `h-4 w-4` (live: `w-5 h-5`); user-menu item icons (moon, log-out) missing `mr-2`; accounts/investments/goals header plus icons `h-4 w-4` (live: `w-5 h-5 mr-2`); investments Total Return icon `text-emerald-600` (live: `text-neutral-400 dark:text-neutral-500`); the four dashboard gradient-tile icons carry `text-white` (live: color inherited from the tile's `text-white`, no class on the svg) | per-view captures |
| F13 | **Low (class-exact)** | Chart color-casing + legend: live uses lowercase hex (`#10b981`, `#ef4444`, `#3b82f6`, `#e2e8f0`, `#64748b`) and the **default legend icon** (line+dot path); clone uses uppercase hex and `iconType="circle"` | live analytics capture (legend icon path `M0,16h10.67 A…`) vs clone (`recharts-symbols` circle) |
| F14 | **Low** | Import review table cells carry `tabular-nums` (live: `font-variant-numeric: normal` everywhere — verified computed) | computed-style probe; `import-view.tsx:350,352` |
| F15 | **High (computed style, found during verification)** | Tailwind v4's regenerated default palette drifts from the v3 values the live app renders — visibly on chromatic steps (v4 blue-600 `#155dfc` vs live `#2563eb` Δ17; red-500 `#fb2c36` vs `#ef4444` Δ24; emerald-400 `#00d294` vs `#34d399` Δ52; purple-600 Δ35) and subtly on the gray/slate ramps (~1-4/255). Live-probed confirmations: dark chart grid `rgb(75,85,99)`; dark `border-gray-600` `rgb(75,85,99)`; dark `bg-gray-700` `rgb(55,65,81)`; dark `bg-gray-800/80` `rgba(31,41,55,.8)`; dark `text-gray-400` `rgb(156,163,175)`. Fix: pin all 102 palette tokens the codebase uses (14 families) to the exact v3 hex in an unlayered `:root` block in `globals.css` (beats Tailwind's `@layer theme` and its `@supports lab()` re-definitions) | live dark probes 2026-09-16 (grid/axis/borders/surfaces/text via agent-browser computed styles); v3-vs-v4 diff of the built CSS; `globals.css` palette pin block |

### A.2 Deliberate deltas (keep, document)

- **framer-motion wrapper divs** on live — clone keeps CSS `.fade-in-up`/`.stagger-*` (ADR-013).
- **Radix Dialog semantics** — live modals are plain `div` overlays without `role="dialog"`; the clone keeps Radix for focus-trap/Esc/a11y (ADR-012). Class strings match; semantics attributes remain (invisible).
- **a11y additions** — `aria-label` on icon-only buttons, `aria-current="page"` on the active nav anchor, `sr-only` Close label, `type="button"` guards, `maxlength`/`min` input guards, `pointer-events-none` on the overlapping search icon (clicks pass through to the input — live's svg intercepts them). All invisible in rendering; retained per the round-4 decision pattern (a11y > DOM signature).
- **Next.js chrome** — route announcer, body font class, script tags.
- **Data-driven counts** — live user data ≠ clone seed data.
- **Toaster duplication** — live mounts two nested toast viewports; clone keeps one.
- **lucide version artifacts** — clone's lucide 0.525 renders renamed-icon dual classes (`lucide-trash-2 lucide-trash2`) and new-format paths; visually identical glyphs. Replicating live's exact path data would require inlining every SVG — not worth the maintenance cost; documented.
- **Nav hrefs** — live links carry real routes (`/Income`); the clone's SPA keeps `href="/"` (ADR: single-route architecture; a per-view href would 404 on direct load).
- **AI double-send guard** — the clone keeps `sending` state preventing concurrent submissions (live's input stays enabled; the guard is invisible).
- **Quick-select tooltip wrappers** — live wraps each quick-select button in `div[tabindex=0]` (an extra meaningless tab stop); the clone omits it (keyboard UX).
- **Toasts** — round-4 reversible delta (PAD §10): the clone keeps confirmation toasts.

### A.3 Live-exact class strings (copied from captures)

- **Mobile drawer bottom**: `<div class="p-4 border-t border-slate-700/30"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border bg-background shadow-sm h-9 px-4 py-2 w-full text-white border-slate-600 hover:bg-white/10 hover:text-white"><svg class="lucide lucide-log-out w-4 h-4 mr-2">…</svg>Sign Out</button></div>`
- **AI Coach body wrapper**: `p-6 pt-0 flex-1 flex flex-col min-h-0`; ScrollArea `flex-1 pr-4`; quick-questions `mt-4 mb-4`; input row `flex gap-2 mt-4`; assistant bubble `rounded-2xl px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600` + prose wrapper `text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0` + `p.my-1.leading-relaxed.text-slate-700.dark:text-slate-300`; user bubble `max-w-[85%] flex flex-col items-end` > `rounded-2xl px-4 py-2.5 bg-slate-800 dark:bg-slate-600 text-white` > `p.text-sm.leading-relaxed`; avatar tile `h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center mt-0.5`.
- **Trend chart (live props)**: `CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-600"`; `XAxis dataKey="month" stroke="#64748b" className="dark:stroke-gray-400" tick={{ fill: "#64748b" }}` (no fontSize — renders 16px like live); YAxis same; `Legend` with default iconType (no `iconType="circle"`); line strokes `#10b981` / `#ef4444` / `#3b82f6`.
- **Quick-select button (live)**: outline-Button base + `w-full h-16 flex flex-col gap-1 text-left items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600`.

---

## B. Remediation tasks

> TDD discipline: every testable seam gets its failing spec first (`src/lib/__tests__/`), then the implementation, then the view wiring. Pure-domain changes are F1/F2/F9-label; primitive changes are F7/F8; the rest are view-level class edits verified by the DOM re-diff + browser pass.

### T1 — Recent Activity income badges (F1) · `fix(dashboard)`
1. **RED**: extend `dashboard-kpis.test.ts` — `IncomeEventInput` gains `category`; income activity items must carry the source's category (and the existing expense subcategory/label assertions stay green). Spec: an income event with `category: "primary"` produces `recentActivity[0].category === "primary"`.
2. **GREEN**: `dashboard-kpis.ts` — add `category: string` to `IncomeEventInput`; map it into the activity item.
3. Wire: `analytics.ts` `getDashboard()` passes `category: source.category` when building `recentIncomeEvents`.
4. View check: `dashboard-view.tsx` badge already renders `badgeKey`/`badgeText` from `transaction.category` — now non-null for income; `ACTIVITY_BADGE.primary` (green) resolves. No view change needed.

### T2 — Income badge text (F2) · `fix(income)`
1. **RED**: `ui-maps.test.ts` (or a small spec in `categories.test.ts`) pinning the card-badge text rule: badge text = raw category id (`primary`), not the lowercased label.
2. **GREEN**: `income-view.tsx:176-178` — render `{source.category}` instead of `{incomeCategoryLabel(source.category).toLowerCase()}`. (Dialog selects keep the full labels — live-matched.)

### T3 — System font + chart typography (F4, part 1) · `fix(theme)`
1. **RED**: none possible for CSS resolution in unit tests — verified by computed-style browser check instead (documented in §E).
2. Change `globals.css` `@theme inline` `--font-sans` from `var(--font-inter)` to the Tailwind default stack `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` (live computed stack). Keep next/font Inter loaded on `<body>` (mirrors live's own Inter @import that is overridden by `font-sans`; the variable stays available but the app renders the system stack like live).
3. Remove `tabular-nums` from the two import-view table cells (F14).

### T4 — Analytics charts to live config (F3, F13, F4 part 2) · `fix(analytics)`
1. **RED**: no pure seam — recharts config is view-level; acceptance via DOM re-diff (grid-vertical groups present, axis-line + tick-line elements present, `dark:stroke-gray-600` on grid lines, `dark:stroke-gray-400` on axis `<g>`, legend icon = line+dot path, lowercase hex) + dark computed-style probe (grid `rgb(75,85,99)`).
2. `analytics-view.tsx` trend chart: `CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-600"` (drop `vertical={false}`); `XAxis`/`YAxis`: `stroke="#64748b"`, `className="dark:stroke-gray-400"`, `tick={{ fill: "#64748b" }}` (drop `fontSize: 12` and `tickLine={false}`/`axisLine={false}`); `Legend` drop `iconType="circle"`; line strokes to `#10b981` / `#ef4444` / `#3b82f6`.
3. Bar chart (Top Spending Categories): same axis/grid treatment (live DOM only evidences the trend chart's axes because the live Overview renders only the trend chart with the current data; the bar chart keeps `horizontal={false}` + hidden axes unless live evidence says otherwise — recheck at re-diff; keep current bar config, align colors to lowercase hex).
4. KPI grid: drop `grid-cols-1` (`grid gap-6 md:grid-cols-3` + `fade-in-up stagger-1` retained).

### T5 — Dialog primitives (F7, F8) · `fix(ui)`
1. **RED**: extend `ui-primitives.test.tsx` with a Dialog block pinning: `DialogTitle` = `text-lg`-free classic set (`font-semibold leading-none tracking-tight`); `DialogContent` base = `relative w-full max-w-2xl rounded-xl border bg-white text-card-foreground shadow dark:bg-gray-800` **without** `max-h-[90vh] overflow-y-auto`.
2. **GREEN**: `dialog.tsx` — remove `text-lg` from DialogTitle; remove `max-h-[90vh] overflow-y-auto` from the base content div.
3. Wire: `add-transaction-dialog.tsx` already passes `max-h-[90vh] max-w-2xl overflow-y-auto` explicitly (live-exact for the full modal). `quick-add-dialog.tsx` (`max-w-md`) and `ai-coach-dialog.tsx` (`flex h-[80vh] max-w-2xl flex-col`) need no extra classes. QuickAdd title `h3` → `text-lg font-semibold text-gray-900 dark:text-white`.

### T6 — Add Expense / Add Income modal details (F9) · `fix(dialogs)`
1. `add-transaction-dialog.tsx`: title icon `Receipt` for expense, `DollarSign` for income (import swap); remove both `DialogDescription` blocks (live renders none); quick-select buttons → `<Button variant="outline" className="…live set…">` with `items-center` (live centers tile content).
2. `categories.ts`: give `QUICK_SELECT_SUBCATEGORIES` its own display labels — `{ id: "rent", label: "Rent/Mortgage", emoji: "🏠" }` etc. — while `SUBCATEGORIES` keeps `{ id: "rent", label: "Rent" }` (the live subcategory select shows "Rent"; the tile shows "Rent/Mortgage" — live-verified).
3. `applyQuickSelect` pre-fills the expense **description** with the tile label (live behavior: tapping "Groceries" sets description "Groceries").
4. **RED first** in `categories.test.ts`: pin the quick-select display labels ("Rent/Mortgage", "Groceries", "Utilities", "Transportation", "Healthcare") and that every quick-select id resolves to a real SUBCATEGORIES entry.

### T7 — AI Coach live anatomy (F10) · `fix(ai-coach)`
1. Content wrapper: add `div className="flex min-h-0 flex-1 flex-col p-6 pt-0"` around [ScrollArea + quick-questions + form]; ScrollArea `className="flex-1 pr-4"`; quick-questions wrapper `mt-4 mb-4`; form `mt-4` with `flex gap-2` (no `items-center`).
2. Remove the header `DialogDescription`.
3. Bubbles: user → `flex gap-3 justify-end` > `max-w-[85%] flex flex-col items-end` > `rounded-2xl px-4 py-2.5 bg-slate-800 dark:bg-slate-600 text-white` > `p.text-sm.leading-relaxed`; assistant → avatar tile (drop `shrink-0`) + `max-w-[85%]` > bubble `rounded-2xl px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600` > prose wrapper (`text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`) > `p.my-1.leading-relaxed.text-slate-700.dark:text-slate-300` rendering markdown (react-markdown — already a dependency).
4. Quick-questions label → `text-sm text-gray-600 dark:text-gray-400 mb-2`; chips → `<Button variant="outline" className="h-8 rounded-md px-3 text-xs">`.
5. Send button → default variant (drop the `bg-primary-sage` override; clone `--primary` = emerald-600 oklch ≈ `#059669` — visually identical to live's `bg-primary`).
6. Remove the visible "AI is thinking…" bubble (live renders nothing while waiting — verified); keep the sending guard.

### T6b — Live default date check (validation note)

The live Add Expense form's default date rendered `2026-09-15` during the probe (UTC "today" at probe time) — consistent with a server/UTC-local date default, not a parity defect. The clone's local-date default stays.

### T12 — Tailwind v3 palette pin (F15) · `fix(theme)`

1. Generated the used-token inventory (`rg` over `src/`, 170 utility instances → 102 unique `(family, step)` pairs across amber/blue/cyan/emerald/gray/green/indigo/neutral/orange/purple/red/slate/violet/yellow).
2. Emitted `--color-<family>-<step>: <v3 hex>` for each into an unlayered `:root` block in `globals.css` (script: `scripts/gen_palette_pin.py` outside the repo; the block itself is committed).
3. Cascade rationale: unlayered author CSS beats Tailwind v4's `@layer theme` definitions and its `@supports (color:lab())` progressive-enhancement re-definitions, so the pin wins without `!important` and without touching the Tailwind config.
4. Verified post-build in the browser: dark grid stroke `rgb(75,85,99)`, axis `rgb(156,163,175)`, blue KPI gradient `rgb(59,130,246) → rgb(37,99,235)` — all exactly matching the live probes.
5. Interaction with existing dark overrides: the unlayered `.dark .text-gray-N` slate-mapped text overrides keep winning over layered utilities (live probed: label `text-gray-600 dark:text-gray-400` computes `rgb(148,163,184)` on BOTH apps); `dark:bg-gray-600` on `bg-white` circles keeps resolving to `rgb(30,41,59)` via the `.dark .bg-white` override on both apps.

### T8 — Mobile drawer bottom (F5) · `fix(sidebar)`
1. `sidebar.tsx` mobile drawer: replace `space-y-3 …` + SyncedBadge + UserMenu with the live Sign Out block (`p-4 border-t border-slate-700/30` + outline button `w-full text-white border-slate-600 hover:bg-white/10 hover:text-white` + `LogOut w-4 h-4 mr-2` + "Sign Out"). Desktop sidebar bottom keeps SyncedBadge + UserMenu (live-matched).
2. Menu icon `h-4 w-4` → `h-5 w-5` (F12).

### T9 — Header/grid/icon class-exact pass (F6, F11, F12) · `fix(views)`
1. `ui-bits.tsx` ViewHeader: render `actions` **directly** (no wrapper) — income/expenses/accounts/investments/goals match live. Analytics keeps a wrapper because live has one: it wraps its actions in its own `div.flex.gap-3.flex-wrap` (live-exact) and ViewHeader renders it as-is (`actionsClassName` prop is removed — analytics owns its wrapper now).
2. Grids: dashboard KPI `+mb-8`; dashboard tiles `grid md:grid-cols-4 gap-6 mb-8` (drop `grid-cols-1`); investments KPI `+mb-8`; goals summary `+mb-8` (all keep `fade-in-up` classes).
3. Header plus icons (accounts/investments/goals): `h-4 w-4` → `h-5 w-5 mr-2` (match income/expenses which are already live-exact).
4. User-menu item icons: add `mr-2` (moon, log-out) — `sidebar.tsx` UserMenu.
5. Investments Total Return icon: `text-emerald-600` → `text-neutral-400 dark:text-neutral-500`.
6. Gradient tile icons (`ui-bits.tsx` GradientTile): drop `text-white` (inherit from tile).

### T10 — Documentation alignment (§D)

### T11 — Verification & ship (§E): gates, browser E2E, DOM re-diff, dark-mode computed checks, commit + push (§F).

---

## C. TDD test inventory (new/updated specs)

| Spec | Change |
|------|--------|
| `dashboard-kpis.test.ts` | + income events carry `category`; activity item exposes it |
| `categories.test.ts` | + quick-select display labels ("Rent/Mortgage" first) resolve to real subcategory ids |
| `ui-primitives.test.tsx` | + Dialog block: DialogTitle without `text-lg`; DialogContent base without `max-h`/`overflow` |
| (existing 98 specs) | must stay green — no weakening |

## D. Documentation updates

- `README.md` — design-system table: typography row → system font stack (live computed), chart config note, test count, round-5 in the verification paragraph.
- `AGENTS.md` — architecture invariants: chart config (grid/axis/dark classes, lowercase hex), dialog title/content class rules, system-font note, mobile drawer bottom, income badge text rule.
- `CLAUDE.md` — parity contracts list + typography correction.
- `Project_Architecture_Document.md` — v1.4: ADR-016 (system-font parity: computed-style ground truth beats declared intent), ADR-017 (live chart configuration), ADR-018 (Tailwind v3 palette pin), round-5 record, §5/§7/§10/§11 refresh.

## E. Verification plan

1. Gates: `bun run lint` (0) · `bun run typecheck` (0) · `bun run test` (all green, ≥ 98 + new specs) · `bun run build` (0).
2. Browser E2E (agent-browser, prod build served via `next start`): login (valid + invalid), all 9 views light + dark, Recent Activity income badge shows "primary"-style colored text, income card badge "primary", Add Expense modal (receipt icon, no description, centered quick-select tiles, "Rent/Mortgage"), Add Income modal (dollar-sign icon), FAB Quick Add round-trip, AI Coach (markdown reply, slate user bubble, outline chips, default send button), analytics (vertical grid lines, axis lines, dark grid gray-600), mobile drawer (390×844: Sign Out button, menu icon size), user menu (mr-2 icons), zero console errors.
3. Computed-style checks: root `font-sans` resolves to the system stack on h1/button/chart ticks (matching live's computed values); chart tick fontSize 16px; dark grid stroke `rgb(75,85,99)`.
4. DOM re-diff: re-capture all 9 clone views; only-live/only-clone signature counts reduced to documented deltas (infra, a11y, lucide artifacts, framer wrappers, data counts).
5. VLM-style side-by-side spot check on dashboard/expenses/analytics (theme-matched, scroll-top).

### E.9 Results (2026-09-16, executed)

- Gates: lint 0 · typecheck 0 · **101/101 tests** (98 + 3 new round-5 specs) · build 0 — all green after every stage including the palette pin.
- Browser E2E: **36/36 checks passed** (`scripts/e2e_round5.py`, prod build): login valid+invalid, system-font stacks on h1/button, income activity badge "primary", Add Expense modal (Receipt icon, 0 description paragraphs, Rent/Mortgage tile with items-center, description pre-fill, subcategory select "Rent"), Add Income (DollarSign), Quick Add (title `text-lg font-semibold text-gray-900 dark:text-white`, content without max-h/overflow, income category step live-matched), AI Coach (label/chips/slate user bubble/prose wrapper/prose p), charts (vertical+horizontal grid, axis+tick lines, `dark:stroke-gray-600`, `dark:stroke-gray-400`), dark mode (grid `rgb(75,85,99)`, tick fill `rgb(100,116,139)`), user menu icon mr-2, mobile drawer at 390×844 (container, Sign Out button classes, log-out icon `mr-2 h-4 w-4`, no Synced badge, no user email), menu icon `h-5 w-5`.
- Palette pin verification: dark grid `rgb(75,85,99)` ✓, axis g `rgb(156,163,175)` ✓, blue gradient `rgb(59,130,246)→rgb(37,99,235)` ✓ — all equal to the live probes.
- DOM re-diff (all 9 views): every remaining delta classifies into the documented buckets — infra (scripts/body/route-announcer/style: 36), a11y attribute additions (aria-label/aria-current/type=button: 11+, incl. truncated-tail button signature pairs), lucide dual-class artifacts (5+), live's duplicated toaster viewport (9), and seed-data count differences (115; e.g. 4 income cards vs live's 1 — button class sets verified identical, only counts differ). No unexplained deltas remain.

## F. Commit grouping (Conventional Commits, atomic)

1. `test: pin round-5 seams (income activity category, rent label, dialog class sets)`
2. `fix(dashboard): carry income category into Recent Activity badges`
3. `fix(income): render raw category id on source card badges`
4. `fix(theme): render the live app's effective system font stack`
5. `fix(analytics): live chart config — grid/axis lines, dark grid colors, default legend`
6. `fix(ui): dialog title/content class sets to live-exact`
7. `fix(dialogs): add-expense/add-income modal live details (icons, description, tiles)`
8. `fix(ai-coach): live chat anatomy (slate user bubble, prose markdown, outline chips)`
9. `fix(sidebar): mobile drawer Sign Out + live icon sizes`
10. `fix(views): header/grid/icon class-exact pass`
11. `fix(theme): pin the Tailwind palette to the live app's v3 values`
12. `docs: align documentation with round-5 parity remediation`

## G. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| System-font change alters every surface | It is the live app's computed truth (probed on h1/button/chart); VLM spot-check before/after; docs updated to record the rationale |
| Removing DialogContent `max-h`/`overflow` could clip long dialogs | Add Expense (the long one) keeps its explicit `max-h-[90vh] overflow-y-auto` (live-exact); Quick Add/AI Coach are short/fixed-height |
| `className` on CartesianGrid propagating to lines | Verified against recharts 2.15.4 source: `SVGElementPropKeys` includes `className` → `filterProps` spreads it onto each `<line>`; dark-mode computed probe confirms |
| prose markdown in AI Coach (new dependency usage) | react-markdown is already a committed dependency; rendering is server-model output (trusted), no user HTML injection |
| Legend default icon change | Live DOM shows the line+dot path icon; drop `iconType="circle"` and re-verify in the re-diff |
