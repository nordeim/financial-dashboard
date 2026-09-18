# Finara — Smart Finance Tracker

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748) ![SQLite](https://img.shields.io/badge/SQLite-3-003B57) ![CI](https://github.com/nordeim/financial-dashboard/actions/workflows/ci.yml/badge.svg)

A personal-finance dashboard web application: income, expenses, 50/30/20 budgets, accounts, investments, savings goals, CSV bank import, analytics reports, and AI-powered insights — modeled as a faithful, production-grade clone of the Finara dashboard.

## Overview

Finara solves the "where did my money go?" problem with a single, real-time surface: it tracks every income source and expense, categorizes spending along the 50/30/20 rule (Needs / Wants / Savings), monitors monthly budgets with progress bars, follows investment holdings and savings goals, and explains it all through an AI coach that answers questions grounded in your live numbers. The app is a single-page Next.js application backed by a typed REST API over Prisma/SQLite, with money stored exclusively as integer minor units so floats never touch financial arithmetic.

## Key Features

| Feature | What it does |
|---------|--------------|
| 📊 **Financial Dashboard** | Monthly income/expenses/net/balance KPIs with source-parity emerald trend chips, savings goal progress, largest expense category, active goals, 50/30/20 budget overview with colored-dot rows, arrow-icon recent activity, AI insights, bottom quick-action links, floating action button (FAB) that opens a two-step **Quick Add** chooser and rotates its plus into an X while open |
| 🌙 **Dark Mode** | User-menu toggle + mobile sun/moon button; the theme follows the account — every toggle persists server-side (`/api/settings`), sign-out resets to light (login always renders light), sign-in re-applies the account's theme; full dark palette across all 9 views, dialogs, and the login card |
| 💸 **Expenses** | Emoji quick-select modal, currency-following quick-add chips, Needs/Wants/Savings segmented tabs, search, collapsible Filters panel (date-range presets, category, min/max amount, sort), blue bulk bar (Select All / inert Bulk Edit / delete), row edit dialog, native `confirm()` deletes, all filtered rows render (no pagination — live parity), FAB |
| 💰 **Income Sources** | Emerald hero card with monthly total, per-source frequency (monthly/weekly/bi-weekly/annual) normalized to monthly equivalents, income categories (primary/secondary/passive/other), active toggle, edit dialog, native `confirm()` deletes |
| 🏦 **Accounts** | Checking/savings/credit-card/investment/other accounts with live-exact type icons (banknote/landmark/building), balance block layout, edit + delete with native `confirm()`, and an Import Transactions link |
| 📈 **Investments** | Holdings by type (stock/ETF/bond/crypto/mutual fund) with portfolio %, gradient portfolio-value/gain KPI cards, sector allocation as a fixed-color dot list (colors verified per sector name), edit + delete with native `confirm()` |
| 🎯 **Savings Goals** | Purple-gradient tiles with live-exact category emoji (🛡️ ✈️ 🏠 🚗 🎓 🏖️ 🎯), priority badges (red/yellow/green), progress bars, deadlines, one-click Add Progress |
| 📥 **CSV Import** | Source-parity 3-step flow: upload → Upload and Extract (with Extracting… state) → review with smart category guessing → import; live-shaped error card with Start New Import retry |
| 🧭 **Analytics** | 3/6/12-month windows, segmented 4-tab control (Overview/Expenses/Income/Investments), windowed monthly averages, income vs expenses trend, category donuts, sector allocation, all-transaction CSV export (`financial-report-<date>.csv` — live parity); From/To date inputs render but are inert (verified source quirk), Income tab renders empty (verified source quirk) |
| 🤖 **AI Coach & Insights** | Chat grounded in your live financial snapshot; dashboard AI Insights as PERSISTED records (round-13 live redesign: type icon + badge, dismiss X, suggested-action callout, confidence footer, generate-once-when-empty, refresh re-lists) with deterministic drafts + optional env-gated LLM polish |
| 🔐 **GDPR Export & Restore** | One-click full JSON export; Settings page round-trips a Finara export file back into the database (finara-export import mode) |
| 🧪 **Unit Tests** | Vitest suite (311 tests) covering money math (incl. signed minor units — negatives end-to-end, the `-$0.00` −0 edge), taxonomy, KPI computation (incl. income activity categories), filters (incl. the null default min), date formats, export normalization (incl. the live snake_case GDPR shape + negative-amount restore), source-exact UI maps, quick-select tile labels, the pinned shadcn primitive class sets (incl. the round-11 Select-popup pins), the live-probed semantic design tokens (incl. the round-10 primary-family re-pin), the login-page class sets, the round-7 dialog form-body + icon-order source contracts, the round-8 view-surface order contracts (incl. the round-12 bare `Finara` login title), the round-9 functional-parity contracts (settings propagation, export shapes, inert From/To, import error card, AI-coach orders), the round-10 theme-lifecycle contracts (sign-out reset, sign-in server-theme apply, toggle persistence), the round-11 interactive-state contracts (no `min="0"` anywhere, investment form attrs + optional current price, goal complete-state — emerald ring + Complete badge + Add Progress removal at ≥ 100%, goal POST/PATCH uncapped, borderless ghost chart tooltip, legend census 1/0/0/0), the round-12 contracts (unauth deep-link title settling + the non-modal Quick Add chooser pin), and the round-13 contracts (persisted insight records — the pure draft builder + the positional `mergePolishedDrafts` LLM-polish join, dialog div-titles, the chooser overlay>wrapper>card structure, the animation-removal sweep, the Progress indeterminate mechanism) |
| 🎭 **E2E Suite** | Playwright E2E (67 specs, 11 files) running against the production build on :3100 with a hermetic `db/e2e.db` — locks the golden paths: login round trips + titles, theme lifecycle, dashboard (incl. the live indeterminate progressbars + AI-insight records with dismiss/refresh), expense CRUD + filters + bulk bar, FAB Quick Add + toggle, income/goal/account/investment CRUD, analytics tabs + ghost tooltip + inert From/To, CSV import + settings-independent exports + GDPR round-trip, EUR/dd-MM-yyyy propagation, mobile drawer, and a zero-console-errors sweep over all 9 views |
| 🌙 **Responsive** | Sidebar on desktop, full-screen mobile drawer with Synced badge; WCAG-minded focus states and aria labels; staggered CSS entrance animations (`prefers-reduced-motion` safe) |

## Architecture

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Web framework | Next.js (App Router) | 16.1.3 | Server rendering + REST route handlers |
| UI runtime | React | 19 | Component model (React Compiler enabled) |
| Language | TypeScript (strict) | 5 | Type safety across the client/server boundary |
| Styling | Tailwind CSS | 4 (CSS-first `@theme`) | Utility styling + design tokens |
| Components | shadcn/ui (new-york) + Radix | latest | Accessible primitives |
| Charts | Recharts | 2.15 | Analytics visualizations |
| ORM | Prisma | 6.19 | Typed SQLite data access |
| Database | SQLite | 3 | Embedded storage (`db/custom.db`) |
| AI | z-ai-web-dev-sdk | 0.0.18 | Server-only AI coach / insights |
| Linting | ESLint 9 (flat config) | 9 | Code-quality gate |
| Runtime | Bun (or Node ≥ 20) | ≥ 1.3 | Package manager + dev server |

## Quick Start

Requires **Bun ≥ 1.3** (or Node.js ≥ 20 with npm — commands below use `bun`).

1. Clone and install:

   ```bash
   git clone git@github.com:nordeim/financial-dashboard.git
   cd financial-dashboard
   bun install
   ```

2. Configure the database (Prisma resolves the relative path from `prisma/schema.prisma`):

   ```bash
   cp .env.example .env
   bun run db:push
   ```

3. Start the dev server:

   ```bash
   bun run dev
   ```

4. Open <http://localhost:3000> and sign in with the demo credentials shown on the login card.

### Verify Setup

- `bun run lint` → exits 0, no output.
- `bun run typecheck` → exits 0, no output.
- `bun run test` → 311 tests passing (Vitest).
- `bun run test:e2e` → builds the app and runs 67 Playwright specs (the webServer sets `FINARA_INSIGHTS_LLM_OFF=1` — deterministic insight records) against the production build on :3100 (hermetic `db/e2e.db`; the dev DB is never touched).
- First visit to any API route (e.g. the dashboard) auto-seeds a six-month demo history: 4 accounts, 4 income sources, ~96 expenses, 3 budgets, 3 goals, 8 holdings. Seeding is idempotent and concurrency-safe (DB-level unique-key lock + completion marker).

## Demo Credentials

| Email | Password |
|-------|----------|
| `sepnetflix2023@outlook.com` | `Abcd1234` |

The login gate mirrors the original Finara sign-in screen. **It is a demo credential check, not production authentication** — see [Security](#security).

## File Hierarchy

```
financial-dashboard/
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📄 page.tsx                    # `/` route (login gate + dashboard)
│   │   ├── 📂 [view]/                     # Catch-all route (real paths: /Dashboard … /Settings + 404)
│   │   ├── 📄 layout.tsx                  # Inter font, metadata, toaster
│   │   ├── 📄 globals.css                 # Tailwind v4 tokens + Finara source-exact design system
│   │   └── 📂 api/                        # 12 REST route groups (see API Reference)
│   ├── 📂 components/
│   │   ├── 📂 finara/                     # App components (16): views, dialogs, shell
│   │   └── 📂 ui/                         # shadcn/ui primitives (pinned to the live
│   │   │                                  # app's classic class sets — see PAD ADR-015)
│   ├── 📂 hooks/                          # use-api (typed fetch), use-toast
│   └── 📂 lib/                            # money, categories, types, analytics, seed, api,
│                                          # dashboard-kpis, expense-filters, date-format,
│                                          # import-export, ui-maps (pure domain modules, TDD)
│                                          # + __tests__/ (Vitest, 311 tests)
├── 📂 prisma/
│   └── 📄 schema.prisma                   # 7 models, money as integer minor units
├── 📂 db/                                 # SQLite runtime storage (gitignored; e2e.db is
│                                          # recreated per E2E run)
├── 📂 docs/                               # Wrapper script, push runbook, reference image,
│                                          # plans/ (remediation plans), session logs
├── 📂 e2e/                                # Playwright E2E suite (11 spec files, 67 specs)
│                                          # + helpers.ts + fixtures/
├── 📂 public/                             # finara-logo.png (login logo asset)
├── 📂 .github/workflows/                  # CI: lint → typecheck → unit → E2E on every push/PR
├── 📄 playwright.config.ts                # E2E runner (prod build :3100, hermetic e2e.db)
├── 📄 vitest.config.ts                    # Vitest runner (node env, @ alias)
├── 📄 AGENTS.md                           # Agent instructions
├── 📄 CLAUDE.md                           # Claude Code project instructions
└── 📄 Project_Architecture_Document.md    # Full architecture reference (PAD)
```

## API Reference

All routes return a uniform envelope: `{ "ok": true, "data": … }` or `{ "ok": false, "error": "…" }`. Money values are integer minor units (cents).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | KPI aggregation, budget progress, recent activity, 6-month trend |
| `/api/income` | GET, POST | List / create income sources |
| `/api/income/[id]` | PATCH, DELETE | Update (pause/amount) / delete a source |
| `/api/expenses` | GET, POST | List / create expenses (validated category + subcategory) |
| `/api/expenses/[id]` | PATCH, DELETE | Update / delete an expense |
| `/api/accounts` | GET, POST | List / connect accounts |
| `/api/accounts/[id]` | PATCH, DELETE | Update / remove an account |
| `/api/budgets` | GET, PUT | List / upsert the three 50/30/20 category budgets |
| `/api/goals` | GET, POST | List / create savings goals (category + priority) |
| `/api/goals/[id]` | PATCH, DELETE | Contribute / update / delete a goal |
| `/api/investments` | GET, POST | List / add holdings |
| `/api/investments/[id]` | PATCH, DELETE | Update / remove a holding |
| `/api/import` | POST | Batch CSV import (`rows` mode) or Finara JSON export restore (`mode: "finara-export"`); row-level validation, ≤ 2000 rows |
| `/api/analytics` | GET | Trends, category breakdowns, portfolio metrics (`?months=3\|6\|12`) |
| `/api/settings` | GET, PUT | Currency, date format, theme (light/dark), notification toggles |
| `/api/ai/chat` | POST | AI coach chat (messages array → grounded reply) |
| `/api/ai/insights` | GET | Dashboard insight cards (LLM-polished, deterministic fallback) |
| `/api/export` | GET | ⚠️ GDPR full-data JSON download (live snake_case `{user,data,summary}` shape); `?type=transactions` returns the analytics transactions CSV |

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | SQLite file URL, relative to `prisma/schema.prisma` | `file:../db/custom.db` (via `.env.example`) |

## Design System

Adopted from the source app's own stylesheet and DOM (round-3 live evidence):

| Token | Value | Usage |
|-------|-------|-------|
| `--primary-sage` | `#059669` (emerald-600) | Sage CTAs (header add-buttons, dialog submits), FAB, active nav accent |
| `--primary` | `#171717` light / `#fafafa` dark (neutral ink/paper) | Progress fills, checked switches/checkboxes, default-variant buttons |
| `--primary-navy` | `#1E293B` (slate-800) | Headings, sidebar gradient base |
| Sidebar | `sidebar-gradient` (vertical navy ramp) | Navigation chrome; active pill `bg-emerald-500/20` + emerald border |
| Page background | `bg-gradient-to-br from-slate-50 to-blue-50` / `dark: gray-900→gray-800` | App shell |
| Card surface | `bg-white/80 backdrop-blur-sm shadow-lg` (+ `.card-hover` lift) | All cards |
| Income | emerald-500→600 gradients | KPI tile, income hero card |
| Expenses | red-500→600 gradient | Expense total card, row amounts |
| Net balance / blue | blue-500→600 gradient | Net KPI, portfolio value card |
| Savings / purple | purple-500→600 gradient | Savings KPI, goal tiles |
| Feature gradients | orange/cyan/blue/purple 500→600 | Dashboard action tiles |
| Sector colors | 9 fixed per-sector hexes (`src/lib/ui-maps.ts`) | Investments sector dots/donut |

Typography: the **Tailwind default system stack** (`ui-sans-serif, system-ui, sans-serif, …`) — the live app's computed truth (its Inter `@import` is overridden by the root `font-sans`; the clone keeps `next/font` Inter loaded on `<body>` the same way). No tabular numerals (live renders `font-variant-numeric: normal` everywhere).
All add/edit dialogs are **centered modals** (`max-w-2xl`); deletions use the browser's
native `confirm()`. Entrance animations are CSS-only staggered fade-ups.

Palette: every Tailwind color token the UI uses (102 across 14 families) is **pinned to
the Tailwind v3 hex values** the live app renders (v4's regenerated ramp drifts — e.g.
blue-600 `#155dfc` vs live `#2563eb`); see the `:root` pin block in `src/app/globals.css`
and ADR-018. Charts render the live config: both grid directions, visible axis/tick
lines (`#64748b`), `dark:stroke-gray-600` grid / `dark:stroke-gray-400` axes (dark grid
computes `rgb(75,85,99)` — live-probed), default legend icon, lowercase hex strokes.

Round 6 (ADR-019) additionally pins **the shadcn semantic theme and the Tailwind utility
scales** to the live app's computed truth: the semantic tokens resolve to the classic
shadcn *neutral* values (light `--background #ffffff`, `--muted-foreground #737373`,
`--border/--input #e5e5e5`, `--ring #0a0a0a`; dark `#0a0a0a` / `#a3a3a3` / `#262626`),
the radius scale renders the v3 values (`rounded-md` 6px, `rounded-lg` 8px, `rounded-xl`
12px), and `backdrop-blur-sm` renders 4px — all live-probed via computed styles in both
themes and pinned by `src/lib/__tests__/design-tokens.test.ts`. Do not "modernize" these
to the v4/oklch defaults. **Round 10 amended the primary family** (variable-level probe):
`--primary`/`--primary-foreground` are the neutral ink/paper pair (light `#171717`/
`#fafafa`, dark `#fafafa`/`#171717`) — NOT sage — so progress fills, checked switches and
checkboxes, and default-variant buttons render monochrome; dark `--ring` is `#d4d4d4`,
dark `--destructive` is `#7f1d1d`, and `--destructive-foreground` is `#fafafa` in both
themes. The sage CTAs keep styling via the separate `--primary-sage`.

Round 7 (ADR-020) pins **the dialog form bodies and the icon class order** to the live
DOM: income quick-amount chips render compact (`h-8 px-3 text-xs`) while expense chips
stay default-size, form grids render `gap-4`, buttons rows are `flex gap-3 pt-4` with
`flex-1` (Add Account keeps `justify-end` + a default primary submit; Add Progress
drops the pt), edit submits read "Update X" (accounts: "Save Changes"), label ids are
the live snake_case set, and every lucide icon in the app views renders `w-X h-X` with
margins after — all pinned by `src/lib/__tests__/dialog-forms.test.ts`.

Round 9 (ADR-022) pins **functional behavior**: saving a currency or date format in
Settings reformats every figure and date app-wide (and persists reloads); the Analytics
Export downloads a live-shaped all-transactions CSV (`financial-report-<date>.csv`);
the GDPR export emits the live snake_case `{user, data, summary}` JSON with the account
email in the filename; quick-amount chips follow the currency; the import error state
is the live replacement card; and the AI coach dialog renders the live class orders —
all pinned by `src/lib/__tests__/functional-parity.test.ts`.

Round 10 (ADR-023) pins **the theme lifecycle**: signing out resets the UI to light and
clears the stored theme (the login page always renders light); signing in re-applies the
account's server-side theme; and every in-app toggle persists it (fire-and-forget
`PUT /api/settings`) — so the preferred theme follows the account across sign-out/sign-in
cycles, exactly like the source app. The mobile menu button swaps its glyph Menu↔X while
the drawer is open. Also verified this round: the EUR quick-amount chips, the explicit
Save-Settings flow, and the long-title/hidden-input overflow quirks (shared with the live
app) — see `docs/plans/2026-09-17-parity-remediation-round10.md`.

Round 11 (ADR-024) replicates **the live app's zero-amount-validation behavior**: money
stays integer minor units but is **signed** — negative expenses/income/balances/goals/
investments persist and render (`-$5.50`, the expense row even keeps the live double-minus
`--$5.50` quirk; `formatMoney` renders `-$0.00` for −0), every `min="0"` was removed from
the forms, the API guards accept any signed integer / finite number
(`requireSignedInt`/`requireFiniteNumber`), negative goal contributions stay a silent
no-op (PUT 200, unchanged — live-probed), and goal progress is never capped (150% over
target renders 150.0%). The round also pinned the **interactive states**: the chart
tooltip is the live's borderless ghost overlay (its raw-HSL-triple tokens make the inline
`var()` color refs invalid-as-color — background transparent, NO border, inherited text;
replicated as `{ backgroundColor: "transparent", border: "none", borderRadius: 8 }`),
the legend census is 1/0/0/0 (one bare legend on Analytics Overview, none on the other
charts), the default expense filter carries an empty min (negatives visible), and a
completed goal (progress ≥ 100%) gains the emerald card ring + Complete badge
(circle-check-big icon) while the Add Progress button is removed entirely — see
`docs/plans/2026-09-17-parity-remediation-round11.md`.

