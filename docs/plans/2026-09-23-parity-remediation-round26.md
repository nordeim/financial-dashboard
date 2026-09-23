# Round-26 Remediation Plan — the eighth zero-drift verification round

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
tsc 0, unit 434/434, build clean), and the codebase
production-readiness review (CI workflow bytes via marker-safe needles,
dependency advisories vs the PAD §10 tail, TODO/FIXME scan, doc-drift
re-check of the round-24/25 fixes).

**The live app is UNCHANGED since round 25** on every probed layer —
the EIGHTH consecutive zero-drift round (19–26). The round's
remediation surface is the standard verification-round alignment set
(docs-only; the app code is contract-pinned and drift-free):

- **Body DOM** (signature-multiset diff, 10 surfaces, the canonical
  plain `tag.class` signature per the round-25 methodology note): zero
  non-bucketed deltas. Every only-live/only-clone delta classifies into
  the documented buckets — the lucide element-mix (the live's lucide
  version draws icons with `polyline`/`line`/`polygon` inner elements;
  the clone's lucide 0.525 draws the same icons with `path` — visible on
  every surface as 5–25 polyline + 1 polygon only-live mirrored by
  15–59 path only-clone), the live user's dismissed-insights empty
  state (Brain `w-12` + "No insights available yet" + the `py-8
  text-center` container) vs the clone's three seeded insight records,
  seed-data counts (the clone's seed renders 100 expenses / 4 income /
  4 accounts / 8 investments / 3 goals vs the live user's 1 of each —
  e.g. 99x per-row action-button pairs on Expenses, 35+7 td on
  Investments, the per-card node sets on Accounts/Goals), chart SVG
  data, the live's duplicated toaster viewport, and Next infra (the
  `next-route-announcer`, the font-loader classes on body — live's
  bare `body` vs clone's `antialiased … inter_*_variable`).
- **Round-over-round invariance re-verified**: the r26 live signature
  multisets are byte-identical to the round-25 capture set on all 9
  desktop surfaces (an initial apparent +1-per-surface was a
  `wc -l` trailing-newline artifact, disproven by the multiset diff:
  0/0 distinct deltas on every surface); the r26 clone multisets are
  byte-identical to round-25's on all 9 surfaces as well.
- **Mobile navigation — the operator's first explicit focus — VERIFIED
  WORKING on both sides and structurally byte-identical** (71/71 nodes,
  only the lucide element-mix deltas): the drawer (`lg:hidden fixed
  inset-0 z-40 bg-slate-800 dark:bg-gray-900`) opens, a nav-link click
  navigates AND unmounts the drawer, the Menu↔X glyph swaps both
  directions (`lucide-menu w-5 h-5` ↔ `lucide-x w-5 h-5`), the X button
  closes, and a clean open→close cycle renders zero console messages on
  both sides. Verified against the production build on the clone side.
