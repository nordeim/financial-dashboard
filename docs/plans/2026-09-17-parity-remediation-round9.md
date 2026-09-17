# Round-9 Parity Remediation Plan — Functional Surfaces (Settings propagation, exports, AI Coach, Import error state)

Date: 2026-09-17 · Scope: functional parity on the surfaces rounds 2–8 never behaviorally
probed. All findings live-probed this round unless noted. Evidence:
`/home/z/my-project/captures/r9-live-*.{txt,png}` (outside the repo, per convention).

## §A Context

Round-8 delivered rendered-class-order parity (0 deltas) on every view surface and the
real-route architecture. The remaining risk surface is **behavior**: what the app DOES
when controls are used. This round probed the unprobed behaviors end-to-end on the live
app: the AI Coach thread, the Import CSV round-trip, Settings propagation (currency +
date format), the Analytics Export / From-To pickers, and the GDPR export. Two live
integrations are currently quota-dead server-side (AI chat and CSV extract both return
402 "limit of integrations for this month") — the probes still captured their UI
anatomy and failure states, and the clone's working implementations stay (deliberate
deltas, documented).

## §B Findings (F1–F12)

**F1 — AI Coach message-row class orders (order deltas, `r9-live-ai-coach-dialog.txt`):**

| Element | Live (raw) | Clone today |
|---|---|---|
| Card | `rounded-xl border text-card-foreground shadow w-full max-w-2xl h-[80vh] bg-white dark:bg-gray-800 flex flex-col` | DialogContent base-merge (different order, same set) |
| Body wrapper | `p-6 pt-0 flex-1 flex flex-col min-h-0` | `flex min-h-0 flex-1 flex-col p-6 pt-0` |
| Assistant row | `flex gap-3 justify-start` | `flex justify-start gap-3` |
| User row | `flex gap-3 justify-end` | `flex justify-end gap-3` |
| User wrapper | `max-w-[85%] flex flex-col items-end` | `flex max-w-[85%] flex-col items-end` |
| User bubble | `rounded-2xl px-4 py-2.5 bg-slate-800 dark:bg-slate-600 text-white` | `rounded-2xl bg-slate-800 px-4 py-2.5 text-white dark:bg-slate-600` |
| Assistant bubble | `rounded-2xl px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600` | `rounded-2xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700` |
| Quick-questions wrapper | `mt-4 mb-4` | `mb-4 mt-4` |
| Input row | `<div class="flex gap-2 mt-4">` | `<form className="mt-4 flex gap-2">` (element + order) |

Matches already correct: header (`flex flex-col space-y-1.5 p-6 shrink-0`), title row,
title classes, in-flow close (full ghost + `h-9 w-9`), avatar tile + dot, prose block,
`p.my-1 leading-relaxed text-slate-700 dark:text-slate-300`, quick-questions label,
chip classes, input (…`md:text-sm flex-1`), send button (default + `h-9 w-9`, disabled
when empty), quick-questions disappear after the first message.

**F2 — Live AI backend is quota-dead (402), failure is SILENT** (no toast, no error
text, user bubble stays, input clears). Clone keeps its working AI + failure toast —
deliberate delta (ADR to document), same bucket as round-4's toast decision.

**F3 — Import upload label misses the Label-primitive base** (round-8 implementation
gap: plan §C pinned the full string, the code pinned the short form):
live `text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer` (Label component +
tail) vs clone hand-written `font-medium text-indigo-600 hover:text-indigo-500
cursor-pointer`. Fix: render via the `Label` primitive (tw-merge output = live-exact).

**F4 — Import error state is a FULL replacement card, live anatomy**
(`r9-live-import-error.txt`): when extraction fails, the step card is REPLACED by
`rounded-xl border bg-card text-card-foreground shadow border-red-500` >
`flex flex-col items-center justify-center p-8` > CircleAlert `h-16 w-16 text-red-500`
(h-first — per-context exception like CloudUpload) > `h3.mt-4 text-xl font-bold`
"An Error Occurred" > `p.mt-2 text-neutral-500` (message) > DEFAULT-primary Button
`h-9 px-4 py-2 mt-6` "Start New Import" (resets to step 1 ✓). Clone today: an inner
`rounded-2xl border-red-200 bg-red-50` box with an X-circle icon, `text-base
font-semibold text-red-700` title, `text-red-600` text, outline-red button — wrong
anatomy at every level.

**F5 — Live CSV extract is quota-dead (402)** — the live error message text was
"You have reached the limit of integrations for this month. Please upgrade your plan".
The clone's working client-side parse stays (deliberate delta); its parse failures
now render through the F4 error card (live anatomy) instead of the red-50 box.

