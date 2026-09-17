# Round-7 Parity Remediation Plan — Dialog Form-Body Matrix, Icon Class Order, User-Menu Anatomy

**Date:** 2026-09-17
**Base:** `6fc5e20` (main, round-6 complete; gates: lint 0 / tsc 0 / 122 tests / build 0 — re-verified before audit)
**Auditor method:** live login → targeted captures of the surfaces rounds 2–6 never fully opened (user dropdown menu, open Select listboxes, per-dialog FORM BODIES incl. today's edit-expense/edit-goal/edit-investment/edit-account/edit-income captures, Analytics 4-tab DOMs, Settings DOM, toast re-probe) → signature-multiset diff vs clone → raw-HTML structure analysis. Evidence archive: `/home/z/my-project/captures/` (`r7-live-*.txt`, plus the round-6 `live-*.txt` re-analyzed with finer probes).

## §A Audit summary

Round 6 pinned the tokens, radii, blurs, and dialog HEADER anatomy — but its per-dialog matrix stopped at the header/body-wrapper level. This audit opened every dialog's FORM BODY and the user dropdown, and found: (1) a systemic icon-class ORDER delta (visually identical, but a class-exact violation across ~230 instances), (2) the user-menu item/trigger anatomy deltas, (3) a per-dialog form-body matrix of gaps, chips, switch rows, button rows, submit styles/labels, field wrappers and label ids that the clone never aligned — the income-edit dialog still carries a pre-round-4 slate/emerald chip design and a bordered Active box that live does not render.

Structure-level parity elsewhere held up: Analytics 4 tabs, Settings, open Select listboxes, Select triggers, the Quick Add chooser, and the toast no-op (re-probed) all matched or fell into documented buckets.

## §B Findings

### Systemic

**F1 — lucide icon class ORDER: live renders `w-X h-X [margin] [color]`; the clone renders `h-X w-X` with margin-first.**
Live sample across all captures: 286× `w-5 h-5`, 106× `w-4 h-4`, 46× `w-3 h-3`, 45× `w-6 h-6`, 25× `w-8 h-8`, `w-5 h-5 mr-2`, `w-3 h-3 mr-1`, `w-5 h-5 mt-0.5` — margin ALWAYS after size. The ONLY h-first icons on live are the shadcn Select internals (`chevron-down h-4 w-4 opacity-50`, `check h-4 w-4`) which live in `src/components/ui/select.tsx` (pinned, untouched). The clone's `src/components/finara/*.tsx` carry ~199 `h-X w-X` + ~35 `margin-first` instances. Visually identical (same computed size), but a class-exact violation. Severity: Medium (discipline; DOM-equality).

**F2 — user-menu items:** live icons `w-4 h-4 mr-2` (clone `mr-2 h-4 w-4`) and the item label is wrapped in `<span>` (clone renders a bare text node). Severity: Low.

**F3 — user-menu trigger button:** live class tail `h-9 flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm w-full text-left` (clone: `flex h-9 w-full items-center gap-3 rounded-xl bg-white/10 p-3 text-left backdrop-blur-sm dark:bg-gray-800/50` — same set, different order); avatar span `relative flex shrink-0 overflow-hidden rounded-full w-8 h-8` (clone h-8 w-8 first); text block `flex-1 min-w-0`; both `<p>`s end with `truncate` (clone leads with it). Also live has NO `aria-label` on the trigger (clone adds one — a11y bucket, keep). Severity: Low.

### Dialog form-body matrix (live-probed per dialog)

**F4 — Income quick-amount chips (BOTH the add flow and the edit dialog):** live = `div[tabindex=0] > Button outline` with `h-8 rounded-md px-3 text-xs` (compact chips; text-xs replaces text-sm). The clone's add flow renders `h-9 px-4 py-2` (expense sizing — round-6 over-generalized), and the edit dialog still renders RAW slate/emerald `<button>`s (`rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs …hover:border-emerald-300…`) — a pre-round-4 design. Severity: High (visible).

**F5 — income-edit "Quick Add Amount" label:** live = Label component (`text-sm font-medium leading-none peer-disabled:…`, no mb-2); clone renders `<p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">`. Severity: Medium.

**F6 — income Active row:** live (add AND edit) = `div.flex.items-center.space-x-2.pt-2` > Label + Switch, nothing else. The clone's edit dialog renders a bordered box (`flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3`) WITH helper text "Counts toward your monthly income total" — live has neither box nor helper. The clone's add flow has the right row but is missing `pt-2`. Severity: High (visible).

**F7 — income-edit buttons row:** live = `div.flex.gap-3.pt-4` > Cancel (outline, `flex-1`) + submit "Update Income" (`shadow h-9 px-4 py-2 flex-1 bg-primary-sage hover:bg-primary-sage/90 text-white`). Clone: `flex items-center justify-end gap-2 pt-1`, no flex-1, label "Save Changes". Severity: High.

**F8 — grid gaps:** every live 2-col form grid uses `gap-4` (income add+edit, investment, goal). The clone renders `gap-3` everywhere. Severity: Medium.

**F9 — investments form structure:** live = GRID[symbol, type] + name (full) + GRID[shares, avg cost] + GRID[current price, portfolio %] + sector (full). The clone renders GRID[symbol, type] + name + **GRID-cols-3[shares, avg, current]** + GRID[percent, sector] — wrong grouping. Severity: High (layout).

**F10 — investments buttons row:** live = `flex gap-3 pt-4` + flex-1 both; submit "Update Investment"/"Add Investment" (`shadow h-9 px-4 py-2 flex-1 bg-primary-sage hover:bg-primary-sage/90 text-white` — note `shadow`, NOT `shadow-lg`). Clone: `flex justify-end gap-2 pt-1`, no flex-1, `shadow-lg`, edit label "Save Changes". Severity: High.

**F11 — goals form structure:** live = Goal Title (full) + Target Amount (full) + Target Date (full) + GRID[category, priority] (gap-4). The clone puts Target Date inside the grid with Category and leaves Priority full-width. Severity: High (layout).

**F12 — goals buttons row + submit:** live = `flex gap-3 pt-4`, flex-1 both, submit "Update Goal"/"Create Goal" with `shadow h-9 px-4 py-2 flex-1 bg-primary-sage hover:bg-primary-sage/90` and **NO `text-white`** (clone: justify-end gap-2 pt-1, shadow-lg, text-white, "Save Changes"). Severity: High.

**F13 — Add Progress dialog:** live buttons row `flex gap-3` (NO pt-4), Cancel `flex-1`, submit "Add Amount" `text-primary-foreground shadow h-9 px-4 py-2 flex-1 bg-primary-sage hover:bg-primary-sage/90` (text-primary-foreground, no text-white). Label id `amount`. Clone: `flex justify-end gap-2`, no flex-1, sage text-white shadow-lg, id `goal-contribution`. Severity: High.

**F14 — accounts dialog:** live submit = **DEFAULT primary Button** (`bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2` — no sage, no flex-1), field wrappers are PLAIN `<div>` (no `space-y-2`), and the card is `bg-card` with **no dark background override** (the clone's `max-w-md bg-card` merge leaks `dark:bg-gray-800` from DIALOG_CARD_BASE — in dark mode the clone renders gray-800 #1f2937 where live renders --card #0a0a0a). Clone: sage submit ✗, space-y-2 wrappers ✗, dark leak ✗. Severity: High (dark-mode card is visible).

**F15 — submit labels:** live edit labels are "Update Expense" / "Update Income" / "Update Investment" / "Update Goal" (accounts edit = "Save Changes" ✓ clone matches). The clone renders static "Add Expense"/"Add Income" and "Save Changes" for income/investments/goals edits. Severity: Medium.

**F16 — label/input ids:** live uses short snake_case ids — expense `title, amount, category, subcategory, date, notes, is_recurring`; income `source_name, amount, frequency, category, is_active`; investment `symbol, investment_type, name, shares, purchase_price, current_price, portfolio_percentage, sector`; goal `title, target_amount, target_date, category, priority` (+ progress `amount`); account `account_name, bank_name, account_type, manual_balance`. The clone uses prefixed kebab ids (`txn-description`, `edit-income-name`, `inv-symbol`, `goal-title`, `account-name`, `goal-contribution`). Severity: Low (DOM attribute parity).

**F17 — grid class-order alignments:** live expense cat/subcat grid `grid grid-cols-1 md:grid-cols-2 gap-4` (clone `grid grid-cols-1 gap-4 md:grid-cols-2`); quick-select tiles grid `grid grid-cols-2 sm:grid-cols-3 gap-3` (clone puts `gap-3` in the middle). Severity: Low.

### Re-verified as correct (round-6 items that held up)

Investment dialogs DO have the trending-up icon + in-flow close (both add and edit — an intermediate probe regex was faulty; raw captures confirm); goal dialogs: icon title, NO close; account dialogs: plain title, no close, `flex justify-end gap-2 pt-4` row; all card bases (`bg-white dark:bg-gray-800` via DIALOG_CARD_BASE, goals/progress `dark:bg-gray-900`); Analytics 4-tab structure; Settings content; open-Select listbox/viewport/option/check classes; Select trigger (`w-32` period select included); Quick Add chooser anatomy (framer-wrapper bucket); expense chips `h-9 px-4 py-2` ✓.

### Documented buckets (no action — re-confirmed today)

Live shows NO toast on CRUD (re-probed with a real add — only inert sonner/rht viewport containers exist; clone keeps toasts as the deliberate round-4 delta). Live dialogs render in-flow (overlay+card are children of the page pane, no portal, no `role=dialog`) — the clone keeps Radix portaled dialogs (functional equivalence; portal wrappers classified infra). framer wrapper divs (Quick Add `w-full max-w-md` wrapper). fade-in-up/stagger (ADR-013). lucide polyline-vs-path internals. data-count deltas. aria-* additions. Live `data-side="top"` on an open Select = runtime collision-avoidance, not a class delta.

## §C Fix design

### C.1 Icon order flip (F1) — all `src/components/finara/*.tsx`

Mechanical transform on lucide icon `className` strings only: `h-X w-X` → `w-X h-X`, `m[a-z]?-X h-X w-X` → `w-X h-X m-X`. The ui/ primitives are untouched (Select chevron/check stay h-4 w-4 per live). Pagination chevrons (not live-renderable, single page) flip too for uniformity — labeled Reasoned. Done by scripted transform + manual review of every diff hunk.

### C.2 User menu (F2, F3) — `sidebar.tsx`

- Trigger className → live order: `"h-9 flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm w-full text-left"`; avatar span → `"relative flex shrink-0 overflow-hidden rounded-full w-8 h-8"`; text div → `"flex-1 min-w-0"`; both `<p>`s → truncate last (`"text-sm font-medium text-white dark:text-gray-200 truncate"`, `"text-xs text-slate-400 dark:text-gray-400 truncate"`).
- DropdownMenuItem icons → `w-4 h-4 mr-2`; wrap labels in `<span>`.

### C.3 add-transaction-dialog.tsx (F4, F6, F8, F15, F16, F17)

- Income chips → `variant="outline" className="h-8 px-3 text-xs"` inside `div tabIndex={0}` (live has `rounded-md` re-asserted; the outline base already carries it — pass `h-8 px-3 text-xs` and let tw-merge keep base rounded-md: live string is `… h-8 rounded-md px-3 text-xs`; to render exactly that, pass `className="h-8 rounded-md px-3 text-xs"`).
- Income Active switch row → add `pt-2`.
- Income frequency/category grid → `grid grid-cols-2 gap-4`.
- Expense cat/subcat grid → `grid grid-cols-1 md:grid-cols-2 gap-4`; quick-select grid → `grid grid-cols-2 sm:grid-cols-3 gap-3`.
- Submit labels → `{isExpense ? (isEditing ? "Update Expense" : "Add Expense") : (isEditing ? "Update Income" : "Add Income")}`.
- ids → `title, amount, category, subcategory, date, notes, is_recurring` (expense) / `source_name, amount, frequency, category, is_active` (income).

### C.4 income-view.tsx edit dialog (F4–F8, F15, F16)

- Chips: replace raw slate buttons with the same `div tabIndex={0} > Button outline h-8 rounded-md px-3 text-xs` set; label → `<Label className="text-sm font-medium leading-none">Quick Add Amount</Label>`.
- Active row → `div.flex.items-center.space-x-2.pt-2` > Label("text-sm font-medium leading-none") + Switch (drop the bordered box + helper text).
- Grid → `gap-4`; buttons row → `flex gap-3 pt-4` with outline `flex-1` Cancel + `flex-1 bg-primary-sage … text-white shadow` submit labeled "Update Income".
- ids → `source_name, amount, frequency, category, is_active`.

### C.5 investments-view.tsx (F8–F10, F15, F16)

- Grids: `[symbol, investment_type]`, `[shares, purchase_price]`, `[current_price, portfolio_percentage]` each `grid grid-cols-2 gap-4`; `name` and `sector` full-width.
- Buttons row → `flex gap-3 pt-4`, flex-1 both, submit `bg-primary-sage text-white shadow hover:bg-primary-sage/90` with `{editing ? "Update Investment" : "Add Investment"}`.
- ids → `symbol, investment_type, name, shares, purchase_price, current_price, portfolio_percentage, sector`.

### C.6 goals-view.tsx (F8, F11, F12, F16)

- Structure: title, target, date full-width; then `grid grid-cols-2 gap-4` with category + priority.
- Buttons row → `flex gap-3 pt-4`, flex-1 both; submit `bg-primary-sage shadow hover:bg-primary-sage/90` (NO text-white), `{editing ? "Update Goal" : "Create Goal"}`.
- ids → `title, target_amount, target_date, category, priority`; Add Progress: id `amount`, row `flex gap-3`, flex-1 both, submit `text-primary-foreground bg-primary-sage shadow hover:bg-primary-sage/90` "Add Amount".

### C.7 accounts-view.tsx (F14, F16)

- Field wrappers → plain `<div>` (drop `space-y-2`).
- Submit → default Button (no sage classes): `{editing ? "Save Changes" : "Add Account"}`.
- DialogContent className → `max-w-md bg-card dark:bg-card` (kills the leaked `dark:bg-gray-800`; computed = `bg-card` in both themes, matching live).
- ids → `account_name, bank_name, account_type, manual_balance`.

## §D TDD plan (red → green)

New spec `src/lib/__tests__/dialog-forms.test.ts` — a **source-contract spec** (precedent: `design-tokens.test.ts` parses `globals.css`): reads the finara component sources and pins the live-probed strings:

1. Icon order: NO `h-\d w-\d` (or margin-first) lucide className in `src/components/finara/*.tsx`; spot-assert `w-5 h-5` / `w-5 h-5 mr-2` present.
2. User menu: trigger/avatar/p class strings + menu-item icon order + span-wrapped labels (sidebar.tsx).
3. Per-dialog contracts: chip class strings (income h-8 both files, expense h-9), grid classes (`gap-4` where live), switch-row classes (plain `space-x-2 pt-2`), buttons-row classes, submit class tails + label expressions, field-wrapper pattern for accounts (plain div), label ids per dialog, card overrides (`dark:bg-card` on accounts, `dark:bg-gray-900` on goals/progress).

Component-interactive behavior (portals, focus, submit flows) stays with the browser verification pass (§E), per the established split.

## §E Execution & verification

- [T1] RED: write `dialog-forms.test.ts`; run `bun run test` — expect exactly the new specs failing; 122 existing stay green.
- [T2] Icon-order flip (C.1) scripted + reviewed.
- [T3] sidebar user menu (C.2).
- [T4] add-transaction-dialog (C.3).
- [T5] income-view (C.4).
- [T6] investments-view (C.5).
- [T7] goals-view (C.6) + accounts-view (C.7).
- [T8] GREEN: full suite green; gates `bun run lint && bun run typecheck && bun run test && bun run build` all 0.
- [T9] Browser verification (dev server, fresh cache): open every dialog add+edit; check chips/rows/grids/labels visually vs the live captures; dark-mode pass (accounts card #0a0a0a, goals gray-900); user menu open state; zero console errors.
- [T10] DOM re-diff of the dialog surfaces vs today's live captures; residuals classified.
- [T11] Docs: AGENTS.md (form-body matrix invariants + icon-order rule), CLAUDE.md (VERIFY additions), README (test count), PAD v1.6 (ADR-020: dialog form-body + icon-order parity contract), this plan's execution record.
- [T12] Atomic Conventional Commits on main; push via `docs/ssh_git_wrapper_v3.py`.

## §F Validation of this plan against the codebase (pre-execution)

- `sidebar.tsx` UserMenu confirmed at lines 88–133 — trigger/avatar/p classes exactly as C.2 describes; menu items render bare text with `mr-2 h-4 w-4` icons.
- `add-transaction-dialog.tsx`: income chips at ~480 (`h-9 px-4 py-2`), income grid at 495 (`gap-3`), switch row at 536 (no pt-2), expense grid at 351, submit labels static.
- `income-view.tsx`: raw slate chips at ~272–290, p-label at 271, bordered Active box at ~327–340, buttons row `justify-end gap-2 pt-1` at 345.
- `investments-view.tsx`: `grid grid-cols-3 gap-3` at 394, `grid grid-cols-2 gap-3` at 441 (percent+sector), buttons row at ~473.
- `goals-view.tsx`: grid at 317 wraps deadline+category, priority full at 350; rows `justify-end gap-2 pt-1` / `justify-end gap-2`; add-progress id `goal-contribution` at 408.
- `accounts-view.tsx`: `space-y-2` wrappers at 218/230/241/256, sage submit at 275, DialogContent `max-w-md bg-card` at 207 (dark leak confirmed by base merge).
- Risk check: label-id renames touch no logic (labels+inputs are id-paired within each form; no CSS or tests reference the old ids — `rg` confirms only htmlFor/id pairs). The Quick Add compact form ids (`qa-*`?) — not captured on live (step-2 form ids not probed); leave untouched, note as unprobed.
- Risk check: `dark:bg-card` on accounts — tw-merge keeps the last dark: background class; computed result equals live's single `bg-card` in both themes. The rendered string carries one extra class (documented approximation, invisible).
- Risk check: the icon flip must NOT touch `src/components/ui/*` (pinned primitives) nor `sidebar.tsx`'s mobile drawer section differently — flip is class-order-only, no semantics.

## §G Execution & verification record (2026-09-17)

**TDD red phase:** 34 specs written first in `src/lib/__tests__/dialog-forms.test.ts` (source contracts: icon order, div tile/dot orders, user-menu anatomy, per-dialog form bodies) — 33 failing, 1 already green (expense chips), all 122 existing tests stayed green.

**Green phase (per the plan's task order):**
- T2 icon flip: scripted transform (`122` icon class strings flipped to `w-X h-X [margin]`; CloudUpload exception live-evidenced h-first) + per-context manual fixes (FAB `text-primary-foreground px-4 py-2 w-14 h-14 …` live order, filters badge `bg-blue-500 text-white text-xs rounded-full w-5 h-5 …`, expense row tiles, activity circles, dots, accounts/goals/income tiles, sidebar logo tile, pen/trash icon buttons `w-8 h-8`, AI-coach avatar `h-7 w-7 … mt-0.5`, empty-state Brain margins-after, header add-buttons `bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg` live order).
- T3 sidebar user menu: live-ordered trigger `h-9 flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm w-full text-left`, avatar `relative flex shrink-0 overflow-hidden rounded-full w-8 h-8`, `flex-1 min-w-0` block, truncate-last `<p>`s, menu-item icons `w-4 h-4 mr-2`, span-wrapped labels.
- T4 add-transaction-dialog: income chips → `h-8 rounded-md px-3 text-xs` (Button outline in `div tabIndex={0}`), income switch row `+ pt-2`, income grid `gap-4`, expense grid order `grid grid-cols-1 md:grid-cols-2 gap-4`, quick-select grid order, submit labels `Update Expense`/`Update Income`, ids → `title/amount/category/subcategory/date/notes/is_recurring` + `source_name/frequency/is_active`.
- T5 income-view edit: raw slate/emerald chips replaced with the live outline-Button chips, Label-based "Quick Add Amount", bordered Active box → plain `flex items-center space-x-2 pt-2` row, `flex gap-3 pt-4` + flex-1 buttons, "Update Income" (sage + text-white + shadow), gap-4, snake_case ids.
- T6 investments-view: grids restructured to the live pairs (symbol+type, shares+avg cost, current+percent; name/sector full-width), gap-4 everywhere, `flex gap-3 pt-4` + flex-1 + "Update Investment", snake_case ids.
- T7 goals-view: Target Date full-width before the grid; grid = Category + Priority (gap-4); `flex gap-3 pt-4` + flex-1; submits "Update Goal"/"Create Goal" (sage, NO text-white) and Add Progress `flex gap-3` + `text-primary-foreground` tail; accounts-view: plain `div` field wrappers, DEFAULT primary submit ("Save Changes"/"Add Account"), `dark:bg-card` kills the base dark leak, snake_case ids.
- **Post-diff additions (found by the T10 re-diff):** Label primitive gained `leading-none` (present on every live form label; the round-4 pin had missed it — pin updated); all 5 in-flow close buttons re-pinned to the full live string (the hand-written round-6 strings lacked the `[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0` tokens and had h-9 w-9 first).

**Gates:** lint 0 · tsc 0 · **156/156 tests** (122 + 34 new) · `next build` 0.

**Browser verification (executed, fresh dev server after a Turbopack cache reset):** every dialog opened and structurally asserted against the live matrix — Add Expense manual (grid order, ids, expense chips h-9, flex-1 buttons, plain switch row), Add Income (compact chips in tabindex wrappers, gap-4 grid, pt-2 active row, max-w-lg), Edit Income (no slate chips, Label quick-add, plain active row, flex gap-3 pt-4 + Update Income), New Goal (date full-width, Category+Priority grid, snake_case ids, dark gray-900 card), Add Investment (live field order, three 2-col gap-4 grids, shadow-not-shadow-lg submit), Add Account (plain div wrappers, default primary submit, justify-end gap-2 pt-4, black/60 overlay). User menu: items ["Dark Mode","Sign Out"], icons `w-4 h-4 mr-2`, span-wrapped labels — live-exact. Dark-mode computed checks: accounts card `rgb(10,10,10)` (= live --card; the gray-800 leak is gone), goals card `rgb(30,41,59)` (= gray-900). Label + close-button re-checks live-exact in-DOM. Zero console errors/warnings after a fresh load and exercising all dialogs (the only console entries were HMR logs from mid-edit states, cleared and re-verified).

**DOM re-diff (dialogs):** residuals per dialog now classify entirely into documented buckets — live's empty react-hot-toast viewport (`fixed flex flex-col-reverse max-h-screen md:max-w-[420px]…`), the clone's Radix overlay wrapper (animation/data-state classes; live renders a plain in-flow overlay div), the clone's `<h2>` DialogTitle vs live's plain `div` (a11y semantics), lucide polyline-vs-path internals, and data-count differences.

**Live-app etiquette:** the throwaway probe expense was created and deleted (DOM-verified gone); every opened live dialog was cancelled; the live app was left in its original dark theme with no overlays open.
