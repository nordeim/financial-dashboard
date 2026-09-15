---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-spa-app
version: 1.0.0
last_updated: 2026-09-15
---

# Finara — Smart Finance Tracker

Single-page Next.js 16 personal-finance dashboard: income sources, 50/30/20 expenses and budgets, accounts, investments, savings goals, CSV bank import, analytics charts, and an AI coach grounded in live data. Prisma + SQLite persistence; money as integer minor units. Maintained as a faithful production-grade clone of the Finara base44 app.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — Read the relevant view component, its API route, and `src/lib/{types,categories,money}.ts` in full before writing. Identify which surface owns the data you are changing. For parity work, re-read `docs/plans/2026-09-15-parity-remediation-round2.md` § "Key live-site behavioral facts" first.
2. **PLAN** — State the smallest correct implementation path; name files touched. Money, budget, or AI-touching changes need extra validation.
3. **VALIDATE** — Confirm scope on money/auth-adjacent changes before coding.
4. **IMPLEMENT (TDD)** — Domain logic changes go red → green: write the failing `src/lib/__tests__/*.test.ts` spec first, implement in the pure module (`dashboard-kpis`, `expense-filters`, `date-format`, `import-export`, `money`, `categories`), then wire views/route handlers around it. Typed, validated increments; server logic in route handlers / `src/lib`, UI in `src/components/finara/*`.
5. **VERIFY** — `bun run lint && bun run typecheck && bun run test` green (69 unit tests); `bun run build` exits 0; exercise the flow in a browser (agent-browser or manual) and check the console for zero errors. Claims of "works" require executed evidence — label anything not executed as Reasoned/Assumed.
6. **DELIVER** — Note what was verified, what was deferred, and the commit grouping.

### Project-Specific Principles

- **Money is integers.** All amounts are minor units; floats never touch money paths (`src/lib/money.ts` is the only conversion seam).
- **The server is the source of truth.** Views render from API responses; derived client state (filters, tabs, form drafts) never duplicates persisted data.
- **One category taxonomy.** `src/lib/categories.ts` is the single source for categories/subcategories/emoji/frequencies/currencies — API validation and UI selects both consume it, and `categories.test.ts` pins the sets to the live source app.
- **Pure domain layer.** KPIs, filters, date formatting, and export normalization live in framework-free modules under `src/lib/` with Vitest specs — views never re-derive them.
- **Honest empty, loading, and error states** on every surface (`EmptyState`, `LoadingRows`, `ErrorNote` in `ui-bits.tsx`) — no silent fallbacks.
- **AI answers stay grounded.** Both AI endpoints build a compact snapshot from the DB first; the model may phrase, never invent, figures.

## Implementation Standards

### TypeScript (strict, enforced)

- `strict` on; avoid `any` — use `unknown` + the `require*` guards in `src/lib/api.ts`.
- Prefer `interface` for object shapes; `import type` for type-only imports.
- Route handlers return the `ApiResult<T>` envelope (`ok`/`fail`/`errorResponse`) — never throw across the client boundary; log internals server-side with a `[api]` prefix.

### Next.js 16 specifics

- The app is a **single route** (`src/app/page.tsx`): the shell switches views via `ViewId` state. Do not add page routes; only `/api/*` handlers are additional routes.
- Route handler `params` are async: `await context.params`.
- **React Compiler rules are lint errors**: never call setState synchronously inside an effect body; never depend on unstable memo references (`query.data ?? []` derived arrays). Session storage and the dark-mode theme read use `useSyncExternalStore` (see `finara-app.tsx`, `theme.ts`). For "reset when inputs change" use guarded render-time state adjustment (see `expenses-view.tsx`, `add-transaction-dialog.tsx`), not effects.
- Client components must never import `@/lib/analytics` or `@/lib/db` (Prisma would ship to the browser). Pure modules: `money`, `categories`, `types`, `dashboard-kpis`, `expense-filters`, `date-format`, `import-export`.
- Tailwind v4: tokens live in `src/app/globals.css` `@theme inline`; `tailwind.config.ts` at the root is unused legacy — do not extend it.

### Data layer (Prisma + SQLite)