**F6 — Settings propagate app-wide on live (MAJOR functional gap):** saving EUR
reformats every money figure on every view (€ everywhere, persists reload); saving
dd/MM/yyyy reformats every date (15/09/2026). The clone's settings only reach the
settings view; all other views hardcode USD + MM/dd/yyyy. Fix: a `useSettings()` hook
+ threading `{ currency }` into every `formatMoney`/`formatMoneyCompact` call and
`dateFormat` into every `formatDate` call; `budgetRemainingLabel` gains a currency
parameter; quick-amount chips follow the setting (expense `+ USD5` → `+ {code}5`
income `+$5.00` → `+{symbol}5.00` — the EUR variants are unprobed; the USD templates
are live-captured).

**F7 — Analytics Export downloads a TRANSACTIONS CSV** (`financial-report-YYYY-MM-DD.csv`):
all-quoted header `"Date","Description","Category","Subcategory","Amount","Type"`;
rows: expenses (date-only `2026-09-15`, Type `Expense`), income (ISO-with-microseconds
`2026-09-15T02:04:11.612000`, Type `Income`), investments (Type `Investment`); amounts
raw decimals (`4.5`, `5000`, `1750`); row order = expenses, income, investments
(3-row sample: both groupings coincide — documented ambiguity). Clone today exports a
`Month,Income,Expenses,Net Savings` trend CSV as `finara-analytics.csv` — wrong
format + filename. Fix: `GET /api/export?type=transactions` returns the live CSV
server-side; the view downloads it as `financial-report-<date>.csv`.

**F8 — Analytics From/To date inputs are INERT on live** (any range leaves the chart
ticks unchanged — unfinished live wiring, same class as the Bulk Edit options).
Clone filters its trend by them — behavioral delta. Fix: drop the filter, render the
inputs uncontrolled (`value=""` state removed); keep aria-labels + `w-auto`.

**F9 — GDPR export shape + filename** (live blob captured): filename
`finara-export-<email>-<date>.json`; shape `{ user: {id, email, full_name,
exportDate}, data: { expenses, income, savings_goals, investments, bank_accounts },
summary: {total_expenses, total_income_sources, total_goals, total_investments,
total_accounts} }`; snake_case fields; amounts decimals; per-collection field lists:

- expenses: `date` (date-only), `amount`, `notes`, `title`, `category`,
  `subcategory`, `is_recurring`, `id`, `created_date`, `updated_date`,
  `created_by_id`, `created_by`, `is_sample`
- income: `amount`, `is_active`, `category`, `source_name`, `frequency`, `id`,
  `created_date`, `updated_date`, `created_by_id`, `created_by`, `is_sample`
- savings_goals: `current_amount`, `target_amount`, `is_active`, `target_date`,
  `title`, `category`, `priority`, `id`, `created_date`, `updated_date`, …
- investments: `shares`, `symbol`, `portfolio_percentage`, `investment_type`,
  `last_updated`, `name`, `purchase_price`, `current_price`, `sector`, `id`, …
- bank_accounts: `bank_name`, `account_type`, `manual_balance`, `last_updated`,
  `account_name`, `id`, `created_date`, `updated_date`, …
- timestamps: `created_date`/`updated_date` are Z-less with 6 microsecond digits
  (`2026-09-15T02:04:11.612000`); `last_updated` carries `Z`.

Clone today: flat camelCase 7-collection shape (includes budgets + settings, which
live does NOT export), no `user`/`data`/`summary` wrapper, filename without email.
Fix: `/api/export` emits the live shape; the settings-view download name gains the
demo email; `normalizeFinaraExport` accepts the live shape (unwraps `data`, maps
snake_case keys + `title`, decimal `amount`s, lowercase categories, collection keys
`income`/`savings_goals`/`bank_accounts`) in addition to the legacy clone shape;
investments become restorable (new `InvestmentInsert` bucket + route insert).

**F10 — Verified matches (no work):** Refresh button anatomy + classes, Budget card
read-only, Add Progress dialog anatomy + "Add Amount", period select (3M/6M/1Y,
default 6), currency list (10), settings selects behavior, quick chip labels (USD
state), AI coach greeting + 5 quick questions, user-menu items.

**F11 — Analytics axis tick formats (r7 captures re-read):** BOTH axes use full
`formatMoney` — Overview `$1,500.00`-style AND the Expenses-tab bar axis
(`$0.00`, `$2.00`, `$4.00`…). The clone's bar axis uses `formatMoneyCompact`
(`$2` — a visible delta) and is its ONLY consumer → the tick flips to
`formatMoney` and `formatMoneyCompact` is deleted (dead code).

