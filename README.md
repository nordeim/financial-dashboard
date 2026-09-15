# Finara — Smart Finance Tracker

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748) ![SQLite](https://img.shields.io/badge/SQLite-3-003B57)

A personal-finance dashboard web application: income, expenses, 50/30/20 budgets, accounts, investments, savings goals, CSV bank import, analytics reports, and AI-powered insights — modeled as a faithful, production-grade clone of the Finara dashboard.

## Overview

Finara solves the "where did my money go?" problem with a single, real-time surface: it tracks every income source and expense, categorizes spending along the 50/30/20 rule (Needs / Wants / Savings), monitors monthly budgets with progress bars, follows investment holdings and savings goals, and explains it all through an AI coach that answers questions grounded in your live numbers. The app is a single-page Next.js application backed by a typed REST API over Prisma/SQLite, with money stored exclusively as integer minor units so floats never touch financial arithmetic.

## Key Features

| Feature | What it does |
|---------|--------------|
| 📊 **Financial Dashboard** | Monthly income/expenses/net/balance KPIs with source-parity emerald trend chips, savings goal progress, largest expense category, active goals, 50/30/20 budget overview with colored-dot rows, arrow-icon recent activity, AI insights, bottom quick-action links, floating action button (FAB) that opens a two-step **Quick Add** chooser and rotates its plus into an X while open |
| 🌙 **Dark Mode** | User-menu toggle + mobile sun/moon button; persists via `localStorage` theme store; full dark palette across all 9 views, dialogs, and the login card |
| 💸 **Expenses** | Emoji quick-select modal, quick-add amount chips, Needs/Wants/Savings segmented tabs, search, collapsible Filters panel (date-range presets, category, min/max amount, sort), bulk select + bulk edit/delete, row edit dialog, native `confirm()` deletes, 10-row pagination, FAB |
| 💰 **Income Sources** | Emerald hero card with monthly total, per-source frequency (monthly/weekly/bi-weekly/annual) normalized to monthly equivalents, income categories (primary/secondary/passive/other), active toggle, edit dialog, native `confirm()` deletes |
| 🏦 **Accounts** | Checking/savings/credit-card/investment/other accounts with live-exact type icons (banknote/landmark/building), balance block layout, edit + delete with native `confirm()`, and an Import Transactions link |
| 📈 **Investments** | Holdings by type (stock/ETF/bond/crypto/mutual fund) with portfolio %, gradient portfolio-value/gain KPI cards, sector allocation as a fixed-color dot list (colors verified per sector name), edit + delete with native `confirm()` |
| 🎯 **Savings Goals** | Purple-gradient tiles with live-exact category emoji (🛡️ ✈️ 🏠 🚗 🎓 🏖️ 🎯), priority badges (red/yellow/green), progress bars, deadlines, one-click Add Progress |
| 📥 **CSV Import** | Source-parity 3-step flow: upload → Upload and Extract (with Extracting… state) → review with smart category guessing → import; live-shaped error card with Start New Import retry |
| 🧭 **Analytics** | 3/6/12-month windows with From/To date pickers, segmented 4-tab control (Overview/Expenses/Income/Investments), windowed monthly averages, income vs expenses trend, category donuts, sector allocation (Income tab renders empty, mirroring a verified source quirk) |
| 🤖 **AI Coach & Insights** | Chat grounded in your live financial snapshot; dashboard insight cards with deterministic fallback |
| 🔐 **GDPR Export & Restore** | One-click full JSON export; Settings page round-trips a Finara export file back into the database (finara-export import mode) |
| 🧪 **Unit Tests** | Vitest suite (98 tests) covering money math, taxonomy, KPI computation, filters, date formats, export normalization, source-exact UI maps, and the pinned shadcn primitive class sets |
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
- `bun run test` → 98 tests passing (Vitest).
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
│   │   ├── 📄 page.tsx                    # Single-route SPA entry (login gate + 9 views)
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
│                                          # + __tests__/ (Vitest, 98 tests)
├── 📂 prisma/
│   └── 📄 schema.prisma                   # 7 models, money as integer minor units
├── 📂 db/                                 # SQLite runtime storage (gitignored)
├── 📂 docs/                               # Wrapper script, push runbook, reference image,
│                                          # plans/ (remediation plans)
├── 📂 public/                             # finara-logo.png (login logo asset)
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
| `/api/settings` | GET, PUT | Currency, date format, notification toggles |
| `/api/ai/chat` | POST | AI coach chat (messages array → grounded reply) |
| `/api/ai/insights` | GET | Dashboard insight cards (LLM-polished, deterministic fallback) |
| `/api/export` | GET | ⚠️ GDPR full-data JSON download |

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | SQLite file URL, relative to `prisma/schema.prisma` | `file:../db/custom.db` (via `.env.example`) |

## Design System

Adopted from the source app's own stylesheet and DOM (round-3 live evidence):

| Token | Value | Usage |
|-------|-------|-------|
| `--primary-sage` | `#059669` (emerald-600) | Primary buttons, FAB, active nav accent, budget fills |
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

Typography: **Inter** (400–800) via `next/font`; tabular numerals for all money values.
All add/edit dialogs are **centered modals** (`max-w-2xl`); deletions use the browser's
native `confirm()`. Entrance animations are CSS-only staggered fade-ups.

## Testing & Verification

The full gate (run before every push):

```bash
bun run lint        # ESLint 9 — must exit 0
bun run typecheck   # tsc --noEmit — must exit 0
bun run test        # Vitest — 98 unit tests, must all pass
bun run build       # next build — must exit 0
```

The Vitest suite covers the pure domain layer with TDD-maintained specs: money math (minor units, monthly-equivalent normalization incl. annual), taxonomy sets (categories, frequencies, currencies, sectors), dashboard KPI computation (goal-progress savings, placeholder-aware trends, largest-expense bucket, budget remaining/limit-0 footer semantics), expense filter/sort/pagination logic, date formats, Finara export normalization, the source-exact UI maps (sector hexes, goal emoji, priority/activity/expense-row badges, account icons), and the shadcn primitive class-set pins (classic live-exact strings, element types, no `data-slot`). Browser verification is performed end-to-end before each push round (login incl. the invalid-credentials error alert, all nine views in light + dark, FAB Quick Add round-trip with the rotating toggle, full quick-select + manual add/edit/confirm-delete, income/goal/account/investment CRUD, filters, pagination, AI coach, CSV import, export restore, dark-mode toggle + persistence, mobile drawer, zero console errors), followed by a VLM side-by-side screenshot comparison against the captured live app (round-4 scores: dashboard 95, expenses 98, settings 100). A formal Playwright E2E suite remains a backlog item — see Project_Architecture_Document.md §10.

## Security

- **Authentication is a demo gate.** The login screen validates the documented demo credentials client-side; there is no session backend, no password hashing, and no multi-tenancy. Replace with a real provider (NextAuth/Better-Auth) before any deployment that touches real user data.
- All API input is validated server-side (`src/lib/api.ts` guards types, ranges, and enum membership); errors return customer-safe messages while internals are logged server-side only.
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

Run `bun run lint && bun run typecheck && bun run test` green first; commit before pushing (the wrapper pushes commits, not the working tree).

## License

No open-source license is currently declared for this repository; all rights are reserved by the owner. Contact the maintainer before reusing the code.
