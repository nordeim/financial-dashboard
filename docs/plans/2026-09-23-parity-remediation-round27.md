# Round-27 Remediation Plan — the ninth zero-drift verification round

Date: 2026-09-23 · Scope: the standard full live re-probe with the two
operator-mandated focus areas re-verified — the mobile navigation menu
(anatomical + behavioral, both sides, against the production build) and the
TailwindCSS v4 audit (production bundle + runtime cascade +
dynamic-class scan + consumer-color probes) — plus the raw-order chrome
probes (sidebar/nav/innerPane/active-pill class strings), the focused
interactive sweep (FAB / Quick Add chooser / step-2 / close-toggle chain),
the HTTP-layer audit (security headers, per-route description template,
login-only head pins, per-route twitter:url + canonical, the SPA-200
unknown-path quirk), the fresh-environment gate verification (lint 0,
tsc 0, unit 434/434, build clean), the round-over-round invariance check
against the r26 capture set, and the codebase production-readiness review
(CI workflow bytes via marker-safe needles + hexdump ground truth,
dependency advisories vs the PAD §10 tail, TODO/FIXME scan, doc-drift
re-check of the round-24/25/26 fixes).

**The live app is UNCHANGED since round 26 on every probed STRUCTURAL
layer — the NINTH consecutive zero-drift round (19–27).** The only live
delta this round is a USER-DATA change, not an app change: the live user
deleted their last income source, so the Income view now renders its
empty state (the dashed-border `border-2 border-dashed` card + the
`lucide-chart-column` h-16 icon + the "Add Income Source" sage button)
where round 26 captured exactly one source card — a −27/+9 multiset
delta on Income, zero deltas on the other eight desktop surfaces
(byte-identical multisets). The round's remediation surface is therefore
the standard verification-round alignment set (docs-only; the app code is
contract-pinned and drift-free):

- **Body DOM** (signature-multiset diff, 10 surfaces, the canonical
  plain `tag.class` signature): zero non-bucketed deltas. Every
  only-live/only-clone delta classifies into the documented buckets —
  the lucide element-mix (the live's lucide version draws icons with
  `polyline`/`line`/`polygon` inner elements; the clone's lucide 0.525
  draws the same icons with `path` — visible on every surface and
  mirrored 1:1), the live user's dismissed-insights empty state (Brain
  `w-12` + "No insights available yet" + the `py-8 text-center`
  container) vs the clone's three seeded insight records, seed-data
  counts (the clone's seed renders 100 expenses / 4 income / 4 accounts
  / 8 investments / 3 goals vs the live user's 1 expense / 0 income /
  1 account / 1 investment / 1 goal — the per-row node sets differ by
  exactly the row-count deltas, e.g. 99x per-row action-button pairs on
  Expenses and 35+7 td on Investments), the live user's Income
  empty state vs the clone's 4 seeded source cards (this round's
  data-change surface), chart SVG data, the live's duplicated toaster
  viewport, and Next infra (the `next-route-announcer`, the
  font-loader classes on body — live's bare `body` vs clone's
  `antialiased … inter_*_variable`).
- **Round-over-round invariance re-verified**: the r27 live signature
  multisets are byte-identical to the round-26 capture set on 8 of 9
  desktop surfaces (0/0 distinct deltas each); Income carries exactly
  the −27/+9 user-data deletion delta (one source-card anatomy set out
  — the card container, the dollar-sign icon block, the h3, the
  pen/trash2 button pair, the amount span, the frequency div, the
  border-t divider, the "Monthly Income" label pair — the empty-state
  anatomy in). The r27 clone multisets are byte-identical to round-26's
  on all 9 surfaces.