**F12 — Stale docs contradicting ADR-021** (fix in the docs pass): AGENTS.md
"Single page route by design…" invariant; CLAUDE.md "single route" (×2); README
"10-row pagination", "Single-route SPA entry", "156 unit tests" (line 202),
"pagination" in the verification paragraph; PAD §11 expenses-view "pagination".

## §C File-by-file change specs

1. **`src/components/finara/ai-coach-dialog.tsx`** — F1: card via a new
   `cardClassName` prop on DialogContent carrying the full live literal; body wrapper
   `p-6 pt-0 flex-1 flex flex-col min-h-0`; rows `flex gap-3 justify-start|end`;
   user wrapper `max-w-[85%] flex flex-col items-end`; bubbles to live orders;
   quick-questions wrapper `mt-4 mb-4`; input row `<div className="flex gap-2 mt-4">`
   with Enter-to-send via input `onKeyDown` (form removed).
2. **`src/components/ui/dialog.tsx`** — add optional `cardClassName?: string` to
   DialogContent: when provided, the card renders `cn(cardClassName)` alone (no base
   merge). Backwards compatible; existing pins unaffected.
3. **`src/components/finara/import-view.tsx`** — F3: upload label via the `Label`
   primitive (htmlFor + the indigo tail). F4/F5: the error state becomes the full
   replacement card (border-red-500 card, `flex flex-col items-center justify-center
   p-8` body, CircleAlert `h-16 w-16 text-red-500`, `mt-4 text-xl font-bold` title,
   `mt-2 text-neutral-500` message, default Button `h-9 px-4 py-2 mt-6`); the step
   card is hidden while the error shows; `reset()` clears it (existing).
4. **`src/hooks/use-api.ts`** (or co-located) — F6: export a `useSettings()` hook:
   `useQuery<SettingsDto>("/api/settings")` → `{ currency, dateFormat }` with
   USD/MM-dd defaults.
5. **`src/lib/money.ts`** — F6/F11: DELETE `formatMoneyCompact` (its only consumer
   flips to `formatMoney`); add `currencySymbol(currency)` helper for the income
   chips (`€` for EUR, `$` for USD — Intl-derived).
6. **`src/lib/dashboard-kpis.ts`** — F6: `budgetRemainingLabel(limitMinor,
   remainingMinor, currency = "USD")`.
7. **Views (F6 threading)**: dashboard (7 formatMoney + fallback `"$0.00"` +
   budget labels + the one formatDate), expenses (4 + row dates), income (4),
   accounts (2 + lastSynced date), investments (7), goals (4 + target dates),
   analytics (10 + tick formatters), add-transaction-dialog chips
   (expense `+ {currency}{units}`, income `+{symbol}{units.toFixed(2)}`).
8. **`src/components/finara/analytics-view.tsx`** — F7: `exportCsv` fetches
   `/api/export?type=transactions`, blob-downloads as
   `financial-report-${YYYY-MM-DD}.csv` (toast stays — documented delta). F8:
   remove the fromDate/toDate trend filter + its state; inputs render uncontrolled.
9. **`src/app/api/export/route.ts`** — F7/F9: `type=transactions` returns the live
   CSV (header + expenses/income/investments rows, quoting, date formats); default
   JSON becomes the live shape (user/data/summary, snake_case, 5 collections,
   per-collection field lists, Z-less microsecond timestamps, demo user identity).
10. **`src/lib/import-export.ts`** — F9: normalize the live shape (unwrap `data`,
    snake_case keys, `title`, decimal amounts, lowercase categories, new collection
    keys) + `InvestmentInsert` bucket; legacy clone shape still accepted.
11. **`src/app/api/import/route.ts`** — F9: insert investments on
    finara-export restore.
12. **`src/components/finara/settings-view.tsx`** — F9: download filename gains the
    demo email (`finara-export-<email>-<date>.json`).
13. **Docs pass (F12)** — AGENTS.md / CLAUDE.md / README.md / PAD stale statements
    + this round's invariants + ADR-022 (functional parity: settings propagation,
    export formats, inert From/To, deliberate working-AI/working-import deltas).

## §D TDD plan (red → green)

New spec file `src/lib/__tests__/functional-parity.test.ts` (+ additions to
`import-export.test.ts`, `money.test.ts`, `dashboard-kpis.test.ts`):

