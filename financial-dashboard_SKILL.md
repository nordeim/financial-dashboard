---
name: financial-dashboard
description: >
  Production-grade engineering skill for the Finara financial-dashboard
  codebase — a Next.js 16 + React 19 + TypeScript strict + Tailwind CSS v4
  (CSS-first @theme) + Prisma/SQLite single-page finance tracker maintained
  as a pixel-faithful, live-probed clone of the Finara base44 app through 25
  remediation rounds. Covers the SPA real-route architecture, the pinned
  design system (v3 palette pins, shadcn classic primitives), integer-minor-unit
  money math, the parity-remediation workflow (signature diffs, structural
  probes, HTTP-layer audits), TDD discipline, the E2E hermetic gate, and the
  full debugging/anti-pattern knowledge from 23 rounds of production
  hardening. Use when extending, debugging, auditing, onboarding onto, or
  replicating this codebase — or when cloning any live web app with the same
  rigor.
version: 1.0.0
last_updated: "2026-09-23 (round 25 — the seventh zero-drift verification round: the seventh consecutive zero-drift live re-probe (19–25), both operator focus areas cleared again (the mobile nav verified end-to-end both sides at 71/71 drawer nodes; no Tailwind v4 bug — the v3 pin wins the cascade), the raw-order chrome probes byte-identical, the production-readiness review clean with the round-24 fixes verified holding — a verification round, no code changes)"
tags:
  - nextjs
  - react19
  - tailwindcss-v4
  - prisma
  - sqlite
  - shadcn-ui
  - parity-cloning
  - tdd
  - playwright
  - vitest
---

# Finara Financial Dashboard — The Complete Engineering Skill