- **Mobile navigation — the operator's first explicit focus — VERIFIED
  WORKING on both sides and structurally byte-identical** (71/71 nodes,
  only the lucide element-mix deltas): the drawer (`lg:hidden fixed
  inset-0 z-40 bg-slate-800 dark:bg-gray-900`) opens, a nav-link click
  navigates AND unmounts the drawer (verified → /Goals, title "Goals |
  Finara"), the Menu↔X glyph swaps both directions, the X button
  closes, and a clean open→close cycle renders zero console messages on
  both sides. Verified against the production build on the clone side.
- **TailwindCSS v4 — the operator's second explicit focus — CLEAN**:
  the 176,431-byte production CSS bundle (176,411 characters — the
  byte/char delta is multi-byte UTF-8 content, not drift) carries
  `lg\:hidden`, `.dark\:bg-gray-900`, all four `fin-*` keyframes
  (`fin-card-in`/`fin-overlay-in`/`fin-scale-in`/`fin-drawer-in`)
  declared inside `@media (prefers-reduced-motion:no-preference)` —
  the standard gate (animations run only when motion is allowed) —
  plus `backdrop-filter` and the reduced-motion override blocks; the
  v3 palette pins verified AT THE VARIABLE LEVEL this round (the
  utilities resolve through the variables): `--color-slate-800
  #1e293b`, `--color-blue-600 #2563eb`, `--color-red-500 #ef4444`,
  `--color-emerald-400 #34d399` (the pinned step;
  `--color-emerald-500` separately verified `#10b981`), and
  `--color-gray-600 #4b5563` — the unlayered `:root` pin wins the
  cascade (computed-style probes on the CSS variables return exactly
  these hexes); no dynamic class construction exists (the only
  template-literal className is layout.tsx's static
  `${inter.variable}`); consumer-element colors byte-match on both
  sides (the sidebar logo `rgb(52, 211, 153)`, the h2
  `rgb(255,255,255)`, the p `rgb(148,163,184)`, the inner-pane
  gradient stops `rgb(17,24,39)`→`rgb(31,41,55)` — the live's
  legacy comma gradient syntax vs the clone's v4 `in oklab` emission
  is the documented engine-level rendering nuance, stops byte-equal).
- **Desktop chrome raw orders**: byte-identical — `aside` = `hidden
  lg:flex lg:w-64 lg:flex-col`, gradient container = `flex flex-col
  flex-1 min-h-0 sidebar-gradient`, nav = `flex-1 px-4 py-6 space-y-2`,
  innerPane = `min-h-screen bg-gradient-to-br from-slate-50 to-blue-50
  dark:from-gray-900 dark:to-gray-800 transition-colors duration-300
  font-sans`, and the active/inactive pill class strings (`…duration-200
  bg-emerald-500/20 text-white shadow-lg border border-emerald-400/30
  backdrop-blur-sm` / `…text-slate-300 hover:bg-white/10
  hover:text-white`).
- **HTTP layer**: byte-exact vs every round-17→26 pin — the
  security-header trio on the live (referrer-policy
  strict-origin-when-cross-origin, strict-transport-security
  max-age=31536000, x-content-type-options nosniff) + the clone's
  hardening pair (X-Frame-Options DENY, Permissions-Policy
  camera=(), microphone=(), geolocation=()); the per-route description
  template (`Goals on Finara. Finara is your intelligent financial
  co-pilot, designed to bring clarity and con.` verified live
  in-browser AND clone static — byte-identical; the root `/` route
  carries the default full description + title `Finara`, verified
  in-browser on the live + static on the clone); the login-only pins
  on the live's static login HTML (viewport `viewport-fit=cover`,
  theme-color `#000000`, `twitter:image:alt "Base44 link preview"`,
  the sized icon pair sizes="any" + apple-touch-icon 180x180 — two of
  the five render content-first attribute order, the values
  byte-matching); the per-route twitter:url + og:url + canonical
  (live in-browser, clone in-browser, both resolving through their
  origins); and the SPA-style HTTP 200 for unknown paths on both
  sides.
