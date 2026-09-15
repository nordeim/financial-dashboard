# Finara (Financial Dashboard) — Master Project Architecture Document (PAD) v1.2

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Documents:** `README.md` (user onboarding), `AGENTS.md` (agent instructions), `CLAUDE.md` (Claude Code conventions), `docs/Finara_Dashboard.png` (visual reference of the original app), `docs/plans/2026-09-15-parity-remediation-round2.md` (round-2 parity audit), `docs/plans/2026-09-15-parity-remediation-round3.md` (round-3 pixel-parity audit + plan this revision implements)
**Last Updated:** 2026-09-15 (v1.2 — pixel-parity remediation round 3: ADR-011..013, source-exact design system, centered dialogs + native confirms, ui-maps module, CSS entrance animations; v1.1 — parity remediation round 2: ADR-008..010, pure domain layer + Vitest, taxonomy alignment, dark mode, filters/bulk/edit/pagination, export restore)
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale. Nothing is here "because it's popular."

---

## Table of Contents

1. [System Overview & Decisions](#1-system-overview--decisions)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Design System Reference](#5-design-system-reference)
6. [Security Architecture](#6-security-architecture)
7. [Testing Strategy](#7-testing-strategy)
8. [Build & Deployment](#8-build--deployment)
9. [Developer Handbook](#9-developer-handbook)
10. [Known Issues & Outstanding Tasks](#10-known-issues--outstanding-tasks)
11. [Key Files Reference](#11-key-files-reference)
12. [Glossary](#12-glossary)

---

## 1. System Overview & Decisions

### 1.1 Document Metadata & Purpose

Finara is a personal-finance dashboard: income, expenses, 50/30/20 budgets, accounts, investments, savings goals, CSV import, analytics, and AI-grounded insights. This PAD is the single source of truth for how the system is built and why. Use it when onboarding, extending a view/API pair, debugging the data flow, or replicating the architecture. It documents the current state only — no roadmap.

### 1.2 Technology Stack Summary

| Layer | Technology | Version | Key Rationale |
|-------|-----------|---------|---------------|
| Web framework | Next.js (App Router, Turbopack) | 16.1.3 | Route handlers + RSC-capable shell; the reference app it clones is a React SPA, and Next's single-page mode fits both the clone and the deployment sandbox |
| UI runtime | React | 19 | Required by Next 16; React Compiler enabled for automatic memoization discipline |
| Language | TypeScript (strict) | 5 | The app's core risk is money arithmetic and boundary data — strict typing is the cheapest defense |
| Styling | Tailwind CSS | 4 (CSS-first `@theme`) | Token-driven palette with zero runtime; v4's inline theme keeps shadcn tokens in one CSS file |
| Component primitives | shadcn/ui (new-york) on Radix | current | Accessible dialogs/selects/switches/tabs for free; matches the original app's look |
| Charts | Recharts | 2.15.4 | Declarative SVG charts matching the original dashboard's trend/area/pie visuals |
| ORM | Prisma | 6.19 | Typed SQLite access; schema-as-code with a one-command push loop for an embedded DB |
| Database | SQLite | 3 | Single-user personal finance app — an embedded file database removes all ops surface |
| AI | z-ai-web-dev-sdk | 0.0.18 | Server-side LLM access for the coach chat and insight phrasing; never shipped client-side |
| Validation | Custom guards (`src/lib/api.ts`) | — | Small, typed, dependency-free; mirrors the ActionResult envelope convention |
| Lint | ESLint 9 flat config + eslint-config-next | 9 | Includes React Compiler rules as hard errors (see §3.3) |
| Package manager / runtime | Bun | ≥ 1.3 | Fast installs; committed `bun.lock` guarantees reproducible resolution |

### 1.3 Architecture Decision Records (ADRs)

**ADR-001: Single-route SPA instead of file-based routing**

- **Context:** The original Finara app is a base44 SPA with client-side navigation. The clone must reproduce its UX (sidebar switching nine screens, dialogs, no full page loads) while running on Next.js.
- **Decision:** One page route (`src/app/page.tsx`) renders a client shell that switches `ViewId` state; all server interaction goes through `/api/*` route handlers.
- **Rationale:** Faithful clone semantics (instant view switches, preserved dialog state), plus the preview environment only exposes `/`. Nine page routes would add routing complexity the original doesn't have.
- **Consequences:** (+) Zero navigation latency; one layout to theme. (−) No per-view URL deep links; back button doesn't switch views. Acceptable for a dashboard clone; documented in AGENTS.md as an invariant.
- **Alternatives Rejected:** Next file-based routes per view (breaks SPA fidelity + sandbox constraint); react-router inside Next (duplicates what view state does with more machinery).

**ADR-002: Money as integer minor units everywhere**

- **Context:** Float arithmetic on currency produces classic rounding drift; the reference codebase (Scandi Haven) proved the integer-minor-units discipline in production.
- **Decision:** Every persisted money column is `Int` `*Minor` (cents). Conversion to/from decimal happens only at the UI/API edge via `toMinorUnits`/`formatMoney` in `src/lib/money.ts`.
- **Rationale:** Eliminates an entire class of financial bugs by construction; `Intl.NumberFormat` renders for humans.
- **Consequences:** (+) Exact sums, no drift, trivial DB aggregation. (−) Every new money field must remember the convention (enforced by review + AGENTS.md).
- **Alternatives Rejected:** Floats (rounding); decimal strings (parse complexity); DB DECIMAL (SQLite lacks native decimal).

**ADR-003: Prisma + SQLite over Postgres**

- **Context:** Single-user personal finance data with modest write volume; the repo must clone-and-run with zero external services.
- **Decision:** SQLite file at `db/custom.db` accessed through Prisma Client.
- **Rationale:** No server to provision, back up, or authenticate; `db:push` is the whole migration story for a demo-grade app; Prisma keeps the code typed and portable.
- **Consequences:** (+) One-command setup; file-level backup. (−) No concurrent multi-process writes (fine for this workload); upscaling to Postgres later requires schema provider swap + migrations (documented in §10).
- **Alternatives Rejected:** Postgres + Docker (ops overhead for a personal app); in-memory/localStorage (no server-side aggregation, no AI grounding).

**ADR-004: Demo login gate, not production auth**

- **Context:** The original app has real (Google + email) auth; this clone is a single-tenant demo whose credentials are published in the README.
- **Decision:** The login screen validates the documented demo credentials client-side; session presence is held in `sessionStorage` via a `useSyncExternalStore` external store.
- **Rationale:** Reproduces the original's sign-in UX without fabricating security. Real auth would add a password store, session backend, and multi-tenancy the clone doesn't need — and falsely implying it exists would be worse than honestly not having it.
- **Consequences:** (+) Faithful UX, zero auth complexity. (−) NOT production-safe; every doc states this explicitly; replacing it is the top backlog item (§10).
- **Alternatives Rejected:** NextAuth/Better-Auth with a demo user (half-fake security, more moving parts); no login screen at all (breaks clone fidelity).

**ADR-005: Database-level seed lock with completion marker**

- **Context:** Twelve route groups all call `ensureSeeded()` on first request; concurrent first requests (dashboard + insights fire together) double-seeded the database in practice — a module-global promise alone did not survive Next dev's per-bundle module instances.
- **Decision:** `seed()` inserts a unique `Setting._seed_lock` row first (DB-level mutex); losers poll for the `_seeded` marker (bounded ~5 s) before reading; the winner publishes `_seeded` last.
- **Rationale:** SQLite's unique constraint is atomic across every process/bundle that can touch the file — the only mutex that covers all observed failure modes. Verified with a 5-way concurrent request burst (zero duplication).
- **Consequences:** (+) Exactly-once seeding under any concurrency the app can generate. (−) Two sentinel rows live in `Setting` (filtered out of settings/export reads); a crashed seed leaves the lock held (fresh-DB retry is the remedy, documented).
- **Alternatives Rejected:** Module-global promise only (empirically insufficient in dev); `SELECT ... FOR UPDATE`-style advisory lock (not available on SQLite).

**ADR-006: AI grounding via server-side snapshot, with deterministic fallback**

- **Context:** LLM answers about personal finances must reflect the user's actual numbers; the model must also never be a single point of failure for the dashboard.
- **Decision:** Both AI endpoints first aggregate a compact snapshot from the DB (income, month-to-date categories, budgets, goals, portfolio). `/api/ai/chat` passes it as the system context; `/api/ai/insights` drafts deterministic insights, asks the model to polish them, and falls back to the drafts on any model error.
- **Rationale:** Prompt-injection-resistant grounding (the model sees numbers, not raw user text), and the dashboard never renders an empty error state when the model is down.
- **Consequences:** (+) Answers cite real figures; insights always render. (−) Snapshot assembly is server-only code that must stay in sync with new entities (AGENTS.md rule).
- **Alternatives Rejected:** Raw user question + full JSON dump to the model (injection risk, token cost); client-side SDK use (credential exposure).

**ADR-007: Income frequency normalization to monthly equivalents**

- **Context:** A biweekly $4,800 salary is $10,400/month, not $4,800 — naive sums misreport every derived KPI (savings rate, budget surplus, AI answers).
- **Decision:** `monthlyEquivalent(amountMinor, frequency)` in the pure `src/lib/money.ts`: biweekly ×26/12, weekly ×52/12, annual ÷12 (`quarterly`/`one-time` remain as legacy-data guards only). Every income total path (dashboard, analytics, insights, chat snapshot, income view) calls it.
- **Rationale:** One canonical, client-safe (no Prisma import) function keeps all five consumers consistent — it lives in `money.ts` precisely so client components can import it without dragging the DB client into the browser bundle.
- **Consequences:** (+) Correct KPIs everywhere. (−) "Monthly Income" excludes one-time windfalls by definition (an honest, documented choice).
- **Alternatives Rejected:** Raw sums (wrong); per-source next-payment projection (overkill for KPI cards).

**ADR-008: Dark mode as a module-level external store (`useSyncExternalStore`)**

- **Context:** The source app toggles a `dark` class on `document.documentElement` and persists the choice; React Compiler forbids the usual read-in-effect patterns, and SSR must not flash the wrong theme.
- **Decision:** `src/components/finara/theme.ts` exposes read/subscribe/write functions backed by `localStorage["finara-theme"]`. The shell consumes it via `useSyncExternalStore` with a `null` server snapshot; writes flip the `<html>` class and persist. `<html suppressHydrationWarning>` in `layout.tsx` absorbs the post-hydration class flip. Component dark styling uses Tailwind `dark:` variants; global tokens live in the `.dark` block of `globals.css`.
- **Rationale:** Identical discipline to the session gate (ADR-001's SPA shell): one external store, one subscription point, no effect-body setState (a compiler ERROR), no hydration flash.
- **Consequences:** (+) Theme survives reload; toggle works from the user menu (desktop) and the sun/moon button (mobile). (−) Every new view must remember its `dark:` variants (reviewed in the parity checklist).
- **Alternatives Rejected:** `next-themes` (adds a dependency for a 40-line store); CSS-only `prefers-color-scheme` (no user control); class toggle in an effect (compiler error).

**ADR-009: Pure domain layer with Vitest seams (TDD)**

- **Context:** Round-1 verification caught math bugs (analytics averages dividing all-time totals by window months; trend placeholders vs. real month-over-month) that browser spot-checks missed — the logic needed executable specifications.
- **Decision:** Framework-free modules own every piece of domain math: `dashboard-kpis.ts` (KPI computation incl. placeholder-fallback trends and goal-progress savings), `expense-filters.ts` (filter/sort/badge-count logic), `date-format.ts` (5 format patterns), `import-export.ts` (Finara export normalization), `ui-maps.ts` (live-verified visual maps), plus the existing `money.ts`/`categories.ts`. Each carries a Vitest spec in `src/lib/__tests__/` (76 tests); views and route handlers stay thin consumers. Behavior changes land red → green.
- **Rationale:** Pure functions are the cheapest thing to test; hoisting them out of components also satisfies the client-import rule (no Prisma/React in `src/lib` domain modules).
- **Consequences:** (+) Regressions in money math and parity rules now fail CI-locally before review; the KPI semantics are documented in code. (−) A second place to look for logic (lib, not view) — the rule is "if it computes, it lives in lib".
- **Alternatives Rejected:** Component-level React Testing Library tests (slower, brittle); snapshot tests (verify shape, not math).

**ADR-010: Taxonomy alignment with the source app + legacy normalization map**

- **Context:** The round-2 live-site audit captured the source app's exact native-select enums; the clone's drift (extra `one-time`/`quarterly` frequencies, missing income categories/goal priorities/investment types, SGD vs. the 10-currency set) surfaced in six dialogs.
- **Decision:** `src/lib/categories.ts` is the single source of truth and now mirrors the source sets exactly (subcategories + emoji order, frequencies `monthly|weekly|biweekly|annual`, income categories, goal categories + priorities, investment types + 9 sectors, account types, 10 currencies, 5 date formats). Pre-remediation rows normalize through a legacy subcategory map on API write; the seed emits only the new taxonomy. `categories.test.ts` pins every set.
- **Rationale:** One module feeds API validation, UI selects, and the CSV import guesser — aligning it once fixes every dialog; the test keeps future drift impossible to merge silently.
- **Consequences:** (+) Six dialogs match the source app; validation and UI can't diverge. (−) The legacy map is dead code once no pre-remediation databases exist (safe to remove later).
- **Alternatives Rejected:** Per-dialog hardcoding (the original bug); a DB enum table (overkill for a pinned set).

**ADR-011: Source-exact design system via CSS variables + captured utility classes (round 3)**

- **Context:** Rounds 1–2 approximated the source look (flat slate canvas, `shadow-sm` cards, emerald-500 buttons). The round-3 audit captured the live app's full DOM and stylesheet: gradient page shell, `bg-white/80 backdrop-blur-sm shadow-lg` cards, `--primary-sage #059669` / `--primary-navy #1E293B` tokens, vertical sidebar gradient, gray-based dark overrides, exact 500→600 feature-card gradients.
- **Decision:** `globals.css` now defines the Finara token set (`:root`/`.dark`), `.sidebar-gradient`, `.card-hover`, and the `.text-primary-navy`/`.bg-primary-sage` utility families; every view was restyled with the exact utility-class strings extracted from the live DOM. Per-name visual maps that cannot be utility classes (9 sector hexes, 7 goal emoji, priority badges, account icons, 50/30/20 dots/badges) live in the pure module `src/lib/ui-maps.ts`, pinned by `ui-maps.test.ts`.
- **Rationale:** Pixel parity by construction: copying verified strings beats re-deriving approximations; centralizing the non-class maps prevents per-view forking (the sector colors are fixed per sector NAME — proven by live delete-rank experiments — so a chart palette order would be wrong).
- **Consequences:** (+) 85–95 VLM parity scores across views; theme-exact dark mode. (−) Class strings are intentionally verbose literals (readability cost accepted for fidelity); the evidence archive lives outside the repo (referenced from the plan doc).
- **Alternatives Rejected:** Approximate restyle (round-1 result: visibly off); a component-level theme prop system (indirection without fidelity gain).

**ADR-012: Centered dialog system + native confirm() deletes (round 3)**

- **Context:** The clone used right-side Sheets for Add Transaction and immediate deletes; the live app opens every dialog as a centered modal (`max-w-2xl`, black/50 overlay) and deletes via the browser's native `confirm()` with fixed texts.
- **Decision:** All add/edit dialogs (transaction, income, goal, account, investment, AI Coach at `h-[80vh]`) are shadcn `Dialog` centered modals; the Add Expense modal opens in Quick Select mode (5 Needs subcategories) then swaps to the manual form in place with "← Back to Quick Select". Delete handlers wrap `window.confirm("Are you sure you want to delete this …?")` with the live app's exact wording; bulk delete pluralizes.
- **Rationale:** Structure parity is behavioral, not just visual — modal-vs-sheet changes focus flow, overlay affordance, and automation semantics; native confirms reproduce the live app's interruptive delete UX exactly.
- **Consequences:** (+) Verified E2E: FAB → Quick Select → manual → toast; confirm dialogs block correctly with exact texts. (−) Native `confirm()` is unstyleable (accepted — it is the source behavior); headless automation must stub/accept dialogs (documented in the verification workflow).
- **Alternatives Rejected:** Keeping Sheets (visible structural mismatch); styled AlertDialog replaces confirm (nicer, but breaks fidelity).

**ADR-013: CSS-only staggered entrance animations (round 3)**

- **Context:** The live app animates every section entrance with framer-motion (staggered fade/slide). Adding framer-motion for parity would cost a dependency + bundle weight for a decorative effect.
- **Decision:** `.fade-in-up` keyframe class + `.stagger-1..5` delay utilities in `globals.css`, applied to section wrappers; wrapped in `@media (prefers-reduced-motion: reduce)` to disable animation entirely.
- **Rationale:** Visually equivalent entrance for a fraction of the cost; reduced-motion accessibility is built in (closing the round-2 backlog item).
- **Consequences:** (+) Zero JS animation cost; reduced-motion safe. (−) Not spring-physics-identical to framer-motion (acceptable — entrance feel is matched, not physics).
- **Alternatives Rejected:** framer-motion dependency (bundle + complexity); no animation (visible parity gap).

---

## 2. High-Level System Topology

```mermaid
flowchart TB
    subgraph Client["Browser (user agent)"]
        UI["Finara SPA shell<br/>single route: /"]
        Storage["sessionStorage<br/>(demo session)"]
    end

    subgraph App["Next.js 16 (Node/Bun :3000)"]
        Shell["page.tsx → finara-app.tsx<br/>login gate + 9 views"]
        API["REST route handlers /api/*<br/>(12 groups, ApiResult envelope)"]
        Domain["src/lib: money · categories ·<br/>analytics · seed · api guards"]
        Prisma["Prisma Client"]
        AI["z-ai-web-dev-sdk<br/>(server-only)"]
    end

    subgraph Data["Embedded data"]
        SQLite[("SQLite<br/>db/custom.db")]
    end

    LLM["Z.ai LLM endpoint<br/>(chat + insights)"]

    UI -->|fetch JSON| API
    Shell --> Storage
    API --> Domain
    API --> Prisma
    Domain --> Prisma
    Prisma --> SQLite
    API <-->|snapshot-grounded calls| AI
    AI --> LLM
```

**Scaling characteristics and constraints:** single Node process; SQLite allows one concurrent writer (sufficient — writes are interactive user mutations, not bulk traffic). The AI path is the only external dependency; both AI features degrade deterministically when it is unavailable (ADR-006).

---

## 3. Application Architecture

### 3.1 The Layer Model

```
Layer 0: Browser shell      — finara-app.tsx: session gate, ViewId state, dialogs.
                                 Rule: no data fetching logic here; owns navigation + refresh signals.
Layer 1: Feature views      — *-view.tsx (9): each owns one useQuery slice + local UI state.
                                 Rule: render from DTOs; never duplicate persisted data into client state.
Layer 2: Shared UI          — ui-bits.tsx + shadcn primitives.
                                 Rule: no domain logic; props in, elements out.
Layer 3: API surface        — src/app/api/*: validation guards + envelope + aggregation calls.
                                 Rule: never throw across the boundary; internals logged server-side only.
Layer 4: Domain libraries   — src/lib (pure where possible): money, categories, types, analytics, seed.
                                 Rule: only analytics/seed/db import Prisma; client code imports the pure set only.
Layer 5: Persistence        — Prisma + SQLite schema (7 models, integer minor units).
                                 Rule: money columns are Int *Minor; no floats ever.
```

**The Golden Rule:** data flows strictly downward (view → API → domain → Prisma); types flow upward through the single `src/lib/types.ts` DTO contract. Nothing in Layers 0–2 may import Layer 4's DB-touching modules.

### 3.2 Annotated Directory Structure

```
financial-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← SPA entry: renders FinaraApp
│   │   ├── layout.tsx                  ← Inter font (400–800), metadata, Toaster
│   │   ├── globals.css                 ← Tailwind v4 @theme tokens (Finara palette)
│   │   └── api/
│   │       ├── dashboard/route.ts      ← KPI/budget/recent-activity aggregation
│   │       ├── income/route.ts + [id]/ ← income sources CRUD
│   │       ├── expenses/route.ts + [id]/← expenses CRUD (category validation)
│   │       ├── accounts/route.ts + [id]/← connected accounts
│   │       ├── budgets/route.ts        ← GET list / PUT upsert the 3 category budgets
│   │       ├── goals/route.ts + [id]/  ← goals CRUD + contributions
│   │       ├── investments/route.ts + [id]/ ← holdings CRUD
│   │       ├── import/route.ts         ← batch CSV import (row-level validation)
│   │       ├── analytics/route.ts      ← trends, breakdowns, portfolio metrics
│   │       ├── settings/route.ts       ← key-value preferences GET/PUT
│   │       ├── export/route.ts         ← GDPR full JSON download (file response)
│   │       └── ai/{chat,insights}/route.ts ← snapshot-grounded LLM features
│   ├── components/
│   │   ├── finara/
│   │   │   ├── finara-app.tsx          ← shell: session store, view switching, dialogs
│   │   │   ├── sidebar.tsx             ← desktop nav + mobile top nav (ViewId export)
│   │   │   ├── login-view.tsx          ← demo credential gate (constants exported)
│   │   │   ├── dashboard-view.tsx      ← KPIs, gradient cards, budgets, activity, insights
│   │   │   ├── income-view.tsx / expenses-view.tsx / accounts-view.tsx
│   │   │   ├── investments-view.tsx / import-view.tsx / analytics-view.tsx
│   │   │   ├── goals-view.tsx / settings-view.tsx
│   │   │   ├── add-transaction-dialog.tsx ← quick-select grid + manual form + quick amounts + edit prefill
│   │   │   ├── expense-filters-panel.tsx ← collapsible Filters panel (presets, min/max, sort)
│   │   │   ├── ai-coach-dialog.tsx     ← chat with quick actions + suggested questions
│   │   │   ├── theme.ts                ← dark-mode external store (useSyncExternalStore)
│   │   │   └── ui-bits.tsx             ← StatCard, GradientCard, EmptyState, TrendPill, …
│   │   └── ui/                         ← shadcn primitives (button, dialog, select, …)
│   ├── hooks/
│   │   ├── use-api.ts                  ← useQuery (loading/error/refresh) + mutate envelope
│   │   └── use-toast.ts                ← shadcn toast hook
│   └── lib/
│       ├── money.ts                    ← minor-units conversion, formatting, monthlyEquivalent (pure)
│       ├── categories.ts               ← source-app-aligned taxonomy + legacy map (pure)
│       ├── types.ts                    ← DTOs crossing the boundary (pure)
│       ├── dashboard-kpis.ts           ← KPI computation: goal-progress savings, placeholder-aware trends (pure)
│       ├── expense-filters.ts          ← filter/sort/badge-count logic for the expenses list (pure)
│       ├── date-format.ts              ← the 5 settings-aware date formats (pure)
│       ├── import-export.ts            ← Finara export normalization + flexible date parsing (pure)
│       ├── ui-maps.ts                  ← live-verified visual maps: sector hexes, goal emoji, badges, icons (pure)
│       ├── api.ts                      ← ApiResult envelope + validation guards (server)
│       ├── analytics.ts                ← getDashboard/getAnalytics aggregations (server)
│       ├── seed.ts                     ← idempotent, lock-guarded demo data (server)
│       ├── db.ts                       ← Prisma client singleton (server)
│       └── __tests__/                  ← Vitest specs (76 tests) for every pure module
├── prisma/schema.prisma                ← 7 models, Int *Minor money columns
├── db/                                 ← SQLite runtime storage (gitignored, .gitkeep)
├── docs/                               ← SSH wrapper + push runbook + reference image + plans/
├── vitest.config.ts                    ← Vitest runner (node env, @ alias)
├── public/finara-logo.png              ← login logo asset (source app)
├── .env.example                        ← DATABASE_URL only
├── AGENTS.md / CLAUDE.md / README.md   ← agent + human documentation
└── (eslint.config.mjs, tsconfig.json, tailwind.config.ts [legacy], postcss.config.mjs, components.json)
```

### 3.3 Critical Code Patterns

**Pattern 1 — The API envelope with validation guards** (`src/lib/api.ts`):

```typescript
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T, init?: number): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export class ValidationError extends Error {}

export function errorResponse(error: unknown): NextResponse<ApiResult<never>> {
  if (error instanceof ValidationError) {
    return fail(error.message, 400);            // guard failures are customer-safe by construction
  }
  console.error("[api] unhandled error:", error); // internals stay in server logs
  return fail("Something went wrong. Please try again.", 500);
}
```

*Why this pattern:* one boundary shape for every route means the client `mutate()`/`useQuery()` helpers never parse error prose, and operator detail can never leak to the browser. Guards (`requireNonNegativeInt`, `requireString`, `requireIsoDate`) make invalid input a typed 400 instead of a runtime crash.

**Pattern 2 — Concurrency-safe idempotent seed** (`src/lib/seed.ts`):

```typescript
try {
  // Unique key = DB-level mutex across processes AND route bundles.
  await db.setting.create({ data: { key: "_seed_lock", value: "acquired" } });
} catch {
  await waitForSeedCompletion(); // poll for the _seeded marker (bounded ~5s)
  return;
}
// … createMany for each entity …
// Publish completion LAST so waiters never read a partial database.
await db.setting.create({ data: { key: "_seeded", value: new Date().toISOString() } });
```

*Why this pattern:* the first browser load fires `/api/dashboard` and `/api/ai/insights` simultaneously; a module-global promise did not survive Next dev's per-bundle module instances and double-seeded the DB (observed, then fixed). SQLite's unique constraint is the only mutex covering every failure mode. Verified with a 5-request concurrent burst — zero duplication.

**Pattern 3 — M-3 external store for the demo session** (`finara-app.tsx`):

```typescript
// Server snapshot renders the logged-out shape; the client snapshot
// (sessionStorage cache) takes over after hydration. Never a useState
// initializer (freezes the SSR shape) and never effect-body setState
// (React Compiler lint error).
const session = useSyncExternalStore(subscribeSession, readSessionCache, getServerSession);
```

*Why this pattern:* the login gate must not hydration-mismatch, and `react-hooks/set-state-in-effect` is a hard error under the React Compiler — this is the sanctioned idiom (inherited from the Scandi Haven reference codebase).

**Pattern 4 — Stable memo dependencies** (`expenses-view.tsx`):

```typescript
// Deps must be stable state references — `query.data`, never the
// derived `const expenses = query.data ?? []` (fresh array identity
// per render breaks compiler-preserved memoization).
const visible = useMemo(() => {
  const filtered = (query.data ?? []).filter(/* … */);
  /* … sort, slice … */
}, [query.data, search, tab, sortDesc, expanded]);
```

**Pattern 5 — AI grounding snapshot** (`api/ai/chat/route.ts`):

```typescript
const context = await snapshot(); // income (normalized), month-to-date by
// subcategory, budget usage, goals, portfolio, accounts — numbers only.
const systemPrompt = [
  "You are Finara's AI financial coach…",
  "Never invent figures that are not derivable from the snapshot below.",
  "CURRENT FINANCIAL SNAPSHOT:", context,
].join("\n");
```

*Why this pattern:* the model receives aggregated facts rather than raw user text, so answers cite real numbers and prompt-injection surface is minimized; the insights twin adds a deterministic fallback so the dashboard degrades gracefully when the model is down.

---

## 4. Data Architecture

### 4.1 Database Schema

```mermaid
erDiagram
    Account ||..|| Setting : "independent entities"
    Expense }o--|| Budget : "category"
    Expense {
        string id PK
        string description
        int amountMinor "integer cents"
        string category "Needs|Wants|Savings"
        string subcategory "pinned enum"
        datetime date
        string notes
        boolean recurring
        string accountId FK
    }
    IncomeSource {
        string id PK
        string name
        int amountMinor "per payment, NOT monthly"
        string frequency "monthly|weekly|biweekly|annual"
        string category "primary|secondary|passive|other"
        boolean active
        datetime nextPaymentDate
    }
    Account {
        string id PK
        string name
        string type "checking|savings|credit-card|investment|other"
        string institution
        int balanceMinor "negative allowed (credit)"
    }
    Budget {
        string id PK
        string category "Needs|Wants|Savings"
        string subcategory "null = category-level"
        int monthlyLimitMinor
    }
    Goal {
        string id PK
        string name
        int targetAmountMinor
        int currentAmountMinor "clamped <= target"
        datetime deadline
        string category "emergency|vacation|home|car|education|retirement|other"
        string priority "high|medium|low"
    }
    Investment {
        string id PK
        string symbol
        string name
        string type "stock|etf|bond|crypto|mutual-fund|other"
        float shares "the ONLY float field (not money)"
        int avgPriceMinor
        int currentPriceMinor
        float portfolioPercent
        string sector
    }
    Setting {
        string key PK "unique — doubles as the seed lock"
        string value
    }
```

Notes: `Investment.shares` is a `Float` because share counts are not money (fractional shares are legitimate); prices and all other amounts are integers. `Setting.key` uniqueness is load-bearing — it implements the seed mutex (ADR-005).

### 4.2 Data Models

DTOs in `src/lib/types.ts` are the wire contract: dates serialize as ISO strings, money as `*Minor` integers. The client never sees Prisma types — routes map rows to DTOs explicitly (e.g. `toDto` in each route file).

### 4.3 Persistence Strategy

- **Client:** Prisma singleton via `globalThis` cache (`src/lib/db.ts`) — one connection pool per process, logging `error`/`warn` only.
- **Migrations:** `bun run db:push` (declarative sync). The project carries no migration history yet; adopting `prisma migrate dev` is listed in §10 for when the schema starts evolving in production.
- **Seeding:** automatic on first API request (ADR-005). Reset procedure: stop the server, delete `db/custom.db`, `bun run db:push`, restart (deleting the file under a live server splits the connection pool across inodes — an observed failure mode, documented in AGENTS.md).
- **Backup:** the database is one file (`db/custom.db`) plus the JSON export from `/api/export`.

---

## 5. Design System Reference

### 5.1 Typographic System

Inter (400/500/600/700/800) via `next/font/google`, exposed as `--font-inter`. Hierarchy (source-exact): page titles `text-3xl lg:text-4xl font-bold text-primary-navy dark:text-white`, KPI values `text-2xl/3xl bold tabular-nums`, labels `text-sm medium neutral-600`, captions `text-xs neutral-500`. All money uses tabular numerals.

### 5.2 Color Tokens

Two layers coexist in `src/app/globals.css`: the shadcn semantic tokens (oklch literals in `@theme inline`, consumed by Radix primitives) and the **Finara source tokens** (CSS variables + utility classes, captured from the live stylesheet — ADR-011):

| Token | Value | Usage | Contrast |
|-------|-------|-------|----------|
| `--primary-sage` | #059669 (emerald-600) | Primary buttons, FAB, budget fills, active-nav accent | 3.1:1 on white (large/UI elements) |
| `--primary-navy` | #1E293B (slate-800) | Headings, sidebar gradient base | white text 12.6:1 |
| Page shell | `from-slate-50 to-blue-50` / dark `gray-900→gray-800` | App canvas gradient | — |
| Card surface | `bg-white/80 dark:bg-gray-800/80` + `backdrop-blur-sm shadow-lg` (+ `.card-hover` lift) | All cards | 21:1 body text |
| Income / Expenses / Net / Savings accents | emerald / red / blue / purple — each `500→600` gradients | KPI tiles, hero cards, feature cards | white text ≥ 4.5:1 on gradients |
| Feature gradients | orange / cyan / blue / purple `500→600` | Dashboard action tiles | white ≥ 4.5:1 |
| Sector palette | 9 fixed hexes in `src/lib/ui-maps.ts` (per sector NAME) | Sector dot list + donut | — |

Dark mode swaps to the source app's gray ramp (gray-800/700/600 overrides in `.dark`), not slate.

### 5.3 Component Primitives

shadcn/ui (new-york style, Radix-based) for dialogs, selects, switches, tabs, tables, toasts. Finara composites in `ui-bits.tsx`: `StatCard` (always-emerald trend chip; no chip on Savings Progress), `GradientCard` (w-16 icon circles, exact gradients), `SectionCard` (source card surface), `ViewHeader`, `EmptyState`, `LoadingRows`, `ErrorNote`, `SurplusBadge`. Long lists get `max-h-* overflow-y-auto` with the `finara-scroll` custom scrollbar. All dialogs are centered modals (`max-w-2xl`; AI Coach `h-[80vh]`) — ADR-012.

### 5.4 Motion

CSS-only staggered entrance animations (`.fade-in-up` + `.stagger-1..5`, ADR-013), disabled under `prefers-reduced-motion`. Card hover uses `.card-hover` (translate + shadow lift); dialog scale/fade from `tw-animate-css`; chart mount animations from Recharts defaults.

---

## 6. Security Architecture

### 6.1 Security Rules

| Rule | Enforcement |
|------|-------------|
| All API input is untrusted and validated (type, range, enum, length) | `require*` guards in `src/lib/api.ts`; guards throw `ValidationError` → 400 |
| Money never arrives as floats from clients | `amountMinor` must be an integer; UI converts via `toMinorUnits` first |
| Category enums are server-authoritative | `CATEGORIES`/`ACCOUNT_TYPES`/`FREQUENCIES` sets checked in every route |
| No secrets in the repo | `.gitignore` rejects `.env*` (except example), `*.key`, `ssh-key.txt`; deploy key supplied externally per push |
| AI SDK stays server-side | Imported only inside `/api/ai/*` route handlers (client bundle audit by convention; AGENTS.md rule) |
| Operator detail never reaches the client | `errorResponse` logs internally, returns generic 500 copy |
| Import bounded | ≤ 2000 rows/batch, file ≤ 10MB client-side, CSV-only |

### 6.2 Security Utilities

`src/lib/api.ts` (guards + envelope), `.gitignore` key rejection, `docs/ssh_git_wrapper_v3.py` (0600 temp key, shred-after-push, `IdentitiesOnly`).

### 6.3 Authentication & Authorization

**There is no production authentication.** The login view checks the documented demo credentials (`sepnetflix2023@outlook.com` / `Abcd1234`) client-side; the "session" is a `sessionStorage` flag consumed through `useSyncExternalStore`. The Google button honestly reports it is unavailable. Every layer of documentation states this. Replacing the gate with a real provider (and adding per-user data scoping) is the first backlog item in §10.

### 6.4 Threat Model (top vectors and current posture)

| Vector | Posture |
|--------|---------|
| Prompt injection through AI chat | Mitigated: model sees an aggregated numeric snapshot, not raw DB text or user content mixed with data |
| XSS via transaction descriptions | React escapes by default; no `dangerouslySetInnerHTML` anywhere |
| CSV import abuse | Bounded size/rows; quoted-field parser; invalid rows skipped with per-row reporting |
| Secret leakage | Keys/env rejected by gitignore; wrapper shreds temp keys; export contains user data only |
| Unauthenticated API abuse (once deployed) | **Open** — demo gate is client-side; must be fixed before any real deployment (§10) |

---

## 7. Testing Strategy

### 7.1 Test Distribution

| Category | Count | Framework | Location |
|----------|-------|-----------|----------|
| Lint gate | 1 suite | ESLint 9 + React Compiler rules | repo root |
| Type gate | 1 suite | `tsc --noEmit` (strict) | repo root |
| Unit suite | 76 tests / 7 files | Vitest 5 (node env) | `src/lib/__tests__/` |
| Browser verification | ~40 golden-path checks | agent-browser session per push round | n/a |
| Visual parity check | theme-matched VLM side-by-side per view | z-ai vision | evidence archive |

Unit coverage: `money` (13 — minor units, formats, monthly-equivalent incl. annual), `expense-filters` (17 — presets, search, sort, badge count), `dashboard-kpis` (14 — goal-progress savings, placeholder-aware trends, largest-expense bucket, mixed recent activity), `categories` (12 — taxonomy sets pinned to the source app), `date-format` (7), `import-export` (6 — export round-trip, per-entity row errors, PascalCase keys), `ui-maps` (7 — sector hexes, goal emoji, priority badges, dots/badges, account icons pinned to the live DOM).

### 7.2 Verified at build time (evidence-backed)

Login → dashboard; all nine views render live data in light AND dark mode (screenshots archived per round); FAB click → Add Expense centered modal in Quick Select mode → quick-select prefill → quick amount → submit → toast + list refresh; expense edit dialog (prefill → save → persisted); native confirm() delete with the exact live text (accept → row removed); income add/edit/delete; goal create + Add Progress + delete; account and investment CRUD with confirm deletes; filters panel (badge "2" default, category apply → filtered count, Clear All → reset); pagination (page 2 active state); AI coach chat returns grounded figures; AI insights render with fallback; GDPR export downloads valid JSON; dark-mode toggle via user menu + mobile button, persists across reload; mobile viewport + full-screen drawer navigation; zero console errors on fresh load; 5-way concurrent seed burst with zero duplication; production `next build` exits 0; theme-matched VLM side-by-side comparisons score 85–95 across views (data/scroll differences excluded by design).

### 7.3 Coverage Thresholds

Vitest covers the pure domain layer (`src/lib` behavior modules) with 76 tests; thresholds are not enforced numerically yet — the rule is "every behavior change lands with its failing test first" (ADR-009). Playwright E2E over the golden paths is the planned next layer (§10).

### 7.4 Pre-Push Checklist

- [ ] `bun run lint` exits 0
- [ ] `bun run typecheck` exits 0
- [ ] `bun run test` — 76 tests, 0 failures
- [ ] `bun run build` exits 0
- [ ] Touched flow exercised in a browser (golden path) with zero console errors
- [ ] No secrets staged (`git ls-files | grep -E "\.env$|\.key$|ssh-key"` is empty)
- [ ] Commit messages follow Conventional Commits
- [ ] Push via `docs/ssh_git_wrapper_v3.py` to `main`

---

## 8. Build & Deployment

### 8.1 Production Build

```bash
bun run build   # next build (Turbopack)
bun run start   # next start -p 3000
```

Output: standard Next build (`.next/`). No `output: "standalone"` in the committed config — the deployment story is a plain Node host.

### 8.2 Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | SQLite URL relative to `prisma/schema.prisma` | `file:../db/custom.db` (from `.env.example`) |

No other variables exist. AI access is configured by the hosting environment's SDK credentials (the `z-ai-web-dev-sdk` reads its own runtime configuration — nothing is committed).

### 8.3 Docker Configuration

None. The app is a Node process + one SQLite file; containerization is deliberately out of scope until a real deployment target exists.

### 8.4 CI/CD Pipeline

No CI configured. The push contract (gates green → wrapper push to `main`) is documented in `AGENTS.md` and `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`; adding a GitHub Actions gate that replays `lint + typecheck + build` is backlog (§10).

---

## 9. Developer Handbook

### 9.1 Local Setup

```bash
cp .env.example .env
bun install
bun run db:push     # creates db/custom.db
bun run dev         # http://localhost:3000 — demo credentials on the login card
```

First API request auto-seeds ~6 months of demo history (96 expenses, 4 income sources, 4 accounts, 3 budgets, 3 goals, 8 holdings, settings).

### 9.2 Common Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` / `build` / `start` | Dev / production build / serve |
| `bun run lint` / `typecheck` | Quality gates (must be green) |
| `bun run db:push` / `db:generate` | Apply schema / regenerate Prisma client |
| `python3 docs/ssh_git_wrapper_v3.py --key-file <path> --remote git@github.com:nordeim/financial-dashboard.git` | Authenticated push to `main` |

### 9.3 Code Style Rules

Enforced by ESLint 9 (flat) + TypeScript strict + React Compiler rules: no `setState` in effect bodies, stable memo deps, `unknown` over `any`. Conventions beyond tooling (minor units, envelope, pure/server module split) are in `AGENTS.md` and reviewed manually.

### 9.4 Git Workflow

Branch `main` only (this repo's contract). Conventional Commits, atomic scope (`feat(expenses): …`). Never commit `.env*`, keys, or `db/*.db`. Pushes go through the SSH wrapper with an externally-supplied deploy key.

---

## 10. Known Issues & Outstanding Tasks

| Priority | Issue | Impact | Status |
|----------|-------|--------|--------|
| CRITICAL | Demo login gate is client-side only; API is unauthenticated once deployed | Anyone reaching a deployed instance can read/write all data | Open — replace with real auth before any real deployment |
| HIGH | No CI pipeline | Push gate is honor-system | Open — planned |
| MEDIUM | No migration history (schema via `db:push`) | Schema evolution on live data is unsafe | Open — adopt `prisma migrate dev` |
| MEDIUM | Analytics income trend is flat (monthly normalization applied to all months) | Trend chart understates historical income variation | Open — by design until per-month income events exist |
| MEDIUM | Playwright E2E layer absent | Browser golden paths re-run manually each round | Open — planned (Vitest layer shipped 2026-09-15) |
| LOW | `tailwind.config.ts` is unused legacy scaffold | Confusing dead file | Open — safe to delete with a docs pass |
| LOW | One-time income sources excluded from monthly totals | KPI definition choice, documented | By design |
| LOW | Source-app trend placeholders replicated as fallbacks only | Deliberate parity trade-off — real MoM math wins when history exists | By design (ADR-009) |
| LOW | Analytics Income tab renders empty (all states) | Deliberate replication of a verified source-app quirk | By design (documented in `analytics-view.tsx`) |
| LOW | Trend chips always render emerald TrendingUp, even for negative MoM | Deliberate replication of a verified source quirk | By design |
| LOW | Toast library differs from source's sonner styling | Minor visual difference in notifications | Open — swap only if materially different |

Resolved in the 2026-09-15 parity remediation (round 2): taxonomy drift in six dialogs, missing dark mode, missing expenses filters/bulk/edit/pagination, missing income/goal/account/investment edit endpoints, KPI semantics (savings-goal progress, placeholder trends), windowed analytics averages, settings export-file restore, test-runner absence (69-test Vitest suite). Plan and audit trail: `docs/plans/2026-09-15-parity-remediation-round2.md`.

Resolved in the 2026-09-15 pixel-parity remediation (round 3): design-system drift (flat canvas → gradient shell, shadow-sm → glass cards, emerald-500 → sage tokens, slate → gray dark ramp), Sheet → centered modal conversion, missing FAB, wrong sidebar icons/logo, dashboard layout (AI Insights position, Quick Actions anatomy, budget dot rows, arrow-icon activity rows), income hero gradient, expenses summary cards + segmented tabs, accounts type icons + balance layout, investments gradient KPIs + sector dot list, goals emoji map + priority badges, analytics controls + empty income tab, import drop area, settings info boxes + tiles, login light theme + logo asset, missing native confirm() deletes, missing entrance animations, `prefers-reduced-motion` support (was a round-2 backlog item), production build script fix. Plan and audit trail: `docs/plans/2026-09-15-parity-remediation-round3.md`.

---

## 11. Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/finara/add-transaction-dialog.tsx` | ~548 | Centered Add Expense/Income modal: Quick Select mode → manual form, quick amounts, validation (ADR-012) |
| `src/components/finara/expenses-view.tsx` | ~487 | Summary gradient cards, segmented tabs, search/filters, rows, bulk ops, pagination, FAB |
| `src/components/finara/investments-view.tsx` | ~475 | Gradient KPIs, holdings table, sector dot list (SECTOR_COLORS), add-holding dialog |
| `src/components/finara/dashboard-view.tsx` | ~434 | KPI cards, action tiles, budget dot rows, arrow-icon activity, AI insights, quick actions, FAB |
| `src/components/finara/import-view.tsx` | ~421 | 3-step CSV import with client-side parsing + category guessing |
| `src/components/finara/goals-view.tsx` | ~421 | Purple-tile goal cards, emoji map, priority badges, progress, Add Progress dialog |
| `src/components/finara/income-view.tsx` | ~349 | Emerald hero card, income source cards with monthly equivalents |
| `src/components/finara/analytics-view.tsx` | ~326 | Segmented tabs, trend chart, category donuts, sector donut (empty Income tab — source quirk) |
| `src/components/finara/sidebar.tsx` | ~299 | Gradient sidebar + mobile chrome (top bar, Synced badge, full-screen drawer) |
| `src/components/finara/accounts-view.tsx` | ~285 | Type-icon account cards, balance block, import link |
| `src/components/finara/settings-view.tsx` | ~285 | Preferences, notifications, GDPR export/import, data summary tiles |
| `src/lib/analytics.ts` | ~276 | Server aggregations: `getDashboard` / `getAnalytics` |
| `src/components/finara/ui-bits.tsx` | ~250 | Source-exact shared composites (StatCard, GradientCard, SectionCard, …) |
| `src/components/finara/expense-filters-panel.tsx` | ~233 | Live-shaped filters panel (date/category/amount/sort + Clear/Cancel/Apply) |
| `src/lib/categories.ts` | ~226 | 50/30/20 taxonomy single source of truth (delegates goal emoji to ui-maps) |
| `src/components/finara/login-view.tsx` | ~214 | Light-theme login card with logo asset, demo credential gate |
| `src/lib/seed.ts` | ~197 | Idempotent, lock-guarded demo seed (ADR-005) |
| `src/components/finara/finara-app.tsx` | ~187 | SPA shell: session store, view switching, dialog wiring, gradient canvas |
| `src/components/finara/ai-coach-dialog.tsx` | ~146 | Centered chat modal (h-[80vh]) with quick actions + grounded replies |
| `src/lib/types.ts` | ~155 | DTO contract for the whole client/server boundary |
| `src/app/api/import/route.ts` | ~119 | Batch import (CSV rows + finara-export mode) with row-level validation |
| `prisma/schema.prisma` | ~96 | 7 models, integer minor-unit money |
| `src/lib/ui-maps.ts` | ~75 | Live-verified visual maps: sector hexes, goal emoji, badges, icons (ADR-011) |
| `src/lib/api.ts` | ~72 | ApiResult envelope + validation guards |
| `src/lib/money.ts` | ~78 | Minor-units conversion, formatting, `monthlyEquivalent` |

---

## 12. Glossary

| Term | Meaning |
|------|---------|
| **Minor units** | The smallest currency division (cents for USD); all money is stored as integers in minor units |
| **50/30/20 rule** | Budget taxonomy: 50% Needs, 30% Wants, 20% Savings — the app's expense category set |
| **Monthly equivalent** | An income amount normalized to its monthly value (biweekly ×26/12, weekly ×52/12, quarterly ÷3) |
| **DTO** | Data Transfer Object — the typed wire shapes in `src/lib/types.ts` (ISO dates + minor-unit money) |
| **Seed lock** | The unique `Setting._seed_lock` row that guarantees exactly one seeder (ADR-005) |
| **ViewId** | The SPA navigation state union (`dashboard | income | expenses | …`) exported from `sidebar.tsx` |
| **M-3 idiom** | `useSyncExternalStore` pattern for browser-storage-backed state that must not hydration-mismatch |
| **ApiResult envelope** | `{ ok: true, data } | { ok: false, error }` — the uniform API response shape |
| **SSH wrapper** | `docs/ssh_git_wrapper_v3.py` — authenticated push helper with temp-key materialization and shredding |
