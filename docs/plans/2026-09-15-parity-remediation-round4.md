# Finara Clone — Parity Remediation Plan (Round 4)

**Date:** 2026-09-15
**Goal:** Close the residual visual/structural/behavioral gap with `https://finara-c636f309.base44.app` identified by the fresh round-4 audit: revert the drifted shadcn primitives to the live app's classic class sets, restructure the app shell/sidebar to the live DOM anatomy, implement the live app's new Quick Add FAB flow, and finish the per-view structural details — producing a fully functioning, production-grade, enterprise-polished clone.
**Method:** TDD (failing tests first for every testable seam), class-exact restyles copied from the captured live DOM, all four gates (`lint` / `typecheck` / `test` / `build`) green before push, browser E2E + DOM re-diff + VLM side-by-side as acceptance.
**Source of truth:** `audit/round4/` (outside the repo) — 9 live view DOM captures, modal/drawer/login-error captures, behavioral probes, `diff-report.md`, `EVIDENCE.md`. All live probe data was cleaned up after capture.
**Predecessors:** round-2 plan (`2026-09-15-parity-remediation-round2.md`), round-3 plan (`2026-09-15-parity-remediation-round3.md`).

---

## A. Round-4 audit summary (all live-verified — see audit/round4/EVIDENCE.md)

### A.1 Root causes

| ID | Root cause | Evidence |
|----|-----------|----------|
| R1 | **shadcn primitive snapshot drift** — the clone's `src/components/ui/*` carry the newest shadcn snapshot (`data-slot` attrs, `transition-all`, `focus-visible:ring-[3px]`, `shadow-xs`, `size-9`, Card `flex flex-col gap-6 py-6`, CardHeader grid, Input `dark:bg-input/30`, Checkbox `rounded-[4px]`, Switch `translate-x-[calc(100%-2px)]`, Table `whitespace-nowrap` + `text-foreground` th, Toaster `ol`) while the live app renders the classic sets | every view diff; `diff-report.md` |
| R2 | **App-shell layout chain** — live nests `div.flex > aside + main.flex.flex-1.flex-col.lg:ml-0 > div.flex-1.pt-16.lg:pt-0 > div.gradient.p-4.lg:p-8.min-h-screen > div.max-w-{6,7}xl.mx-auto`; the clone merges these into one gradient root + flat `main` | dashboard/income captures |
| R3 | **Sidebar anatomy** — live nav = `nav.flex-1.px-4.py-6.space-y-2 > a > div[tabindex=0]` (no ul/li, no overflow-y-auto, aside without shrink-0); user name/email are `p` elements; avatar fallback has no text classes; no chevron on the user button; mobile top bar `fixed top-0 left-0 right-0` with solid emerald logo tile and `w-8 h-8 text-gray-700 dark:text-gray-300` icon buttons | dashboard capture |
| R4 | **FAB flow changed on live** — FAB opens a Quick Add chooser (`max-w-md`, overlay z-40) → compact form (description/amount/category for expenses; name/amount/category for income) with Back + Add; submitting creates the row with subcategory "other", default emoji 📋. The Expenses header "Add Expense" still opens the full Quick Select modal (z-50, `max-w-2xl`); row edit still opens the full Edit Expense form; the Dashboard "Add Transaction" button navigates to /Expenses (a-wrapped) | modal captures + probes |
| R5 | **View-level structure gaps** — card titles as plain `div`s with per-view classes; list rows as `div`s (not li); badges as classic Badge `div`s (with `hover:bg-secondary/80` + focus ring classes); icon circles without `shrink-0`; income view icon tiles/titles/badges without dark variants; accounts/goals title class deltas; analytics TabsContent/Input deltas; settings Label/Switch deltas; login error Alert missing | per-view diff sections |

### A.2 Deliberate deltas (keep, document)

- **framer-motion wrapper divs** (`style="opacity:1; transform:none"`) on live — the clone uses CSS `.fade-in-up`/`.stagger-*` (ADR-013). Visually equivalent entrances without the dependency. Accepted.
- **Radix Dialog semantics** — live modals are plain `div` overlays; the clone keeps Radix Dialog for focus-trap/Esc/a11y (ADR-012). The overlay/content class strings will match exactly; `role="dialog"` + `data-state` attributes remain (invisible).
- **Next.js chrome** — `next-route-announcer`, `body.inter-*` font class, script tags. Inherent to the framework.
- **Data-driven counts** — live user data ≠ clone seed data; row counts and repeated signatures differ. Ignored by design.
- **Toaster duplication** — live mounts two nested toast viewports (base44 quirk, one always empty). The clone keeps one.

