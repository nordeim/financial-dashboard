# Finara Clone — Parity Remediation Plan (Round 2)

**Date:** 2026-09-15
**Goal:** Achieve visual and functional parity between this codebase and the live source app `https://finara-c636f309.base44.app/Dashboard`, fixing all gaps found in the 2026-09-15 live-site audit.
**Method:** TDD (red → green per vertical slice) for domain logic; browser-verified UI parity (agent-browser) for presentation; vitest added as the test runner.
**Source of truth:** live-site audit artifacts in the workspace (`audit/live/*` screenshots + a11y snapshots; taxonomy dumps captured via native `<select>` enumeration on the live app).

---

## Audit Summary (counts by severity)

- **Critical:** 0
- **High:** 16 (dark mode missing; filters panel missing; bulk selection missing; edit affordances missing on income/expense/goal/account/investment; taxonomy drift in 6 dialogs; income dialog wrong form; dashboard KPI semantics wrong; analytics windowing bug; no test runner)
- **Medium:** 18 (placeholder trends; Quick Actions section; Recent Activity composition; row/card anatomy drift; pagination; date-range pickers; chart labels; schema fields)
- **Low:** 9 (labels, icon colors, sub-labels, "OR" divider, currency/date-format option lists)

All findings below are **Verified** against the live app unless noted. Empty-state references: `audit/live/01-dashboard.png` (matches `docs/Finara_Dashboard.png`), `02..09-*-empty.png`. Data-state references: `11..38-*.png`.

---

## Key live-site behavioral facts (drives several tasks)