- **TailwindCSS v4 — the operator's second explicit focus — CLEAN**:
  the 176,431-byte production CSS bundle carries `lg\:hidden`,
  `.bg-slate-800` with the raw `#1e293b` v3 hex, `.dark\:bg-gray-900`,
  all four `fin-*` keyframes (`fin-card-in`/`fin-overlay-in`/
  `fin-scale-in`/`fin-drawer-in`) with the `prefers-reduced-motion`
  gate, and `backdrop-filter`; the computed-style probes ON THE CSS
  VARIABLES return `#2563eb`/`#1e293b`/`#ef4444`/`#34d399`
  (emerald-400, the pinned step)/`#4b5563` — the unlayered v3 pin wins
  the cascade; no dynamic class construction exists (the only
  template-literal className is layout.tsx's static `${inter.variable}`);
  consumer-element colors byte-match on both sides (the sidebar logo
  `rgb(52, 211, 153)`, the h2 `rgb(255,255,255)`, the p
  `rgb(148,163,184)`, the inner-pane gradient stops
  `rgb(17,24,39)`→`rgb(31,41,55)`).
- **Desktop chrome raw orders**: byte-identical — `aside` = `hidden
  lg:flex lg:w-64 lg:flex-col`, gradient container = `flex flex-col
  flex-1 min-h-0 sidebar-gradient`, nav = `flex-1 px-4 py-6 space-y-2`,
  innerPane = `min-h-screen bg-gradient-to-br from-slate-50 to-blue-50
  dark:from-gray-900 dark:to-gray-800 transition-colors duration-300
  font-sans`, the bare-anchor > pill-div nav structure, and the
  active/inactive pill class strings (`…duration-200 bg-emerald-500/20
  text-white shadow-lg border border-emerald-400/30 backdrop-blur-sm` /
  `…text-slate-300 hover:bg-white/10 hover:text-white`).
- **HTTP layer**: byte-exact vs every round-17→25 pin — the
  security-header trio on the live (referrer-policy
  strict-origin-when-cross-origin, strict-transport-security
  max-age=31536000, x-content-type-options nosniff) + the clone's
  hardening pair (X-Frame-Options DENY, Permissions-Policy
  camera=(), microphone=(), geolocation=()); the per-route description
  template (`Goals on Finara. Finara is your intelligent financial
  co-pilot, designed to bring clarity and con.` verified live
  in-browser AND clone static — byte-identical; the root /Dashboard
  route carries the default full description + title `Finara`, also
  byte-identical both sides); the login-only pins on the live's static
  login HTML (viewport `viewport-fit=cover`, theme-color `#000000`,
  `twitter:image:alt "Base44 link preview"`, the sized icon pair
  sizes="any" + apple-touch-icon 180x180); the per-route twitter:url +
  og:url + canonical (live in-browser, clone static, both resolving
  through their origins); and the SPA-style HTTP 200 for unknown paths
  on both sides.
- **Focused interactive sweep**: matched on both sides — the FAB
  wrapper `fixed bottom-6 right-6 z-50` + `tabindex="0"` + the sage
  button + `lucide-plus w-6 h-6 text-white`; the Quick Add chooser
  (overlay `fixed inset-0 bg-black/50 flex items-center justify-center
  p-4 z-40`, title "Quick Add", subtitle "What would you like to
  add?", options "Add Income" / "Add Expense"); the step-2 form (the
  "Needs" default tab, placeholders "Expense description…" +
  "Amount", Back enabled, Add disabled-until-filled); and the FAB
  close-toggle (clicking the open FAB closes the overlay on both
  sides, the glyph staying `lucide-plus` on both — byte-matching
  behavior).
- **The live account's theme state left as found (dark)** — the applied
  state verified DARK at the start and after re-login at the end; the
  mid-probe "light" reading was the live session's auth expiry showing
  the login page (the login route carries no `dark` class), NOT a theme
  change — the account's server-side setting was DARK throughout.

## §A Context

Round 26 continues from the pushed round-25 state (remote main @
`a02517f` + the user-pushed `docs/session_36.md` at `9816edd` — the
round-25 session narrative). The sandbox was NOT reset this time
(node_modules, the repo-root db/custom.db, .env, and the re-probe
tooling all intact), so the refresh was a fast-forward `git pull`
(a02517f → 9816edd) plus `bun install --frozen-lockfile` (613 installs
verified, no changes). The known `DATABASE_URL` shadow trap (the
sandbox exports an absolute `file:/home/z/my-project/db/custom.db`
pointing outside the repo) was confirmed active and handled with
`unset` on every server/gate invocation. The Playwright chromium 1234
build (the 1.62.1 runner's requirement) was already present — the
documented environment lesson pre-satisfied.

The operating instructions were internalized (the uploaded coding-agent
prompt — audit then remediate, evidence-backed claims, TDD, no
guardrail weakening; the repo skills catalog — clone-app-pat-pro /
agent-browser / tdd / the Tailwind v4 pair; the scandihaven repo's
tech-stack patterns re-confirmed present). The core docs were re-read
(AGENTS, CLAUDE, README, PAD v1.24, financial-dashboard_SKILL.md,
session_35, session_36, the round-25 plan, the
Tailwind-V4-Validation-Report) and the codebase alignment validated:
17 finara components + theme.ts, 17 pinned ui primitives, 18 unit
files / 434 specs, 11 E2E spec files / 67 specs, 8 Prisma models, 24
runtime dependencies, and the installed versions (next 16.3.5, prisma
6.19.2, tailwindcss 4.1.18, eslint-config-next 16.3.5, react 19.2.3,
lucide-react 0.525, recharts 2.15.4, z-ai-web-dev-sdk 0.0.18) —
matching the documented round-25 state exactly.

## §B Findings (all verified against the codebase 2026-09-23)

- **F1 — Zero parity drift** (verified, no action): the eighth
  consecutive zero-drift re-probe; every delta in the documented
  buckets on all 10 surfaces + the chrome raw orders + the HTTP layer.
- **F2 — Both operator focus areas clean** (verified, no action): the
  mobile navigation menu works end-to-end on both sides against the
  production build; no TailwindCSS v4 bug exists (bundle + cascade +
  dynamic-class scan + consumer colors all clean).
- **F3 — Production-readiness review clean on the code side**: no
  TODO/FIXME; `bun audit` = exactly the PAD §10 documented tail (43
  advisories — 30 high / 12 moderate / 1 low — ZERO in the 24-package
  direct runtime set); the CI workflow verified clean TWO ways this
  round — the marker-safe needles (all PASS: `branches: [main]` on
  both push and pull_request, the full gate chain) + the GitHub-side
  run evidence (12+ real CI runs on main listed on the workflow page,
  e.g. the round-19 head 8488f5c) — closing a verification gap: a
  first-pass `cat` read appeared to show a corrupted `branches: ain]`
  filter, but the hexdump (`od -c`) proved the bytes correct — the
  `[m` had been eaten by the tool-output display layer (a new
  probe-methodology lesson: verify bracket-bearing needles with a
  hexdump when the displayed line looks mangled); the installed
  framework versions match every doc claim; the round-24/25 doc fixes
  all hold (the remaining `task-management.git` / `16.1.3` mentions
  grep-verified as historical fix/upgrade records only).
- **F4 — The round's remediation surface is the standard
  verification-round alignment set** (docs-only, the round-22/23/24/25
  precedent — never invent work to look busy): the round-26 references
  in AGENTS (plans list), CLAUDE (ANALYZE pointer), README
  (parity-program row), PAD (v1.25 header + §10 round-26 row +
  verification paragraph), SKILL (last_updated + history-table row 26 +
  the Appendix B header 25 → 26-Round), the session log (session_37),
  and the date-relative screenshot refresh. No code changes — the
  434 + 67 executable contracts stand unmodified as the verification
  record.

## §C Affected surfaces

- `docs/plans/2026-09-23-parity-remediation-round26.md` (this plan) —
  the plan + §G execution record.
- `docs/screenshots/` — the refreshed dev-server captures (login + 9
  views + the mobile drawer, full-page; date-relative surfaces
  refresh, deterministic surfaces expected byte-identical per the
  round-22/23/24/25 signature).
- `AGENTS.md` — the plans-list round-26 entry.
- `CLAUDE.md` — the ANALYZE round-26 pointer.
- `README.md` — the parity-program row (25 → 26 rounds).
- `Project_Architecture_Document.md` — the v1.25 header + the §10
  round-26 verification row + the verification paragraph.
- `financial-dashboard_SKILL.md` — `last_updated` + the history-table
  row 26 + the Appendix B header (the 26-Round Parity History).
- `docs/session_37.md` — the round-26 session log.
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
numbers must equal the actual counts: 434 unit, 67 E2E, 8 models, 26
rounds). The 434 unit + 67 E2E executable contracts stand unmodified
as the verification record. Any future live drift that surfaces in
round 27+ resumes the red → green discipline (per the
round-22/23/24/25 §E precedent).

## §F Verification plan

- Gates: `bun run lint` (exit 0) · `bun run typecheck` (exit 0) ·
  `bun run test` (434/434) · `bun run test:e2e` (67/67, foreground) ·
  `bun run build` (clean) — before the push.
- Doc-fix validation: every round-26 reference grep-verified (the
  plans-list entry, the ANALYZE pointer, the README row, the PAD
  header/§10 row, the SKILL history row + Appendix header, the session
  log present).
- Parity evidence: the signature-multiset diffs with every delta
  classified (the capture set under `/home/z/my-project/captures/r26/`
  — outside the repo, per convention); the mobile drawer 71/71
  structural diff; the Tailwind bundle/cascade checks; the HTTP
  header/head probes; the interactive sweep probes.
- Push contract: gates green → `python3 docs/ssh_git_wrapper_v3.py
  --key-file <path outside repo> --remote
  git@github.com:nordeim/financial-dashboard.git` (dry-run then real;
  remote ref == HEAD; key shredded).

## §G Execution record (2026-09-23)

Executed in plan order:

1. **Environment bootstrap** — fast-forward pull to `9816edd`,
   `bun install --frozen-lockfile` (613 installs, no changes), the
   `DATABASE_URL` shadow confirmed active and unset on every
   invocation, chromium 1234 confirmed present.
2. **Baseline gates** — lint 0 · tsc 0 · unit 434/434 (3.6s) · build
   clean.
3. **The live re-probe** (agent-browser isolated `live`/`clone`
   sessions; the clone side against the production build on :3000 with
   the repo-local DB; both sides theme-matched dark): the full
   10-surface signature-multiset diff + both focus areas + the
   raw-order chrome probes + the HTTP audit + the interactive sweep +
   the round-over-round invariance check against the r25 capture set.
   Verdict: the live UNCHANGED — the EIGHTH consecutive zero-drift
   round (19–26). The live session's auth expired once mid-probe (the
   Investments surface captured the login screen — detected by the
   sidebar-signature validation, re-captured clean after re-login; a
   late "light" theme reading was the login page, disproven and
   re-verified DARK after re-login — the account's server-side theme
   state DARK throughout, left as found).
4. **Production-readiness review** — TODO/FIXME clean; `bun audit` =
   exactly the PAD §10 tail (43: 30h/12m/1l, zero direct-runtime); CI
   verified clean two ways (needles + GitHub run evidence, after the
   display-artifact false alarm resolved by hexdump); the installed
   versions match every doc claim; the round-24/25 fixes
   grep-verified holding. **The remediation surface: the standard
   verification-round alignment set (F4).**
5. **The E2E gate** — run in the foreground after closing the probe
   browser sessions.
6. **The screenshot refresh** — dev-server captures on :3000
   (repo-local DB, `DATABASE_URL` unset, full-page): login (sign-out
   state) + the 9 views + the mobile drawer.
7. **The docs alignment pass** — AGENTS (the plans-list round-26
   entry), CLAUDE (the ANALYZE round-26 pointer), README (the
   parity-program row 25 → 26 rounds), PAD v1.25 (the header + the
   §10 round-26 row + the verification paragraph), SKILL
   (last_updated + the history-table row 26 + the Appendix B header →
   the 26-Round Parity History), session_37.
8. **Final gates re-verified at close** — lint 0 · tsc 0 · unit
   434/434 · E2E 67/67 (step 5) · build clean.