### A.3 Primitive class-set matrix (live-exact, from captures)

All strings below are copied verbatim from the captured live DOM (class order normalized for readability; the implementation copies the captured order).

**Button** base: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`
variants: default `bg-primary text-primary-foreground hover:bg-primary/90`; destructive `bg-destructive text-destructive-foreground hover:bg-destructive/90`; outline `border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground`; secondary `bg-secondary text-secondary-foreground hover:bg-secondary/80`; ghost `hover:bg-accent hover:text-accent-foreground`; link `text-primary underline-offset-4 hover:underline`.
sizes: default `h-9 px-4 py-2`; sm `h-8 rounded-md px-3 text-xs`; lg `h-10 rounded-md px-8`; icon `h-9 w-9`. No `data-slot`, no `shrink-0`, no `outline-none`/`ring-[3px]`/`shadow-xs`/`has-[>svg]`.

**Card**: `rounded-xl border bg-card text-card-foreground shadow`. **CardHeader**: `flex flex-col space-y-1.5 p-6`. **CardTitle**: plain `div`, per-view classes supplied by callers. **CardDescription**: `text-sm text-muted-foreground`. **CardContent**: `p-6 pt-0`. **CardFooter**: `flex items-center p-6 pt-0`.

**Badge** (renders `div`): base `inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`; default `border-transparent shadow hover:bg-primary/80`; secondary `border-transparent hover:bg-secondary/80`; outline `text-foreground`. Custom per-context classes appended by callers (e.g. `bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300`).

**Input**: `flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`.

**Label**: `text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70` (no flex/gap/select-none).

**SelectTrigger**: `flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1` + size `h-4 w-4` chevron. **SelectContent**: `relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1`; viewport `p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]`; item `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50` + check `absolute right-2 flex h-3.5 w-3.5 items-center justify-center`.

**TabsList**: `inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground`; grid form `grid w-full grid-cols-4` (expenses). **TabsTrigger**: `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow`. **TabsContent**: `mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

**Checkbox**: `peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`.

**Switch** thumb: `pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0` (container per classic set).

**Table**: `w-full caption-bottom text-sm`; thead `[&_tr]:border-b`; tr `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted`; th `h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]`; td `p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]`; wrapper `div.overflow-x-auto > div.relative.w-full.overflow-auto`. No `whitespace-nowrap` anywhere; th is `text-muted-foreground` (NOT text-foreground).

**ScrollArea** root: `relative overflow-hidden` + height from caller (`h-80`), injects the `[data-radix-scroll-area-viewport]` style block; viewport `h-full w-full rounded-[inherit]`; inner sizer `min-width: 100%; display: table`.

**Progress** track: `relative w-full overflow-hidden rounded-full h-2 bg-gray-200 dark:bg-gray-700`; indicator `h-full w-full flex-1 bg-primary transition-all` (translateX hides at 0).

**Alert**: `relative w-full border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground text-foreground`; description `[&_p]:leading-relaxed text-sm text-muted-foreground` (login error overrides: `bg-red-50/70 border-red-200 rounded-xl` + `text-red-700 text-sm`).

**Toast viewport** (div, not ol): `fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]`; toast item per classic set (`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg ...`).

**DropdownMenuContent**: `z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in ...` (+ `w-56` from caller); item `relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0`; destructive item appends `text-red-500 focus:text-red-500` (note: live drops `focus:text-accent-foreground` there); label `px-2 py-1.5 text-sm font-semibold`; separator `-mx-1 my-1 h-px bg-muted`.

**Dialog**: keep Radix; **DialogContent renders as the live overlay**: `fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50` (z-40 for the Quick Add chooser) with the card supplied by callers as `rounded-xl border text-card-foreground shadow w-full max-w-2xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto`; DialogHeader = classic CardHeader pattern; DialogTitle per-view classes; close button ghost `h-9 w-9` X. No separate overlay element.

---

## B. Task list (TDD)

### Task 0 — Evidence + this plan ✅
`audit/round4/` captures + `EVIDENCE.md` + this document.