## Testing & Verification

The full gate (run before every push):

```bash
bun run lint        # ESLint 9 — must exit 0
bun run typecheck   # tsc --noEmit — must exit 0
bun run test        # Vitest — 311 unit tests, must all pass
bun run test:e2e    # next build + Playwright — 66 browser specs, must all pass
```

The Vitest suite covers the pure domain layer with TDD-maintained specs: money math (minor units, monthly-equivalent normalization incl. annual, signed negatives + the −0 edge), taxonomy sets (categories, frequencies, currencies, sectors, quick-select tile labels), dashboard KPI computation (goal-progress savings, placeholder-aware trends, largest-expense bucket, budget remaining/limit-0 footer semantics, income activity categories for the Recent Activity badges), expense filter/sort logic (incl. the null default min), date formats, Finara export normalization (incl. the live snake_case GDPR shape + investments restore), the source-exact UI maps (sector hexes, goal emoji, priority/activity/expense-row badges, account icons), the shadcn primitive class-set pins (classic live-exact strings, element types, no `data-slot`, DialogTitle as a pure semantics wrapper, the dialog card base without `relative`, the Select popup surfaces), the live-probed semantic design tokens (classic shadcn neutral theme, light + dark, incl. the round-10 primary-family re-pin, plus the v3 radius/blur scale pins), the login-page class sets (raw Google button, ringed span logo, py-2 ring-2 inputs, slate-500 field icons), the dialog form-body + icon-order source contracts, the view-surface order contracts, the round-9 functional-parity contracts, the round-10 theme-lifecycle contracts, and the round-11 interactive-state contracts (plus the round-12 additions: the bare `Finara` login-surface title — direct visit AND unauth deep-link redirect, with the unauth deep link settling on it — and the import path accepting negative amounts like every other layer). The **Playwright E2E suite** (`bun run test:e2e`, 67 specs / 11 files under `e2e/`) automates the browser golden paths against the production build on :3100 with a hermetic `db/e2e.db`: login round trips incl. the invalid-credentials alert and document titles, the theme lifecycle (ADR-023), dashboard KPIs, expense CRUD + filters + bulk bar, the FAB Quick Add round-trip + the FAB-as-close-toggle contract (non-modal chooser), income/goal (incl. the complete-state ring)/account/investment CRUD, analytics tabs + the borderless ghost tooltip + the inert From/To, CSV import incl. the live error card, exports verified **settings-independent** (EUR + dd/MM/yyyy leave the ISO-date/raw-decimal CSV and GDPR JSON byte-shaped — round-12 live probe), the GDPR restore round-trip, EUR/dd-MM/yyyy propagation (the app-wide `$` sweep excludes the persisted insight record text — creation-time content, live-faithful), the mobile drawer + Menu↔X swap, and a zero-console-errors/warnings sweep over all nine views. Deeper probes stay manual per round (computed styles, pixel crops, VLM side-by-side sweeps, signature-multiset DOM re-diffs against the captured live app — every residual delta classifies into the documented buckets: infra, a11y additions, lucide artifacts, live's duplicated toaster, seed-data counts, the login demo-credentials affordance). CI (`.github/workflows/ci.yml`) runs the full chain — lint → typecheck → unit → build + E2E — on every push to main and every PR.

## Security

- **Authentication is a demo gate.** The login screen validates the documented demo credentials client-side; there is no session backend, no password hashing, and no multi-tenancy. Replace with a real provider (NextAuth/Better-Auth) before any deployment that touches real user data.
- All API input is validated server-side (`src/lib/api.ts` guards types and enum membership; amounts are deliberately signed per ADR-024 to mirror the source app — there is no sign-range validation by design); errors return customer-safe messages while internals are logged server-side only.
- The AI SDK runs **server-side only** — it never ships to the client bundle.
- No secrets are committed: `.gitignore` rejects `.env*` (except `.env.example`), `*.key`, and `ssh-key.txt`; pushes use an externally-supplied deploy key via `docs/ssh_git_wrapper_v3.py` (see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).

## Git Push (maintainers)

Pushes go to `git@github.com:nordeim/financial-dashboard.git`, `main` branch only, using the SSH wrapper — the deploy key is piped/file-supplied and never stored in the repo:

```bash
python3 docs/ssh_git_wrapper_v3.py \
  --key-file /secure/path/to/id_ed25519 \
  --remote git@github.com:nordeim/financial-dashboard.git \
  --branch main
```

Run `bun run lint && bun run typecheck && bun run test && bun run test:e2e` green first (CI runs the same chain); commit before pushing (the wrapper pushes commits, not the working tree).

## License

No open-source license is currently declared for this repository; all rights are reserved by the owner. Contact the maintainer before reusing the code.
