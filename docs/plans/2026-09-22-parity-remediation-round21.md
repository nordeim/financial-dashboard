# Round-21 Remediation Plan — the database-path contract + suite-verification round

Date: 2026-09-22 · Scope: the standard full live re-probe with a focused
mobile-navigation audit (the round's explicit mandate) — the dashboard
body-DOM signature diff (sorted multiset), the mobile drawer structural
probes on BOTH sides (top-bar buttons, drawer anatomy, link-click
navigation, X-swap), the chrome probes (SyncedBadge, toaster viewport),
and the HTTP-layer audit (per-route description metas, login-only head
pins, security headers) — plus the codebase's own environment/tooling
gaps: the documented-but-unimplemented database-path contract, the
`.env.example` drift, and the test-suite baseline verification.

**The live app is UNCHANGED since round 20** on every probed layer: the
dashboard body-DOM diff carries zero non-bucketed deltas (the live user
has dismissed all AI-insight records — the live renders the round-13
empty state — and the activity/budget row counts and chart/icon
inner-stroke populations differ with the data); every chrome probe is
byte-identical (the SyncedBadge base+tail string, the sidebar raw
orders, the mobile drawer anatomy `lg:hidden fixed inset-0 z-40
bg-slate-800 dark:bg-gray-900` + `pt-20` wrapper + `flex-1 px-4 py-6
space-y-2` nav + compact pills + `p-4 border-t border-slate-700/30`
bottom with the direct Sign Out); the HTTP layer matches every
round-17/18/19/20 pin byte-exact (the `Goals on Finara. Finara is your
intelligent financial co-pilot…` description template on all three
metas, the login-only viewport-fit=cover + theme-color #000000 + sized
apple-touch-icon 180x180 + twitter:image:alt "Base44 link preview", the
security-header edge trio). The toaster double-viewport remains the
documented round-4 by-design delta (PAD §10).

**The mobile navigation menu — the round's explicit focus — is verified
WORKING on both sides and byte-identical**: open (drawer mounts with the
live-exact class string, z-40 under the z-50 top bar), navigate (a nav
link click navigates to the view AND unmounts the drawer, the Menu
glyph returns), close (the X swap works both directions), zero console
errors, and the aria additions (`aria-expanded`/`aria-controls`/
`aria-label` on the toggle — absent on the live) remain the documented
a11y bucket. The Tailwind v4 audit that accompanied it (the round's
second explicit focus) is CLEAN in both dev and production: the drawer's
utility classes (`lg:hidden`, `bg-slate-800`, `dark:bg-gray-900`) and
the `fin-drawer-in` keyframes are present in the production CSS bundle;
no dynamic class construction exists in the finara components (all
class strings are full literals through `cn()`); the unlayered v3
palette pin wins the cascade over Tailwind v4.1.18's regenerated ramp
AND its `@supports lab()` re-definition (computed `rgb(30, 41, 59)` =
v3 `#1e293b` on the live-exact drawer surface, runtime-verified).

Zero parity drift pivots the round to the codebase's own
production-readiness gaps (the round-15/20 precedent) — this time in
the environment/tooling layer the operator prompt explicitly targets:
the database-path contract, the `.env.example` drift, and the
vitest/Playwright suite verification.

Evidence: `/home/z/my-project/captures/r21/` (outside the repo, per
convention) — the signature captures for both sides, the diff report,
the structural probe transcripts (mobile drawer both sides, chrome
probes, HTTP head dumps both sides), and the production CSS analysis.

## §A Context

Rounds 2–20 drove the clone to verified body-DOM, transport-layer,
per-route head, and description parity, then cleared the scaffold's
dead code (round 20: 31 vendored-but-unused primitives + 34 dead
dependencies). The round-21 re-probe (2026-09-22, agent-browser
isolated sessions, production build on :3000 with the repo-local DB)
found the live unchanged on every layer, so the round closes the
environment/tooling gaps the operator prompt pins:

- **The database-path contract is documented but not implemented.** The
  committed `.env.example` (updated at `9f0882c`) documents the exact
  contract: "A RELATIVE `file:` URL is resolved against
  prisma/schema.prisma — exactly like the Prisma CLI — so
  `file:../db/custom.db` points at <repo>/db/custom.db for the CLI
  (migrate/seed), `next build`, and the running server alike,
  regardless of the process working directory. (src/lib/db-path.ts
  implements this resolution; tests/db-path.test.ts pins the
  contract.)" — but `src/lib/db-path.ts` does not exist. Today the
  runtime resolution depends on the process CWD (verified working for
  `next dev`/`next start` from the repo root; the generated client's
  relative-URL anchor is CWD-shaped in bundled contexts, which is
  exactly why `playwright.config.ts` pins an ABSOLUTE `db/e2e.db` —
  its own comment calls out "Prisma's relative-path ambiguity").
- **`.env.example` references three things that do not exist**: the
  `bun run db:seed` script (the architecture auto-seeds via
  `ensureSeeded()` — AGENTS.md: "No manual seeding"), `docs/DEPLOYMENT.md
  §4`, and `tests/db-path.test.ts` (the repo convention is
  `src/lib/__tests__/*.test.ts`).
- **The test suites needed a fresh-environment verification** (this
  sandbox was reset): the unit gate opened green 428/428 immediately;
  the Playwright gate required the chromium headless-shell rebuild
  (`bunx playwright install chromium` — the round-19 lesson class:
  environment, not code) before its baseline run.

## §B Findings (all verified against the codebase 2026-09-22)

**F1 — the runtime database-path contract (HIGH; the round's core
mandate).** `src/lib/db.ts` constructs `PrismaClient` with no datasource
override, so the relative `DATABASE_URL="file:../db/custom.db"` resolves
through the generated client's own anchor — correct when the process
runs from the repo root (verified: `next dev` and `next start` both
read/write `<repo>/db/custom.db`, and `prisma db push` writes the same
file), but not guaranteed for other working directories, and a missing
`DATABASE_URL` surfaces as Prisma's raw constructor error instead of an
actionable message. The fix: a server-only `src/lib/db-path.ts` that
(1) resolves RELATIVE `file:` URLs against the repo root — discovered
by walking up from the process CWD to the directory containing
`prisma/schema.prisma` (the CLI's own anchor), falling back to the CWD
itself when no schema is found (the standard `next dev`/`next start`
flow); (2) passes ABSOLUTE `file:` URLs through unchanged (the E2E
webServer's hermetic `db/e2e.db` pin, production deployments); (3)
passes non-SQLite URLs through unchanged; (4) throws a crisp,
setup-pointing error when `DATABASE_URL` is missing. `src/lib/db.ts`
wires it through Prisma 6's `datasourceUrl` constructor option
(supported by the installed 6.19.2 client — verified in the generated
runtime).

**F2 — `.env.example` drift (MEDIUM).** The committed text references
`bun run db:seed`, `docs/DEPLOYMENT.md §4`, and `tests/db-path.test.ts`
— none exist. After F1, align the text: the test path becomes
`src/lib/__tests__/db-path.test.ts` (repo convention), the seed step
becomes the architecture's real one (`bun run db:push` + the automatic
`ensureSeeded()` on first API request), and the deployment note points
at the README Quick Start / PAD instead of a missing file. The
`DATABASE_URL="file:../db/custom.db"` value itself stays — it is the
contract F1 implements.

**F3 — suite verification (the operator's explicit ask; no config
defects found).** `vitest.config.ts` (node env, `src/**/*.test.{ts,tsx}`,
`@` alias) and `playwright.config.ts` (production build on :3100,
hermetic absolute `db/e2e.db` reset, serial `workers: 1`, `retries: 0`,
`FINARA_INSIGHTS_LLM_OFF=1`) are both correct for the codebase; the
baseline gates opened green once the chromium headless-shell was
rebuilt (lint 0 · tsc 0 · unit 428/428 · E2E 67/67 on the re-run). The
round adds the F1 spec to the vitest suite (picked up by the existing
include pattern — no config edit required) and records the chromium
rebuild as the environment lesson.

**Verified UNCHANGED (non-findings):** the live head on the probed
routes, the mobile drawer on both sides (anatomy + behavior + the
production CSS bundle), the SyncedBadge/toaster/sidebar chrome, the
security headers, the CI workflow (`branches: [main]` — a terminal
rendering artifact initially suggested corruption; the YAML parses and
the raw bytes are clean), and the E2E config's hermetic isolation
(which F1 deliberately preserves — absolute URLs pass through).

## §C Affected surfaces

1. `src/lib/db-path.ts` — NEW: the server-only DATABASE_URL resolver
   (repo-root walk-up anchoring, absolute/PG passthrough, crisp missing
   error).
2. `src/lib/db.ts` — wire `datasourceUrl: resolveDatabaseUrl()` into
   the PrismaClient singleton.
3. `src/lib/__tests__/db-path.test.ts` — NEW: the contract spec
   (relative-from-root, relative-from-subdirectory, absolute passthrough,
   postgresql passthrough, missing-env error).
4. `.env.example` — F2 text alignment (real test path, real seed flow,
   real deployment pointer).
5. Docs: AGENTS.md (the db-path invariant + the round-21 reference),
   CLAUDE.md (the env-var table note + round-21 ANALYZE/VERIFY
   references), README (Quick Start note + env table + round-21 rows),
   PAD v1.20 (§7 file inventory + counts, §10 round-21 row, §11 the
   db-path seam), this plan's §G, `docs/session_28.md`.
6. `financial-dashboard_SKILL.md` — NEW: the distilled project skill
   (via `skills/to-distill-project-into-skill` +
   `skills/distill-codebase-skill`, 20 sections + appendices).
7. `docs/screenshots/` — refreshed dev-server captures of the
   remediated app (login + the 9 views + the mobile drawer).

## §D Execution order

1. RED: write `src/lib/__tests__/db-path.test.ts` (the five contract
   cases) — the suite fails on the missing module, exactly as designed.
2. GREEN: implement `src/lib/db-path.ts` → wire `src/lib/db.ts` →
   re-run the suite.
3. Gates: `bun run lint` · `bun run typecheck` · `bun run test`
   (428 + the new specs) · `bun run build`.
4. Runtime verification: with `DATABASE_URL="file:../db/custom.db"` in
   `.env`, `bun run db:push` from the repo root, then the production
   server (`next start`) — the settings API must serve the seeded data
   and `<repo>/db/custom.db` must be the only DB file touched; repeat
   with the server launched from a SUBDIRECTORY (the CWD-independence
   contract); confirm the E2E webServer's absolute URL still isolates
   `db/e2e.db`.
5. E2E gate: `bun run test:e2e` (67 specs — the full pre-push contract).
6. `.env.example` alignment (F2) + docs (§C.5) + the SKILL.md (§C.6).
7. Screenshots: dev server on :3000, login + 9 views + mobile drawer →
   `docs/screenshots/`.
8. Atomic commits + push (SSH wrapper, main only).

## §E TDD plan

Red → green for F1. The spec (`src/lib/__tests__/db-path.test.ts`):

- **The CLI-equivalence contract**: `file:../db/custom.db` resolved
  with the process CWD at the repo root yields
  `file:<repoRoot>/db/custom.db` — the same file `prisma db push`
  writes (the test computes the repo root from its own module location,
  an independent anchor from the implementation's CWD walk).
- **CWD independence**: the same relative URL resolved from a
  subdirectory (the test passes `src/` as the CWD) yields the SAME
  absolute target — the walk-up finds the repo root.
- **Absolute passthrough**: an absolute `file:/abs/path/e2e.db` returns
  unchanged (the Playwright webServer pin).
- **Non-SQLite passthrough**: a `postgresql://…` URL returns unchanged.
- **Missing env**: an empty environment throws the actionable message
  (asserting the `.env.example` pointer, not Prisma's raw error).

The resolver takes `(env?, cwd?)` injectable parameters so the spec is
hermetic (no process-env mutation, no real chdir), while the production
path in `db.ts` uses the defaults.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit green (428 + the round-21 specs) ·
  build exits 0 · E2E 67/67.
- Runtime probe: production server + `GET /api/settings` returns the
  seeded envelope; `db/custom.db` (repo root) is the only mutated DB
  file; subdirectory-launch probe returns the same result (the
  CWD-independence contract, executed).
- E2E hermeticity: the webServer still resets `db/e2e.db` (absolute
  URL passthrough) and the dev DB is untouched.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-22)

Both findings remediated red → green in plan order; every gate green.

**RED:** `src/lib/__tests__/db-path.test.ts` (six contract cases) failed
on the missing module with all 428 existing specs green — exactly the
designed failure surface.

**GREEN (per finding):** F1 — `src/lib/db-path.ts` implemented (the
walk-up from the process CWD to the nearest `prisma/schema.prisma`, the
CWD fallback, absolute/PostgreSQL passthrough, the crisp missing-env
error) and wired into `src/lib/db.ts` through Prisma 6's
`datasourceUrl` option. One GREEN-phase correction: the all-optional
`DatabaseEnv` interface tripped TS2559 against Node's index-signature
`ProcessEnv` — fixed by carrying the index signature on the interface
(no casts anywhere). F2 — `.env.example` aligned (the real test path
`src/lib/__tests__/db-path.test.ts`, the real auto-seed flow —
`bun run db:push` + `ensureSeeded()` on first API request, the README
pointer replacing the phantom `docs/DEPLOYMENT.md §4`).

**Environment incident + recovery (pre-fix baseline):** the first E2E
baseline attempt on the fresh workspace failed 67/67 at 1-2ms — the
Playwright chromium headless-shell executable was missing (the
workspace reset wiped `~/.cache/ms-playwright`), the round-19
environment-lesson class. `bunx playwright install chromium` rebuilt
it; the re-run went green 67/67. NOT a code regression — recorded as
the standing lesson: rebuild the browsers after a workspace reset
before trusting an E2E failure.

**Post-fix verification (production build, repo-local DB):**
- Runtime probe, repo root: `next start` + `GET /api/settings` returns
  the seeded envelope; `<repo>/db/custom.db` is the only DB file
  touched.
- Runtime probe, subdirectory CWD: the resolver launched with the
  process CWD in `scripts/` resolves `file:../db/custom.db` to the
  same absolute target — the CWD-independence contract, executed.
- Missing-env probe: an empty `DATABASE_URL` throws the actionable
  `.env.example`-pointing message (not Prisma's raw constructor
  error).
- E2E hermeticity: the webServer's absolute `db/e2e.db` URL passes
  through unchanged; the dev DB is never touched.

**Gates (final):** lint 0 · tsc 0 · unit 434/434 (428 + 6 net-new) ·
build clean · E2E 67/67 (the post-change re-run).

**Deliverables:** `.env.example` aligned; AGENTS/CLAUDE/README/PAD
v1.20 aligned (the db-path invariant + the round-21 references + the
counts 428 → 434); `financial-dashboard_SKILL.md` distilled via the
to-distill-project-into-skill meta-skill; `docs/screenshots/`
refreshed (dev server: login + the 9 views + the mobile drawer);
`docs/session_28.md`; this plan's §G.