### Task 1 — TDD: primitive class-set specs (RED)
**Create:** `src/lib/__tests__/ui-primitives.test.tsx`
**Modify:** `vitest.config.ts` — extend `include` to `["src/**/*.test.{ts,tsx}"]` (validated: the current `.ts`-only pattern silently ignores `.tsx` spec files).
Render each primitive with `react-dom/server` `renderToStaticMarkup` and assert:
- exact base class strings (substring anchors for the long sets) for Button (all variants/sizes), Badge, Card family, Input, Label, SelectTrigger, Tabs family, Checkbox, Switch thumb, Table family, ScrollArea, Progress, Alert, Toaster viewport, DropdownMenu item;
- NO `data-slot` attribute on any rendered primitive;
- Badge renders a `div`; Toaster viewport renders a `div` (not ol).
RED (all fail against the newest-shadcn primitives), then GREEN in Task 2.

**Extend** `src/lib/__tests__/ui-maps.test.ts` + `src/lib/ui-maps.ts`:
- `ACTIVITY_BADGE` (recent-activity row badges): income-by-category and expense-by-50/30/20 class strings (green-100 "primary", purple-100 "wants", blue-100 "needs", emerald-100 "savings" + secondary/income categories) — live-exact incl. `hover:bg-secondary/80`.
- `EXPENSE_ROW_BADGE` (category with `border-purple-200` family + subcategory outline family).
- `PRIORITY_BADGE` updated to Badge-based strings (red-100/red-800, yellow-100/yellow-800, green-100/green-800 + hover/focus classes).

### Task 2 — Revert primitives to live-exact class sets (GREEN)
**Modify:** `src/components/ui/{button,badge,card,input,label,select,tabs,checkbox,switch,table,scroll-area,progress,alert,toast,toaster,dropdown-menu,separator}.tsx`
Replace the newest-shadcn implementations with the classic sets from §A.3. Keep Radix behavior, keep `cn()` merging, keep React 19 function components. Remove all `data-slot` attributes. `CardTitle`/`CardDescription` keep their default classes but render as plain divs with caller-supplied classes (callers pass the live-exact strings).

### Task 3 — App shell + sidebar restructure
**Modify:** `src/components/finara/finara-app.tsx`, `src/components/finara/sidebar.tsx`
- Shell: root `div` (gradient, `font-sans`, min-h-screen, transition-colors — no flex) > `div.flex` > `aside.hidden.lg:flex.lg:w-64.lg:flex-col` + `main.flex.flex-1.flex-col.lg:ml-0` > `div.flex-1.pt-16.lg:pt-0` (mobile top-bar offset) > `div.p-4.lg:p-8.min-h-screen` + same gradient classes > per-view `div.max-w-{6,7,4}xl.mx-auto` (move `VIEW_CONTAINER` to this wrapper).
- Sidebar: nav = `a` children (no ul/li), nav item = `div[tabindex=0]` with the live classes, label wrapped in `span`; icons `w-5 h-5` (no shrink-0); aside without `shrink-0`; nav without `overflow-y-auto`/`aria-label`; active state on the div (no `aria-current` on the anchor — keep `aria-current` for a11y? live has none; keep it, invisible).
  - DECISION: keep `aria-current="page"` on the active anchor (a11y > DOM signature; invisible in rendering).
- User area: name/email as `p` elements; avatar fallback span without text classes; remove the chevron svg; DropdownMenuTrigger keeps the live button classes.
- Mobile top bar: `fixed top-0 left-0 right-0 z-50` (replace inset-x-0); solid `w-8 h-8 bg-emerald-500 rounded-lg` logo tile (not the glassy active-pill style); theme/menu buttons = ghost `w-8 h-8 text-gray-700 dark:text-gray-300` (Button size="icon" variant="ghost" + className overrides, classic set from Task 2); remove the `h-16` spacer (the `pt-16` wrapper from the shell now provides the offset).
- Mobile drawer: nav items `py-4`, icons `w-6 h-6`, label `span.text-lg`, a>div anatomy; drawer `lg:hidden fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900` + `div.flex.flex-col.h-full.pt-20`.