- **Focused interactive sweep**: matched on both sides — the FAB
  wrapper `fixed bottom-6 right-6 z-50` + `tabindex="0"` + the sage
  button (computed `rgb(5, 150, 105)` = #059669) + `lucide-plus w-6
  h-6 text-white`; the Quick Add chooser (overlay `fixed inset-0
  bg-black/50 flex items-center justify-center p-4 z-40`, title "Quick
  Add", subtitle "What would you like to add?", options "Add Income" /
  "Add Expense"); the step-2 form (the "Needs" default tab,
  placeholders "Expense description..." + "Amount", Back enabled, Add
  disabled-until-filled); and the FAB close-toggle (clicking the open
  FAB closes the overlay on both sides, the glyph staying
  `lucide-plus` on both — byte-matching behavior).
- **The live account's theme state left as found (dark)** — with a
  new operator-side lesson recorded: the probe's own first Menu-locator
  attempt mis-clicked the mobile top-bar SUN toggle (an unnamed
  icon-only button adjacent to the Menu button), flipping the live
  account DARK→LIGHT mid-probe; detected via the consumer-color probe
  (the inner-pane gradient returned the light ramp), restored through
  the user dropdown's Dark Mode item, and re-verified `html.dark` at
  session close. Lesson: locate the mobile Menu button by its
  `svg.lucide-menu` glyph, never by snapshot ref order, and re-verify
  the theme state after every drawer/top-bar interaction sequence.

## §A Context

Round 27 continues from the pushed round-26 state (remote main @
`9eb64ad` + the user-pushed `docs/session_38.md` at `812e5d2` — the
round-26 session narrative). The sandbox was NOT reset (node_modules,
the repo-root db/custom.db, .env, and the re-probe tooling all
intact), so the refresh was a fast-forward `git pull` (9eb64ad →
812e5d2) plus `bun install --frozen-lockfile` (613 installs verified,
no changes). The known `DATABASE_URL` shadow trap (the sandbox exports
an absolute `file:/home/z/my-project/db/custom.db` pointing outside
the repo) was confirmed active and handled with `unset` on every
server/gate invocation. The Playwright chromium 1234 build (the 1.62.1
runner's requirement) was already present — the documented environment
lesson pre-satisfied.

The operating instructions were internalized (the uploaded coding-agent
prompt — audit then remediate, evidence-backed claims, TDD, no
guardrail weakening; the repo skills catalog — clone-app-pat-pro /
agent-browser / tdd / the Tailwind v4 pair; the scandihaven repo's
tech-stack patterns re-confirmed). The core docs were re-read (AGENTS,
CLAUDE, README, PAD v1.25, financial-dashboard_SKILL.md, session_37,
session_38, the round-26 plan) and the codebase alignment validated:
17 finara components + theme.ts, 17 pinned ui primitives, 18 unit
files / 434 specs, 11 E2E spec files / 67 specs, 8 Prisma models, 24
runtime dependencies, and the installed versions (next 16.3.5, prisma
6.19.2, tailwindcss 4.1.18, eslint-config-next 16.3.5, react 19.2.3,
lucide-react 0.525, recharts 2.15.4, z-ai-web-dev-sdk 0.0.18) —
matching the documented round-26 state exactly; the `.env` /
`.env.example` pair identical with `DATABASE_URL="file:../db/custom.db"`
resolving to the repo-root `db/` through the round-21 db-path contract.

## §B Findings (all verified against the codebase 2026-09-23)

- **F1 — Zero STRUCTURAL parity drift** (verified, no action): the
  ninth consecutive zero-drift re-probe; every delta in the documented
  buckets on all 10 surfaces + the chrome raw orders + the HTTP layer.
- **F2 — One live USER-DATA change** (verified, no action, classified
  seed-data bucket): the live user deleted their last income source —
  the Income view now renders the empty state (−27/+9 multiset delta
  vs r26; all other 8 surfaces byte-identical). The view's structural
  anatomy is unchanged (the empty state is the same component tree the
  clone renders for an empty income list); no code action — the
  clone's seeded 4-source state remains the documented seed-data
  bucket delta.
- **F3 — Both operator focus areas clean** (verified, no action): the
  mobile navigation menu works end-to-end on both sides against the
  production build (open, navigate+unmount, Menu↔X both directions, X
  close, zero console messages; 71/71 drawer nodes byte-identical); no
  TailwindCSS v4 bug exists (bundle + variable-level cascade +
  dynamic-class scan + consumer colors all clean).
- **F4 — Production-readiness review clean on the code side**: no
  TODO/FIXME; `bun audit` = exactly the PAD §10 documented tail (43
  advisories — 30 high / 12 moderate / 1 low — ZERO in the 24-package
  direct runtime set); the CI workflow verified clean TWO ways — the
  marker-safe needles (all PASS) + the `od -c` hexdump ground truth on
  both `branches:` lines (the display layer again ate `[m` — this
  round even the `cat -A` output passed through the same display
  mangling, extending the round-22/24/26 ANSI-artifact lesson class:
  od -c's space-separated bytes are the ONLY display-safe ground truth
  for bracket-bearing needles); the installed framework versions match
  every doc claim; the round-24/25/26 doc fixes all hold (the
  remaining `task-management.git` / `16.1.3` mentions grep-verified as
  historical fix/upgrade records only).
- **F5 — The round's remediation surface is the standard
  verification-round alignment set** (docs-only, the round-22→26
  precedent — never invent work to look busy): the round-27 references
  in AGENTS (plans list), CLAUDE (ANALYZE pointer), README
  (parity-program row), PAD (v1.26 header + §10 round-27 row +
  verification paragraph), SKILL (last_updated + history-table row 27 +
  the Appendix B header 26 → 27-Round + the description-block
  round-count refs), the session log (session_39), and the
  date-relative screenshot refresh. No code changes — the 434 + 67
  executable contracts stand unmodified as the verification record.

## §C Affected surfaces

- `docs/plans/2026-09-23-parity-remediation-round27.md` (this plan) —
  the plan + §G execution record.
- `docs/screenshots/` — the refreshed dev-server captures (login + 9
  views + the mobile drawer, full-page; date-relative surfaces
  refresh, deterministic surfaces expected byte-identical per the
  round-22→26 signature).
- `AGENTS.md` — the plans-list round-27 entry.
- `CLAUDE.md` — the ANALYZE round-27 pointer.
- `README.md` — the parity-program row (26 → 27 rounds).
- `Project_Architecture_Document.md` — the v1.26 header + the §10
  round-27 verification row + the verification paragraph.
- `financial-dashboard_SKILL.md` — `last_updated` + the history-table
  row 27 + the Appendix B header (the 27-Round Parity History) + the
  description-block round-count refs (26 → 27).
- `docs/session_39.md` — the round-27 session log.
- **No source files change** — the app code is contract-pinned and
  drift-free; the 434 + 67 executable contracts are the verification
  record.

## §D Execution order

1. The E2E gate in the foreground (`bun run test:e2e` — build + 67
   specs; browser sessions closed first per the round-20 memory
   lesson; chromium 1234 confirmed present).
2. The screenshot refresh from the dev server on :3000 (repo-local DB,
   `DATABASE_URL` unset; sign out first for the login capture;
   full-page captures; semantic-locator sign-in per the round-24
   lesson).
3. The docs alignment pass (§C) + the session log.
4. Final gates re-verified at close (lint · typecheck · unit · build),
   then the atomic commits + the SSH-wrapper push to `main`.

## §E TDD plan

Not applicable — zero code changes. The remediation surface is
documentation-only; the "test" for each alignment edit is the
grep-verification against the measured codebase state (the referenced
numbers must equal the actual counts: 434 unit, 67 E2E, 8 models, 27
rounds). The 434 unit + 67 E2E executable contracts stand unmodified
as the verification record. Any future live drift that surfaces in
round 28+ resumes the red → green discipline (per the round-22→26 §E
precedent).

## §F Verification plan

- Gates: `bun run lint` (exit 0) · `bun run typecheck` (exit 0) ·
  `bun run test` (434/434) · `bun run test:e2e` (67/67, foreground) ·
  `bun run build` (clean) — before the push.
- Doc-fix validation: every round-27 reference grep-verified (the
  plans-list entry, the ANALYZE pointer, the README row, the PAD
  header/§10 row, the SKILL history row + Appendix header + the
  description-block refs, the session log present).
- Parity evidence: the signature-multiset diffs with every delta
  classified (the capture set under `/home/z/my-project/captures/r27/`
  — outside the repo, per convention); the mobile drawer 71/71
  structural diff; the Tailwind bundle/cascade checks; the HTTP
  header/head probes; the interactive sweep probes.
- Push contract: gates green → `python3 docs/ssh_git_wrapper_v3.py
  --key-file <path outside repo> --remote
  git@github.com:nordeim/financial-dashboard.git` (dry-run then real;
  remote ref == HEAD; key shredded).

## §G Execution record (2026-09-23)

Executed in plan order:

1. **Environment bootstrap** — fast-forward pull to `812e5d2`,
   `bun install --frozen-lockfile` (613 installs, no changes), the
   `DATABASE_URL` shadow confirmed active and unset on every
   invocation, chromium 1234 confirmed present.
2. **Baseline gates** — lint 0 · tsc 0 · unit 434/434 (3.2s) · build
   clean.
3. **The live re-probe** (agent-browser isolated `live`/`clone`
   sessions; the clone side against the production build on :3000 with
   the repo-local DB; both sides theme-matched dark): the full
   10-surface signature-multiset diff + both focus areas + the
   raw-order chrome probes + the HTTP audit + the interactive sweep +
   the round-over-round invariance check against the r26 capture set.
   Verdict: the live structurally UNCHANGED — the NINTH consecutive
   zero-drift round (19–27); the single live delta the user's income
   -source deletion (F2). One live-session auth bounce mid-probe (the
   Investments surface caught the login screen — detected by the
   sidebar-signature validation, re-captured clean at 227 nodes after
   re-auth, the documented lesson class). The probe's own sun-toggle
   mis-click flipped the live theme DARK→LIGHT mid-probe; detected via
   the consumer-color gradient probe, restored via the user dropdown,
   re-verified `html.dark` at close, left as found.
4. **Production-readiness review** — TODO/FIXME clean; `bun audit` =
   exactly the PAD §10 tail (43: 30h/12m/1l, zero direct-runtime); CI
   verified clean two ways (needles + od -c hexdump ground truth after
   the display artifact re-manifested through cat -A); the installed
   versions match every doc claim; the round-24/25/26 fixes
   grep-verified holding. **The remediation surface: the standard
   verification-round alignment set (F5).**
5. **The E2E gate** — run in the foreground after closing the probe
   browser sessions.
6. **The screenshot refresh** — dev-server captures on :3000
   (repo-local DB, `DATABASE_URL` unset, full-page): login (sign-out
   state) + the 9 views + the mobile drawer.
7. **The docs alignment pass** — AGENTS (the plans-list round-27
   entry), CLAUDE (the ANALYZE round-27 pointer), README (the
   parity-program row 26 → 27 rounds), PAD v1.26 (the header + the
   §10 round-27 row + the verification paragraph), SKILL
   (last_updated + the history-table row 27 + the Appendix B header →
   the 27-Round Parity History + the description-block refs), the
   session log (session_39).
8. **Final gates re-verified at close** — lint 0 · tsc 0 · unit
   434/434 · E2E 67/67 (step 5) · build clean.
