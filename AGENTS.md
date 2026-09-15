# AGENTS.md

Instructions for AI coding agents working in this repository. Every line answers: "would you get this wrong without being told?" Verified against the toolchain on 2026-09-15.

## Commands

Run from the repo root. Bun is the canonical package manager — never mix `npm`/`yarn`/`pnpm` installs (the committed `bun.lock` is the resolution for exactly the committed `package.json`).

| Command | What it does |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Dev server on :3000 (Turbopack) |
| `bun run build` / `bun run start` | Production build / serve (build before start) |
| `bun run lint` | ESLint 9 flat config — must exit 0 |
| `bun run typecheck` | `tsc --noEmit` — must exit 0 |
| `bun run test` / `bun run test:watch` | Vitest unit suite (69 tests) / watch mode |
| `bun run db:push` | Push `prisma/schema.prisma` to SQLite (creates `db/custom.db`) |
| `bun run db:generate` | Regenerate the Prisma client after schema edits |
| `bun run db:migrate` / `db:reset` | Dev migrations / drop+recreate (SQLite) |

Setup order: `cp .env.example .env` → `bun install` → `bun run db:push` → `bun run dev`. No manual seeding — the first API request runs `ensureSeeded()` (idempotent, concurrency-safe).

Push contract: `main` only, via `python3 docs/ssh_git_wrapper_v3.py --key-file <path outside repo> --remote git@github.com:nordeim/financial-dashboard.git` — never commit the key (`.gitignore` rejects `*.key` / `ssh-key.txt` / `.env*`). Run `bun run lint && bun run typecheck && bun run test` green before pushing. See `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.

## Architecture invariants

- **Single page route by design.** The entire app lives in `src/app/page.tsx` → `src/components/finara/finara-app.tsx` as a client-side SPA (view state, not routing). Do not add page routes; navigation switches `ViewId` state. Only `/api/*` route handlers are additional routes.
- **Money is integer minor units.** Every persisted amount is `amountMinor: Int` (cents). Floats never touch money; conversion happens only at the edges via `toMinorUnits` / `formatMoney` in `src/lib/money.ts`.
- **API envelope.** Every route returns `{ ok: true, data } | { ok: false, error }` via `src/lib/api.ts` helpers (`ok`, `fail`, `errorResponse`). Validate input with the `require*` guards; never throw across the boundary.
- **Client components must not import server modules.** `src/lib/analytics.ts` and `src/lib/db.ts` pull in Prisma — importing them from a `"use client"` file ships the DB client to the browser. Pure helpers (`money`, `categories`, `types`) are safe; anything DB-touching stays server-side. `monthlyEquivalent` lives in `lib/money.ts` for exactly this reason.
- **Seed concurrency is DB-level.** `ensureSeeded()` takes a unique-key lock row (`Setting._seed_lock`), publishes `Setting._seeded` last, and losing callers poll for the marker. A module-global promise alone is NOT sufficient — Next dev route bundles can run separate module instances.
- **Income normalization.** Monthly income = Σ `monthlyEquivalent(amountMinor, frequency)` (biweekly ×26/12, weekly ×52/12, annual ÷12; `quarterly`/`one-time` are legacy-data guards only — the seed no longer emits them). Apply this in every new totals path; a raw sum silently misreports biweekly salaries.
- **Taxonomy source of truth is `src/lib/categories.ts`.** The sets match the live source app exactly (Needs/Wants/Savings subcategories incl. emojis; frequencies `monthly|weekly|biweekly|annual`; income categories; goal categories + priorities; investment types + 9 sectors; account types; 10 currencies; 5 date formats). `categories.test.ts` pins the sets — when the source app changes, update the constant + test together. Pre-remediation rows are normalized through the legacy subcategory map on write.
- **Dashboard KPI semantics (source parity).** Savings Progress = Σ goal current ÷ Σ goal target (NOT savings rate). Trend pills show real month-over-month when both months carry data; otherwise fall back to the source app's exact placeholders (+8.2% / −3.1% / −5.2%, or 12.5% net when only current-month income exists). Largest Expense Category shows the 50/30/20 bucket name. `computeDashboardKpis` in `src/lib/dashboard-kpis.ts` is the single implementation — never re-derive in a view.
- **Analytics averages are windowed**: `avg = windowTotal ÷ periodMonths` (not all-time totals). `GET /api/analytics?months=3|6|12` computes the window server-side.
- **Dark mode is a module-level external store** (`src/components/finara/theme.ts`) — same `useSyncExternalStore` discipline as the session gate: server snapshot `null`, client snapshot reads `localStorage["finara-theme"]`, writes flip `document.documentElement` class and persist. `<html suppressHydrationWarning>` in `layout.tsx` is required.
- **Pure domain modules are the TDD seams.** `dashboard-kpis`, `expense-filters`, `date-format`, `import-export`, `money`, `categories` — no React, no Prisma imports; every behavior change lands with its failing test first. Views consume them; route handlers stay thin wrappers.

## Framework quirks (verified the hard way)

- **React Compiler is on**: `react-hooks/set-state-in-effect` is an ERROR. No setState in effect bodies. For browser-storage-backed session state use the `useSyncExternalStore` pattern in `finara-app.tsx` (server snapshot renders the logged-out shape; client snapshot takes over post-hydration) — never a `useState` initializer (freezes SSR shape).
- **Memo deps must be stable references.** `useMemo(..., [expenses])` where `const expenses = query.data ?? []` mints a fresh array per render → `react-hooks/preserve-manual-memoization` fails compilation. Depend on `query.data` and derive inside the memo.
- **Next.js 16**: route handler `params` are async — `await context.params`. Page files may export only `default` + `metadata`/`revalidate`/`dynamic`.
- **Tailwind v4 is CSS-first**: design tokens live in `src/app/globals.css` `@theme inline` block; shadcn semantic tokens are literal oklch values. The root `tailwind.config.ts` is legacy scaffold — v4's postcss pipeline does not read it; don't add theme values there.
- **ESLint/tsconfig ignore `repos/`, `examples/`, `skills/`** — reference material only, not app code. Keep the ignores when adding sibling directories.
- **Deleting the SQLite file under a running server splits the connection pool** across the dead inode and the new file. To reset: stop the server, `rm db/custom.db`, `bun run db:push`, restart — or just `bun run db:reset`.

## Domain rules

- Expenses follow the 50/30/20 rule: `category ∈ {Needs, Wants, Savings}`; subcategories are pinned in `src/lib/categories.ts` (`SUBCATEGORIES`, emoji quick-select grid). Both API validation and UI selects read the same source — never hardcode the list elsewhere.
- Budgets are category-level (`subcategory: null`) with a monthly limit; progress = spent-this-month ÷ limit; `>100%` renders the over-budget state.
- Goal contributions clamp at the target (`PATCH /api/goals/[id]` with `contributeMinor`). Goals carry `category` + `priority` (high/medium/low).
- Income sources carry `category ∈ {primary, secondary, passive, other}` and `active` (the source app's Active Income Source switch).
- CSV import caps at 2000 rows, parses `MM/DD/YYYY`, `DD.MM.YYYY`, `YYYYMMDD`, and ISO dates, guesses category from description keywords, and reports row-level skips without aborting the batch. `POST /api/import` also accepts `mode: "finara-export"` — a Finara JSON export file normalized by `src/lib/import-export.ts` (accepts camelCase and PascalCase entity keys; row-level errors never abort the batch).
- Dashboard "month to date" filters use `date <= now` — future-dated rows are excluded (the seed dates today's entries at 01:00 for this reason).
- Expenses list UX mirrors the source app: client-side filtering via `applyExpenseFilters` (date-range presets + custom, category, min/max, search, sort), 10-row pagination, bulk select → bulk category edit / delete, per-row edit dialog. The Filters badge replicates the source quirk of counting the two default amount inputs as active (shows "2" untouched).

## Conventions that differ from defaults

- Strict TypeScript; `any` is avoided (use `unknown` + guards from `src/lib/api.ts`).
- Conventional Commits, atomic scope: `feat(expenses): …`, `fix(seed): …`. Never bundle unrelated changes.
- TDD for domain logic: write the failing `src/lib/__tests__/*.test.ts` first, implement in the pure module, then wire views/routes. `bun run test` is part of the pre-push gate.
- Errors are logged with a `[api]`/`[ai/*]` prefix server-side and returned as customer-safe strings — internals never reach the client.
- The login gate is a documented demo credential check (see README §Demo Credentials) — never present it as real authentication, and do not store credentials anywhere but the login screen constants.
- Demo data realism is a feature: seeded amounts jitter ±10%, categories/dates stay plausible. Keep it that way when editing `src/lib/seed.ts`.
- Rendering-time state adjustment (guarded `setState` during render) is the established pattern for "reset when inputs change" — NOT effects (React Compiler rejects setState in effect bodies). See `expenses-view.tsx` (filter-context reset) and `add-transaction-dialog.tsx` (edit prefill).

## Reference

- `README.md` — human onboarding (setup, API table, design tokens).
- `Project_Architecture_Document.md` — full PAD: ADRs, layer model, security, data architecture.
- `CLAUDE.md` — Claude Code project instructions (Meticulous Approach workflow).
- `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` — push runbook for the SSH wrapper.
- `docs/Finara_Dashboard.png` — visual reference for the original dashboard.
- `docs/plans/2026-09-15-parity-remediation-round2.md` — the live-site parity audit + remediation plan this codebase implements.