### Task 4 — Dashboard view parity
**Modify:** `src/components/finara/dashboard-view.tsx`, `src/components/finara/ui-bits.tsx`, `src/lib/ui-maps.ts`
- KPI StatCard: plain card div (`rounded-xl text-card-foreground p-6 card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg`), `flex items-start justify-between`, label `p.text-sm.font-medium.text-neutral-600.dark:text-neutral-400.mb-1`, value `p.text-2xl.font-bold.text-neutral-900.dark:text-white.mb-3`, trend chip `div.flex.items-center.gap-1` + `svg.w-4.h-4.text-emerald-500` + `span.text-sm.font-medium.text-emerald-500`; icon circle `w-12 h-12 rounded-xl bg-gradient-to-r from-*-500 to-*-600 flex items-center justify-center` (NO shrink-0) + `svg.w-6.h-6.text-white`; Savings Progress has no chip.
- Action tiles: orange/cyan plain divs (`bg-gradient-to-r from-*-500 to-*-600 rounded-2xl p-6 text-white`, no shadow/w-full); blue/purple buttons with `card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-transform w-full`; labels `p.text-*-100.text-sm.font-medium.mb-1` + `p.text-2xl.font-bold.capitalize` + `p.text-*-100.text-lg`; icon circles `w-16 h-16 bg-white/20 rounded-full` + `svg.w-8.h-8`.
- Budget Overview: title `div.tracking-tight.text-xl.font-bold.text-primary-navy.dark:text-white`; surplus Badge (default variant + emerald classes + `trending-up w-3 h-3 mr-1` icon — convert `SurplusBadge` from a span to the Badge component); rows render per budget record (live's single row is a data difference, not a filter — the live user has one budget record); row: dot + `span.font-medium.capitalize` + `circle-check-big w-4 h-4 text-emerald-500` + `span.text-sm.font-medium` amounts; progress track `relative w-full overflow-hidden rounded-full h-2 bg-gray-200 dark:bg-gray-700` + fill `h-full w-full flex-1 bg-primary transition-all` (transform-based: `translateX(-{100-pct}%)`, not width %); footer `span.text-emerald-600.dark:text-emerald-400.font-medium` remaining.
- **Budget limit=0 edge case (live-verified):** `percent(x, 0)` already returns 0; the remaining footer must show "$0.00 remaining" (not "over budget") when `limitMinor === 0` — add a failing spec for the limit=0 row (0.0% used, $0.00 remaining) before fixing the view logic.
- Recent Activity: rows as `div` (no ul/li); icon circle `w-10 h-10 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center text-{emerald,red}-500` (no shrink-0) + `svg.w-5.h-5`; title `p.font-medium.text-neutral-900.dark:text-white.truncate`; meta `div.flex.items-center.gap-2.mt-1` + Badge-div (ACTIVITY_BADGE) + `span.text-xs.text-neutral-500.dark:text-neutral-400` (NO calendar icon); amount `p.font-semibold.text-emerald-600.dark:text-emerald-400` / `p.font-semibold.text-red-600.dark:text-red-400` in `div.text-right`.
- AI Insights: CardHeader title = icon-div (`font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white` + `brain w-5 h-5`) + `div.flex.gap-2` with Ask AI (`h-8 px-3 text-xs` outline + message-circle w-4 h-4) and Refresh (`h-9 w-9` ghost icon button, refresh-cw w-4 h-4, aria-label, triggers insights refetch); body = ScrollArea `h-80` wrapping `div.space-y-4` with the live empty state (`div.text-center.py-8` + `brain w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3` + the two exact lines) or the existing insight cards.
- Quick Actions: plain `div.mt-12.bg-white/80.dark:bg-gray-800/80.backdrop-blur-sm.rounded-2xl.shadow-lg.p-6` (NOT Card, no card-hover) + `h3.text-xl.font-bold.text-primary-navy.dark:text-white.mb-4` + `div.grid.grid-cols-2.md:grid-cols-4.gap-4` + `<a>`-wrapped buttons (outline, `w-full h-16 flex-col gap-2`, per-action hover tint `hover:bg-emerald-50 dark:hover:bg-emerald-900/20` etc., icons `w-5 h-5`, `span.text-sm` labels) → navigate to Income/Expenses/Goals/Analytics views.
- View header: "Add Transaction" = a-wrapped sage button that NAVIGATES to the Expenses view (no modal); Refresh = outline button with `refresh-cw w-4 h-4` + label.
- FAB: opens the new Quick Add dialog (Task 5); icon rotates 45° while open (plus → X look) via a wrapper div `style={{ transform: open ? "rotate(45deg)" : undefined }}` — or CSS class `rotate-45` transition.

### Task 5 — New Quick Add dialog (FAB flow)
**Create:** `src/components/finara/quick-add-dialog.tsx`
- Step 1 chooser: `max-w-md`, overlay z-40; Card `rounded-xl border text-card-foreground shadow bg-white dark:bg-gray-800`; `p-6` body; header `h3.text-lg.font-semibold.text-gray-900.dark:text-white` "Quick Add" + ghost `h-9 w-9` X; `p.text-sm.text-gray-600.dark:text-gray-400.mb-4` "What would you like to add?"; two outline `h-12 w-full justify-start gap-3` buttons (Add Income `trending-up w-5 h-5 text-emerald-500`, Add Expense `trending-down w-5 h-5 text-red-500`).
- Step 2 expense: description Input ("Expense description..."), amount number Input (step 0.01, "Amount"), category SelectTrigger (needs/wants/savings; default needs) — all classic sets; footer `div.flex.gap-2.pt-2` with Back (outline) + Add (sage default) buttons.
- Step 2 income: "Income source..." Input, amount, category Select (Primary Income/Secondary Income/Passive Income/Other; default primary), frequency defaults to monthly server-side.
- Submit: POST /api/expenses with `subcategory: "other"` (validated) or POST /api/income; on success close + refresh + toast (clone keeps toasts — deliberate delta, live showed none this round); on failure toast the customer-safe error.
- **TDD:** add API-level note — `subcategory: "other"` must be valid for every category (it is — pinned in categories.test.ts). Add a unit test for a new pure helper `quickAddDraft(kind, form)` in `src/lib/quick-add.ts` if any mapping logic emerges (labels: "Primary Income" etc. → ids).
- The existing `AddTransactionDialog` (full Quick Select + manual + edit forms) remains for the Expenses header button and row edits.

### Task 6 — Income view parity
**Modify:** `src/components/finara/income-view.tsx`
- Hero: Card `bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-xl rounded-xl` + `div.p-8` + `p.text-emerald-100.text-lg.font-medium.mb-2` + `p.text-4xl.font-bold` + `p.text-emerald-100.text-sm.mt-2` ("From N active sources" — keep plural always) + `div.w-20.h-20.bg-white/20.rounded-full` + `trending-up w-10 h-10`.
- Source cards: body plain `p-6` (single wrapper, not Header/Content pair); icon tile `w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center` (NO dark variants) + `dollar-sign w-6 h-6 text-emerald-600`; title `h3.font-bold.text-neutral-900.truncate` (NO dark) + Badge (secondary-based emerald, NO mt-1, no dark) directly under; amount `span.text-2xl.font-bold.text-neutral-900.dark:text-white`; freq chip `div.flex.items-center.gap-1.text-sm.text-neutral-500.dark:text-neutral-400` (emoji + label); `div.pt-3.border-t.dark:border-gray-700` + "Monthly equivalent" rows; edit/delete ghost `w-8 h-8 text-neutral-400 hover:text-blue-600/hover:text-red-600`.
- Header: "Add Income Source" sage button with `plus w-5 h-5 mr-2`.

### Task 7 — Expenses view parity
**Modify:** `src/components/finara/expenses-view.tsx`, `expense-filters-panel.tsx`
- Summary: Total = gradient Card (`from-red-500 to-red-600 text-white border-0 shadow-lg`) + `p.text-red-100.text-sm.font-medium.mb-1` + `p.text-2xl.font-bold` + `trending-down w-8 h-8 text-red-200` (no circle); category cards = white Card (card-hover) + `p.text-neutral-600.dark:text-neutral-400.text-sm.font-medium.mb-1.capitalize` + `p.text-xl.font-bold` + `div.w-3.h-3.rounded-full.{bg-blue-500|bg-purple-500|bg-emerald-500}`.
- Search: bare on page (no card) — classic Input with `pl-10` + `search` icon absolutely positioned; Filters button: `bg-blue-50 border-blue-200 ...` + count badge `bg-blue-500 text-white rounded-full w-5 h-5` (keep documented badge-count quirk).
- Expense History: Card WITHOUT card-hover; CardHeader with icon-title (`font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white` + `receipt w-5 h-5`) + Tabs (grid-cols-4 TabsList) INSIDE the header; CardContent `p-6 pt-0`.
- Rows: old Checkbox; emoji tile `w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center shadow-sm` (no shrink-0) + `span.text-lg`; title `h3.font-semibold.text-neutral-900.dark:text-white.truncate`; amount `p.text-lg.font-bold.text-red-600.dark:text-red-500.ml-4`; category Badge (purple-100 family + `border-purple-200` + dark + `hover:bg-secondary/80`); subcategory outline Badge (`text-foreground`, `dark:border-gray-600`); date `div.flex.items-center.gap-1.text-xs.text-neutral-500.dark:text-neutral-400` + `calendar w-3 h-3` + span; edit/delete ghost `w-8 h-8` classic.
- Header "Add Expense" button: opens the existing full AddTransactionDialog (Quick Select) — already correct; icon `plus w-5 h-5 mr-2`.

### Task 8 — Accounts view parity
**Modify:** `src/components/finara/accounts-view.tsx`
- Card keeps `card-hover h-full flex flex-col`; CardHeader classic + `flex flex-row items-start justify-between` override (caller className); account title `div.font-semibold.tracking-tight.text-lg` (NO color classes); institution `p.text-sm.text-neutral-500.dark:text-neutral-400`; icon tiles keep dark variants; balance block `p-6 pt-0 flex-grow flex flex-col justify-end` + `p.text-3xl.font-bold.text-neutral-800.dark:text-neutral-100` + "Last updated" `p.text-xs.text-neutral-400.dark:text-neutral-500.mt-1`; Import Transactions button wrapped in an anchor that navigates to the Import view (`<a>` semantics — use a button with onClick navigation styled outline classic + `w-full mt-4`); edit/delete classic ghost.

### Task 9 — Investments view parity
**Modify:** `src/components/finara/investments-view.tsx`
- KPI cards: gradient Cards (`border-0 shadow-lg`) with `p-6` bodies; icons `w-12 h-12 text-blue-200`/`text-emerald-200` rendered directly (no circle wrapper); labels `p.text-blue-100.text-sm.font-medium.mb-1` / `p.text-sm.font-medium.mb-1.text-emerald-100`; values `p.text-3xl.font-bold`.
- Holdings: title icon-div + `wallet w-5 h-5`; classic Table (Task 2 covers classes; verify th rendering = `text-muted-foreground`); symbol cell `font-medium`; gain cells `text-emerald-600`.
- Sector Allocation: title icon-div + `chart-pie w-5 h-5`; rows `div.flex.items-center.justify-between` > `div.flex.items-center.gap-2` + `div.w-3.h-3.rounded-full` with **inline style backgroundColor** (SECTOR_COLORS hex → `rgb(r, g, b)`) + `span.capitalize` (no color classes) + `span.font-semibold.text-neutral-900.dark:text-white`.
- Header "Add Investment": sage button + `plus w-5 h-5 mr-2`.

### Task 10 — Goals view parity
**Modify:** `src/components/finara/goals-view.tsx`
- Card title `div.font-bold.text-lg.text-neutral-900.dark:text-neutral-100.tracking-tight.truncate` (add tracking-tight); priority badges → Badge-divs (PRIORITY_BADGE from Task 1); progress track `relative w-full overflow-hidden rounded-full bg-primary/20 h-2` + fill `h-full w-full flex-1 bg-primary transition-all`; clock row `div.flex.items-center.gap-2.text-sm` + `clock w-4 h-4 text-neutral-400` + `span.text-neutral-600.dark:text-neutral-300`; Target line `div.text-xs.text-neutral-500.dark:text-neutral-400`; edit/delete ghost classic with `dark:hover:text-blue-400` / `dark:hover:text-red-400`; Add Progress outline `h-8 text-xs w-full` + `dollar-sign` icon.

### Task 11 — Analytics view parity
**Modify:** `src/components/finara/analytics-view.tsx`
- Classic TabsContent (`mt-2 ring-offset-background focus-visible:...` + `space-y-8`); date Inputs classic (`w-auto`); Refresh outline + `refresh-cw w-4 h-4`; Export outline + `download w-4 h-4`; period Select `w-32`; calendar icon on From/To labels? (live shows `svg.lucide-calendar` 1x — verify placement during implementation from the capture); chart cards keep recharts; Income tab stays empty (documented quirk).

### Task 12 — Import view parity
**Modify:** `src/components/finara/import-view.tsx`
- Upload label: classic Label + `cursor-pointer font-medium hover:text-indigo-500 leading-none text-indigo-600 text-sm` (full string from capture); file input classic Input + `sr-only`; card title = div (not h2); keep the 3-step flow.

### Task 13 — Settings view parity
**Modify:** `src/components/finara/settings-view.tsx`
- Card titles → icon-divs (5x); Labels classic (`text-base` for main labels, `text-sm` for switch rows — live has both variants); Switch classic (thumb `h-4 w-4 ... translate-x-4 ... shadow-lg`); amber warning box uses `triangle-alert`; file input row shows `file-text` icon; keep info boxes + tiles + Save Settings sage button.

### Task 14 — Login view parity (error state)
**Modify:** `src/components/finara/login-view.tsx`
- Render the error state (currently set but never rendered — genuine bug): classic Alert + AlertDescription with `bg-red-50/70 border-red-200 rounded-xl` + `text-red-700 text-sm`, message "Invalid email or password", placed between the form fields and the submit button (per capture).
- Labels classic set with `text-slate-700`; keep the round-3 login card structure.

### Task 15 — Verification pass (acceptance)
1. `bun run lint && bun run typecheck && bun run test` — 0 / 0 / all green (76 existing + new primitive/ui-maps tests).
2. `bun run build` — exit 0.
3. Browser E2E (agent-browser, both themes): login (valid + invalid → error alert), all 9 views, FAB → Quick Add → expense + income round-trips (clean up test rows), Expenses header → Quick Select full flow, row edit + confirm-delete, filters + pagination, AI Coach, dark-mode persistence + reload, mobile drawer, zero console errors.
4. DOM re-diff acceptance: re-capture clone DOM, re-run `scripts/dom-diff.py`; per-view only-live counts must drop to ~0 after excluding documented deliberate deltas (framer wrappers, Radix attrs, Next chrome, data counts). Record before/after table.
5. VLM side-by-side spot-check (theme-matched) on dashboard/expenses/settings — scores ≥ 85 with data differences excluded.

### Task 16 — Documentation alignment
**Modify:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `Project_Architecture_Document.md`
- PAD → v1.3: ADR-014 (Quick Add FAB flow, live-verified 2026-09-15), ADR-015 (shadcn primitive class-set policy: primitives are pinned to the live app's classic sets — do not "upgrade" shadcn primitives), updated §5 design system (classic primitive classes), §7 test counts, §10 known issues, §11 key files.
- README: features table (Quick Add FAB), test count, file hierarchy.
- AGENTS.md: commands (test count), invariants (primitive class-set pinning, FAB flow, budget limit=0 footer semantics, activity badges, no-calendar-icon activity dates), quirks (live shows no toast on add/delete — clone keeps toasts as deliberate delta).
- CLAUDE.md: workflow + parity contract updates.

### Task 17 — Commits + push
Atomic Conventional Commits, `main` only, via `docs/ssh_git_wrapper_v3.py` with the externally-supplied key. Suggested grouping:
1. `test: pin live-exact shadcn primitive class sets + ui-maps extensions (round 4)`
2. `feat: revert shadcn primitives to live-exact classic class sets`
3. `feat: restructure app shell and sidebar to live DOM anatomy`
4. `feat: quick add dialog for the FAB flow (live parity)`
5. `feat: dashboard round-4 parity (KPI cards, budget rows, activity, AI insights, quick actions)`
6. `feat: per-view round-4 parity (income/expenses/accounts/investments/goals/analytics/import/settings/login)`
7. `fix(login): render the invalid-credentials error alert`
8. `docs: align documentation with round-4 parity remediation`

---

## C. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Primitive revert breaks view styling that depended on newest classes (e.g. `has-[>svg]:px-3` button padding) | Views pass explicit width/padding classes at call sites (live does the same); verify each view in the browser pass; the primitive specs pin the strings |
| Dialog overlay refactor (content-as-overlay) breaks focus/Esc | Radix Content keeps focus trap + Esc; E2E exercises open/close/submit per dialog |
| Removing `shrink-0` from icon wrappers causes flex squashing | Matches live rendering exactly (live has no shrink-0 and renders correctly); verify visually |
| Budget row semantics change | Validation: rows render per budget record in both apps (live's single row is a data difference) — no filter is added; the 50/30/20 progress semantics stay. Only the limit=0 edge case (0.0% used, $0.00 remaining) changes, guarded by a new spec |
| `subcategory: "other"` quick-add rows look different from seeded data | Matches live behavior exactly (live saves "other" + 📋); document in AGENTS.md |
| Tailwind v4 CSS-first tokens vs classic classes (e.g. `shadow-sm` vs `shadow-xs` naming) | Tailwind v4 still generates `shadow-sm`; the design tokens in `globals.css` remain authoritative; spot-check computed styles in the browser pass |

## D. Out of scope (documented, not fixed this round)

- Real authentication (top backlog item, PAD §10).
- CI pipeline, Playwright E2E layer, prisma migrate adoption (backlog).
- Toast behavior change (live showed no toasts this round; clone keeps them — deliberate, reversible).
- framer-motion wrappers / sonner toast swap / `tailwind.config.ts` deletion (LOW backlog).

---

## E. Execution & verification record (2026-09-16)

### E.1 Residual-fix pass (post main implementation)

Additional live-exact fixes applied after the first re-diff, all traced to the
round-4 captures:

1. **FAB toggle + rotation** (dashboard + expenses): the plus icon now rotates
   45° into an X while the Quick Add chooser is open — `<div style="transform:
   rotate(45deg)">` wrapper around a `w-6 h-6 text-white` Plus, `transform:
   none` when closed (live-exact); clicking the FAB while open closes the dialog.
2. **Classic filter glyph**: modern lucide-react renamed the angular `filter`
   icon to `funnel` (redesigned, rounded). Added `ClassicFilterIcon` (ui-bits)
   rendering the live-exact polygon path for the Expenses Filters button.
3. **Per-view theme-fade quirk**: only the dashboard + expenses content panes
   carry `transition-colors duration-300` on the inner gradient div (the other
   seven live views do not — replicated via conditional in the shell).
4. **ViewHeader anatomies**: with-actions (flex wrapper), no-actions compact
   (`div.mb-8 > h1+p` — settings), and bare (`h1 + p.mb-8`, no wrapper — import);
   analytics actions row gains `flex-wrap` on the shared wrapper (no double div).
5. **Dashboard activity circles**: `text-emerald-500`/`text-red-500` moved onto
   the circle div (glyph inherits currentColor) — live-exact.
6. **Import view**: dropzone `rounded-lg`; file input renders the full classic
   Input class set + `sr-only`; hint `p.text-xs.text-gray-500` (no mt-2/dark);
   Upload button `shadow` (default size), no `type` attribute; no view-root div.
7. **Analytics**: chart titles as `div` (not h2); the Income tab renders NO
   content element (live renders only three TabsContent divs).
8. **Goals**: Add Progress button `size="sm"` (h-8 px-3 text-xs, live-exact).
9. **Settings**: Profile/Summary cards split CardContent (`p-6 pt-0`) from the
   grid divs (Profile grid without `grid-cols-1`); toggle labels `text-base`;
   select labels `leading-none`; the Protected tile pill carries a shield glyph;
   Save Settings button = default variant + `bg-primary-sage shadow` (not the
   custom shadow-lg/text-white set).
10. **Separator** reverted to the classic class set (pinning policy).

### E.2 DOM re-diff — before/after (only-live signature counts)

| View | Before residual pass | After | Remaining = documented deltas |
|------|---------------------|-------|-------------------------------|
| dashboard | 19 | 17 | 6 framer wrappers, 4 animation-class wrappers, 3 activity-badge data sigs, 3 AI-insights empty-state data sigs, 1 toaster quirk |
| income | 4 | 3 | 2 animation wrappers, 1 toaster quirk |
| expenses | 7 | 6 | 2 framer wrappers, 3 animation wrappers, 1 toaster quirk |
| accounts | 3 | 2 | 1 animation wrapper, 1 toaster quirk |
| investments | 7 | 6 | 3 framer wrappers, 2 animation wrappers, 1 toaster quirk |
| import | 8 | 2 | 1 animation wrapper (card fade-in-up), 1 toaster quirk |
| analytics | 6 | 3 | 2 animation wrappers, 1 toaster quirk |
| goals | 4 | 2 | 1 animation wrapper, 1 toaster quirk |
| settings | 19 | 7 | 5 animation wrappers (stagger cards), 1 framer wrapper, 1 toaster quirk |
| **total** | **77** | **48** | all excluded per §D documented deltas |

Documented deliberate deltas (excluded per plan §D / ADR-013): live's
framer-motion wrapper divs and settled inline styles (clone uses CSS
`.fade-in-up`/`.stagger-*`); the live toaster double-renders its viewport
(base44 quirk — the clone renders it once, correctly); data-driven signature
counts (different transaction/insight/budget contents); clone keeps
confirmation toasts (live showed none this round).

### E.3 Gates

`lint` 0 · `typecheck` 0 · `test` 98/98 (76 pre-round-4 + 22 new) · `build` 0.

### E.4 Browser E2E (agent-browser, production build)

Login error alert ("Invalid email or password") ✓ · login ✓ · FAB → Quick Add
chooser (icon rotates to X) → expense round-trip ✓ · row delete via native
confirm ✓ (verified via API + fresh-mount UI) · all 9 views render ✓ · dark-mode
toggle + reload persistence + light restore ✓ · zero console errors (fresh
buffer) ✓.

### E.5 VLM side-by-side (theme-matched, data differences excluded)

- Dashboard: **95/100** (flagged items: budget-row/activity/insights data
  differences; QA buttons DOM-verified class-identical)
- Expenses: **98/100** (flagged items: pagination + counts = data; tab position
  DOM-verified identical)
- Settings: **100/100**

All ≥ 85 as required by Task 15.5.
