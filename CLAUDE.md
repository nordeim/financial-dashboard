---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-spa-app
version: 1.0.0
last_updated: 2026-09-18
---

# Finara — Smart Finance Tracker

Single-page Next.js 16 personal-finance dashboard: income sources, 50/30/20 expenses and budgets, accounts, investments, savings goals, CSV bank import, analytics charts, and an AI coach grounded in live data. Prisma + SQLite persistence; money as integer minor units. Maintained as a faithful production-grade clone of the Finara base44 app.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — Read the relevant view component, its API route, and `src/lib/{types,categories,money,ui-maps}.ts` in full before writing. Identify which surface owns the data you are changing. For parity work, re-read the round-17 plan `docs/plans/2026-09-19-parity-remediation-round17.md` (the HTTP/metadata-layer round: the body-DOM re-probe found the live UNCHANGED since round 16 — zero non-bucketed deltas on all 10 surfaces, both diff modes — but a NEW transport-layer audit found what the DOM diff is structurally blind to: the live sends Referrer-Policy/X-Content-Type-Options/HSTS (the clone sent none + leaked X-Powered-By), its head carries per-route og:title/og:url mirroring the titles (the DASHBOARD canonical normalizes to `/`), theme-color #000000, viewport-fit=cover, its exact description, PWA metas and the logo favicon; its robots.txt is the wildcard shape and its sitemap.xml lists 9 URLs — fixes: the `headers()` baseline + `poweredByHeader: false` in next.config.ts, the `buildRouteMetadata` seam in `src/lib/route-metadata.ts` (returns the COMPLETE openGraph — Next merges metadata shallowly per key), viewport/appleWebApp/icons in layout.tsx, `app/robots.ts` + `app/sitemap.ts`, the Finara logo as a true-PNG favicon; `NEXT_PUBLIC_SITE_URL` resolves the site origin) and the round-16 plan `docs/plans/2026-09-19-parity-remediation-round16.md` (the LIVE UPDATED since round 15 — the SyncedBadge dropped its variant classes (the clone renders it via `variant="outline"` + tail so tw-merge strips `text-foreground` and NO variant classes survive), the gradient panes all carry `transition-colors duration-300` now (the round-4 per-view quirk retired), and a NEW raw-order diff pass (tag|exact-class-attribute multisets) exposed sidebar/shell class-ORDER deltas the long-standing sorted diff is structurally blind to — eight sidebar strings re-pinned (gradient container, header block, both navs, both bottom blocks, nav icons size-first, logo size-before-color) plus the inner pane order and the nav pill className-before-tabIndex attribute order; MobileTopNav renders a FRAGMENT (top bar + drawer are direct shell children); the Investments KPI cards are MotionWrap'd like the Holdings/Sector cards; and the mobile drawer mounts with the `fin-drawer-in` slide-in (translateX −300px→0 spring, rAF-sampled) — the dialog-forms h-first ban now covers dynamic `item.icon` tags + ternary classNames) and the round-15 plan `docs/plans/2026-09-19-parity-remediation-round15.md` (the live re-probe found zero drift — the signature diff was semantically identical to the round-14 post-fix baseline — so the round closed the codebase's own production-readiness gaps: the `bun audit` runtime criticals via next 16.1.3 → 16.3.5 + eslint-config-next lockstep + sharp 0.35.4 + seven unused dependency removals, all pinned by manifest-contracts specs; and the Prisma migration baseline with the db:push-for-dev/db:deploy-for-production split, pinned by the migrations-baseline drift guard — every schema model must have its CREATE TABLE in a committed migration) and the round-14 plan `docs/plans/2026-09-19-parity-remediation-round14.md` (the live's framer-motion entrance system was re-found after round 13 misread `animationName: none` — the clone now CSS-replicates it via `entranceStyle`/`MotionWrap` in `ui-bits.tsx` + the `fin-card-in`/`fin-overlay-in`/`fin-scale-in` keyframes in globals.css with per-view delay maps and CAPPED row staggers; every dialog overlay carries its settled `overlayStyle` (`{opacity: 1, transform: "none"}` full modals, `{opacity: 1}` Add Account + chooser — only the chooser ANIMATES open: fade + 0.9→1 scale); the login page's ten class orders re-pinned + Google label span-wrapped + h-first field icons; the Expenses CardHeader renders CardTitle + Tabs as direct children; icon+text pairs render space-free via the multi-line JSX idiom) and the round-13 plan `docs/plans/2026-09-18-parity-remediation-round13.md` (AI Insights became PERSISTED `Insight` records — list/dismiss/generate-once-when-empty, env-gated LLM polish with a positional join; entrance animations REMOVED app-wide; dialog titles are DIVs; the Quick Add chooser is plain overlay > `w-full max-w-md` wrapper > plain card; Progress renders `data-state=indeterminate` + manual `translateX` with no aria-valuenow) and round-12 `docs/plans/2026-09-17-parity-remediation-round12.md` (Playwright E2E layer — 66 specs in `e2e/` lock the rounds 4–11 browser contracts; login-surface title = bare `Finara` + unauth deep links settle on it via the MutationObserver-guarded title effect; import path accepts negative amounts like every other layer; the Quick Add chooser is `modal={false}` so the z-50 FAB stays clickable as the close toggle) and round-11 `docs/plans/2026-09-17-parity-remediation-round11.md` (ADR-024 signed minor units — negatives valid at every layer, no `min="0"`, guards `requireSignedInt`/`requireFiniteNumber`; chart tooltip = borderless ghost overlay `{ backgroundColor: "transparent", border: "none", borderRadius: 8 }`; legend census 1/0/0/0; goal complete-state — emerald ring + Complete badge + Add Progress removed at progress ≥ 100) and round-10 (ADR-019 primary-family amendment — `--primary` is the neutral ink/pair, sage lives on `--primary-sage`; ADR-023 theme lifecycle; mobile Menu↔X swap) and round-9 (settings propagation, live-shaped exports, inert From/To, import error card, AI coach orders) and round-8 (real routes, order-parity sweep, expenses bulk bar, Quick Add step-2) and round-7 (dialog form bodies, icon class order, user menu) and round-6 (token pins, per-dialog header matrix, overlay behavior) and round-5 §A/§E.9 (and round-4 §A/§E, round-3 § audit findings, round-2 § "Key live-site behavioral facts") first — class-exact restyles copy the strings from the captured live DOM evidence, never approximations.
2. **PLAN** — State the smallest correct implementation path; name files touched. Money, budget, or AI-touching changes need extra validation.
3. **VALIDATE** — Confirm scope on money/auth-adjacent changes before coding.
4. **IMPLEMENT (TDD)** — Domain logic changes go red → green: write the failing `src/lib/__tests__/*.test.{ts,tsx}` spec first, implement in the pure module (`dashboard-kpis`, `expense-filters`, `date-format`, `import-export`, `money`, `categories`, `ui-maps` — plus the primitive class-set pins in `ui-primitives.test.tsx` and the source contracts in `view-surfaces`/`dialog-forms`/`functional-parity`), then wire views/route handlers around it. Typed, validated increments; server logic in route handlers / `src/lib`, UI in `src/components/finara/*`.
5. **VERIFY** — `bun run lint && bun run typecheck && bun run test` green (378 unit tests); `bun run test:e2e` green (build + 67 Playwright specs); `bun run build` exits 0; exercise the flow in a browser (agent-browser or manual) and check the console for zero errors. Claims of "works" require executed evidence — label anything not executed as Reasoned/Assumed. Parity changes additionally require computed-style probes (font stack, semantic tokens — probe the CSS VARIABLE, never a consumer element, per the round-10 lesson — radii, blur, chart colors in both themes; per the round-11 lesson, verify `location.href` BEFORE probing so the readout is taken on the intended app, and prefer computed styles + pixel crops over VLM verdicts; per the round-13 lesson, treat ANY flaky E2E failure as a determinism bug until proven otherwise — the insights LLM polish once collided with a label assertion nondeterministically; per the round-14 lesson, JS-driven animations NEVER set CSS `animationName` — probe computed styles + the `style` ATTRIBUTE (the framer-motion wrappers settled at `opacity: 1; transform: none;` were invisible to the round-13 CSS-class probes; sample with rAF + MutationObserver to measure the curves); per the round-16 lesson, the SORTED signature diff is class-order BLIND — always pair it with a RAW-order diff (tag|exact-class-attribute multisets) when auditing chrome, and re-extract RAW strings before pinning; per the round-17 lesson, the body-DOM diff is ALSO blind to the transport and <head> layers — audit response headers, head metadata, robots.txt and sitemap.xml at the curl level, a separate diff surface from the DOM walk) and a signature-multiset DOM re-diff against the captured live app, with every only-live/only-clone delta accounted for in the documented buckets (infra, a11y additions, lucide artifacts, live's duplicated toaster, seed-data counts, the login demo-credentials affordance, theme-state icons).
6. **DELIVER** — Note what was verified, what was deferred, and the commit grouping.

### Project-Specific Principles

- **Money is integers.** All amounts are minor units; floats never touch money paths (`src/lib/money.ts` is the only conversion seam).
- **The server is the source of truth.** Views render from API responses; derived client state (filters, tabs, form drafts) never duplicates persisted data.
- **One category taxonomy.** `src/lib/categories.ts` is the single source for categories/subcategories/emoji/frequencies/currencies — API validation and UI selects both consume it, and `categories.test.ts` pins the sets to the live source app.
- **One UI-map module.** `src/lib/ui-maps.ts` is the single source for live-verified sector hexes, goal emoji, priority/activity/expense-row badges, account icons, category dots/badges — pinned by `ui-maps.test.ts`; views never fork these values inline.
- **Pinned shadcn primitives (parity contract, ADR-015).** `src/components/ui/*` render the live app's classic class sets, enforced by `ui-primitives.test.tsx` — never "upgrade" them with `npx shadcn add/diff`; a newer snapshot fails the suite by design. Where lucide renamed a glyph (Filter→Funnel), the live-exact shape is an inline SVG (`ClassicFilterIcon`).
- **Three add-entry flows (ADR-014).** FAB → Quick Add chooser (z-40, rotating plus→X toggle, compact form, subcategory "other") — the chooser dialog is `modal={false}` with `onInteractOutside` suppressed so the z-50 FAB stays clickable as the close toggle (Radix's modal body-lock would deaden it); Expenses header → full Quick Select modal; Dashboard header "Add Transaction" → navigates to Expenses. Do not merge them.
- **Source-exact design system.** The Finara look (CSS vars, `sidebar-gradient`, `.card-hover`, gradient cards, gray-based dark overrides) lives in `src/app/globals.css`; views use the exact utility-class strings captured from the live DOM. **The effective typeface is the Tailwind default system stack** (live's Inter import is overridden by its root `font-sans` — computed-style verified; ADR-016) and **the Tailwind palette is pinned to the v3 hex values the live app renders** (ADR-018; `globals.css` `:root` pin block, 102 tokens/14 families). Charts render the live config (both grid directions, visible `#64748b` axis/tick lines, `dark:stroke-gray-600` grid, default legend icon, lowercase hex, full money strings on BOTH axes — ADR-017 + round-9 F11). Centered modals + native `confirm()` deletes are parity contracts — see AGENTS.md § Domain rules.
- **Settings propagate app-wide (ADR-022).** Currency/date-format saves reformat every view (views consume `useSettings()`; AI routes read the currency server-side; chips follow it). All client fetches use `cache: "no-store"` (no Cache-Control on API responses → browser heuristic caching served stale data). The shell-level AddTransactionDialog renders mount-on-open so its useSettings is always fresh.
- **The theme follows the account (ADR-023, round-10).** Sign-out resets to light AND clears the stored key (`resetTheme()`); sign-in re-applies the SERVER-side theme from `/api/settings` (async, like the live User/me hydration); every toggle persists fire-and-forget (`PUT /api/settings {theme}`) after the local apply. The login page always renders light. The `--primary`/`--primary-foreground` tokens are the classic shadcn NEUTRAL pair (light #171717/#fafafa, dark #fafafa/#171717) — progress fills, switches, checkboxes, and default buttons render monochrome; sage CTAs style via `--primary-sage`.
- **Pure domain layer.** KPIs, filters, date formatting, and export normalization live in framework-free modules under `src/lib/` with Vitest specs — views never re-derive them.
- **Honest empty, loading, and error states** on every surface (`EmptyState`, `LoadingRows`, `ErrorNote` in `ui-bits.tsx`) — no silent fallbacks.
- **AI answers stay grounded.** Both AI endpoints build a compact snapshot from the DB first; the model may phrase, never invent, figures.

## Implementation Standards

### TypeScript (strict, enforced)

- `strict` on; avoid `any` — use `unknown` + the `require*` guards in `src/lib/api.ts`.
- Prefer `interface` for object shapes; `import type` for type-only imports.
- Route handlers return the `ApiResult<T>` envelope (`ok`/`fail`/`errorResponse`) — never throw across the client boundary; log internals server-side with a `[api]` prefix.

### Next.js 16 specifics

- The app serves **real routes** (ADR-021): `src/app/page.tsx` (`/`) + the `src/app/[...view]/page.tsx` catch-all map every path through `src/lib/routes.ts`; the shell switches views via `ViewId` state inside a single mount (SPA pushState/popstate). Only `/api/*` handlers are additional routes — do not add per-view page folders.
- Route handler `params` are async: `await context.params`.
- **React Compiler rules are lint errors**: never call setState synchronously inside an effect body; never depend on unstable memo references (`query.data ?? []` derived arrays). Session storage and the dark-mode theme read use `useSyncExternalStore` (see `finara-app.tsx`, `theme.ts`). For "reset when inputs change" use guarded render-time state adjustment (see `expenses-view.tsx`, `add-transaction-dialog.tsx`), not effects.
- Client components must never import `@/lib/analytics` or `@/lib/db` (Prisma would ship to the browser). Pure modules: `money`, `categories`, `types`, `dashboard-kpis`, `expense-filters`, `date-format`, `import-export`.
- Tailwind v4: tokens live in `src/app/globals.css` `@theme inline`; the v3-era `tailwind.config.ts` was deleted in round-12 — never re-add a JS config (animations come from `tw-animate-css` via CSS import).

### Data layer (Prisma + SQLite)

- Schema in `prisma/schema.prisma`; after edits: `bun run db:generate`, then `bun run db:push` (dev) — SQLite has no migration history in this project yet.
- Every money column is an `Int` named `*Minor`. New money fields follow the same rule.
- Seeding is automatic and idempotent (`src/lib/seed.ts`): unique-key lock row + `_seeded` completion marker; losing callers poll for the marker. Do not seed in route handlers.
- Income totals normalize frequencies via `monthlyEquivalent` — apply it in any new income aggregation.

### Component conventions

- Views live in `src/components/finara/*-view.tsx`, each owning its `useQuery` slice; shared primitives in `ui-bits.tsx`; shadcn primitives in `src/components/ui/*` (don't hand-roll what shadcn provides).
- Lists that can grow get `max-h-*` + `overflow-y-auto` + the `finara-scroll` scrollbar class.
- Interactive elements: visible focus states, aria-labels on icon-only buttons, `role="progressbar"` consumers keep the live's `data-state=indeterminate` (NO aria-valuenow — the value drives the manual transform only; the clone's aria-LABELs stay), 44px touch targets.

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
| `bun run test` / `test:watch` | Vitest unit suite (378 tests) / watch mode |
| `bun run test:e2e` / `test:e2e:headed` | Playwright E2E (build + 67 specs vs the production build on :3100, hermetic `db/e2e.db`, `FINARA_INSIGHTS_LLM_OFF=1` for deterministic insights) / headed |
| `bun run db:push` / `db:generate` | Apply schema / regen client |

## Testing Strategy

- **Pre-push gate**: `bun run lint && bun run typecheck && bun run test` (378 Vitest specs) + `bun run test:e2e` (67 Playwright specs); CI (`.github/workflows/ci.yml`) runs the same chain on every push/PR to main.
- **TDD loop for domain logic**: failing test → pure-module implementation → wire the view/route → re-run the suite. A behavior change without a test is incomplete.
- **Parity verification gates** (visual/behavioral parity with the source app): filters badge count, KPI placeholder fallbacks, savings-goal progress semantics, budget limit-0 footer, windowed analytics averages, dark-mode persistence, taxonomy selects, ui-maps entries, pinned primitive class sets (incl. DialogTitle as a pure semantics wrapper and the DIALOG_CARD_BASE without `relative`), pinned semantic design tokens (classic shadcn neutral, light+dark) and v3 radius/blur scales (`design-tokens.test.ts`), login-page class sets (`login-view.test.tsx`), dialog form-body + icon-order source contracts (`dialog-forms.test.ts`: compact income chips, gap-4 grids, flex-1 buttons rows, submit styles/labels, snake_case ids, accounts plain wrappers + default-primary submit, `w-X h-X` icon order), view-surface order contracts (`view-surfaces.test.ts`), functional-parity contracts (`functional-parity.test.ts`: settings propagation, live export shapes, inert From/To, import error card, AI-coach orders, AI-route currency grounding, theme lifecycle — sign-out reset / sign-in server-theme apply / toggle persistence / Menu↔X swap; round-11 — signed minor units end-to-end, no `min="0"` anywhere, investment form attrs + optional current price, goal complete-state emerald ring + Complete badge + Add Progress removal, goal POST/PATCH no cap, borderless ghost tooltip, legend census 1/0/0/0, select-popup class pins; round-12 — login-surface bare `Finara` title (direct + unauth-redirect) with the unauth deep link settling on it, import path accepts negative amounts, non-modal Quick Add chooser with live FAB toggle), default expense filter renders null min as empty, empty analytics Income tab, centered-modal + confirm() contracts + per-dialog matrix (header row/in-flow close/width/scroll/dark-card, no overlay-click dismiss except Quick Add), FAB Quick Add flow, income activity badge categories, quick-select tile labels ("Rent/Mortgage") and tile/chip tabindex wrappers, live chart config, system font stack, v3 palette pin, AI Coach bubble anatomy (no node prop leak), mobile drawer Sign Out are all pinned by tests or browser checks — re-run them after any related change.
- **Live-DOM evidence workflow**: when auditing the source app, capture per-view DOM dumps + stylesheet + behavioral probes (create/delete throwaway records to prove maps like sector colors and emoji), archive them, then restyle class-exact against the dumps; finish with theme-matched VLM side-by-side screenshots (ignore data/scroll differences) as a sanity check.
- **Playwright E2E layer (round-12; round-13 additions)**: `bun run test:e2e` builds the app and runs 67 serial specs (`e2e/`, 11 files) against the production build on :3100 with a hermetic `db/e2e.db` — the dev DB and dev server are never touched, and `FINARA_INSIGHTS_LLM_OFF=1` keeps the insights generation deterministic (the LLM polish rewrites record text nondeterministically — one run collided with a KPI label assertion). Covered golden paths: login (incl. the invalid-credentials error alert, deep-link round trips, titles) -> dashboard (exact-match KPI labels, the live indeterminate progressbars, AI-insight records — generation on empty, type badges, confidence footer, dismiss + refresh re-list), FAB Quick Add round-trip + FAB toggle, expense add via full quick-select + manual/edit/confirm-delete + filters + bulk bar, income/goal/account/investment CRUD (incl. goal complete-state), analytics tabs + ghost tooltip + inert From/To, CSV import (incl. the live error card) + export + GDPR round-trip + settings-independence, theme lifecycle, EUR/dd-MM/yyyy propagation (the app-wide `$` sweep excludes the persisted insight record text — creation-time content, live-faithful), mobile drawer, and a zero-console-errors/warnings sweep over all 9 views. The AI chat stays unit-pinned only (external model dependency). A red E2E run is a regression, never a flake to wave through (retries: 0).
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
- AI endpoints degrade explicitly: insights persist deterministic drafts when the table is empty (LLM polish optional, env-gated, positionally joined — record text keeps its creation-time currency); chat surfaces a retry toast.

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
| `NEXT_PUBLIC_SITE_URL` | Deployable site origin — resolves metadataBase, og:url/canonical, robots/sitemap URLs (default `http://localhost:3000`; round 17) | `https://finara.example.com` |

## Anti-Patterns to Avoid

- Adding per-view page folders or a router — the catch-all + SPA view switch is the architecture (ADR-021).
- Hardcoding USD / MM/dd/yyyy in views — thread `useSettings()` everywhere money or dates render.
- Float arithmetic or string money math — integers only.
- Importing `lib/db`/`lib/analytics` from client components.
- Seeding inside route handlers or component effects.
- `setState` in effect bodies (compiler error) or unstable `useMemo` deps.
- Presenting the demo login as real authentication.
