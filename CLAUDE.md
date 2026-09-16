---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-spa-app
version: 1.0.0
last_updated: 2026-09-16
---

# Finara — Smart Finance Tracker

Single-page Next.js 16 personal-finance dashboard: income sources, 50/30/20 expenses and budgets, accounts, investments, savings goals, CSV bank import, analytics charts, and an AI coach grounded in live data. Prisma + SQLite persistence; money as integer minor units. Maintained as a faithful production-grade clone of the Finara base44 app.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — Read the relevant view component, its API route, and `src/lib/{types,categories,money,ui-maps}.ts` in full before writing. Identify which surface owns the data you are changing. For parity work, re-read the round-5 plan `docs/plans/2026-09-16-parity-remediation-round5.md` §A/§E.9 (and round-4 §A/§E, round-3 § audit findings, round-2 § "Key live-site behavioral facts") first — class-exact restyles copy the strings from the captured live DOM evidence, never approximations.
2. **PLAN** — State the smallest correct implementation path; name files touched. Money, budget, or AI-touching changes need extra validation.
3. **VALIDATE** — Confirm scope on money/auth-adjacent changes before coding.
4. **IMPLEMENT (TDD)** — Domain logic changes go red → green: write the failing `src/lib/__tests__/*.test.{ts,tsx}` spec first, implement in the pure module (`dashboard-kpis`, `expense-filters`, `date-format`, `import-export`, `money`, `categories`, `ui-maps` — plus the primitive class-set pins in `ui-primitives.test.tsx`), then wire views/route handlers around it. Typed, validated increments; server logic in route handlers / `src/lib`, UI in `src/components/finara/*`.
5. **VERIFY** — `bun run lint && bun run typecheck && bun run test` green (101 unit tests); `bun run build` exits 0; exercise the flow in a browser (agent-browser or manual) and check the console for zero errors. Claims of "works" require executed evidence — label anything not executed as Reasoned/Assumed. Parity changes additionally require computed-style probes (font stack, chart colors in both themes) and a signature-multiset DOM re-diff against the captured live app, with every only-live/only-clone delta accounted for in the documented buckets (infra, a11y additions, lucide artifacts, live's duplicated toaster, seed-data counts).
6. **DELIVER** — Note what was verified, what was deferred, and the commit grouping.

### Project-Specific Principles

- **Money is integers.** All amounts are minor units; floats never touch money paths (`src/lib/money.ts` is the only conversion seam).
- **The server is the source of truth.** Views render from API responses; derived client state (filters, tabs, form drafts) never duplicates persisted data.
- **One category taxonomy.** `src/lib/categories.ts` is the single source for categories/subcategories/emoji/frequencies/currencies — API validation and UI selects both consume it, and `categories.test.ts` pins the sets to the live source app.
- **One UI-map module.** `src/lib/ui-maps.ts` is the single source for live-verified sector hexes, goal emoji, priority/activity/expense-row badges, account icons, category dots/badges — pinned by `ui-maps.test.ts`; views never fork these values inline.
- **Pinned shadcn primitives (parity contract, ADR-015).** `src/components/ui/*` render the live app's classic class sets, enforced by `ui-primitives.test.tsx` — never "upgrade" them with `npx shadcn add/diff`; a newer snapshot fails the suite by design. Where lucide renamed a glyph (Filter→Funnel), the live-exact shape is an inline SVG (`ClassicFilterIcon`).
- **Three add-entry flows (ADR-014).** FAB → Quick Add chooser (z-40, rotating plus→X toggle, compact form, subcategory "other"); Expenses header → full Quick Select modal; Dashboard header "Add Transaction" → navigates to Expenses. Do not merge them.
- **Source-exact design system.** The Finara look (CSS vars, `sidebar-gradient`, `.card-hover`, gradient cards, gray-based dark overrides) lives in `src/app/globals.css`; views use the exact utility-class strings captured from the live DOM. **The effective typeface is the Tailwind default system stack** (live's Inter import is overridden by its root `font-sans` — computed-style verified; ADR-016) and **the Tailwind palette is pinned to the v3 hex values the live app renders** (ADR-018; `globals.css` `:root` pin block, 102 tokens/14 families). Charts render the live config (both grid directions, visible `#64748b` axis/tick lines, `dark:stroke-gray-600` grid, default legend icon, lowercase hex — ADR-017). Centered modals + native `confirm()` deletes are parity contracts — see AGENTS.md § Domain rules.
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
| `bun run test` / `test:watch` | Vitest unit suite (101 tests) / watch mode |
| `bun run db:push` / `db:generate` | Apply schema / regen client |

## Testing Strategy

- **Pre-push gate**: `bun run lint && bun run typecheck && bun run test` (101 Vitest specs) + `bun run build`; browser-verify the touched flow and confirm zero console errors.
- **TDD loop for domain logic**: failing test → pure-module implementation → wire the view/route → re-run the suite. A behavior change without a test is incomplete.
- **Parity verification gates** (visual/behavioral parity with the source app): filters badge count, KPI placeholder fallbacks, savings-goal progress semantics, budget limit-0 footer, windowed analytics averages, dark-mode persistence, taxonomy selects, ui-maps entries, pinned primitive class sets (incl. DialogTitle as a pure semantics wrapper), empty analytics Income tab, centered-modal + confirm() contracts, FAB Quick Add flow, income activity badge categories, quick-select tile labels ("Rent/Mortgage"), live chart config, system font stack, v3 palette pin, AI Coach bubble anatomy, mobile drawer Sign Out are all pinned by tests or browser checks — re-run them after any related change.
- **Live-DOM evidence workflow**: when auditing the source app, capture per-view DOM dumps + stylesheet + behavioral probes (create/delete throwaway records to prove maps like sector colors and emoji), archive them, then restyle class-exact against the dumps; finish with theme-matched VLM side-by-side screenshots (ignore data/scroll differences) as a sanity check.
- Playwright E2E remains the planned next layer (see PAD §10); until then the golden paths are login (incl. the invalid-credentials error alert) → dashboard, FAB Quick Add round-trip, expense add via full quick-select + manual/edit/confirm-delete, income/goal/account/investment CRUD, filters + pagination, CSV import, export restore, dark-mode toggle + reload, AI chat, mobile drawer.
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