1. `money`: `currencySymbol("EUR")` → `€`; USD default `$`; `formatMoneyCompact`
   no longer exported (bar axis uses full formatMoney — F11).
2. `dashboard-kpis`: `budgetRemainingLabel(…, "EUR")` renders € strings; USD default
   unchanged.
3. `import-export`: normalize the captured live export JSON (all 5 collections,
   snake_case) → correct inserts (title→description/name, decimal→minor, lowercase
   category → capitalized, `savings_goals`/`bank_accounts`/`income` keys,
   `target_date`→deadline, investments bucket); legacy camelCase shape still
   normalizes; decimals round to minor units.
4. Source contracts (file-read pattern per `view-surfaces.test.ts`): ai-coach
   renders the F1 literal strings; import-view renders the Label-primitive label +
   the F4 error card literals (no `border-red-200 bg-red-50` box); analytics-view
   has no trend filter + the transactions export filename; export route contains
   the live CSV header + wrapper keys; settings-view filename includes the email;
   views thread `{ currency }` / `dateFormat` (representative greps); dialog.tsx
   `cardClassName` passthrough.

## §E Verification plan

- Gates: `bun run lint` · `bun run typecheck` · `bun run test` (210 + new) ·
  `bun run build`.
- Browser (dev server): EUR + dd/MM/yyyy save → dashboard/expenses/goals/
  investments/accounts/analytics all reformat (money + dates) after navigation,
  revert to USD restores; analytics Export downloads the live-shaped CSV
  (intercept anchor.download + blob text); From/To typing leaves chart ticks
  unchanged; AI coach dialog renders the live card order (eval class strings);
  import error card renders on a malformed CSV; GDPR export shape spot-check via
  `/api/export`; zero console errors.
- Live etiquette: none required this round (no live data was mutated; the live app
  was left at `/`, dark theme, USD + MM/dd/yyyy, 6 Months — already done).

## §F Validation against the codebase (pre-execution)

- `formatMoney` already takes `{ currency }` (money.ts:20) — only call sites change.
- `formatDate(iso, format)` already parameterized (date-format.ts:12) — call sites
  pass the setting.
- `useQuery` (use-api.ts) fetches per mount; views remount on route switch →
  navigation picks up fresh settings, matching the live navigation behavior.
- `SettingsDto` (types.ts:137) already carries `currency` + `dateFormat`.
- Import route inserts 4 collections today (route.ts:101–104); the Investment model
  matches the live fields (symbol/name/type/shares/avgPriceMinor/currentPriceMinor/
  portfolioPercent/sector).
- DialogContent (dialog.tsx:44–78) is the single card-render seam — `cardClassName`
  is a contained addition; `DIALOG_CARD_BASE` pin untouched.
- Risks: (a) money.ts `formatMoneyCompact` change affects analytics bar axis labels
  in USD too (`$3.0k` → `$3.0K`-style) — Intl compact renders `US$`? No:
  `Intl.NumberFormat("en-US", {currency:"USD", notation:"compact"})` → `$1.5K`;
  visually equivalent, spec-pinned. (b) export shape change breaks nothing else —
  only settings-view + tests consume `/api/export`. (c) chips: EUR variants are
  reasoned (USD templates live-captured) — documented.

## §G Execution & verification record

**TDD red phase:** 26 failing specs in the new
`src/lib/__tests__/functional-parity.test.ts` (money currency helpers, budget-label
currency, live-shape normalization, AI-coach/import/analytics/export/settings source
contracts) — all 215 existing tests stayed green (241 total after green, 242 after the
AI-route pin below).

**Green phase (F1–F11):**
- F1 ai-coach: DialogContent gained `cardClassName` (full card replacement — the live
  merge order cannot come out of `cn(DIALOG_CARD_BASE, …)`); the dialog renders the
  live card literal, body wrapper `p-6 pt-0 flex-1 flex flex-col min-h-0`, rows
  `flex gap-3 justify-start|end`, user wrapper `max-w-[85%] flex flex-col items-end`,
  live bubble orders, `mt-4 mb-4` quick-questions, and the input row as a DIV
  (`flex gap-2 mt-4`, Enter-to-send via onKeyDown, send button onClick).
- F3 import label: rendered through the `Label` primitive (base + indigo tail) —
  the round-8 gap where the plan documented the full string but the code pinned the
  short form.
- F4/F5 import error card: full replacement card (border-red-500, CircleAlert
  `h-16 w-16` — a second live h-first exception, per-class allow-list in
  dialog-forms.test.ts), `mt-4 text-xl font-bold` title, `mt-2 text-neutral-500`
  message, default Button `h-9 px-4 py-2 mt-6`; the red-50 box is gone; parse
  failures (header/column/rows) render through it.
