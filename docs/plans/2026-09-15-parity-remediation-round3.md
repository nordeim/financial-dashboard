# Finara Clone — Parity Remediation Plan (Round 3)

**Date:** 2026-09-15
**Goal:** Pixel-faithful visual and functional parity with `https://finara-c636f309.base44.app` by adopting the source app's exact design language (verified via live DOM extraction), closing all remaining structural gaps found in the round-3 audit.
**Method:** TDD for new pure mapping modules; class-exact restyle of every view against captured live DOM (`audit/round3/live-dom/*.html`); browser-verified parity per view; all four gates (vitest / lint / tsc / build) green before push.
**Source of truth:** live DOM dumps + stylesheets captured 2026-09-15 (`audit/round3/live-dom/`, `audit/round3/live-styles.css`), live behavioral probes (goal/account/investment test-data creation + deletion on the live app).

---

## Round-3 audit findings (all live-verified)

### A. Design-system drift (the clone approximates; the live app is exact)

| Element | Live (verified) | Clone (current) |
|---|---|---|
| Page background | `bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800` + `transition-colors duration-300` | flat `bg-slate-100 dark:bg-zinc-950` |
| Card surface | `rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg` (+ `card-hover`) | `bg-white border-none shadow-sm dark:bg-slate-800` |
| Dark palette | gray-800/gray-700/gray-600 overrides via CSS (`--primary-navy` etc.) | slate-800/slate-700 oklch vars |
| Headings | `text-3xl lg:text-4xl font-bold text-primary-navy dark:text-white` | `text-2xl sm:text-3xl text-slate-900` |
| Secondary text | `text-neutral-600 dark:text-neutral-400` | `text-slate-500` |
| Primary buttons | `bg-primary-sage (#059669) hover:bg-primary-sage/90 text-white shadow-lg` | `bg-emerald-500 hover:bg-emerald-600` |
| Sidebar | vertical `sidebar-gradient` (#1e293b→#334155 light / #0f172a→#1e293b dark), nav items `px-4 py-3 rounded-xl text-base`, active = `bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30 backdrop-blur-sm` | flat #0f172a, `px-3 py-2.5 rounded-lg text-sm`, active = `bg-emerald-500/15 text-emerald-300` + inset bar |
| Icons (sidebar) | layout-dashboard / trending-up / trending-down / landmark / **wallet** / **download** / **chart-pie** / **target** / settings | chart-line / ✓ / ✓ / ✓ / chart-column / upload / sparkles / piggy-bank / ✓ |
| Logo | `lucide-dollar-sign` in emerald rounded-lg | `lucide-wallet` |
| User area | `p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm`, avatar `w-8 h-8 bg-muted` | `rounded-lg px-2 py-2 hover:bg-white/5`, avatar `bg-emerald-600` |
| Font | Inter 400–800 (Google Fonts import) | Inter (same, verify weights) |
| Animations | framer-motion entrance (staggered fade/slide) on every section | none |

### B. Structural gaps

1. **FAB**: live has `fixed bottom-6 right-6 z-50` `w-14 h-14 rounded-full bg-primary-sage shadow-xl` plus-icon FAB on **Dashboard and Expenses** — clone has none.
2. **Add Expense is a CENTERED MODAL** (`max-w-2xl`, overlay `bg-black/50 flex items-center justify-center p-4`), NOT a right-side Sheet — clone uses Sheet.
3. **Dashboard layout**: AI Insights lives in the right column **stacked under Recent Activity** (`grid lg:grid-cols-3 gap-8`, Budget = col-span-2) — clone renders AI Insights full-width below. Quick Actions = bottom, `grid-cols-2 md:grid-cols-4 gap-4`, h-16 flex-col icon+label buttons linking to /Income /Expenses /Goals /Analytics — clone has icon-tile buttons with sub-text that open dialogs.
4. **KPI trend chips**: live always renders `trending-up` icon + `text-emerald-500` (even for −3.1%) — clone colors by sign. Savings Progress card has NO trend chip.
5. **Action tiles**: gradients `from-orange-500 to-orange-600`, `from-cyan-500 to-cyan-600`, `from-blue-500 to-blue-600`, `from-purple-500 to-purple-600` (clone: orange-400→600 to-br, cyan→teal, blue→indigo, purple→fuchsia); icon circles `w-16 h-16 bg-white/20 rounded-full` with `w-8 h-8` icons; only tiles 3–4 are links (clone makes all 4 clickable).
6. **Recent Activity rows**: `p-3 rounded-lg bg-neutral-50/50` background, icon circle `w-10 h-10 bg-white` with `arrow-up-right`/`arrow-down-left` icons (NOT emoji), solid `bg-green-100 text-green-800` category badges, amount in `text-right` block — clone: emoji circles, no row bg, plain text meta.
7. **Budget rows**: colored dot `w-3 h-3` (needs `bg-blue-500`, wants `bg-purple-500`, savings `bg-emerald-500`) + `circle-check-big` emerald icon + `h-2` bar with `bg-primary` fill + footer `justify-between` — clone: no dots/check, h-2.5 bar with per-category fills, footer inline.
8. **Income view**: hero card = `bg-gradient-to-r from-emerald-500 to-emerald-600` p-8, `text-4xl` value, `w-20 h-20` icon circle, "From N active sources" — clone: plain white card. Cards: grid `md:grid-cols-2 lg:grid-cols-3`, icon tile `w-12 h-12 bg-emerald-100 rounded-xl` + `dollar-sign` icon, solid emerald category badge, amount `text-2xl` + `📊` frequency right, `border-t` divider + "Monthly equivalent" + `text-lg font-semibold text-primary-sage` — clone: 2-col, emoji circle, slate pills, inline equivalent.
9. **Expenses view**: summary = gradient red Total card + 3 category cards with colored dots (blue/purple/emerald) + `capitalize` labels + `text-xl` values; search `h-9 pl-10` + Filters button `bg-blue-50 border-blue-200` + count badge `bg-blue-500 text-white rounded-full w-5 h-5`; Expense History header with icon + Tabs `grid w-full grid-cols-4` segmented control; rows `p-4 bg-neutral-50/50 rounded-xl` with checkbox, emoji tile `w-10 h-10 bg-white rounded-lg shadow-sm`, amount `text-lg font-bold text-red-600` (plain hyphen `-$4.50`), category badge `bg-purple-100 text-purple-800 border-purple-200` + subcategory bordered text-only badge, date with calendar icon, edit/delete `w-8 h-8` (pen hover:text-blue-600 / trash hover:text-red-600).
10. **Accounts view**: grid `md:grid-cols-2 lg:grid-cols-3`; card `h-full flex flex-col` — icon tile `w-12 h-12 bg-blue-100 text-blue-600 rounded-xl` with type icon (**checking/savings=banknote? verified: checking=banknote, savings=landmark, credit-card=banknote, investment=building, other=building**); Balance block at bottom (`flex-grow justify-end`): "Balance" `text-xs`, value `text-3xl font-bold`, "Last updated: MM/dd/yyyy", Import Transactions outline button `w-full mt-4` wrapped in `<a href="/Import">`.
11. **Investments view**: KPI cards = blue gradient Portfolio Value (`text-3xl`) + emerald gradient Total Gain/Loss + white Total Return (`text-emerald-600`); holdings `grid lg:grid-cols-3 gap-8`: table (col-span-2, headers Symbol/Shares/Avg. Price/Current Price/Market Value/Gain/Loss/Actions, symbol `font-medium` — NO title attr, gain `text-emerald-600`) + **Sector Allocation as a colored-dot LIST** (not donut): `w-3 h-3 rounded-full` dots + `capitalize` name + `font-semibold` %, sorted by share desc. **Sector colors (verified by experiment):** Technology `#3B82F6`, Healthcare `#10B981`, Finance `#8B5CF6`, Energy `#F59E0B`, Consumer `#EF4444`, Industrial `#6B7280`, Real Estate `#06B6D4`, Utilities `#84CC22`, Other `#D1D5DB`.
12. **Goals view**: card icon tile = `w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl` with emoji `text-2xl` — **emoji map (verified): Emergency 🛡️, Vacation ✈️, Home 🏠, Car 🚗, Education 🎓, Retirement 🏖️, Other 🎯** (clone: 🛡️/🏖️/🏠/🚗/📚/🌴/🎯 — three wrong); priority badges **high=`bg-red-100 text-red-800`, medium=`bg-yellow-100 text-yellow-800`, low=`bg-green-100 text-green-800`**; Progress row + `h-2 bg-primary/20` bar with `bg-primary` fill + amounts `justify-between` on separate sides + clock icon + "N days remaining" + "Target: MM/dd/yyyy" + Add Progress `h-8 text-xs w-full` outline button with dollar-sign icon.
13. **Analytics view**: header controls = 2 native date inputs + period Select (`w-32`) + Refresh + Export outline buttons; Tabs `grid-cols-4` (Overview/Expenses/Income/Investments); Overview = trend chart card (h-80, legend Income emerald/Expenses red/Net Savings blue) + avg cards `md:grid-cols-3` (emerald/red/blue gradients, `text-2xl`); Expenses tab = Spending by Category donut + Top Spending Categories bars; **Income tab = EMPTY on live (verified quirk)**; Investments tab = Portfolio Allocation by Sector donut.
14. **Import view**: card `rounded-xl border bg-card shadow` (plain); "Step 1: Upload File" card header; drop area `p-6 border-2 border-dashed rounded-lg text-center` + cloud icon + "Upload a file" `text-indigo-600` label (sr-only input `.csv,.xls,.xlsx`) + "CSV, XLS, XLSX up to 10MB"; "Upload and Extract" `bg-primary` disabled until file. No step-indicator bar in the resting state — clone shows a persistent 3-step progress header (remove).
15. **Settings view**: `max-w-4xl`; Profile Settings (user icon) with currency/date Selects; Notifications (bell icon) — labels `text-base font-medium` + `text-sm text-neutral-500` descriptions; Export Your Data (download icon) — blue info box `bg-blue-50 border-blue-200` + "Export All Data" `bg-blue-600 hover:bg-blue-700 w-full`; Import Data (upload icon) — amber warning box `bg-amber-50 border-amber-200` + file input `accept=".json"`; Your Data Summary (shield icon) — 4 tiles: Protected/Encrypted (green), Synced/Multi-Device (blue), Private/Your Eyes Only (purple), GDPR/Compliant (indigo); "Save Settings" `bg-primary-sage` bottom-right.
16. **Login view**: LIGHT gradient `from-slate-50 to-slate-100`; card `bg-white/95 rounded-2xl shadow-2xl` + `h-1` gradient top strip; **logo image asset** (downloaded to `public/finara-logo.png`) in `h-20 w-20 sm:h-24` circle `ring-4 ring-white/50`; Google button white `rounded-xl py-3.5`; divider "or" lowercase; inputs `h-11 sm:h-12 bg-slate-50/50 border-slate-200 rounded-xl pl-10`; Sign in `bg-slate-900 hover:bg-slate-800 rounded-xl`; **no show-password button**. Clone: dark bg, emerald button, uppercase OR, show-password, wallet icon.
17. **Deletions use native `confirm()`** — live texts: "Are you sure you want to delete this goal?" / "...delete this account?" / "...delete this investment?" (expense/income presumed same pattern). Clone deletes immediately.
18. **AI Coach**: centered modal `max-w-2xl h-[80vh]`, title "AI Financial Coach" + `bot` icon; assistant bubble avatar `h-7 w-7 rounded-lg bg-slate-100` with dot; bubbles `rounded-2xl bg-white border border-slate-200`.
19. **Mobile top bar**: `h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b`; dollar-sign logo w-8 h-8 + "Finara" `text-lg font-bold text-primary-navy`; right = "Synced" badge (wifi icon `w-3 h-3`, `text-green-600 border-green-300`) + theme toggle + menu. Mobile drawer: full-screen `fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900`, items `px-4 py-4 rounded-xl`, icons `w-6 h-6`, labels `text-lg`.
20. **Toast library**: live styles include sonner CSS (`[data-sonner-toaster]`) — optional parity swap; keep current toast if visual close (LOW priority, decide at verification).

### C. Behavioral facts confirmed this round

- Sector Allocation list renders **all sectors that have holdings**, sorted by share desc (ties: most-recent first) — fixed color per sector name (proven by delete-rank experiment: colors do not shift with rank).
- The Add Expense modal opens in **Quick Select mode first** (5 Needs subcategory buttons), then "Or fill manually" swaps to the full form (same modal), with "← Back to Quick Select".
- Quick Add amounts in expense mode: `+ USD1 … + USD500` (verified).
- Budget Overview shows one row per 50/30/20 bucket with expenses; limits may be $0.00 on live (no budgets set) — clone keeps seeded limits (documented round-2 decision).
- Income analytics tab is empty on the live app in BOTH empty and data states — replicate + document as source quirk.
- All dialogs/modals on live are **centered** (Add Expense, AI Coach, goal/account/investment dialogs) — clone must convert Sheet → Dialog everywhere.

---

## Task 0 — TDD: pure UI map modules (RED → GREEN)

**Create:** `src/lib/ui-maps.ts` + `src/lib/__tests__/ui-maps.test.ts`

- `SECTOR_COLORS: Record<SectorId, string>` — the 9 verified hex values.
- `GOAL_EMOJI: Record<GoalCategoryId, string>` — 🛡️ ✈️ 🏠 🚗 🎓 🏖️ 🎯.
- `PRIORITY_BADGE: Record<Priority, string>` — high/medium/low Tailwind classes.
- `ACCOUNT_TYPE_ICON: Record<AccountTypeId, LucideIcon>` — banknote/landmark/banknote/building/building.
- `CATEGORY_DOT: Record<"needs"|"wants"|"savings", string>` — bg-blue-500 / bg-purple-500 / bg-emerald-500.
- `CATEGORY_BADGE` — expense row category badge classes (needs=blue-100/blue-800, wants=purple-100/purple-800, savings=emerald-100/emerald-800 + border variants).

**TDD:** write the test file first asserting every map entry (exact hex strings, exact emoji, exact class fragments) → red → implement → green. Commit `test: add ui-maps unit tests` + `feat: source-exact ui maps (sectors, goals, badges, icons)`.

## Task 1 — Global design system adoption

**Modify:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/finara/finara-app.tsx`, `src/components/finara/ui-bits.tsx`

- globals.css: add `:root`/`.dark` Finara vars (primary-navy, primary-sage, accent-blue, warning-amber, danger-red, success-green, neutrals — exact live values), `.sidebar-gradient` (+dark), `.card-hover` (+hover translate/shadow), `.text-primary-navy/.text-primary-sage/.bg-primary-navy/.bg-primary-sage/.border-primary-sage` utilities, `.dark` gray overrides (`.dark .bg-white` etc.), global `*` transition rule, Inter import already present (verify weights 400–800), keep existing shadcn tokens for the radix primitives.
- finara-app.tsx: root wrapper → `bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300`; main content area → `p-4 lg:p-8` + per-view max-w container classes (7xl dashboard/expenses/analytics/investments, 6xl income/accounts/goals/import, 4xl settings) — implemented via a `pageShellClass(view)` helper or per-view root.
- ui-bits.tsx: restyle `ViewHeader` (h1 `text-3xl lg:text-4xl text-primary-navy`, subtitle `text-neutral-600`, header row `mb-8 gap-4`), `SectionCard` (live card surface + header variants: `text-xl font-bold` for feature cards vs `font-semibold tracking-tight` + icon for list cards), `StatCard` (p-6, `w-12 h-12` gradient tile, always-emerald trend chip, no chip for Savings Progress), `GradientCard` (rounded-2xl p-6, `w-16 h-16` white/20 icon circle, exact 500→600 gradients, optional link), `EmptyState`, `ErrorNote`, `LoadingRows` (skeleton look), `SurplusBadge` (emerald-100 pill with trending-up icon w-3 h-3).
- Commit: `feat: adopt source design system (tokens, cards, gradients, shell)`.

## Task 2 — Sidebar / mobile chrome

**Modify:** `src/components/finara/sidebar.tsx`

- Logo → `DollarSign` in `bg-emerald-500 rounded-lg` (h-10 w-10 desktop / w-8 h-8 mobile bar); nav icons → LayoutDashboard/TrendingUp/TrendingDown/Landmark/Wallet/Download/ChartPie/Target/Settings; item classes → `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-base` + active `bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30 backdrop-blur-sm` / inactive `text-slate-300 hover:bg-white/10 hover:text-white`.
- Sidebar container → `sidebar-gradient` class (CSS gradient).
- User area → `p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm w-full text-left`, avatar `w-8 h-8 rounded-full bg-muted` + dark:text; name `text-sm font-medium text-white`; email `text-xs text-slate-400`.
- MobileTopNav → `h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-gray-700`; right side: Synced badge (`wifi` icon w-3 h-3, `text-green-600 border-green-300` / dark green-400/600) + moon/sun + menu.
- Mobile drawer → full-screen `fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900` + `pt-20`, items `px-4 py-4 rounded-xl` with `w-6 h-6` icons + `text-lg` labels, same active pill; user block + Sign Out at bottom.
- Commit: `feat: sidebar and mobile chrome parity (icons, gradient, pills, synced badge)`.

## Task 3 — Dashboard parity

**Modify:** `src/components/finara/dashboard-view.tsx`, `ui-bits.tsx`

- KPI grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8`; StatCard per live anatomy; trend chip always `TrendingUp` + emerald (mirror live quirk); Savings Progress without chip; tiles emerald/red/blue/purple `to-*-600` gradients.
- Action tiles: exact gradients (orange/cyan/blue/purple `from-X-500 to-X-600`), `w-16 h-16` circles, w-8 icons, rounded-2xl p-6; only Bank Sync + Portfolio are links.
- Budget rows: `w-3 h-3` dots (CATEGORY_DOT map) + `CircleCheckBig` emerald icon + `text-sm font-medium` amounts + `h-2` bar `bg-gray-200 dark:bg-gray-700` with `bg-primary` fill + footer `flex justify-between text-xs` (`X.X% used` left, `$X remaining` emerald right).
- Recent Activity: rows `p-3 rounded-lg bg-neutral-50/50 dark:bg-gray-700/30 hover:bg-neutral-100/50`; icon circles `w-10 h-10 rounded-full bg-white dark:bg-gray-600` with ArrowUpRight (emerald) / ArrowDownLeft (red); title `font-medium text-neutral-900 truncate`; badges solid (income `bg-green-100 text-green-800`, expense category via CATEGORY_BADGE); date `text-xs text-neutral-500` separate line under badge; amount `font-semibold text-emerald-600`/`text-red-500` in `text-right` block; **amount format `+$X` / `-$X` with plain hyphen** (live uses "-", not "−").
- Layout: `grid lg:grid-cols-3 gap-8` — Budget (col-span-2) + right column stacking Recent Activity + AI Insights; Quick Actions LAST with live button anatomy (`grid-cols-2 md:grid-cols-4 gap-4`, `h-16 flex-col gap-2` outline buttons, icon `w-5 h-5` + `text-sm` label; links to income/expenses/goals/analytics views).
- Add FAB: `fixed bottom-6 right-6 z-50` button `w-14 h-14 rounded-full bg-primary-sage hover:bg-primary-sage/90 shadow-xl` with Plus icon → opens Add Transaction (expense).
- AI Insights card header: `font-semibold tracking-tight flex items-center gap-2 text-primary-navy` + `Brain w-5 h-5`; "Ask AI" outline `h-8 px-3 text-xs` with `MessageCircle` icon (drop the regenerate icon button — live has none).
- Commit: `feat: dashboard pixel parity (tiles, activity, budget rows, FAB, quick actions)`.

## Task 4 — Income view parity

**Modify:** `src/components/finara/income-view.tsx`

- Hero: `rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl` p-8; label `text-emerald-100 text-lg font-medium mb-2`; value `text-4xl font-bold`; sub `text-emerald-100 text-sm mt-2` "From N active sources"; icon circle `w-20 h-20 bg-white/20 rounded-full` + `TrendingUp w-10 h-10`.
- Cards grid `md:grid-cols-2 lg:grid-cols-3 gap-6`; card = live anatomy: `w-12 h-12 bg-emerald-100 rounded-xl` tile + `DollarSign w-6 h-6 text-emerald-600`; title `font-bold text-neutral-900 truncate`; category badge `bg-emerald-100 text-emerald-800` (drop the frequency badge from header); edit `hover:text-blue-600`; amount row: `text-2xl font-bold` + right `📊` + frequency `text-sm text-neutral-500`; divider `pt-3 border-t dark:border-gray-700`; "Monthly equivalent" `text-sm text-neutral-500 mb-1` + value `text-lg font-semibold text-primary-sage`; drop "paused" badge (active switch lives in the dialog only).
- Commit: `feat: income view parity (hero gradient, card anatomy)`.

## Task 5 — Expenses view parity (+FAB)

**Modify:** `src/components/finara/expenses-view.tsx`, `expense-filters-panel.tsx`

- Summary: `grid-cols-1 md:grid-cols-4 gap-6 mb-8`; Total card `bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg` (label `text-red-100 text-sm`, value `text-2xl font-bold`, icon right); category cards: `capitalize` label `text-neutral-600 text-sm`, value `text-xl font-bold`, dot `w-3 h-3` (CATEGORY_DOT).
- Search `h-9 pl-10` + Filters button `h-9 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800` + badge `bg-blue-500 text-white text-xs rounded-full w-5 h-5`.
- Expense History card: header `font-semibold tracking-tight flex items-center gap-2 text-primary-navy` + `Receipt` icon (verify live icon) + count; Tabs → shadcn Tabs `grid w-full grid-cols-4` segmented.
- Rows: live anatomy (checkbox; emoji tile `w-10 h-10 bg-white dark:bg-gray-600 rounded-lg shadow-sm` `text-lg`; title `font-semibold text-neutral-900 truncate`; amount `text-lg font-bold text-red-600 ml-4` with plain hyphen; badges: category `CATEGORY_BADGE` + border variants, subcategory `border dark:border-gray-600 text-xs font-semibold` plain; date with `Calendar` icon `text-xs text-neutral-500`; actions `w-8 h-8`).
- Pagination: keep current implementation (live paginates) but restyle buttons.
- Add FAB (same as dashboard).
- Filters panel: field layout per live (`grid grid-cols-2 md:grid-cols-4 gap-4` selects + min/max + sort row + buttons row `Clear All / Cancel / Apply Filters`).
- Commit: `feat: expenses view parity (summary cards, segmented tabs, rows, FAB)`.

## Task 6 — Accounts view parity

**Modify:** `src/components/finara/accounts-view.tsx`

- Grid `md:grid-cols-2 lg:grid-cols-3 gap-6`; cards `h-full flex flex-col`; header p-6: icon tile `w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl` + ACCOUNT_TYPE_ICON; name `font-semibold tracking-tight text-lg`; bank `text-sm text-neutral-500`; actions `w-8 h-8`.
- Body `p-6 pt-0 flex-grow flex flex-col justify-end`: "Balance" `text-xs text-neutral-500` → value `text-3xl font-bold text-neutral-800 dark:text-neutral-100` → "Last updated: MM/dd/yyyy" `text-xs text-neutral-400 mt-1` → Import Transactions outline button `w-full mt-4` wrapped in link-to-import.
- Commit: `feat: accounts view parity (type icons, balance layout, import link)`.

## Task 7 — Investments view parity

**Modify:** `src/components/finara/investments-view.tsx`

- KPI: `md:grid-cols-3 gap-6 mb-8` — Portfolio Value `from-blue-500 to-blue-600` gradient + `text-3xl` + Wallet icon right; Total Gain/Loss `from-emerald-500 to-emerald-600` + TrendingUp icon; Total Return white card + `text-emerald-600` value + Percent icon.
- Holdings `grid lg:grid-cols-3 gap-8`: table card (col-span-2) with header icon `Wallet` + "Portfolio Holdings"; table columns live-exact; symbol `font-medium` (no title attr); gain cell colored by sign; actions w-8 h-8.
- Sector Allocation card (right): header icon `ChartPie`; rows `flex items-center justify-between` — dot `w-3 h-3 rounded-full` (SECTOR_COLORS inline style) + `capitalize` name + `font-semibold` %; sorted share desc; empty text "No sector data available."
- Commit: `feat: investments parity (gradient KPIs, sector dot list)`.

## Task 8 — Goals view parity

**Modify:** `src/components/finara/goals-view.tsx`, `src/lib/categories.ts` (emoji map)

- Cards grid `md:grid-cols-2 lg:grid-cols-3 gap-6`; header `p-6 pb-4`: tile `w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl` + GOAL_EMOJI `text-2xl`; title `tracking-tight text-lg font-bold truncate`; priority badge PRIORITY_BADGE (lowercase); actions w-8 h-8.
- Body `p-6 pt-0 space-y-4`: Progress row (`text-sm` justify-between: `text-neutral-600` label + `font-medium` value); bar `h-2 bg-primary/20 rounded-full` + `bg-primary` fill; amounts row `flex justify-between text-sm text-neutral-500` (current left, target right — NOT "$X / $Y" single line); days remaining row with `Clock` icon `w-4 h-4` + `text-neutral-600`; "Target: MM/dd/yyyy" `text-xs text-neutral-500`; Add Progress button `h-8 text-xs w-full mt-4` outline + `DollarSign` icon.
- Commit: `feat: goals parity (purple tiles, emoji map, priority badges)`.

## Task 9 — Analytics view parity

**Modify:** `src/components/finara/analytics-view.tsx`

- Header controls: date inputs `h-9 w-auto` + period Select `w-32` + Refresh + Export outline buttons (order: dates, period, Refresh, Export).
- Tabs `grid w-full grid-cols-4` segmented (Overview/Expenses/Income/Investments).
- Overview: trend card (header icon `TrendingUp` + "Income vs Expenses Trend"; h-80 chart; line colors Income `#10B981`, Expenses `#EF4444`, Net Savings `#3B82F6`; legend labels Income/Expenses/Net Savings) + avg cards `md:grid-cols-3 gap-6` gradients emerald/red/blue with `text-2xl` values + icons right.
- Expenses tab: Spending by Category (h-80 donut) + Top Spending Categories (h-80 horizontal bars) — cards with icon headers.
- Income tab: render EMPTY panel (live quirk — document in code comment + AGENTS.md).
- Investments tab: Portfolio Allocation by Sector donut (h-80) using SECTOR_COLORS.
- Commit: `feat: analytics parity (controls, tabs, avg gradients, empty income tab)`.

## Task 10 — Import view parity

**Modify:** `src/components/finara/import-view.tsx`

- Card `rounded-xl border bg-card shadow` (plain surface); "Step 1: Upload File" header (font-semibold tracking-tight, no icon); drop area `p-6 border-2 border-dashed rounded-lg text-center` with cloud SVG + "Upload a file" label `text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer` (sr-only input `.csv,.xls,.xlsx`) + "CSV, XLS, XLSX up to 10MB" `text-xs text-gray-500`; CTA "Upload and Extract" `bg-primary` disabled until file, `Extracting...` state.
- Remove the persistent 3-step progress header (live shows step headings inside the card content only, per-step).
- Keep the 3-step flow + error card shape from round 2 (verify against live step-2/3 screenshots).
- Commit: `feat: import view parity (dashed drop area, step headings)`.

## Task 11 — Settings view parity

**Modify:** `src/components/finara/settings-view.tsx`

- `max-w-4xl`; five cards + Save button per finding A.15: icons user/bell/download/upload/shield; notification labels `text-base font-medium` + descriptions `text-sm text-neutral-500`; GDPR box `bg-blue-50 dark:bg-blue-900/20 border-blue-200` + copy; Export button `bg-blue-600 hover:bg-blue-700 w-full`; import warning `bg-amber-50 dark:bg-amber-900/20 border-amber-200`; data summary tiles with badge pills (green/blue/purple/indigo); Save Settings `bg-primary-sage` aligned right.
- Commit: `feat: settings parity (section icons, info boxes, data summary tiles)`.

## Task 12 — Login view parity

**Modify:** `src/components/finara/login-view.tsx`; **Add:** `public/finara-logo.png` (already downloaded)

- Light gradient background + `bg-white/95 rounded-2xl shadow-2xl` card + `h-1` top gradient strip; logo image in `h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white/50 shadow-lg` (with blur halo); heading `text-2xl sm:text-3xl text-slate-900`; Google button white `rounded-xl px-5 py-3.5 border-slate-200`; "or" divider (lowercase, `bg-white px-3 text-slate-500`); inputs `h-11 sm:h-12 bg-slate-50/50 border-slate-200 rounded-xl pl-10`; Sign in `bg-slate-900 hover:bg-slate-800 rounded-xl h-11 sm:h-12 w-full`; remove show-password button; keep demo-credentials hint (restyle to subdued slate box) + footer links.
- Commit: `feat: login parity (light theme, logo asset, form styling)`.

## Task 13 — Add Transaction modal conversion (Sheet → centered Dialog)

**Modify:** `src/components/finara/add-transaction-dialog.tsx` (+ income/goal edit dialogs in views)

- Container → shadcn Dialog: overlay `bg-black/50`, content `max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800`.
- Expense mode: Quick Select first (`grid grid-cols-2 sm:grid-cols-3 gap-3`, `h-16 flex flex-col gap-1 text-left` buttons: emoji `text-lg` + label `text-xs font-medium`; the 5 Needs subcategories), "Or fill manually" full-width ghost; manual form fields per live (Description placeholder "e.g., Coffee, Train ticket", Amount placeholder "0.00", Quick Add `+ USD1..+ USD500` outline h-9, Category/Subcategory 2-col grid, Date default today, Notes "Any extra details...", recurring switch "This is a recurring expense", "← Back to Quick Select", Cancel + Add Expense `flex-1 bg-primary-sage`).
- Income mode: same centered dialog with round-2 live form (Income Source / Amount + quick add `+ $1.00 ...` / Frequency / Category / Active switch / Cancel + Add Income).
- Edit dialogs (expense/income/goal/account/investment): convert Sheet → centered Dialog with same surfaces.
- Commit: `feat: centered modal dialogs (add/edit transaction, forms)`.

## Task 14 — AI Coach + confirm dialogs

**Modify:** `src/components/finara/ai-coach-dialog.tsx`, delete handlers across views

- AI Coach: centered `max-w-2xl h-[80vh] flex flex-col`; header `Bot` icon + "AI Financial Coach"; message list (assistant avatar `h-7 w-7 rounded-lg bg-slate-100` + dot, bubbles `rounded-2xl bg-white border-slate-200`); input + send at bottom (keep current input if close; verify placeholder "Ask about your finances...").
- Deletions: wrap delete handlers in `window.confirm("Are you sure you want to delete this expense/income source/goal/account/investment?")` — exact live pattern.
- Commit: `feat: ai coach modal + native confirm on deletes`.

## Task 15 — Entrance animations

**Modify:** `globals.css` + view roots (dashboard/income/expenses/... sections)

- CSS-only staggered fade-up: `.fade-in-up { animation: fadeInUp .5s cubic-bezier(.4,0,.2,1) both }` + `@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px) } }` + `animation-delay` utility classes (0/.05s/.1s/...) applied to section wrappers — approximates the live framer-motion entrance without adding a dependency. Respect `prefers-reduced-motion`.
- Commit: `feat: staggered entrance animations (reduced-motion safe)`.

## Task 16 — Full verification pass (Iron Law)

1. `bunx vitest run` → 0 failures (69 existing + new ui-maps tests).
2. `bun run lint` clean; `bunx tsc --noEmit` clean.
3. `bun run build` → exit 0.
4. Browser E2E (agent-browser): login → all 9 views (light + dark) → add expense via Quick Select + manual → edit + confirm-delete (accept confirm) → income add/edit → goal create + Add Progress → account + investment CRUD → filters + pagination → FAB click → AI Coach round-trip → theme persistence → mobile viewport + drawer → console error check (0 errors).
5. VLM side-by-side (theme-matched, scroll-top, full-page): dashboard light/dark, income, expenses, accounts, investments, goals, analytics, import, settings, login, mobile — record verdicts in `audit/round3/verdicts-final/`.
6. Sync sandbox → repo tree (`rsync` src/, public/, prisma/, configs) + repo-side `bun install`, vitest, tsc.

## Task 17 — Documentation alignment

- README.md: design-token table refresh (sage/navy, gradients, card surfaces), new features (FAB, centered modals, confirm deletes), screenshots note.
- AGENTS.md: invariants — "class strings mirror audit/round3/live-dom", ui-maps source of truth, confirm() contract, income-tab quirk.
- CLAUDE.md: parity gates + live-DOM evidence workflow in the six-phase loop.
- Project_Architecture_Document.md: ADR-011 (source-exact design system via CSS vars + utility classes), ADR-012 (centered dialog system), ADR-013 (CSS-only entrance animations), known-issues refresh (income tab quirk, toast library note).
- Commit: `docs: align documentation with round-3 parity remediation`.

## Task 18 — Git push via SSH wrapper

1. Atomic commits per task group (as listed above).
2. Push via `python3 docs/ssh_git_wrapper_v3.py --key-file /home/z/.ssh/finara_deploy --remote git@github.com:nordeim/financial-dashboard.git --branch main` with `PATH=/home/z/.local/bin:$PATH` (ssh shim).
3. Verify: `git ls-remote` shows new HEAD on main.

---

## Out of scope (documented, not fixed)

- Live app's Base44 AI quota errors and stuck "AI is thinking..." — source environment limits, intentionally not replicated.
- Toast library swap to sonner — only if verification shows material visual difference (LOW).
- Live's hardcoded trend chips are mirrored exactly (always emerald TrendingUp) per round-3 DOM evidence; real MoM values still flow through the same chip.
- Login demo-credentials hint — clone-only affordance, retained and subdued.

## Validation addendum (cross-checked against the codebase, 2026-09-15)

- All target files exist: `src/components/finara/{finara-app,sidebar,ui-bits,dashboard-view,income-view,expenses-view,expense-filters-panel,accounts-view,investments-view,goals-view,analytics-view,import-view,settings-view,login-view,add-transaction-dialog,ai-coach-dialog}.tsx` ✓ (17 components, 5333 LOC).
- `globals.css` currently has NO Finara vars/gradient/card-hover — additions are greenfield. ✓
- `theme.ts` external store works with `document.documentElement` class toggle — compatible with the new `.dark` overrides. ✓
- `ui-bits.tsx` exports ViewHeader/StatCard/GradientCard/SectionCard/SurplusBadge/EmptyState/ErrorNote/LoadingRows — the exact shared components to restyle. ✓
- Tests: 6 spec files, 69 tests — new ui-maps spec joins them under `src/lib/__tests__/`. ✓
- `public/finara-logo.png` downloaded (480×480). ✓
- Live DOM evidence archived at `audit/round3/live-dom/*.html` (14 files) — reference for every class string in this plan. ✓

Plan validated. Execution order: Tasks 0→18 sequential.