> **Purpose:** A single-source-of-truth reference for any coding agent working
> on `nordeim/financial-dashboard`. Every design decision, anti-pattern,
> debugging procedure, and hard-won lesson from 25 rounds of live-probe parity
> remediation, distilled and codebase-verified. Read the section you need;
> trust the pins — they were all live-probed.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Data Management: Seed, Import, Export](#7-data-management-seed-import-export)
8. [Accessibility Implementation](#8-accessibility-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)
21. [Appendix A — The ADR Catalog](#appendix-a--the-adr-catalog)
22. [Appendix B — The 25-Round Parity History](#appendix-b--the-25-round-parity-history)
23. [Appendix C — The Live-Site Validation Method](#appendix-c--the-live-site-validation-method)
24. [Appendix D — Quick Reference Card](#appendix-d--quick-reference-card)

---

## 1. Project Identity & Design Philosophy

**Finara — Smart Finance Tracker.** A single-page personal-finance dashboard:
income sources, 50/30/20 expenses and budgets, bank accounts, investments,
savings goals, CSV bank import, analytics charts, and an AI coach grounded in
live data. Maintained as a **faithful, production-grade clone of the Finara
base44 app** (`https://finara-c636f309.base44.app/Dashboard`).

The defining philosophy — three rules, in priority order:

1. **Parity is a contract, not a vibe.** Every visual/behavioral decision
   traces to a live-probed capture: class strings, computed styles, HTTP
   headers, DOM signatures. When the live app and "best practice" disagree,
   the live app wins (negative amounts accepted end-to-end, inert From/To
   date inputs, the always-plural bulk count, the empty Analytics Income
   tab — all deliberate replications of verified source quirks). Deviations
   are allowed only in documented buckets: a11y additions, infra, lucide
   artifacts, the live's duplicated toaster, seed-data counts.
2. **Money is integers.** Every persisted amount is signed integer minor
   units (`amountMinor: Int`, cents). Negatives are valid end-to-end — the
   live app has zero amount validation, and the clone replicates that
   (ADR-024). `src/lib/money.ts` is the only float↔int conversion seam.
3. **TDD at the pure seams.** Domain logic lives in framework-free modules
   (`src/lib/`) with Vitest specs; every behavior change lands
   red → green. Views consume the modules; route handlers stay thin.

**Scale of the verification apparatus** (this is the repo's real moat):
434 unit specs / 18 files, 67 Playwright E2E specs / 11 files, a CI chain
(lint → typecheck → unit → build + E2E), and a per-round live re-probe
methodology (Appendix C) that has run 21 times.

---

## 2. Tech Stack & Environment

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Web framework | Next.js (App Router) | 16.3.5 | Turbopack dev; RCE advisory floor ≥ 16.2.5 (round 15) |
| UI runtime | React | 19 | **React Compiler ON** — see §9 rules |
| Language | TypeScript | 5 (strict) | `any` banned; `unknown` + `require*` guards |
| Styling | Tailwind CSS | 4.1.18 | CSS-first `@theme inline`; NO JS config (deleted round 12) |
| Animations | tw-animate-css + custom `fin-*` keyframes | 1.3.5 | framer-motion deliberately NOT used (round 14) |
| Components | shadcn/ui (classic) + Radix | pinned | 17 primitives, class-set pinned (ADR-015) |
| Charts | Recharts | 2.15.4 | Live-pinned config (ADR-017) |
| ORM | Prisma | 6.19.2 | `datasourceUrl` wiring (round 21) |
| Database | SQLite | 3 | `db/custom.db` (dev), `db/e2e.db` (E2E hermetic) |
| AI | z-ai-web-dev-sdk | 0.0.18 | Server-only; env-gated LLM polish |
| Unit tests | Vitest | 5 | node env, `@` alias |
| E2E | Playwright | 1.62.1 | chromium, serial, production build :3100 |
| Lint | ESLint 9 + eslint-config-next | 16.3.5 | Same major.minor as next (contract-pinned) |
| Runtime/PM | Bun | ≥ 1.3 | `bun.lock` is canonical — never mix npm/yarn/pnpm |
| Image | sharp | 0.35.4 | ≥ 0.35.0 AND inside next's optional range |

**Runtime dependency set: 24 packages** (round 20 purged 34 dead ones —
including the look-alikes `@tanstack/react-query`, `date-fns`, `zod`,
`zustand`; the app hand-rolls `use-api.ts`, `date-format.ts`, and the
`require*` validation guards instead). The banned set is pinned in
`manifest-contracts.test.ts` — a re-added dead dependency fails the gate.

**Environment variables:**

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `file:../db/custom.db` — relative URLs anchor at `prisma/schema.prisma` via `src/lib/db-path.ts` (round 21); absolute URLs (E2E's `db/e2e.db`) pass through |
| `FINARA_INSIGHTS_LLM_OFF` | No | `1` = deterministic insight drafts (hermetic gates; the Playwright webServer sets it) |
| `NEXT_PUBLIC_SITE_URL` | No | Resolves metadataBase, og:url/canonical, twitter:url, robots/sitemap URLs (round 17/18) |

**Environment traps (verified the hard way):**
- A shell-exported `DATABASE_URL` **shadows** `.env` (Next.js process-env
  precedence) — `unset` it before dev/gates in sandboxed environments.
- A workspace reset wipes `~/.cache/ms-playwright` — rebuild with
  `bunx playwright install chromium` BEFORE trusting any E2E failure
  (67/67 specs failing at 1–2ms = missing browser executable, not a
  regression).
- Deleting the SQLite file under a running server splits the connection
  pool across the dead inode. Stop the server, `rm`, `bun run db:push`,
  restart — or `bun run db:reset`.

---

## 3. Bootstrapping & Configuration

```bash
git clone git@github.com:nordeim/financial-dashboard.git
cd financial-dashboard
cp .env.example .env        # DATABASE_URL="file:../db/custom.db"
bun install                 # never npm/yarn/pnpm — bun.lock is canonical
bun run db:push             # creates <repo>/db/custom.db (CLI anchors at prisma/)
bun run dev                 # http://localhost:3000
```

**No manual seeding.** The first API request runs `ensureSeeded()`
(idempotent, concurrency-safe via a DB-level unique-key lock row
`Setting._seed_lock` + `_seeded` completion marker; losing callers poll).
A module-global promise alone is NOT sufficient — Next dev route bundles
run separate module instances.

**Database path contract (round 21, `src/lib/db-path.ts`):** a relative
`file:` URL anchors at `prisma/schema.prisma` (the CLI's own anchor,
discovered by walking up from the process CWD) — so `file:../db/custom.db`
means `<repo>/db/custom.db` for the CLI, `next build`, AND the running
server, regardless of working directory. Absolute `file:` URLs and
PostgreSQL URLs pass through unchanged. A missing `DATABASE_URL` throws
the crisp setup error. Wired via `new PrismaClient({ datasourceUrl:
resolveDatabaseUrl() })`.

**Migration workflow split (round 15):** dev and E2E use `db:push`
(disposable DBs); production uses `bun run db:deploy` (`prisma migrate
deploy`) against the committed baseline
`prisma/migrations/20260919000000_init/migration.sql`.
`migrations-baseline.test.ts` fails the gate if a schema edit lands
without its migration.

**Command table:**

| Command | Purpose |
|---|---|
| `bun run dev` / `build` / `start` | Dev :3000 / production build / serve |
| `bun run lint` / `typecheck` | ESLint 9 flat / `tsc --noEmit` — both must exit 0 |
| `bun run test` / `test:watch` | Vitest (434) / watch |
| `bun run test:e2e` | `next build` + 67 Playwright specs on :3100 (hermetic) |
| `bun run db:push` / `db:generate` / `db:deploy` | Schema sync / client regen / prod migrate |

---

## 4. The Design System (Code-First)

All tokens live in `src/app/globals.css` — there is NO `tailwind.config.ts`
(round 12 deleted it; re-adding one is an anti-pattern). Structure:

1. `@import "tailwindcss"` + `@import "tw-animate-css"`
2. `@custom-variant dark (&:is(.dark *))` — class-based dark mode
3. `@theme inline { … }` — semantic tokens mapping to CSS vars + the
   **v3-pinned radius/blur scales**: `--radius-sm/md/lg/xl` =
   0.125/0.375/0.5/0.75rem, `--blur-sm: 4px` (ADR-019 — v4's regenerated
   values drift from the live app)
4. `:root` / `.dark` blocks — classic shadcn **neutral** semantic theme
   (light `--background #ffffff`, `--foreground #0a0a0a`,
   `--muted-foreground #737373`, `--border/--input #e5e5e5`,
   `--ring #0a0a0a`; dark `#0a0a0a`/`#fafafa`/`#a3a3a3`/`#262626`).
   Round-10 amendment: `--primary`/`--primary-foreground` are the neutral
   ink/paper pair (light `#171717`/`#fafafa`) — NOT sage; dark `--ring`
   `#d4d4d4`, dark `--destructive` `#7f1d1d`
5. **The unlayered `:root` palette pin (ADR-018)** — `--color-<family>-<step>`
   for all 102 tokens across 14 families, pinned to the Tailwind **v3 hex
   values** (blue-600 `#2563eb`, not v4's `#155dfc`). The block is
   deliberately UNLAYERED so it beats `@layer theme` AND Tailwind v4.1's
   `@supports lab()` re-definition (verified: the drawer computes
   `rgb(30, 41, 59)` = v3 slate-800). Do not "modernize" to v4/oklch
6. Finara custom properties: `--primary-sage #059669`, `--primary-navy
   #1e293b`, `.sidebar-gradient`, `.card-hover`, `finara-scroll` — plus
   dark-mode gray overrides (`.dark .bg-white { background-color: #1e293b }`
   etc.)
7. The `fin-*` keyframes under `@media (prefers-reduced-motion:
   no-preference)` — `fin-card-in`, `fin-overlay-in`, `fin-scale-in`,
   `fin-drawer-in`, `finara-insight-in` (the CSS replication of the live's
   framer-motion entrances, round 14)

**The effective typeface is the Tailwind default system stack** —
`--font-sans: ui-sans-serif, system-ui, sans-serif, …` (the live's Inter
`@import` is overridden by its root `font-sans`; the clone keeps
`next/font` Inter loaded on `<body>` to mirror the loaded-but-overridden
import). No tabular-nums anywhere (live computes
`font-variant-numeric: normal`).

**Key surface classes (live-captured, RAW-ORDER pinned — round 16):**

| Surface | String |
|---|---|
| Page shell | `min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 font-sans` |
| Card | `bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg` + `.card-hover` |
| Headings | `text-3xl lg:text-4xl font-bold text-primary-navy dark:text-white` |
| Sage CTAs | `bg-primary-sage hover:bg-primary-sage/90 text-white shadow-lg` |
| Active nav pill | `bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30` (+ `backdrop-blur-sm` desktop only) |
| Mobile drawer | `lg:hidden fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900` |
| Bulk bar | `bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4` |

---

## 5. Component Architecture & Patterns

```
src/
├── app/
│   ├── page.tsx                 # `/` — dashboard, NO active nav pill
│   ├── [view]/page.tsx          # catch-all: /Dashboard … /Settings + 404
│   ├── layout.tsx               # Inter font, metadata, <Toaster/>
│   ├── globals.css              # the design system (§4)
│   ├── robots.ts / sitemap.ts   # live-shaped (round 17)
│   └── api/                     # 12 REST route groups (envelope)
├── components/
│   ├── finara/                  # 17 view/shell components + theme.ts
│   │   ├── finara-app.tsx       # the SPA shell: session gate, view switch
│   │   ├── sidebar.tsx          # desktop sidebar + MobileTopNav + drawer
│   │   ├── *-view.tsx           # 9 feature views
│   │   ├── add-transaction-dialog.tsx / quick-add-dialog.tsx / ai-coach-dialog.tsx
│   │   ├── ui-bits.tsx          # StatCard, GradientCard, SectionCard,
│   │   │                        #   ViewHeader, entranceStyle/MotionWrap,
│   │   │                        #   ClassicFilterIcon, ClassicTrash2, …
│   │   └── theme.ts             # useSyncExternalStore dark-mode store
│   └── ui/                      # EXACTLY 17 pinned shadcn primitives
├── hooks/                       # use-api, use-toast, use-mobile
└── lib/                         # pure domain modules + __tests__ (18 files)
```

**The SPA real-route architecture (ADR-021):** `src/app/page.tsx` serves `/`
and `src/app/[view]/page.tsx` maps every other path through
`src/lib/routes.ts` (`VIEW_PATHS`, `parseRoute`, `segmentToTitle`) with
`generateMetadata` per-route titles (`X | Finara`; bare `Finara` on `/`,
`/Dashboard`, `/login`). `FinaraApp` switches views by `ViewId` state inside
a **single mount** — navigation is `history.pushState`/`popstate` with
`preventDefault` on anchor clicks. Only `/api/*` handlers are additional
routes. **Never add per-view page folders** (they remount the app).

**Route metadata seam (rounds 17–19):** `src/lib/route-metadata.ts`
`buildRouteMetadata(path)` produces the per-route head — the
`X on Finara. Finara is your intelligent financial co-pilot…` description
template on all THREE metas for the 8 view routes (FULL text on `/`,
`/Dashboard`, `/login`, 404s), per-route og:title/og:url, the
dashboard-canonicalizes-to-`/` quirk, and the login-only viewport-fit +
theme-color + sized icon pair + twitter:image:alt via
`buildRouteViewport`.

**Document title ownership (round 12):** `document.title` is written by a
MutationObserver-guarded post-commit effect in `FinaraApp` — the App Router
hydrates the `<title>` textContent AFTER client effects, so render-phase
and first-macrotask writes both lose that race. Never write
`document.title` in `applyRoute`/render.

**Session + theme stores:** both use `useSyncExternalStore` with a `null`
server snapshot (server renders the logged-out/light shape; the client
snapshot takes over post-hydration). `<html suppressHydrationWarning>` is
required in `layout.tsx`. The theme follows the account (ADR-023):
sign-out RESETS to light + clears the stored key (`resetTheme()`), sign-in
re-applies the SERVER theme from `/api/settings`, every toggle persists
fire-and-forget (`PUT /api/settings {theme}`).

**Three add-entry flows (ADR-014) — do not merge:**
1. FAB → Quick Add chooser (z-40 overlay, rotating plus→X toggle at z-50,
   `modal={false}` with `onInteractOutside` suppressed so the FAB stays
   clickable — Radix's modal body-lock would deaden it)
2. Expenses header → full Quick Select modal (emoji tile grid)
3. Dashboard header "Add Transaction" → navigates to Expenses

**Entrance motion (round 14):** `entranceStyle(delayMs, animationName)` +
`MotionWrap` wrap cards/rows with the settled inline style
`opacity: 1; transform: none;` plus the `fin-*` animation — replicating
the live's framer-motion layer without the dependency. Keyframes defined
ONLY under `prefers-reduced-motion: no-preference` (reduced-motion users
render settled instantly).

**Icon+text whitespace rule (round 14):** `<Icon />` and text go on
SEPARATE JSX lines — the multi-line idiom strips the newline; single-line
`<Icon /> Text` emits a leading space in textContent. Banned by
`view-surfaces.test.ts`.

**Icon class order (ADR-020):** lucide icons in finara views render
`w-X h-X [margin] [color]` (size-first). Documented h-first exceptions:
the shadcn Select chevron/check internals, the import dropzone's
CloudUpload (`mx-auto h-12 w-12 text-gray-400`), the import error
CircleAlert, in-flow close buttons (`h-9 w-9` last).

**Renamed lucide glyphs:** the live pins an older lucide — `Filter` is the
classic angular polygon (`ClassicFilterIcon` inline SVG), `Trash2` is the
single-alias shape (`ClassicTrash2`). Never import `Filter`/`Trash2` from
lucide-react in finara views.

---

## 6. Custom Hooks Deep Dive

**`useQuery<T>(url, {manual?})` — `src/hooks/use-api.ts`.** Minimal typed
fetch with `data/loading/error/refresh`. Key decisions:
- `cache: "no-store"` on every client fetch (round 9): API responses carry
  no Cache-Control header, so browsers heuristically cache them and a
  remounted view would render stale data
- Envelope-aware: `{ok: true, data} | {ok: false, error}` — a non-ok
  payload throws into the error state with the server's customer-safe
  message
- `mounted` ref guards the async setState
- Deliberately hand-rolled — `@tanstack/react-query` was removed as dead
  weight (round 20); do not re-add it

**`useSettings()`** — the settings slice with app-wide propagation
(ADR-022): currency/date-format saves reformat EVERY view (thread
`{currency}` into every `formatMoney`, `dateFormat` into every
`formatDate`). The shell-level AddTransactionDialog renders mount-on-open
so its `useSettings` is always fresh.

**`useToast` — `src/hooks/use-toast.ts`** — the classic shadcn toast store
(a deliberate round-4 delta: the live showed no toasts on add/delete; the
clone keeps confirmation toasts — reversible, documented in PAD §10).

**`useMobile`** — viewport breakpoint hook (lg boundary).

**Theme store — `src/components/finara/theme.ts`** (not a hook file):
`useSyncExternalStore` discipline, `localStorage["finara-theme"]`,
`document.documentElement` class flips, the ADR-023 lifecycle (§5).

---

## 7. Data Management: Seed, Import, Export

**Schema (`prisma/schema.prisma`, 8 models):** Account, IncomeSource,
Expense, Budget, Goal, Investment, Setting, Insight. Every money column
is `Int` named `*Minor`.

**Seed (`src/lib/seed.ts`):** six-month demo history — 4 accounts, 4
income sources, ~96 expenses, 3 budgets, 3 goals, 8 holdings. Realism is a
feature: amounts jitter ±10%, categories/dates stay plausible. Today's
entries date at 01:00 (the dashboard's `date <= now` month-to-date filter
excludes future-dated rows). DB-level lock (§3).

**Income normalization:** monthly income = Σ `monthlyEquivalent(amountMinor,
frequency)` — biweekly ×26/12, weekly ×52/12, annual ÷12. A raw sum
silently misreports biweekly salaries. `quarterly`/`one-time` are
legacy-data guards only.

**KPI semantics (`src/lib/dashboard-kpis.ts` — single implementation,
never re-derive in a view):** Savings Progress = Σ goal current ÷ Σ goal
target (NOT savings rate). Trend pills show real MoM when both months
carry data, else the source's exact placeholders (+8.2% / −3.1% / −5.2%,
or 12.5% net). Largest Expense Category shows the 50/30/20 bucket name.
Budget footer: `limit === 0` renders "0.0% used · $0.00 remaining" —
never over-budget wording.

**Analytics:** windowed averages (`avg = windowTotal ÷ periodMonths`,
`?months=3|6|12` computed server-side). From/To date inputs are INERT by
design (verified live quirk). Income tab renders empty by design.

**CSV import (`POST /api/import`):** `rows` mode — ≤2000 rows, parses
`MM/DD/YYYY`, `DD.MM.YYYY`, `YYYYMMDD`, ISO; guesses category from
description keywords; row-level skips never abort the batch. Signed
amounts follow ADR-024 (the integer-shape guard only).
`mode: "finara-export"` — a Finara JSON export normalized by
`src/lib/import-export.ts` (camelCase and PascalCase entity keys;
`normalizeFinaraExport` restores negative decimals).

**Exports:** Analytics Export = `GET /api/export?type=transactions` →
`financial-report-<date>.csv` (transactions CSV, all-quoted, raw decimals,
expenses date-only + income/investments microsecond timestamps, grouped
expenses→income→investments). GDPR export = `{user, data:{expenses,
income, savings_goals, investments, bank_accounts}, summary:{total_*}}` —
snake_case fields, decimal amounts, title display names, Z-less
microsecond timestamps. Both are settings-independent (EUR/dd-MM-yyyy
leave them byte-shaped).

**AI endpoints:** grounded in a DB snapshot built first — the model may
phrase, never invent, figures. Insights are PERSISTED records
(round 13): `GET /api/ai/insights` lists `Insight` records (the live's
`TransactionInsight` equivalent, filtered `!is_dismissed`) and
generates+persists ONLY when the table is
completely empty (dismissed rows still count — dismissing everything
leaves the empty state showing; refresh re-lists, NEVER regenerates).
The LLM polish is env-gated (`FINARA_INSIGHTS_LLM_OFF=1` for hermetic
gates) and positionally joined (`mergePolishedDrafts`); record text keeps
its creation-time currency.

---

## 8. Accessibility Implementation

WCAG-minded (2.2 AA baseline), with the parity constraint that a11y
additions must stay in the documented "a11y bucket" (they render extra
attributes the live lacks — acceptable, reversible):
- `aria-label` on every icon-only button (the live's mobile menu button
  has none — the clone adds `Open/Close navigation menu`)
- `aria-expanded`/`aria-controls` on the mobile menu toggle
- Visible focus states via the pinned `focus-visible:ring-1` primitives
- `role="progressbar"` consumers keep the live's `data-state=indeterminate`
  with NO `aria-valuenow` (the value drives the manual transform only);
  the clone's aria-LABELS stay
- Dialog titles render through `DialogTitle asChild` around a div (keeps
  Radix's `aria-labelledby` wiring while matching the live's div titles)
- 44px touch targets; the FAB wrapper carries `tabIndex={0}`
- `prefers-reduced-motion` gates every entrance animation (§4)
- Deletions use native `window.confirm()` with the live's exact texts

---

## 9. Anti-Patterns & Common Bugs

1. **Never add per-view page folders** — they remount the SPA (ADR-021).
2. **Never write `document.title` in render/applyRoute** — the
   MutationObserver-guarded effect owns it (round 12).
3. **Never `setState` in effect bodies** — React Compiler makes
   `react-hooks/set-state-in-effect` an ERROR. Use the
   `useSyncExternalStore` pattern (session/theme) or guarded render-time
   state adjustment (expenses filter reset, edit prefill).
4. **Never depend on unstable memo references** — `useMemo(...,
   [expenses])` where `const expenses = query.data ?? []` mints a fresh
   array per render → `react-hooks/preserve-manual-memoization` fails
   compilation. Depend on `query.data`, derive inside.
5. **Never import `lib/db`, `lib/analytics`, or `lib/db-path` from client
   components** — Prisma/node:fs ships to the browser. Pure modules:
   `money`, `categories`, `types`, `dashboard-kpis`, `expense-filters`,
   `date-format`, `import-export`.
6. **Never float money or string-math it** — integers only, `money.ts` is
   the seam.
7. **Never re-add positivity validation** — negatives are valid
   end-to-end (ADR-024); no numeric input carries `min="0"`; the expense
   row renders the live's `--$5.50` double-minus quirk.
8. **Never hardcode USD/MM/dd/yyyy in views** — thread `useSettings()`.
9. **Never "upgrade" the pinned shadcn primitives** with `npx shadcn
   add/diff` — a newer snapshot fails the suite BY DESIGN (ADR-015).
10. **Never "modernize" the palette to v4/oklch** — the v3 hex pin is the
    contract (ADR-018).
11. **Never re-add `tailwind.config.ts`** — tokens live in
    `@theme inline` (round 12).
12. **Never fork a color/emoji/icon value into a component** — consume
    `src/lib/ui-maps.ts` (sector hexes, goal emoji 🛡️✈️🏠🚗🎓🏖️🎯,
    priority/activity/expense-row badges, account icons, 50/30/20 dots).
13. **Never hardcode the category list** — `src/lib/categories.ts` is the
    single source (API validation and UI selects both consume it).
14. **Never seed in route handlers or component effects** — `ensureSeeded()`
    owns it.
15. **Never throw across the API boundary** — the `{ok, data}|{ok, error}`
    envelope + `require*` guards; log internals server-side with the
    `[api]` prefix.
16. **Never construct Tailwind classes dynamically** — full literal
    strings through `cn()` only (v4 static analysis; the purge bug class).
17. **Never present the demo login as real authentication** (it is a
    documented client-side credential check).
18. **Never weaken a gate** (lint rules, type strictness, retries,
    migration checks, tests) to make a run green — a red gate is a
    regression or a wrong test.
19. **Never merge the three add-entry flows** (ADR-014).
20. **Never replace native `confirm()` deletions** with custom dialogs.

---

## 10. Debugging Guide

**The gate classification first** (which gate fails: install / typecheck /
lint / test / build / E2E / pre-commit?), then split infrastructure failure
from source debt. Then:

- **E2E 67/67 failing at 1–2ms** → the browser executable is missing or
  resources are exhausted. Check `~/.cache/ms-playwright` exists; close
  lingering agent-browser/chromium sessions (the round-20 lesson: ~66
  stray processes starved the runner — check `free -m`); rebuild with
  `bunx playwright install chromium`.
- **E2E insight-text assertions flake** → the LLM polish rewrites record
  text nondeterministically. The webServer must set
  `FINARA_INSIGHTS_LLM_OFF=1` (round 13).
- **App reads the WRONG db file** → a shadowed `DATABASE_URL` (shell env
  beats `.env`) or a launch CWD outside the repo (the walk-up fallback).
  Probe: `console.error` the resolved URL from `db-path.ts`, or watch
  `ls db/` while hitting the API. `unset DATABASE_URL` and launch from
  the repo root.
- **`prisma db push` exits 0 but the app says "table does not exist"** →
  the CLI and the runtime disagreed on the file location (the pre-round-21
  failure class) or the DB file was deleted under a running server. Stop
  the server, re-push, restart.
- **Stale data after a settings change** → a fetch lost `cache: "no-store"`
  or a dialog renders mounted (not mount-on-open) so its `useSettings`
  froze at open time.
- **Hydration mismatch on `<html>`** → missing `suppressHydrationWarning`
  (the theme class flips pre-hydration).
- **A view's `document.title` won't change** → you're writing it in
  render; the MutationObserver effect owns it (round 12).
- **React Compiler error on an effect** → setState in the effect body;
  restructure per §9.3/§9.4.
- **Parity suspicion** → run the Appendix C method: signature diff (BOTH
  sorted AND raw — the sorted diff is class-order blind, round 16),
  structural probes, HTTP-layer curl diff (the body DOM is blind to the
  transport/head layers, round 17), then classify every delta into the
  documented buckets before touching code.
- **A pinned primitive "fails" after a dependency bump** → the bump
  drifted the class set. Revert to the pin; the suite is the contract.

---

## 11. Pre-Ship Checklist

```bash
unset DATABASE_URL                      # the shadow trap
bun run lint                            # 0
bun run typecheck                       # 0
bun run test                            # 434/434
bun run test:e2e                        # build + 67/67
git ls-files | grep -E "\.env$|\.key$|ssh-key"   # empty
```

- [ ] Touched flow exercised in a browser, zero console errors/warnings
- [ ] No secrets staged; `.env`/`*.key`/`db/*.db` never committed
- [ ] Conventional Commits, atomic scope (`feat(expenses): …`)
- [ ] Docs updated in the same commit when behavior/setup changed
      (AGENTS.md + CLAUDE.md + README + PAD)
- [ ] Behavior changes carry their failing-test-first spec
- [ ] Schema edits carry their migration (`migrations-baseline.test.ts`)
- [ ] Push via `docs/ssh_git_wrapper_v3.py` to `main` only — never a
      feature branch, never the key inside the repo
- [ ] Parity-affecting changes: re-probe the live (Appendix C) and
      classify every delta

---

## 12. Lessons Learnt & How to Avoid Them

1. **The live app moves.** Four consecutive rounds (17–19) the body DOM
   was stable but the HEAD changed. Probe every layer, every round —
   body DOM (both diff modes), transport, head, robots, sitemap.
2. **The sorted signature diff is class-order blind** (round 16) — the
   sidebar shipped wrong class ORDER for eleven rounds while sorting
   hid it. Always pair sorted with RAW-order diffs.
3. **JS animations never set CSS `animationName`** (round 13→14
   misdiagnosis): the live's "removed" entrances were framer-motion
   INLINE styles. Probe the `style` attribute and computed styles, not
   CSS classes, when auditing motion.
4. **`document.title` is a race** (round 12): React hydrates the title
   AFTER client effects. MutationObserver-guarded post-commit effect.
5. **Browser-storage state needs `useSyncExternalStore`** — a
   `useState` initializer freezes the SSR shape (React Compiler era).
6. **Heuristic caching serves stale API data** when responses carry no
   Cache-Control (round 9) — `cache: "no-store"` everywhere.
7. **The seed lock must be DB-level** — module globals duplicate across
   Next dev route bundles.
8. **Prisma's relative SQLite URL is ambiguous between CLI and bundled
   runtime** (the playwright config carried an absolute URL for exactly
   this reason, rounds before round 21 made the general fix).
9. **A workspace reset wipes the Playwright browsers** — rebuild before
   trusting an E2E failure (rounds 19 and 21).
10. **Close browser sessions before the E2E gate** — the sandbox's
    memory budget does not fit the probe fleet plus the runner (round 20).
11. **Trust machine-readable diagnostics over terminal rendering** — the
    "corrupted" CI YAML was a display artifact; the parser and raw bytes
    were clean (round 21).
12. **Zero-import dependencies are supply-chain surface** — round 15
    removed seven advisory-carrying ones, round 20 thirty-four more; the
    manifest contract keeps them out.
13. **One empirical correction per plan is normal** — round 20's
    `react-separator` transitivity assumption inverted during GREEN;
    verify the lockfile after removal, then tighten the spec to the
    observed truth.
14. **When the live probe finds zero drift, pivot to production
    readiness** (the round-15/20/21 precedent) — there is always a
    scaffold tail, a doc drift, or an environment contract to close.
    When even that comes back clean (round 22), ship the verification
    itself: refreshed screenshots, the documentation set, and the honest
    no-code-changes verdict — never invent work to look busy.
15. **Run the E2E gate in the foreground** — the sandbox reaps detached
    background processes between tool invocations (round 22: two silent
    E2E deaths mid-build before the foreground run went green 67/67).
16. **The hex dump is the ground truth when terminal output looks
    corrupted** — the CI workflow's `branches: [main]` renders as
    `branches: ain]` because `[m` is the ANSI reset escape; the YAML
    parses and the raw bytes are clean (root-caused round 22, observed
    round 21). Round 23 extended the lesson: the artifact is
    output-stream-GENERAL — it ate the [main] token inside the
    session's own printed labels, so assert on bytes with MARKER-SAFE
    needle construction (build the needle from concatenated fragments)
    and let the boolean result speak.
17. **Dev-only console diagnostics are not production defects** — React's
    "Cannot update a component while rendering a different component"
    warning fires in dev for the documented render-time route-adjustment
    pattern; the production console sweep stays clean (E2E-pinned).
    Classify by build mode before filing.
18. **Leave the live account as you found it** — the live theme follows
    the account (ADR-023, persisted server-side): verify the theme
    state before AND after probing, and if a mis-click toggles it,
    toggle it back (round 23 verified the dark state preserved both
    ends of the session).

---

## 13. Pitfalls to Avoid

- Mixing package managers (bun.lock is the resolution for exactly the
  committed package.json).
- `next`/`eslint-config-next` version splits (the lint rule set tracks
  the framework — the pair is contract-pinned to the same major.minor).
- `sharp` older than next's own optional range (a second vulnerable copy
  nests under next).
- Editing `db/*.db` under a running server (the split-inode pool).
- Assuming the E2E DB is the dev DB (it is `db/e2e.db`, absolute-pinned,
  reset per run).
- Forgetting `await context.params` in route handlers (Next 16 async
  params).
- Testing the wrong app (verify `location.href` BEFORE probing — the
  round-11 lesson).
- VLM verdicts without measurement (the round-20 "narrower sidebar" flag
  was a full-page scaling artifact; the measured sidebar was exactly
  256px on both sides — prefer computed styles + pixel crops).

---

## 14. Best Practices

- Read the full file before editing; smallest safe edit; preserve
  unrelated content.
- TDD for domain logic: failing `src/lib/__tests__/*.test.ts` first →
  pure module → wire the view/route → re-run.
- One logical change per commit; explain WHY in the message.
- Errors: customer-safe strings to the client, `[api]`-prefixed context
  in server logs, secrets never logged.
- Money: integers end-to-end; `toMinorUnits` accepts negative strings.
- Views consume `ui-maps`/`categories` — never fork a constant.
- Long lists: `max-h-*` + `overflow-y-auto` + `finara-scroll`.
- Empty/loading/error states explicit on every surface (`EmptyState`,
  `LoadingRows`, `ErrorNote`).
- Every claim of "works" needs executed evidence; label the rest
  Reasoned/Assumed.

---

## 15. Coding Patterns

**The API envelope (every route):**

```ts
import { ok, fail, errorResponse, requireSignedInt, requireFiniteNumber,
         requireString, requireEnum } from "@/lib/api";

export async function GET() {
  try {
    const rows = await db.expense.findMany({ orderBy: { date: "desc" } });
    return ok(rows.map(toExpenseDto));
  } catch (cause) {
    return errorResponse("list expenses", cause); // logs [api], returns 500
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const amountMinor = requireSignedInt(body, "amountMinor"); // NOT non-negative
    // …validate enums against categories.ts, persist, return ok(dto)
  } catch (cause) {
    if (cause instanceof ValidationError) return fail(cause.message);
    return errorResponse("create expense", cause);
  }
}
```

**Route params (Next 16):**

```ts
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  // …
}
```

**The external-store pattern (session/theme):**

```ts
const subscribe = (cb: () => void) => { /* storage/custom-event wiring */ };
const getSnapshot = () => localStorage.getItem(KEY);   // client
const getServerSnapshot = () => null;                  // SSR shape
const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
```

**Render-time state reset (the Compiler-safe pattern):**

```ts
const [filterCtx, setFilterCtx] = useState(initial);
if (filterCtx.key !== currentKey) {          // guarded — settles in one pass
  setFilterCtx(initial);
}
```

**The entrance-motion wrapper:**

```tsx
<div style={entranceStyle(0)}>
  <SectionCard>…</SectionCard>
</div>
// or for classless outer wrappers:
<MotionWrap delayMs={120}><StatCard …/></MotionWrap>
```

**Money (the only conversion seam):**

```ts
const minor = toMinorUnits("123.45");      // 12345 — negatives pass
const text = formatMoney(minor, { currency }); // "$123.45" / "-$5.50"
const monthly = monthlyEquivalent(minor, "biweekly"); // ×26/12
```

---

## 16. Coding Anti-Patterns (verified failure modes)

```ts
// 1. The unstable memo dep (compiler error):
const expenses = query.data ?? [];
useMemo(() => compute(expenses), [expenses]);        // ✗ fresh array per render
useMemo(() => compute(query.data ?? []), [query.data]); // ✓

// 2. setState in an effect body (compiler error):
useEffect(() => { setOpen(isOpenProp); }, [isOpenProp]);   // ✗
const [open, setOpen] = useState(isOpenProp);
if (open !== isOpenProp) setOpen(isOpenProp);              // ✓ guarded render-time

// 3. Dynamic Tailwind classes (v4 static analysis):
<div className={`bg-${color}-500`}>                     // ✗ purged
<div className={cn(color === "emerald" ? "bg-emerald-500" : "bg-red-500")}> // ✓

// 4. Float money:
const total = rows.reduce((s, r) => s + r.amount / 100, 0);  // ✗
const total = rows.reduce((s, r) => s + r.amountMinor, 0);   // ✓

// 5. Positivity validation (breaks ADR-024 parity):
<input type="number" min="0" />                        // ✗ live has none
if (amountMinor < 0) return fail("negative");          // ✗ negatives are valid

// 6. Single-line icon+text (emits a leading space):
<Button><Plus /> Add</Button>                          // ✗
<Button>
  <Plus />
  Add
</Button>                                              // ✓
```

---

## 17. Responsive Breakpoint Reference

One primary breakpoint: **`lg` (1024px)** — the sidebar/mobile split.

| Zone | Chrome |
|------|--------|
| ≥ 1024px (lg) | Desktop sidebar (`hidden lg:flex lg:w-64`), no top bar, no FAB-drawer |
| < 1024px | Fixed top bar (`lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b`): brand tile + SyncedBadge + theme toggle (`w-8 h-8`) + menu button (`h-9 w-9`, Menu↔X swap); full-screen drawer (`lg:hidden fixed inset-0 z-40`); content padding `p-4` vs `lg:p-8` |

Secondary usage: view headers stack (`flex-col lg:flex-row`), headings
scale (`text-3xl lg:text-4xl`), grids (`grid-cols-1 md:grid-cols-2
lg:grid-cols-3` — `md` = 768px for card grids), dialog max-widths are
viewport-independent (`max-w-2xl` etc.). The E2E mobile contract runs at
375×812; the manual drawer probes at 375×667.

---

## 18. Z-Index Layer Map

| Layer | Value | Owner |
|-------|-------|-------|
| Toast viewport | `z-[100]` | `ToastViewport` (toaster.tsx) — top of everything |
| Mobile top bar / FAB / dialogs | `z-50` | MobileTopNav bar; the sage FAB stays z-50 so it remains the close toggle while the chooser is open |
| Mobile drawer / Quick Add chooser overlay / dialog overlays | `z-40` | the drawer slides UNDER the top bar (X stays clickable); the chooser sits under the FAB by design (ADR-014) |
| Default flow | auto | everything else |

Rule: the FAB-chooser pair is intentionally split (50 over 40) — never
"fix" it to a single layer; Radix's modal body-lock is why the chooser is
`modal={false}`.

---

## 19. Color Reference (Complete)

**Semantic (classic shadcn neutral, light/dark):**

| Token | Light | Dark |
|---|---|---|
| `--background` / `--foreground` | `#ffffff` / `#0a0a0a` | `#0a0a0a` / `#fafafa` |
| `--card` / `--card-foreground` | `#ffffff` / `#0a0a0a` | `#0a0a0a` / `#fafafa` |
| `--primary` / `--primary-foreground` | `#171717` / `#fafafa` | `#fafafa` / `#171717` |
| `--secondary`/`--accent`/`--muted` | `#f5f5f5` | `#262626` |
| `--muted-foreground` | `#737373` | `#a3a3a3` |
| `--border` / `--input` | `#e5e5e5` | `#262626` |
| `--ring` | `#0a0a0a` | `#d4d4d4` |
| `--destructive` | `#ef4444` | `#7f1d1d` |
| `--destructive-foreground` | `#fafafa` | `#fafafa` |

**Finara brand tokens:** `--primary-sage #059669` (emerald-600 — CTAs,
FAB, active accent), `--primary-navy #1e293b` (slate-800 — headings,
sidebar base), sidebar `sidebar-gradient` (vertical navy ramp), dark
gray overrides map `.bg-white→#1e293b`, `.text-gray-900→#f1f5f9` …

**The v3 palette pin (ADR-018):** all 102 `--color-*` tokens across 14
families pinned to Tailwind v3 hexes in an unlayered `:root` block —
e.g. blue-600 `#2563eb`, red-500 `#ef4444`, emerald-400 `#34d399`,
slate-800 `#1e293b`, gray-900 `#111827`. Tailwind v4.1.18's own ramp
(e.g. slate-800 `#1d293d`, red-500 `#fb2c36`) and its `@supports lab()`
re-definitions BOTH lose to the unlayered pin — verified by computed
styles.

**Feature gradients:** income emerald-500→600, expenses red-500→600,
net/portfolio blue-500→600, savings/purple-500→600, action tiles
orange/cyan/blue/purple-500→600.

**Chart strokes (ADR-017):** lowercase hex — `#10b981` / `#ef4444` /
`#3b82f6`; grid `stroke="#e2e8f0"` + `dark:stroke-gray-600`; axes
`stroke="#64748b"` + `dark:stroke-gray-400"`, `tick={{ fill: "#64748b" }}`.

**Sector colors (ui-maps):** 9 fixed per-sector hexes, live-probed per
sector NAME.

---

## 20. The Complete TypeScript Interface Reference

All DTOs in `src/lib/types.ts` — ISO-date strings + minor-unit money:

```ts
interface AccountDto { id, name, type: "checking"|"savings"|"credit-card"|"investment"|"other",
  balanceMinor: number, currency, createdAt, updatedAt }
interface IncomeSourceDto { id, name, category: "primary"|"secondary"|"passive"|"other",
  amountMinor: number, frequency: "monthly"|"weekly"|"biweekly"|"annual",
  active: boolean, createdAt, updatedAt }
interface ExpenseDto { id, description, category: "Needs"|"Wants"|"Savings",
  subcategory: string, amountMinor: number, date, createdAt, updatedAt }
interface BudgetDto { id, category, limitMinor: number, createdAt, updatedAt }  // subcategory: null
interface GoalDto { id, title, category, priority: "high"|"medium"|"low",
  targetMinor: number, currentMinor: number, deadline, createdAt, updatedAt }
interface InvestmentDto { id, name, type: "stock"|"etf"|"bond"|"crypto"|"mutual-fund",
  shares: number, avgCostMinor: number, currentPriceMinor: number, sector, createdAt, updatedAt }
interface KpiCardDto { … } interface BudgetProgressDto { … }
interface RecentActivityItemDto { … }   // income rows badge the RAW category id
interface DashboardDto { kpis, budgets, recentActivity, trend, insights … }
interface AnalyticsDto { … }            // windowed server-side
interface SettingsDto { currency, dateFormat, theme, pushNotifications, emailAlerts,
  budgetWarnings, monthlyReports }
type InsightType = "anomaly"|"alert"|"trend"|"opportunity"|"prediction"
interface AiInsightDto { id, type: InsightType, title, message, suggestedAction?,
  confidence?, isDismissed, createdAt }
interface AiChatMessage { role: "user"|"assistant", content: string }
```

API envelope: `type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }`.
Validation: `requireString`, `requireSignedInt`, `requireFiniteNumber`,
`requireEnum` (+ `ValidationError`) from `src/lib/api.ts`.

---

## Appendix A — The ADR Catalog

| ADR | Decision |
|-----|----------|
| 012 | Centered modals for all add/edit dialogs |
| 014 | Three add-entry flows (FAB chooser / Quick Select / navigate) |
| 015 | shadcn primitives pinned to the live's classic class sets (17 files) |
| 016 | Effective typeface = Tailwind default system stack |
| 017 | Recharts live-pinned config |
| 018 | Tailwind palette pinned to v3 hexes (unlayered `:root`) |
| 019 | shadcn semantic tokens + radius/blur scales pinned to computed values |
| 020 | Icon class order + dialog form-body matrix pinned |
| 021 | Real routes via catch-all + SPA view switch |
| 022 | Settings propagate app-wide (no-store fetches) |
| 023 | Theme follows the account (sign-out reset, server-theme sign-in) |
| 024 | Money = signed integer minor units, zero amount validation |

---

## Appendix B — The 25-Round Parity History

| Round | Focus |
|-------|-------|
| 2–3 | Live-site parity audit; design-system adoption, centered modals, ui-maps |
| 4 | Classic primitive pins; shell/sidebar anatomy; Quick Add FAB |
| 5 | Income badges, system font, chart config, mobile drawer, palette pin |
| 6 | Semantic-token/radius/blur pins; per-dialog live matrix |
| 7 | Dialog form bodies + icon class order |
| 8 | Real-route architecture; order-parity sweep; bulk bar; ADR-021 |
| 9 | Settings propagation; live-shaped exports; inert From/To |
| 10 | Primary-family re-pin; ADR-023 theme lifecycle; Menu↔X swap |
| 11 | ADR-024 signed units; interactive-state sweep |
| 12 | Playwright E2E layer; title-hydration fix; tailwind.config deleted |
| 13 | Persisted AI insights; div titles; Progress indeterminate |
| 14 | framer-motion entrances CSS-replicated (`fin-*` keyframes) |
| 15 | Security round: advisory floors; migration baseline |
| 16 | RAW-order pins; drawer motion; SyncedBadge re-pin |
| 17 | HTTP/metadata layer: headers, per-route og, robots/sitemap |
| 18 | Per-route head STRUCTURE (login-only viewport/theme-color/icon pair) |
| 19 | Per-route description template (all three metas) |
| 20 | Dead-code purge: 31 ui files + 34 dependencies; ui-inventory contract |
| 21 | db-path contract implemented; `.env.example` aligned; mobile-nav + Tailwind v4 focus audit clean; suite verification |
| 22 | Full-stack verification round: fourth consecutive zero-drift re-probe; mobile-nav + Tailwind v4 cleared again; interactive sweep + production-readiness review — no code changes |
| 23 | Fifth zero-drift verification round: fifth consecutive zero-drift re-probe (19–23); mobile-nav + Tailwind v4 cleared again; focused interactive sweep (FAB/chooser/step-2/close-toggle both sides); audit tail 43/0-runtime; ANSI-artifact lesson extended (output-stream-general) — no code changes |
| 24 | Sixth zero-drift verification round (19–24) + documentation-debt alignment: mobile-nav + Tailwind v4 cleared again; focused interactive sweep + HTTP audit byte-exact; audit tail 43/0-runtime (CI bytes marker-safe-verified, the ANSI artifact re-demonstrated in the round's own script output); remediation = seven doc-drift fixes (the push-runbook's wrong remote + no-CI claim, the 7→8 model count + wrong model names, the PAD's stale 16.1.3/tailwind.config tree entry/378 count/glossary quarterly wording, this Appendix header) — no code changes |
| 25 | Seventh zero-drift verification round (19–25): mobile-nav + Tailwind v4 cleared again (71/71 drawer nodes; the v3 pin wins the cascade — computed `#2563eb`/`#1e293b`/`#ef4444`/`#34d399`/`#4b5563`); raw-order chrome probes byte-identical (aside/nav/innerPane/active-pill); HTTP layer byte-exact incl. the per-route description template verified in-browser; audit tail 43/0-runtime; CI bytes clean; the seven round-24 doc fixes verified holding — verification only, no code changes |

---

## Appendix C — The Live-Site Validation Method

The per-round re-probe (adapt for any clone project):

1. **Capture both sides** — agent-browser isolated sessions, live + a
   fresh production build, matched viewport AND theme; all view surfaces
   + the logged-out login.
2. **Body-DOM signature diff** — per-surface multiset of
   `tag.class` strings, in BOTH modes: sorted (structure) and RAW
   (order-sensitive; the round-16 lesson).
3. **Classify every delta** into the documented buckets: chart/data
   (recharts dots, row counts, icon inner-strokes), a11y additions,
   infra, lucide artifacts, the live's duplicated toaster, seed-data
   counts. A non-bucketed delta = real drift = remediate.
4. **Structural probes** — the Add Expense modal, the FAB chooser, the
   Progress indeterminate mechanism (translateX −75.5%, no
   aria-valuenow), the mobile drawer (open/navigate/X-swap + the rAF
   slide-in curve −300px → +35.6px overshoot → settle), the SyncedBadge
   string, sidebar raw orders, the user menu, the motion audit.
5. **HTTP-layer audit** (curl) — response headers, per-route head
   structure, description metas, robots.txt, sitemap.xml — the DOM diff
   is structurally blind to all of these (round 17).
6. **VLM side-by-side sweep** — theme-matched screenshots, ignore
   data/scroll differences; VERIFY every flag by measurement (viewport
   -only re-comparisons clear full-page scaling artifacts).
7. **Close browser sessions before the E2E gate** (the memory budget).

---

## Appendix D — Quick Reference Card

```
src/app/globals.css          design system (tokens, pins, fin-* keyframes)
src/app/page.tsx             / route
src/app/[view]/page.tsx      catch-all real routes
src/lib/routes.ts            VIEW_PATHS, parseRoute, segmentToTitle
src/lib/route-metadata.ts    per-route head (description template, og, login pins)
src/lib/money.ts             minor-units seam (signed, monthlyEquivalent)
src/lib/categories.ts        taxonomy single source
src/lib/ui-maps.ts           sector hexes, emoji, badges, icons
src/lib/dashboard-kpis.ts    KPI semantics (single implementation)
src/lib/expense-filters.ts   client-side filter/sort engine
src/lib/date-format.ts       5 date formats
src/lib/import-export.ts     CSV/Finara-export normalization
src/lib/db.ts                Prisma singleton (datasourceUrl wiring)
src/lib/db-path.ts           DATABASE_URL resolver (round 21)
src/lib/seed.ts              ensureSeeded (DB-level lock)
src/lib/api.ts               envelope + require* guards
src/lib/insights.ts          insight drafts + LLM-polish join
src/components/finara/       17 components + theme.ts
src/components/ui/           EXACTLY 17 pinned primitives
src/hooks/use-api.ts         typed fetch (no-store)
e2e/                         11 files / 67 specs (helpers.ts drivers)
prisma/migrations/           committed baseline (db:deploy)
docs/plans/                  all 20 round plans + execution records
docs/session_*.md            session evidence logs
docs/ssh_git_wrapper_v3.py   the push runbook's wrapper
financial-dashboard_SKILL.md this file
```

**Gates:** `bun run lint && bun run typecheck && bun run test (434) &&
bun run test:e2e (67)` — then push via the SSH wrapper, `main` only.
