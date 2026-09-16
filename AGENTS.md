# AGENTS.md

Instructions for AI coding agents working in this repository. Every line answers: "would you get this wrong without being told?" Verified against the toolchain on 2026-09-16.

## Commands

Run from the repo root. Bun is the canonical package manager — never mix `npm`/`yarn`/`pnpm` installs (the committed `bun.lock` is the resolution for exactly the committed `package.json`).

| Command | What it does |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Dev server on :3000 (Turbopack) |
| `bun run build` / `bun run start` | Production build / serve (build before start) |
| `bun run lint` | ESLint 9 flat config — must exit 0 |
| `bun run typecheck` | `tsc --noEmit` — must exit 0 |
| `bun run test` / `bun run test:watch` | Vitest unit suite (98 tests) / watch mode |
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
- **UI maps source of truth is `src/lib/ui-maps.ts`.** Live-verified per-sector hex colors, goal-category emoji (🛡️ ✈️ 🏠 🚗 🎓 🏖️ 🎯), priority/activity/expense-row badge classes, account-type icons, 50/30/20 dots and category badge classes. Views must consume these maps — never fork a color/emoji/icon value into a component. `ui-maps.test.ts` pins every entry.
- **shadcn primitives are PINNED to the live app's classic class sets (ADR-015).** `src/components/ui/{button,badge,card,input,label,select,tabs,checkbox,switch,table,scroll-area,progress,alert,toast,toaster,dropdown-menu,separator}.tsx` render the exact strings the live app renders — no `data-slot`, `focus-visible:ring-1` (not ring-[3px]), Card `py-6` split, Badge/Toaster viewport as `div` (not span/ol). `src/lib/__tests__/ui-primitives.test.tsx` pins every string — do NOT "upgrade" these files with `npx shadcn add/diff`; a newer snapshot fails the suite by design. Vendored-but-unused primitives outside the pinned set are not app-rendered.
- **Icon-rename guard:** lucide-react 0.525 aliases redesigned icons to old names (`Filter` → rounded `Funnel`). Where the live app renders the classic shape, use the live-exact inline SVG instead (see `ClassicFilterIcon` in `ui-bits.tsx`).
- **Design-system class strings mirror the captured live DOM** (round-3 evidence archive, not in-repo): page shell `bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800`, cards `bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg` + `.card-hover`, sidebar `sidebar-gradient` + emerald-500/20 active pill, headings `text-3xl lg:text-4xl text-primary-navy`, primary buttons `bg-primary-sage`. `globals.css` carries the Finara CSS vars (`--primary-navy`, `--primary-sage`, …) and the gray-800/700/600 dark overrides. When restyling, copy the exact class string from the live DOM evidence — do not approximate.
- **The effective typeface is the Tailwind default system stack** (ADR-016, round-5 computed-style probe): `--font-sans: ui-sans-serif, system-ui, sans-serif, …` — the live app's Inter `@import` is overridden by its root `font-sans`, so everything renders system-ui. Keep `next/font` Inter on `<body>` (mirrors live's loaded-but-overridden import) but never map `--font-sans` back to Inter. No tabular-nums on money/table values (live computes `font-variant-numeric: normal`).
- **The Tailwind palette is pinned to v3 hex values** (ADR-018, round-5): `globals.css` defines `--color-<family>-<step>` for every token the UI uses (102 across 14 families) in an unlayered `:root` block, because Tailwind v4's regenerated ramp drifts from the live app's v3 colors (e.g. blue-600 `#155dfc` vs live `#2563eb`, red-500 Δ24, emerald-400 Δ52; live-probed dark grid `rgb(75,85,99)` = v3 gray-600). Do not remove the pin or "modernize" to v4/oklch values — utilities must render the v3 colors. The unlayered block intentionally beats `@layer theme` and Tailwind's `@supports lab()` re-definitions.
- **Charts render the live configuration** (ADR-017, round-5): `CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-gray-600"` with BOTH grid directions; axes `stroke="#64748b" className="dark:stroke-gray-400" tick={{ fill: "#64748b" }}` with visible axis + tick lines and NO explicit fontSize (renders the SVG default 16px like live); Legend keeps the default icon (no `iconType="circle"`); line strokes are lowercase hex (`#10b981` / `#ef4444` / `#3b82f6`).
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
- **All dialogs are centered modals** (`shadcn Dialog`, content base `max-w-2xl`), including Add Transaction, edit dialogs, and the AI Coach (`h-[80vh]`). `DialogTitle` injects NO base classes — every call site owns its live-exact set (full modals: `font-semibold leading-none tracking-tight …`; Quick Add: `text-lg font-semibold text-gray-900 dark:text-white`). Only the Add Expense modal and the edit form dialogs carry `max-h-[90vh] overflow-y-auto`; Quick Add and AI Coach contents must NOT. The Add Expense modal opens in **Quick Select mode first** (5 Needs subcategory buttons — outline Buttons with `items-center`, tile labels from `QUICK_SELECT_SUBCATEGORIES` where rent reads "Rent/Mortgage" while the stored id keeps "Rent"; tapping a tile pre-fills the description), then swaps to the manual form in the same dialog with "← Back to Quick Select". Title icons: `Receipt` for expense, `DollarSign` for income. No `DialogDescription` in the Add Expense/Add Income/AI Coach headers (live renders none). Do not convert these back to side Sheets — the live app uses centered modals.
- **Deletions use native `window.confirm()`** with the live app's exact texts: "Are you sure you want to delete this expense/income source/goal/account/investment?" (bulk delete pluralizes). Never replace with a custom confirm dialog.
- **Analytics Income tab renders empty by design** — the live app shows no content in both empty and data states (verified quirk, documented in `analytics-view.tsx`). Do not "fix" it.
- Dashboard layout: `grid lg:grid-cols-3` — Budget Overview `col-span-2`, right column stacks Recent Activity + AI Insights; Quick Actions LAST (h-16 flex-col link buttons); FAB `fixed bottom-6 right-6` on Dashboard + Expenses. KPI trend chips always render `TrendingUp` + emerald (live quirk — real MoM values still flow through).
- **FAB opens the Quick Add chooser (ADR-014), NOT the full modal.** Two steps at overlay `z-40`: chooser ("What would you like to add?" → Add Income / Add Expense) → compact form (description, amount, category Select). Expenses submit `subcategory: "other"`; income defaults frequency monthly. The sage FAB stays on top (`z-50`) as the close toggle and rotates its plus 45° into an X while open (`transform: rotate(45deg)` wrapper). The Expenses header button keeps the FULL Quick Select modal; the Dashboard header "Add Transaction" NAVIGATES to Expenses — three distinct flows, do not merge them.
- **Budget rows render per budget record** (the live user simply has one record — a data difference, not a filter). Footer semantics: `percent(x, 0)` is 0 and a `limit === 0` row shows "0.0% used · $0.00 remaining" — never the over-budget wording (`budgetRemainingLabel` in `dashboard-kpis.ts`, spec-pinned).
- **Recent Activity rows are plain `div`s with NO calendar icon on dates**; badges come from `ACTIVITY_BADGE` (ui-maps) — income rows badge with the source's raw category id ("primary"/"secondary"/"passive", green/orange/gray), so `IncomeEventInput.category` must always be populated (`analytics.ts` passes `source.category`); the emerald/red text color lives on the icon circle `div`, and the arrow glyphs inherit `currentColor`. Income source card badges likewise render the raw category id, never the lowercased label.
- Dashboard "month to date" filters use `date <= now` — future-dated rows are excluded (the seed dates today's entries at 01:00 for this reason).
- Expenses list UX mirrors the source app: client-side filtering via `applyExpenseFilters` (date-range presets + custom, category, min/max, search, sort), 10-row pagination, bulk select → bulk category edit / delete, per-row edit dialog. The Filters badge replicates the source quirk of counting the two default amount inputs as active (shows "2" untouched). The Filters button icon is the classic angular filter polygon (`ClassicFilterIcon`), not lucide's modern Funnel.
- **Toasts are a deliberate round-4 delta:** the live app showed NO toasts on add/delete this round; the clone keeps its confirmation toasts (reversible — see PAD §10). Do not remove them without a parity decision.
- **AI Coach renders the live chat anatomy** (round-5): body wrapper `p-6 pt-0 flex-1 flex flex-col min-h-0` around ScrollArea (`flex-1 pr-4`) + quick-questions + form; user bubble `max-w-[85%] flex flex-col items-end` > `rounded-2xl px-4 py-2.5 bg-slate-800 dark:bg-slate-600 text-white` > `p.text-sm.leading-relaxed`; assistant bubble wraps the reply in a prose block (`text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`, paragraphs `my-1 leading-relaxed text-slate-700 dark:text-slate-300` via react-markdown); quick-questions label `text-sm text-gray-600 dark:text-gray-400 mb-2`; chips are outline Buttons `h-8 rounded-md px-3 text-xs`; send button uses the default variant. NO visible "AI is thinking…" bubble (live renders nothing while waiting; the `sending` guard stays).
- **Mobile drawer bottom renders a direct Sign Out button** (round-5): `p-4 border-t border-slate-700/30` + outline button `w-full text-white border-slate-600 hover:bg-white/10 hover:text-white` + `LogOut mr-2 h-4 w-4` — NO Synced badge, NO user menu in the drawer (the badge lives in the mobile top bar; Dark Mode has its own top-bar toggle). Desktop sidebar bottom keeps SyncedBadge + UserMenu (live-matched). Mobile header/menu icons are `h-5 w-5` (menu) with `mr-2` on user-menu item icons.
- Entrance animations are CSS-only staggered fade-ups (`.fade-in-up` + `.stagger-N` in `globals.css`), disabled under `prefers-reduced-motion`. No framer-motion dependency — do not add one.

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
- `docs/plans/2026-09-15-parity-remediation-round2.md` — round-2 live-site parity audit + remediation plan.
- `docs/plans/2026-09-15-parity-remediation-round3.md` — round-3 pixel-parity plan (design-system adoption, centered modals, ui-maps) this codebase implements.
- `docs/plans/2026-09-15-parity-remediation-round4.md` — round-4 structural-parity plan (classic primitive pins, shell/sidebar anatomy, Quick Add FAB flow) + the execution & verification record (gates, E2E, DOM re-diff before/after, VLM scores).
- `docs/plans/2026-09-16-parity-remediation-round5.md` — round-5 plan + execution record (income badges, system font, chart config, dialog classes, AI Coach anatomy, mobile drawer, palette pin F15, 36/36 E2E, DOM re-diff classification).