- Schema in `prisma/schema.prisma`; after edits: `bun run db:generate`, then `bun run db:push` (dev) — SQLite has no migration history in this project yet.
- Every money column is an `Int` named `*Minor`. New money fields follow the same rule.
- Seeding is automatic and idempotent (`src/lib/seed.ts`): unique-key lock row + `_seeded` completion marker; losing callers poll for the marker. Do not seed in route handlers.
- Income totals normalize frequencies via `monthlyEquivalent` — apply it in any new income aggregation.

### Component conventions

- Views live in `src/components/finara/*-view.tsx`, each owning its `useQuery` slice; shared primitives in `ui-bits.tsx`; shadcn primitives in `src/components/ui/*` (don't hand-roll what shadcn provides).
- Lists that can grow get `max-h-*` + `overflow-y-auto` + the `finara-scroll` scrollbar class.
- Interactive elements: visible focus states, aria-labels on icon-only buttons, `role="progressbar"` with aria-valuenow on progress bars, 44px touch targets.

## Development Workflow

### Environment Setup

```bash
cp .env.example .env
bun install
bun run db:push
bun run dev        # http://localhost:3000 — demo credentials on the login card
```

### Build Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server :3000 |
| `bun run build` | Production build |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint 9 flat config |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` / `test:watch` | Vitest unit suite (69 tests) / watch mode |
| `bun run db:push` / `db:generate` | Apply schema / regen client |

## Testing Strategy

- **Pre-push gate**: `bun run lint && bun run typecheck && bun run test` (69 Vitest specs) + `bun run build`; browser-verify the touched flow and confirm zero console errors.
- **TDD loop for domain logic**: failing test → pure-module implementation → wire the view/route → re-run the suite. A behavior change without a test is incomplete.
- **Parity verification gates** (visual/behavioral parity with the source app): filters badge count, KPI placeholder fallbacks, savings-goal progress semantics, windowed analytics averages, dark-mode persistence, and taxonomy selects are all pinned by tests or browser checks — re-run them after any related change.
- Playwright E2E remains the planned next layer (see PAD §11); until then the golden paths are login → dashboard, expense add/edit/bulk-delete with filters, income/goal/account/investment CRUD, CSV import, export restore, dark-mode toggle + reload, AI chat.
- A red gate is a regression or a wrong test — never weaken lint/type rules to pass.

## Code Quality Standards

- No `console.log` in committed code (server `console.error` with context is expected in catch paths).
- Errors surfaced to users are customer-safe strings; operator detail stays in server logs.
- No placeholder values, dead code, or speculative abstractions.

## Git & Version Control

- Branch `main` only (this repo's push contract); Conventional Commits, atomic scope: `feat(expenses): quick-select category grid`.
- Never commit `.env*` (except `.env.example`), `*.key`, `ssh-key.txt`, or `db/*.db` — the `.gitignore` enforces it; keep it that way.
- Push via `docs/ssh_git_wrapper_v3.py` with an externally-supplied key (runbook: `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`). Gates green before push.

## Error Handling & Debugging

- API errors: throw `ValidationError` subclasses for 400s; `errorResponse` maps unknown failures to a generic 500 with a server-side log. Debug order: reproduce with the exact request → read the dev-server log → isolate → fix the cause.
- Client errors: `useQuery` surfaces `error` state per view with a retry affordance; mutations toast failures and refresh only on success.
- AI endpoints degrade explicitly: insights fall back to deterministic drafts when the model is unavailable; chat surfaces a retry toast.

## Communication & Documentation

- Comments explain why, not what; document non-obvious invariants at the seam (e.g. the seed lock, the minor-units rule).
- When behavior or setup changes, update `README.md` and `AGENTS.md` in the same commit.

## Project-Specific Standards

### Architecture

Single-route SPA shell → 9 feature views → 12 REST route groups → Prisma/SQLite. Shared typed contracts in `src/lib/types.ts` (DTOs with ISO-date strings + minor-unit money). Full reference: `Project_Architecture_Document.md`.

### API Design

REST resources under `/api/*` with the uniform envelope. Validation guards in `src/lib/api.ts`; category enums validated server-side, never trusted from the client.

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | SQLite file URL (relative to `prisma/schema.prisma`) | `file:../db/custom.db` |

## Anti-Patterns to Avoid

- Adding page routes or a router — the SPA view switch is the architecture.
- Float arithmetic or string money math — integers only.
- Importing `lib/db`/`lib/analytics` from client components.
- Seeding inside route handlers or component effects.
- `setState` in effect bodies (compiler error) or unstable `useMemo` deps.
- Presenting the demo login as real authentication.