1. **KPI trend percentages are placeholders in the source app**: `+8.2%` income, `-3.1%` expenses, `-5.2%` net (empty state; identical in the official reference screenshot). With income present but no prior-month data, net shows `12.5%`. These never changed across observed states. → Parity rule: compute real month-over-month when both months carry data; otherwise fall back to the source app's exact placeholder values.
2. **Savings Progress = goal progress** (sum(current)/sum(target) across goals; `0.0%` with no goals), NOT savings rate. Verified: adding $2,500 to a $10,000 goal moved the KPI to exactly `25.0%`.
3. **Largest Expense Category** shows the 50/30/20 bucket name (`Wants`), not the subcategory; `N/A` + `$0.00` when empty.
4. **Recent Activity** mixes income and expenses (income renders `+$X` green with a lowercase category badge), sorted by date desc, date format `MM/dd/yyyy`.
5. **Dark mode**: user-menu item (desktop) + sun/moon button (mobile header); toggles `document.documentElement` class `dark`/`light`; persists across reload. Dark palette: body ≈ `#0a0a0a`, cards ≈ `#1e293b`, borders ≈ `#334155`, feature gradient cards unchanged, sidebar ≈ `#1a1f2e` with emerald active pill.
6. **Source taxonomy** (captured from the live app's native selects):
   - Expense category: `Needs | Wants | Savings`
   - Subcategories — Needs: `Rent, Groceries, Utilities, Transportation, Healthcare, Other`; Wants: `Other, Dining, Entertainment, Shopping, Subscriptions`; Savings: `Other, Emergency Fund, Investments, Retirement`
   - Income frequency: `Monthly, Weekly, Bi-weekly, Annual`; income category: `Primary Income, Secondary Income, Passive Income, Other`
   - Goal category: `Emergency, Vacation, Home, Car, Education, Retirement, Other`; priority: `High, Medium, Low`
   - Investment type: `Stock, ETF, Bond, Crypto, Mutual Fund, Other`; sector: `Technology, Healthcare, Finance, Energy, Consumer, Industrial, Real Estate, Utilities, Other`
   - Account type: `Checking, Savings, Credit Card, Investment, Other`
   - Currencies: `USD, EUR, GBP, CAD, AUD, JPY, CHF, SEK, NOK, DKK`; date formats: 5 options incl. `MMM dd, yyyy (Dec 25, 2024)`
   - Expense filters: Date Range `Today | Last 7 days | Last 30 days | This month | Last month | Custom range`; Category `All categories | Needs | Wants | Savings`; Min Amount default `0.00`; Max Amount default `No limit`; Sort By `Date`; direction `↓/↑`; buttons `Clear All / Cancel / Apply Filters`; the Filters button shows badge `2` in the default state.
7. **Analytics averages divide the window total by the period month count** (e.g. $4.50 spent in one month → "Avg Monthly Expenses $0.75" over 6 months).
8. The live app has **no footer**; Sign Out lives in the sidebar user menu (desktop) and mobile drawer.

---

## Task 0 — Test infrastructure (TDD prerequisite)

**Files:**
- Create: `vitest.config.ts`, `src/lib/__tests__/money.test.ts`
- Modify: `package.json` (add `test: vitest run`, `test:watch: vitest` scripts + `vitest` devDependency)

**Steps:**
1. `bun add -d vitest` (already installed in the dev sandbox; mirror exact version into the repo `package.json` and copy `bun.lock`).
2. Create `vitest.config.ts` (node environment, `include: ["src/**/*.test.ts"]`).
3. Write `src/lib/__tests__/money.test.ts` covering `toMinorUnits`, `formatMoney`, `percent`, `changePercent` — including the not-yet-implemented `annual` frequency case (red).
4. Run `bunx vitest run` → the annual case fails (red), everything else passes.
5. Implement `annual` in `monthlyEquivalent` (green). Run again → 0 failures.
6. Commit: `test: add vitest runner and money unit tests`.

---

## Task 1 — Taxonomy alignment (categories.ts + money.ts)

**Files:**
- Modify: `src/lib/categories.ts`, `src/lib/money.ts`
- Test: `src/lib/__tests__/categories.test.ts`

**Changes (exact sets, order preserved from the live app):**
- `SUBCATEGORIES` → Needs: `rent→Rent 🏠, groceries→Groceries 🛒, utilities→Utilities ⚡, transportation→Transportation 🚗, healthcare→Healthcare 🏥, other→Other 📌`; Wants: `other→Other 📌, dining→Dining 🍽️, entertainment→Entertainment 🎬, shopping→Shopping 🛍️, subscriptions→Subscriptions 📺`; Savings: `other→Other 📌, emergency-fund→Emergency Fund 🚨, investments→Investments 📈, retirement→Retirement 🌴`
- `INCOME_FREQUENCIES` → `monthly | weekly | biweekly | annual` (drop `one-time`, `quarterly`)
- Add `INCOME_CATEGORIES` → `primary | secondary | passive | other` with labels `Primary Income | Secondary Income | Passive Income | Other`
- `GOAL_CATEGORIES` → `emergency | vacation | home | car | education | retirement | other` labels `Emergency | Vacation | Home | Car | Education | Retirement | Other`; add `GOAL_PRIORITIES` → `high | medium | low`
- Add `INVESTMENT_TYPES` → `stock | etf | bond | crypto | mutual-fund | other`
- `SECTORS` → `Technology, Healthcare, Finance, Energy, Consumer, Industrial, Real Estate, Utilities, Other` (drop `ETF`)
- `ACCOUNT_TYPES` → `checking | savings | credit-card | investment | other` labels `Checking | Savings | Credit Card | Investment | Other`
- `CURRENCIES` → USD, EUR, GBP, CAD, AUD, JPY, CHF, SEK, NOK, DKK (drop SGD)
- `DATE_FORMATS` → add `MMM dd, yyyy (Dec 25, 2024)`
- `monthlyEquivalent`: add `annual → Math.round(amountMinor / 12)`; keep `quarterly`/`one-time` cases ONLY as legacy data guards (seed no longer emits them) — documented in a comment.
- Keep a `LEGACY_SUBCATEGORY_MAP` (old id → new id) used by the seed rewriter + API POST/PUT normalization so pre-existing rows never 500.

**TDD steps:** write `categories.test.ts` asserting: every Needs/Wants/Savings subcategory set matches the live dump exactly (labels + order); frequency set equals the live set; goal categories exclude `Major Purchase`/`Vehicle` and include `Car`/`Emergency`; sectors include `Utilities`/`Other` and exclude `ETF`; currencies include CHF/SEK/NOK/DKK and exclude SGD; `monthlyEquivalent(120000,"annual") === 10000`. Red → implement → green → commit `feat: align taxonomy with source app`.

---

## Task 2 — Prisma schema parity fields

**Files:**
- Modify: `prisma/schema.prisma` (add `IncomeSource.category String @default("primary")`, `Goal.priority String @default("medium")`, `Investment.type String @default("stock")`, `Investment.portfolioPercent Float?`; update frequency/type comment enums)
- Modify: `src/lib/types.ts` (mirror DTO fields: `IncomeSourceDto.category`, `GoalDto.priority`, `InvestmentDto.type`)
- Modify: `src/lib/seed.ts` (rewrite seed to live taxonomy: subcategory remap, `annual` dividend income, income categories, goal priorities, investment types, sectors without ETF; goal categories `Emergency/Vacation/Home`)
- DB: `bunx prisma db push` in sandbox (SQLite dev flow), delete `db/custom.db` + `_seeded` marker so the new seed runs (dev-only data, no migration needed — documented in AGENTS.md).

**Verify:** `bunx prisma db push` exits 0; restart dev server; `curl /api/dashboard` returns KPIs; income sources carry `category`; goals carry `priority`. Commit `feat: schema parity fields (income category, goal priority, investment type)`.

---

## Task 3 — Pure domain modules + tests (KPIs, filters, dates)

**Files:**
- Create: `src/lib/dashboard-kpis.ts`, `src/lib/expense-filters.ts`, `src/lib/date-format.ts`
- Tests: `src/lib/__tests__/dashboard-kpis.test.ts`, `src/lib/__tests__/expense-filters.test.ts`, `src/lib/__tests__/date-format.test.ts`
- Modify: `src/lib/analytics.ts` (getDashboard/getAnalytics consume the new pure modules), `src/app/api/dashboard/route.ts`, `src/app/api/analytics/route.ts` (thin wrappers)

**3a. `dashboard-kpis.ts`** — pure function `computeDashboardKpis({expenses, incomeSources, goals, budgets, now})` returning the full KPI set:
- `savingsProgressPercent` = `sum(goal.currentAmountMinor)/sum(goal.targetAmountMinor)*100` (0 when no goals; rounded to 1 decimal)
- trend placeholders: real MoM when prior month has both income-equivalent and expense data, else `incomeChange=8.2`, `expenseChange=-3.1`, `netChange = income>0 ? 12.5 : -5.2`
- `largestExpenseCategory` = top-level bucket name (`Wants`/`Needs`/`Savings`) or `null`
- `recentActivity` = merged income + expenses, date desc, max 6, income typed `{kind:"income"}` (amounts positive), expenses `{kind:"expense"}`
- `avgMonthly*` windowed to the trend period

**3b. `expense-filters.ts`** — pure `applyExpenseFilters(list, {search, category, tab, dateRange, minMinor, maxMinor, sortBy, sortDesc})` with date-range presets (`today`, `7d`, `30d`, `this-month`, `last-month`, `custom`, `all`) and `countActiveFilters` (mirrors the badge `2` default: min-amount + max-amount preset count).

**3c. `date-format.ts`** — `formatDate(iso, "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy-MM-dd" | "dd MMM yyyy" | "MMM dd, yyyy")`.

**TDD:** each test file written first, red, then implement, green. Key worked examples:
- kpis: `{goals:[{current:2500,target:10000}]}` → `savingsProgress 25.0`; no goals → `0.0`
- kpis: empty data → trends `{8.2, -3.1, -5.2}`, largestExpense `null`
- kpis: income 5000 + expense 450 this month, nothing prior → net trend `12.5`
- filters: 101-row fixture, `min=0,max=null` → all pass; `this-month` → only current month; search "grocery" → case-insensitive description + subcategory label match; sort by date desc default
- dates: `2026-09-15` → `09/15/2026` / `15/09/2026` / `2026-09-15` / `15 Sep 2026` / `Sep 15, 2026`

Commit: `feat: pure domain modules for KPIs, filters, dates (TDD)`.

---

## Task 4 — Dark mode + user menu + footer removal

**Files:**
- Create: `src/components/finara/theme.ts` (module-level external store: read/subscribe/write + `localStorage["finara-theme"]` persistence + `<html>` class sync, SSR-safe server snapshot `null`)
- Modify: `src/app/layout.tsx` (add `suppressHydrationWarning` on `<html>`; no inline script needed — theme resolves client-side; default light)
- Modify: `src/components/finara/sidebar.tsx` (user area becomes DropdownMenu button: avatar + name + email + chevron; items: `My Account` label, separator, `Dark Mode`/`Light Mode` (moon/sun icon), `Sign Out`)
- Modify: `src/components/finara/finara-app.tsx` (remove footer; wire `onSignOut` through the user menu + mobile drawer; apply `dark:` classes on the shell root)
- Modify: `src/components/finara/sidebar.tsx` MobileTopNav (add `Synced` pill + sun/moon button; drawer gains user block + `Sign Out` button)
- Modify: `src/app/globals.css` (dark palette variables: `--background: #0a0a0a`, card `#1e293b`, border `#334155` via `.dark` selector)
- Modify all view components: add `dark:` Tailwind variants to match the audited dark palette (cards `bg-slate-800 border-slate-700`, text `text-slate-100/400`, inputs, dialogs, tables, toasts, login card)

**Verify (agent-browser):** toggle via user menu → `document.documentElement.className === "dark"`; all 9 views + dialogs + login render correctly in dark (screenshots `audit/clone/dark-*.png` vs `audit/live/28-*.png`, `29-*.png`); reload persists theme; mobile header shows sun/moon + Synced; Sign Out works from menu and mobile drawer; no footer. Commit `feat: dark mode, user menu, remove footer`.

---

## Task 5 — Dashboard parity

**Files:**
- Modify: `src/components/finara/dashboard-view.tsx`, `src/components/finara/ui-bits.tsx`

**Changes:**
- Savings Progress KPI: bind `kpis.savingsProgressPercent` (from Task 3a)
- Trend chips: bind placeholder-aware values; Net Balance icon tile `bg-blue-500`
- Largest Expense Category: `data.kpis.largestExpenseCategory` + amount; `N/A` + `$0.00` empty
- Recent Activity: mixed feed; income rows `+$X` emerald + lowercase category badge; expense rows `−$X` red + lowercase subcategory badge; date `MM/dd/yyyy` (settings-aware via `date-format.ts`)
- Add `Quick Actions` h3 section: 4 link-buttons `Add Income / Add Expense / Set Goal / View Reports` (outline style, plus/target icons; navigate or open dialogs)
- Budget Overview: keep existing budget rows (seeded limits — richer than live but same layout); row format `$spent / $limit`, `X.X% used`, `$remaining` (align the remaining line wording to live: `$219.59 remaining` — drop "this month")

**Verify:** browser — dashboard KPIs match `api/dashboard`; empty-state (via a test DB flag or by deleting rows in a scratch check) matches reference placeholders; recent activity shows the seeded salary income green; Quick Actions navigate correctly. Commit `feat: dashboard parity (goal progress, placeholder trends, quick actions, mixed activity)`.

---

## Task 6 — Expenses view parity (filters, bulk, edit, pagination)

**Files:**
- Modify: `src/components/finara/expenses-view.tsx`
- Create: `src/components/finara/expense-filters-panel.tsx`, `src/components/finara/edit-transaction-dialog.tsx`
- Modify: `src/app/api/expenses/route.ts` (accept filter/sort/pagination query params server-side? — NO: keep client-side filtering via `expense-filters.ts` pure module, matching live behavior where filters apply client-side after fetch)

**Changes:**
- Filters panel (collapsible under the search row): Date Range select (6 presets + Custom range → shows two date inputs), Category select, Min Amount number input (default 0.00), Max Amount (placeholder "No limit"), Sort By select (`Date | Amount | Description`), direction toggle `↓/↑`, `Clear All / Cancel / Apply Filters` buttons; `Filters N` badge = `countActiveFilters` (live shows `2` by default)
- Bulk selection: checkbox per row + header select-all; when ≥1 selected show toolbar: `Deselect All`, `N expenses selected`, `Bulk Edit` combobox (Sets category → needs/wants/savings), `Delete (N)` button calling `DELETE /api/expenses` per id (or new bulk endpoint `POST /api/expenses/bulk-delete`)
- Row anatomy: checkbox · emoji · description (h3) · `−$amount` (red, minus sign) · lowercase `category` + `subcategory` badges · `MM/dd/yyyy` date · edit (pen) + delete (trash) ghost buttons
- Edit dialog: prefilled form (description, amount, category, subcategory, date, notes, recurring) → `PUT /api/expenses/[id]`
- Pagination: page size 10 (live paginates the history list), prev/next + `Page X of Y` + page number buttons; replaces "Show all"
- Summary cards: drop the sub-label lines for exact parity (label + value only)

**Verify:** browser — set each filter combination; select 2 rows → bulk delete; edit an expense → row updates; pagination walks 101 seeded rows; badge shows `2` initially. Screenshots vs `audit/live/03b-expenses-filters.png`. Commit `feat: expenses filters, bulk actions, edit, pagination`.

---

## Task 7 — Income view parity

**Files:**
- Modify: `src/components/finara/income-view.tsx`, `src/components/finara/add-transaction-dialog.tsx`
- Modify: `src/app/api/income/route.ts` + `[id]/route.ts` (accept `category`; PUT support exists — verify)

**Changes:**
- Add Income dialog (income mode rewritten to live form): `Income Source` (required) · `Amount (USD)` + Quick Add buttons labeled `+ $1.00 + $5.00 + $10.00 + $50.00 + $100.00 + $500.00` · `Frequency` select (Monthly/Weekly/Bi-weekly/Annual) · `Category` select (Primary Income/Secondary Income/Passive Income/Other) · `Active Income Source` switch (default on) · `Cancel / Add Income`
- Income card anatomy: `📊` emoji · title · lowercase category badge · edit + delete icon buttons · amount · lowercase frequency badge · `Monthly equivalent $X` line; drop pause-switch and `next …` line
- Edit income dialog (prefilled) → `PUT /api/income/[id]`
- Quick amounts in expense mode labeled `+ USD1 + USD5 + USD10 + USD50 + USD100 + USD500` (matches live exactly)
- Dialog container → right-side `Sheet` (side="right") matching the live drawer, for both expense and income forms

**Verify:** browser — add income source with each frequency (verify monthly equivalent math on card); edit; delete; quick amounts accumulate. Commit `feat: income parity (dialog form, card anatomy, edit)`.

---

## Task 8 — Goals view parity

**Files:**
- Modify: `src/components/finara/goals-view.tsx`, `src/app/api/goals/route.ts`, `src/app/api/goals/[id]/route.ts` (accept `priority`, PUT)

**Changes:**
- New Goal dialog: `Goal Title` · `Target Amount` · `Target Date` (required — live blocks submit without it) · `Category` (live set) · `Priority` (High/Medium/Low, default Medium) · `Cancel / Create Goal`
- Goal card: category emoji (Emergency 🛡️, Vacation 🏖️, Home 🏠, Car 🚗, Education 📚, Retirement 🌴, Other 🎯) · title · lowercase priority badge · edit + delete · `Progress` label + `X.X%` + progressbar · `$current / $target` · `N days remaining` · `Target: MM/dd/yyyy` · `Add Progress` button
- Add Progress dialog: title `Add Progress`, `Amount to Add` (required), `Cancel / Add Amount` → `POST /api/goals/[id]` progress endpoint (verify existing route shape; add if missing)
- Edit goal dialog (prefilled) → `PUT /api/goals/[id]`

**Verify:** browser — create goal with priority High; add progress; card shows `25.0%` style values; days remaining math correct; edit changes priority. Commit `feat: goals parity (priority, card anatomy, add progress)`.

---

## Task 9 — Accounts view parity

**Files:**
- Modify: `src/components/finara/accounts-view.tsx`, `src/app/api/accounts/route.ts` + `[id]/route.ts`

**Changes:**
- Account card: name · bank name · edit + delete icon buttons · `Balance` label + amount · `Last updated: MM/dd/yyyy` · `Import Transactions` link-button (navigates to Import view)
- Add/Edit Account dialog: `Account Name` (required) · `Bank Name` · `Account Type` (Checking/Savings/Credit Card/Investment/Other) · `Current Balance` (required) · `Cancel / Add Account`
- Drop the header `Sync` button and the `Combined net worth` footer line (not in live)

**Verify:** browser — add account; edit; delete; Import Transactions navigates. Commit `feat: accounts parity (card anatomy, edit, import link)`.

---

## Task 10 — Investments view parity

**Files:**
- Modify: `src/components/finara/investments-view.tsx`, `src/app/api/investments/route.ts` + `[id]/route.ts`

**Changes:**
- Add/Edit Investment dialog: `Symbol` (required) · `Type` select (live set) · `Company/Fund Name` (required) · `Shares` · `Avg Cost` · `Current Price` · `Portfolio %` · `Sector` (live 9-option set) · `Cancel / Add Investment`
- Holdings table: Symbol column shows symbol only (company name as `title` attr/tooltip); Gain/Loss cell `$X` (drop inline %); Actions = edit + delete
- KPI cards: drop sub-labels (`8 holdings`, `Unrealized`, `Since purchase`) for parity
- Keep `Sector Allocation` donut + `No sector data available.` empty text

**Verify:** browser — add investment with type + sector; edit; delete; table renders per live anatomy. Commit `feat: investments parity (type, portfolio %, table anatomy, edit)`.

---

## Task 11 — Analytics view parity

**Files:**
- Modify: `src/components/finara/analytics-view.tsx`, `src/lib/analytics.ts`

**Changes:**
- Add From/To date pickers (native date inputs, applied to the window when non-empty) next to the period select (`3 Months | 6 Months | 1 Year`)
- Trend chart: x-axis labels `Apr 26` (short month + 2-digit year); y-axis ticks full currency format `$0.00 $1,500.00 …` (drop compact `k` formatting on this chart); legend 3 items: `Income, Expenses, Net Savings`
- Averages: `avg = windowTotal / periodMonths` (fixes all-time-total bug; Task 3a module reuse)
- Expenses tab: `Spending by Category` donut (labels `Category: $X`) + `Top Spending Categories` horizontal bars (top 5 subcategories) — align titles exactly
- Income tab: `Income by Source` breakdown + `Monthly Income Trend`
- Investments tab: `Portfolio Allocation by Sector` donut — verify title matches

**Verify:** browser — with the live-mirroring data (1 expense $4.50, 1 income $5000) the averages show `$0.75 / $5,000.00 / $4,999.25`; period switch re-windows; date pickers narrow the range. Commit `feat: analytics parity (date range, labels, windowed averages)`.

---

## Task 12 — Shell misc parity (login OR divider, AI coach text, settings)

**Files:**
- Modify: `src/components/finara/login-view.tsx` (add `OR` divider; keep demo-credentials hint)
- Modify: `src/components/finara/ai-coach-dialog.tsx` (welcome text → live exact: `👋 Hi! I'm your AI financial advisor. I can help you analyze your spending, identify savings opportunities, and answer questions about your finances. What would you like to know?`; loading state `AI is thinking...`)
- Modify: `src/components/finara/settings-view.tsx` (`Select Finara Export File` becomes a real file input that round-trips a Finara JSON export: Expenses/Income/Goals/Accounts arrays → `POST /api/import` finara-export mode; currency/date lists from Task 1; default all notification switches `false` incl. seed change)
- Modify: `src/components/finara/import-view.tsx` (label the CTA `Upload and Extract`, disabled until a file is chosen; `Extracting...` state; error card `An Error Occurred` + `Start New Import` retry — parity with live error shape; keep the 3-step review flow)

**Verify:** browser — login shows `OR`; AI coach welcome matches; settings import round-trips an export file. Commit `feat: shell parity (login divider, AI text, JSON import, import labels)`.

---

## Task 13 — Full verification pass (Iron Law)

1. `bunx vitest run` → 0 failures (all domain tests).
2. `bun run lint` → clean. `bunx tsc --noEmit` → clean.
3. `bun run build` → exit 0 (must actually run this round; it was deferred in round 1).
4. Browser E2E script (agent-browser): login → all 9 views → add/edit/delete expense → add income → create goal + add progress → add account → add investment → filters + bulk delete → dark mode toggle + reload → mobile viewport spot-check → console error check (0 errors).
5. VLM side-by-side: `audit/live/15-*.png` vs new clone dashboard (light), `29-*.png` vs clone dark, `30-*.png` vs clone mobile — record verdicts.
6. Sync all changes into the repo tree at `/home/z/my-project/financial-dashboard` (`rsync` src/, prisma/, configs; re-run repo-side `bun install` lockfile sync; repo `bunx vitest run` + `tsc --noEmit`).

---

## Task 14 — Documentation alignment

- `README.md`: dark mode, filters/bulk/edit features, new taxonomy tables, test runner section (`bunx vitest run`), updated screenshots note.
- `AGENTS.md`: commands table adds `test`; invariants updated (taxonomy source-of-truth = `categories.ts`, placeholder-trend rule, goal-progress semantics, windowed averages).
- `CLAUDE.md`: extend the six-phase workflow with the TDD loop reference and parity-verification gates.
- `Project_Architecture_Document.md`: ADR-8 (dark-mode theme store), ADR-9 (pure domain layer + vitest seams), ADR-10 (taxonomy alignment + legacy map); update ER diagram (new fields), known-issues backlog refreshed.
- Commit: `docs: align documentation with remediated codebase`.

---

## Task 15 — Git push via SSH wrapper

1. `git add` changed paths; atomic commits per task group (already committed incrementally in Tasks 0-12, 14).
2. Save the user-supplied ED25519 deploy key to `/home/z/.ssh/finara_deploy` (0600, outside the repo).
3. Push via the repo's own wrapper: `python3 docs/ssh_git_wrapper_v3.py --key-file /home/z/.ssh/finara_deploy --remote git@github.com:nordeim/financial-dashboard.git --branch main` (per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).
4. Verify remote: `git ls-remote` shows the new HEAD on `main`.

---

## Out of scope (documented, not fixed)

- Live app's Base44 AI quota errors (`limit of integrations`, stuck `AI is thinking...`) — environment limits of the source app, intentionally NOT replicated; our AI routes stay deterministic-grounded.
- Live's hardcoded trend values are replicated ONLY as fallbacks (documented in AGENTS.md) — real month-over-month math wins when history exists.
- Google OAuth button is present but demo-local (login is a documented demo gate).

---

## Validation Addendum (post cross-check against the codebase, 2026-09-15)

Every task was cross-checked against the current source. Confirmed adjustments:

1. **`src/app/api/accounts/[id]/route.ts` and `src/app/api/investments/[id]/route.ts` expose ONLY `DELETE`** — edit endpoints must be ADDED (PATCH handlers with partial-update semantics mirroring `expenses/[id]`). Income/goals/expenses already have PATCH.
2. **`src/app/api/income/route.ts`** — `FREQUENCIES` set is `monthly|biweekly|weekly|one-time`; must become `monthly|weekly|biweekly|annual` and accept `category` (validated against `INCOME_CATEGORIES`). Error copy updated accordingly.
3. **Goals API** — POST accepts `category` but not `priority`; PATCH supports `contributeMinor` (the Add Progress flow already exists server-side). Add `priority` to POST/PATCH/DTO.
4. **`analytics-view.tsx`** — period select offers `3 / 6 / 12 Months`; the "12" label must read `1 Year` (live label), and the analytics API currently returns a fixed 6-month window with client-side slicing. Change: `GET /api/analytics?months=3|6|12` (default 6) computed server-side in the windowed pure module; the view refetches on period change.
5. **`ai-coach-dialog.tsx`** — loading text is `Thinking…` → change to `AI is thinking...` (live exact).
6. **`settings-view.tsx`** — `Select Finara Export File` is currently a toast-stub ("full export-file restore is not part of this demo") → becomes a real file input that round-trips Finara JSON exports.
7. **`import-view.tsx`** — already implements the 3-step flow, disabled CTA and per-row errors; only the live-shaped error card (`An Error Occurred` + `Start New Import`) and `Extracting...` label polish remain.
8. **`layout.tsx`** — `<html>` needs `suppressHydrationWarning` for the theme class toggle; `globals.css` has no `.dark` overrides yet (add Finara dark palette variables).
9. **Chart details** — trend chart already draws the `Net Savings` line (#3B82F6) with a default recharts `<Legend>`; axis fixes (full `$0.00` tick format, `Apr 26` labels) apply to the existing `XAxis/YAxis` props.
10. **Seed** — `_seeded`/`_seed_lock` Setting rows force idempotency; DB reset flow for the schema change: stop dev server → `rm db/custom.db` → `bunx prisma db push` → restart (ensureSeeded re-runs automatically).

Plan validated — all file paths, APIs, and behaviors verified present/as-described. Execution order: Tasks 0→15 sequential.
