# Round-12 Parity Remediation Plan — Playwright E2E layer: golden-path lock + CI pipeline

Date: 2026-09-17 · Scope: the PAD §10 MEDIUM item ("Playwright E2E layer absent —
browser golden paths re-run manually each round") and the PAD §10 HIGH item ("No
CI pipeline"). This round converts eleven rounds of manually re-verified browser
contracts into an automated, repeatable E2E suite running against the production
build, adds a GitHub Actions workflow that runs the full gate on every push, and
closes the last unprobed functional corner (exports under non-default currency +
date-format settings). It also deletes the dead `tailwind.config.ts` (PAD §10
LOW). Evidence: `/home/z/my-project/captures/r12/*` (outside the repo, per
convention).

## §A Context

Rounds 2–11 drove the clone to verified parity across every probed surface —
static rendering (rounds 3–7), real routes + order parity (8), functional
behavior (9), theme lifecycle + full VLM sweep (10), and interactive states
(11). Every round re-verified the same browser golden paths by hand (login →
CRUD → filters → export → theme), which is slow, non-regressing-proof, and the
single remaining MEDIUM gap in PAD §10. `docs/session_9.md` and
`docs/session_10.md` both recommend the Playwright E2E layer as the natural
next round; `skills/e2e-testing-lessons/SKILL.md` and `skills/playwright-cli/
SKILL.md` (repo-included skills catalog, category 5) inform the design.

## §B Findings

**F0 — Exports under non-default settings: settings-independent on live; clone
already live-exact (probe verdict — no fix, document + pin in E2E):**

Controlled live probe (2026-09-17, all settings restored + verified after):

| Capture | Default (USD / MM/dd/yyyy) | EUR + dd/MM/yyyy |
|---|---|---|
| Analytics Export CSV (client-built from 3 entity GETs — `Expense?sort=-date`, `Income?sort=-created_date`, `Investment?sort=-created_date`) | `"Date","Description",…` header; expense dates **ISO date-only** (`2026-09-15`); income/investment rows microsecond stamps (`2026-09-15T02:04:11.612000`); amounts **raw decimals** (`4.5`, `5000`); filename `financial-report-2026-09-17.csv` | **byte-identical** — dates stay ISO (NOT dd/MM/yyyy), amounts stay raw decimals (no €), filename keeps the ISO date |
| GDPR export (`Export All Data`) | `{user, data:{expenses,income,savings_goals,investments,bank_accounts}, summary:{total_*}}`, snake_case, `date: "2026-09-15"` ISO, `amount: 4.5`, `exportDate` full ISO-Z; filename `finara-export-<email>-<date>.json` | **identical shape** — ISO dates, raw decimals, ISO filename date |

The clone's export route (`src/app/api/export/route.ts`) never reads settings —
identical behavior. **Parity confirmed; zero code change.** The E2E suite pins
this (export specs run after switching settings, asserting the ISO/raw-decimal
output is unchanged).

**F1 — E2E infrastructure design decisions (validated against the codebase):**

1. **Runner + browser**: `@playwright/test@1.62.1` (devDependency, added to
   `bun.lock`); the sandbox and CI use the cached/downloadable chromium-1234
   build (`bunx playwright install chromium`). No Firefox/WebKit — the parity
   target is a Chromium-rendered app.
2. **Server under test**: the **production build** (`next build` → `next start
   -p 3100`), not the dev server — determinism (no Turbopack cache flakiness,
   no HMR noise in the console sweep) and it exercises the shipped artifact.
   Port **3100** with `reuseExistingServer: false` so a running dev server
   (:3000) never collides and a stale server is never silently reused.
3. **DB isolation**: a dedicated **`db/e2e.db`** (gitignored by the existing
   `db/*.db` pattern). The `playwright.config.ts` computes an **absolute**
   `DATABASE_URL` at runtime (`file://<repo>/db/e2e.db`) and passes it to the
   webServer command, which resets + re-creates the schema before starting:
   `rm -f db/e2e.db && prisma db push && next start -p 3100`. Absolute paths
   sidestep the Prisma relative-path ambiguity (CLI resolves CWD-relative,
   generated client schema-relative). `ensureSeeded()` seeds on the first API
   request; every run starts from the pristine canonical seed (96 expenses /
   4 income / 4 accounts / 3 goals / 8 investments / 3 budgets — date-dependent
   row count asserted loosely, ≥ 90). The dev DB (`db/custom.db`) is untouched.
4. **Execution model**: `workers: 1`, `fullyParallel: false` (serial) — the
   suite mutates one shared SQLite file; determinism beats wall-clock. ~50
   specs × ~1–3 s ≈ 1–3 min. `retries: 0` locally (a red gate is a regression,
   never a flake to wave through — CLAUDE.md rule); CI retries once.
5. **Auth strategy**: the login IS a golden path — a `login()` helper drives
   the real UI (fill email/password → Sign in → await the dashboard). Session
   is `sessionStorage["finara-demo-session"]` (finara-app.tsx), so every
   fresh context logs in via UI; no storageState shortcut (the e2e-lessons
   skill's API-auth rule does not apply — this app has no auth API).
6. **Test data**: serial specs create their own rows with `E2E `-prefixed
   names and delete them (native confirm dialogs accepted via
   `page.on('dialog')`); count assertions are relative (fetch count before →
   assert after). The per-run DB reset makes leftovers harmless anyway.
7. **Vitest/ESLint/tsc boundaries**: vitest `include` is `src/**/*.test.{ts,tsx}`
   — `e2e/` is invisible to the unit gate; tsconfig `include` already covers
   `**/*.ts` (e2e typechecked ✓); eslint flat config lints `e2e/` (explicit
   imports only — no globals plugin needed). The `skills/` folder stays
   excluded from all gates (tsconfig/eslint ignores already list it).
8. **Scripts**: `test:e2e` = `bun run build && playwright test` (build is part
   of the E2E gate — the suite always tests the current tree's artifact);
   `test:e2e:headed` for debugging. The push gate becomes:
   lint · typecheck · unit (270) · **e2e** (which builds).

**F2 — CI pipeline (PAD §10 HIGH):** `.github/workflows/ci.yml` — on push to
main + PRs: checkout → setup-bun (1.3.x) → `bun install --frozen-lockfile` →
`bun run db:generate` (bun blocks postinstall scripts — the Prisma client must
be generated explicitly) → lint → typecheck → unit test → `bun run test:e2e`
(with `bunx playwright install chromium` + an actions/cache entry keyed on the
playwright version). Written to standard action versions (checkout@v4,
setup-bun@v2, cache@v4); **not executed remotely from this sandbox** — flagged
in docs as verify-on-GitHub (the wrapper key only grants git push, not API
reads).

**F3 — `tailwind.config.ts` is dead** (PAD §10 LOW): `postcss.config.mjs` uses
only `@tailwindcss/postcss` (CSS-first v4 pipeline); no file in the repo
references the config; AGENTS.md already documents it as unused legacy. Delete
it; build must stay green.

## §C File-by-file change specs

1. **`playwright.config.ts`** (new, repo root) — single chromium project,
   `baseURL http://localhost:3100`, `workers: 1`, `fullyParallel: false`,
   `timeout: 30_000`, `expect.timeout: 10_000` (first-run seeding headroom),
   `reporter: [['list'], ['html', { open: 'never' }]]`, `outputDir: 'test-results'`,
   webServer: absolute-path `DATABASE_URL` env, command
   `rm -f db/e2e.db && bun run db:push && bunx next start -p 3100`,
   `url: 'http://localhost:3100/login'`, `reuseExistingServer: false`,
   `timeout: 120_000`.
2. **`e2e/helpers.ts`** (new) — `login(page)` (UI drive + dashboard marker
   await), `signOut(page)` (user menu), `expectNoConsoleErrors(page)` collector
   (errors + warnings, production build), dialog-accept setup, unique-name
   factory (`E2E <name> <timestamp>`), shadcn Select driver (click trigger →
   click option by role), CSV/JSON download reader (`waitForEvent('download')`
   → `download.path()` → fs read).
3. **`e2e/auth.spec.ts`** (~9 specs) — unauthenticated `/Dashboard` →
   replaceState to `/login?from_url=…`; login title `Login | Finara`; invalid
   credentials → Alert "Invalid email or password"; valid login → dashboard;
   deep-link round trip (from_url return); document.title contracts (`/` and
   `/Dashboard` bare `Finara`, others `X | Finara`, 404 camelCase-split title);
   unknown path → NotFoundView; sign-out → login page.
4. **`e2e/theme-lifecycle.spec.ts`** (~5 specs) — toggle dark (html.dark) →
   reload persists → PUT /api/settings fired (request spy); sign-out from dark
   → login renders light + `finara-theme` localStorage key removed (ADR-023);
   sign-in re-applies the server theme (dark returns async); login page always
   light.
5. **`e2e/dashboard.spec.ts`** (~6 specs) — KPI cards render formatted money;
   budget overview rows; recent activity rows; AI insights cards (deterministic
   fallback content); quick actions; sidebar nav to Goals (URL + title + view
   content); FAB visible.
6. **`e2e/expenses.spec.ts`** (~11 specs) — list renders seed rows (no
   pagination); Filters badge "2" default quirk; filters panel min/max
   placeholders; search narrows rows; category tabs filter; header Add Expense
   → Quick Select modal (5 tiles, "Rent/Mortgage" label) → tile → manual form
   prefill → submit → row renders; **negative −5.50 expense renders `--$5.50`**
   (round-11); edit → amount updates; delete via native confirm → row gone;
   bulk select → blue bar "1 expenses selected" → Select All (N) → X clears.
7. **`e2e/quick-add.spec.ts`** (~5 specs) — FAB opens chooser (+ rotates 45°);
   Add Expense compact form → row lands (subcategory "other"); Add Income →
   source lands; overlay click dismisses (Quick Add is the only overlay-dismiss
   dialog); FAB toggle closes.
8. **`e2e/income.spec.ts`** (~4 specs) — add source (frequency select) → card
   renders monthly equivalent; edit amount; Active toggle; delete confirm.
9. **`e2e/goals.spec.ts`** (~6 specs) — create goal (native date input);
   Add Progress → percent/bar updates; **complete-state at 100%: emerald ring +
   Complete badge + Add Progress button removed** (round-11); overshoot via
   PATCH API → 150.0% uncapped rendering; negative-target goal → no badge;
   delete goal.
10. **`e2e/accounts.spec.ts`** (~3 specs) — add / edit / delete (confirm).
11. **`e2e/investments.spec.ts`** (~4 specs) — add holding with **empty current
    price → 0** (round-11); sector dot list renders; edit; delete.
12. **`e2e/analytics.spec.ts`** (~7 specs) — 4 tabs render; **legend census
    1/0/0/0** (round-11); Overview line chart renders SVG; **hover tooltip =
    borderless ghost** (computed transparent bg + no border, round-11); period
    select 3/6/12 re-renders; From/To inputs present + inert (no analytics
    refetch on change — request spy, round-9); Income tab empty quirk.
13. **`e2e/import-export.spec.ts`** (~6 specs) — CSV import 3-step flow
    (fixture upload → review with guessed category → import → rows land);
    garbage file → live error card "An Error Occurred" + Start New Import
    resets (round-9); Analytics Export downloads `financial-report-<date>.csv`
    with the live header/ISO-date/raw-decimal shape; **export stays
    settings-independent** (switch EUR + dd/MM/yyyy → export byte-shape
    unchanged — F0 pin); GDPR export JSON `{user,data,summary}` snake_case
    shape + filename; GDPR restore round-trip (finara-export mode) re-creates
    entities. Settings restored to USD/MM-dd after.
14. **`e2e/settings.spec.ts`** (~4 specs) — settings view renders selects;
    currency → EUR reformats dashboard figures (€ + European format spot
    checks); date format → dd/MM/yyyy reformats rendered dates; notification
    toggles persist. (Restore settings at the end; the per-run DB reset makes
    this belt-and-braces.)
15. **`e2e/mobile.spec.ts`** (~4 specs) — 375×812: drawer opens; **Menu↔X glyph
    swap while open** (round-10); drawer Sign Out works; sidebar hidden.
16. **`e2e/console-sweep.spec.ts`** (~2 specs) — fresh-navigate all 9 views →
    **zero console errors and zero warnings** (production build — no dev
    noise; round-11's manual sweep automated); 404 view clean too.
17. **`package.json`** — devDependency `@playwright/test@^1.62.1`; scripts
    `test:e2e`, `test:e2e:headed`.
18. **`.gitignore`** — `test-results/`, `playwright-report/`,
    `playwright/.cache/`.
19. **`.github/workflows/ci.yml`** (new) — F2.
20. **Delete `tailwind.config.ts`** — F3.
21. **Docs pass** — AGENTS.md (commands table +E2E gate, E2E invariants §),
    CLAUDE.md (testing strategy: E2E layer + how to run), README (Testing &
    Verification section, Key Features tests row, CI badge), PAD v1.11 (§7
    testing strategy E2E layer + CI, §10 resolve 3 items, §11 key files),
    `docs/session_11.md`.

## §D TDD plan

The E2E layer is itself the test artifact — its "red" is infrastructure
failure (missing config → runner errors), its "green" is the full suite
passing against the current tree. Two behaviors get true red→green treatment
where they are new contracts: none — F0 verified parity (no code change).
Suite count: unit stays 270 (no unit-spec changes expected); E2E adds ~60
browser specs as a separate runner (`bunx playwright test`), reported as
"N browser specs" in docs.

## §E Verification plan

- Gates: `bun run lint` · `bun run typecheck` · `bun run test` (270) ·
  `bun run test:e2e` (build + all E2E specs green, zero flakes across 2
  consecutive runs).
- Dev DB (`db/custom.db`) untouched by E2E runs (verify file mtime + counts).
- The dev server on :3000 keeps running throughout (no port collision).
- CI YAML: python yaml.safe_load parse + every referenced script exists in
  package.json.
- Post-delete `tailwind.config.ts`: `bun run build` green.
- Live etiquette: no live mutations this round beyond the F0 settings toggle
  (restored + verified persisted; theme left dark as found).

## §F Validation against the codebase (pre-execution)

- `next start` honors `-p 3100`; `next build` output is served by it (README
  documents `bun run start`).
- Prisma: `DATABASE_URL` env var overrides `.env` for both CLI and runtime
  (dotenv never overrides existing process env) — absolute path computed in
  playwright.config.ts makes resolution unambiguous.
- `ensureSeeded()` is idempotent + concurrency-safe (AGENTS.md §Seed
  concurrency) — the first API request from `login()`'s dashboard await seeds
  `db/e2e.db`.
- vitest include `src/**` excludes `e2e/` ✓ (vitest.config.ts:7); tsconfig
  include `**/*.ts` covers `e2e/` ✓; eslint lints `e2e/` (no ignores match) ✓;
  `skills/` ignored by all three ✓.
- Session key `finara-demo-session` in sessionStorage (finara-app.tsx:24);
  login error text "Invalid email or password" (login-view.tsx:49); theme key
  `finara-theme` (theme.ts); demo credentials in `src/lib/demo-user.ts`
  (importable — pure module, no server deps).
- Native `confirm()` delete texts per entity (AGENTS.md §Domain rules) —
  dialog handlers assert the exact strings.
- Export endpoints: `/api/export` + `?type=transactions` (export/route.ts) ✓;
  import: `POST /api/import` rows mode + finara-export mode (import route) ✓.
- Risk: (a) shadcn Select interactions need the role-based driver (Radix
  portal) — helpers centralize it; (b) the AI chat spec is excluded (external
  model dependency → flaky by nature; the AI routes keep unit-level grounding
  pins and the insights fallback is covered in dashboard specs); (c) downloads
  in headless chromium land via `page.waitForEvent('download')` — verified
  pattern; (d) `next build` while the dev server runs risks the documented
  Turbopack cache corruption — the dev server is restarted (`.next` reset if
  needed) after the E2E gate.

## §G Execution record (2026-09-17)

**F0 — exports under non-default settings: verified parity, zero code change.**
Live probe with settings switched to EUR + dd/MM/yyyy (restored + persisted
after): the Analytics CSV and the GDPR JSON are **byte-identical** to the
default-settings exports (ISO dates, raw decimals, ISO filename dates). The
live builds its CSV client-side from 3 entity GETs and never reads settings —
the clone's routes behave identically. Pinned in E2E
(`import-export.spec.ts`: export runs after switching settings, asserts the
ISO/raw-decimal shape unchanged). Evidence: `captures/r12/live-csv-eur-ddMMyyyy.json`,
`captures/r12/live-gdpr-eur-ddMMyyyy.json`.

**E2E layer delivered — 66 specs / 11 files / 1024 lines, all green twice
consecutively, zero flakes.** File consolidation vs §C (same spec count
class, tighter grouping): `accounts-investments` (7), `analytics` (6),
`auth` (8), `dashboard` (6), `expenses` (11), `goals` (5), `import-export`
(4), `income` (4), `mobile-console` (5), `quick-add` (5), `settings-theme`
(5) = 66. Infrastructure exactly per §C.1–2: production build on :3100
(`reuseExistingServer: false`), hermetic `db/e2e.db` (absolute-path
`DATABASE_URL` in the webServer env; `rm -f` + `prisma db push` reset per
run; `ensureSeeded()` fills it), serial `workers: 1`, `retries: 0`. The AI
chat surface stays excluded (external model dependency — unit pins remain).
Two consecutive full runs: 66/66 + 66/66 (~3.4 min each). The dev DB
(`/home/z/my-project/db/custom.db`) was untouched — verified by mtime
(predates all E2E runs) + pristine counts 96/4/4/3/8/3.

**Three genuine parity deltas surfaced by the E2E work (each live-probed,
TDD red→green):**

1. **Login-surface title contract** (routes.ts + finara-app.tsx; 3 unit
   specs): round-8 left the /login title unprobed; probes show the live
   renders bare **"Finara"** on /login AND on unauth deep-link redirects
   (the redirect only rewrites the URL — the clone kept "Goals | Finara").
   Fixes: `parseRoute("/login")` title → "Finara"; a render-time route
   adjustment in FinaraApp for logged-out deep links (reads the LIVE session
   store — trusting the hydration render snapshot would bounce authenticated
   visitors; SSR window-guarded); the redirect effect now depends on `route`
   so browser-back while logged out re-gates to /login like the live.
   **Mechanism found**: the App Router hydrates the `<title>` node's
   textContent AFTER client effects — clobbering client-side title writes
   (render-phase and first-macrotask writes both lose the race; a
   `document.title` setter trap proved the reset bypasses the setter, a
   load-time MutationObserver caught React as the writer). Final fix: a
   post-commit title effect guarded by a MutationObserver that restores the
   route title on any external write (converges; equal title → no-op).
   Verified against the production build.
2. **Import path rejected negative amounts** (import route + import-export
   normalizer; 2 unit specs): an ADR-024 layer round-11 missed — rows mode
   guarded `amountMinor < 0` and the finara-export restore normalizer
   rejected negative decimals. Both relaxed to integer-shape-only; negatives
   now import/restore like any other row.
3. **FAB toggle dead under the chooser** (quick-add-dialog.tsx; unit pin):
   Radix's modal lock sets `pointer-events: none` on `<body>`, deadening the
   z-50 FAB while the chooser is open — but the live's FAB STAYS clickable
   and toggles the chooser closed (probed: `elementFromPoint` at the FAB
   center resolves inside the FAB; live full modals DO cover it — overlay
   z-50). Fix: `modal={false}` + `onInteractOutside` suppression (non-modal
   Radix dismisses on outside pointerdown AND outside focus — the FAB takes
   focus on mousedown, so the chooser closed and the FAB's click re-opened
   it: a traced close→toggle double fire). Overlay-click dismiss and Escape
   still close; the full entity dialogs stay modal.

**F2 — CI workflow delivered** (`.github/workflows/ci.yml`): checkout@v4 →
setup-bun@v2 (1.3.x) → `bun install --frozen-lockfile` → `bun run
db:generate` (bun blocks postinstall scripts) → lint → typecheck → unit →
Playwright-version-keyed browser cache → `bunx playwright install
--with-deps chromium` → `bun run test:e2e`; failure-only report artifact.
Validated: YAML safe-parse, every `bun run` script exists,
`--frozen-lockfile` dry-run clean, `next build` + unit suite verified green
WITHOUT .env (CI condition — all API routes are dynamic, unit suite is
pure). Not executed remotely from this sandbox (push-only key) — flagged
verify-on-GitHub.

**F3 — `tailwind.config.ts` deleted + dead `tailwindcss-animate`
dependency removed** (v4 CSS-first pipeline via `@tailwindcss/postcss` +
`tw-animate-css`; the v3 config was referenced by nothing). Post-delete
`next build` green; frozen-lockfile install clean.

**Gates**: lint 0 · tsc 0 · unit **275/275** (270 + 5 new: 3 title + 2
import-negative) · build 0 · E2E **66/66** (×2). eslint ignores extended
with `playwright-report/**` + `test-results/**` (the html reporter's
artifacts crashed lint otherwise); `.gitignore` extended with the E2E
artifact dirs. One sandbox lesson recorded: crashed runs left ~65 zombie
chromium processes that starved later launches mid-suite (looked like
locator timeouts) — cleaned; suite then all-green twice.

**Live etiquette**: settings probe toggles restored + verified persisted
(USD / MM/dd/yyyy); theme left dark as found; no other live mutations.