- F6 settings propagation: `useSettings()` hook (use-api.ts) consumed by all 7 data
  views + add-transaction-dialog; `formatMoney` call sites thread `{ currency }`
  (dashboard KPIs + fallback + budget rows + activity, expenses totals + rows,
  income hero + cards + equivalents, accounts balances, investments KPIs + table,
  goals amounts, analytics averages + BOTH chart axes + tooltips);
  `budgetRemainingLabel(…, currency)`; `SurplusBadge currency`; `formatDate` sites
  thread `dateFormat` (expenses rows, accounts Last updated, goals Target, dashboard
  activity); chips: expense `+ {currency}{units}`, income `+{symbol}{units.toFixed(2)}`
  (`currencySymbol` helper); both AI routes read the currency server-side
  (`readSettingsCurrency` — insight facts/budget notes/chat snapshot grounding).
- F6 hardening (browser-caught): all client fetches now `cache: "no-store"`
  (the API sends no Cache-Control header — browsers heuristically cached
  /api/settings and stale USD/GBP/EUR values leaked after saves); the shell-level
  `AddTransactionDialog` renders mount-on-open (`{txnDialogOpen ? <…/> : null}`) so
  its settings slice is fresh per open. Pinned by the AI-route + no-bare-formatMoney
  specs.
- F7 analytics export: `exportCsv` fetches `/api/export?type=transactions` and
  downloads `financial-report-<date>.csv` (toast retained — documented delta).
- F8 From/To: filter logic + state removed; inputs render uncontrolled (`w-auto`).
- F9 exports: `/api/export` emits the live GDPR shape (user/data/summary,
  snake_case, decimals, `title` names, Z-less microsecond `created_date`/
  `updated_date`, `last_updated` with Z, byline `created_by_id`/`created_by`/
  `is_sample` from `src/lib/demo-user.ts`) and `?type=transactions` the live CSV
  (all-quoted header, expenses date-only, income/investments microStamp, grouped
  expenses→income→investments, raw decimals);
  `normalizeFinaraExport` accepts the live shape (data-unwrap, snake_case keys,
  title→name, decimal→minor, lowercase category capitalization, `source_name`,
  `target_date`, `account_name`/`bank_name`/`manual_balance`/`last_updated`) AND the
  legacy clone shape; `InvestmentInsert` bucket + route insert (investments
  restorable); settings-view download name gains the demo email.
- F11: `formatMoneyCompact` deleted; the bar-axis tick flips to `formatMoney` (its
  only consumer).

**Gates:** lint 0 · tsc 0 · **242/242 tests** (210 + 32 new) · `next build` 0 (16/16).

**Browser verification (executed, dev server):** AI coach renders the live card/
body/row/bubble/input-row strings (eval-checked), a sent message renders the live
user row + bubble, quick-questions disappear after the first message, and the
working reply arrives (deliberate delta — the live AI backend is 402 quota-dead
with SILENT failure); the import error card renders the live anatomy on a
malformed CSV (header-less columns) and Start New Import resets to step 1; the
upload label renders the Label base + indigo tail; EUR + dd/MM/yyyy save →
dashboard 21€/0$, expenses 101€ with all 97 rows on dd/MM/yyyy, income/accounts/
investments/goals/analytics all reformat, AI insight text carries €, budget
surplus pill carries €; GBP round-trip verified; USD + MM/dd/yyyy restored
(API-verified); analytics Export downloads `financial-report-2026-09-17.csv`
(anchor.download intercept) with the transactions CSV body (curl-verified);
From/To set to any range leaves the chart ticks unchanged (Apr 26 – Sep 26);
quick-amount chips follow the setting WITHOUT reload after the mount-on-open fix
(`+ EUR1…` expense, `+€1.00…` income); GDPR export filename
`finara-export-sepnetflix2023@outlook.com-2026-09-17.json`; zero console errors.

**Live etiquette:** the live app was left at `/`, dark theme, USD + MM/dd/yyyy,
6 Months (restored + verified during the round-9 probe session); no live data was
mutated (the live AI/CSV backends are quota-dead; nothing persisted).

**Deferred / documented:** EUR chip variants reasoned from the USD templates
(live evidence is USD-only); the clone's working AI + working CSV parse remain
deliberate deltas vs the quota-dead live integrations; the toast on analytics
export remains (live shows none — round-4 toast bucket); `.csv,.txt` file-input
accept stays (advertising .xls/.xlsx would fail at parse time — round-4 decision).

