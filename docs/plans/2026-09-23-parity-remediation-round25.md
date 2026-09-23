# Round-25 Remediation Plan — the seventh zero-drift verification round

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
re-check of the round-24 fixes).

**The live app is UNCHANGED since round 24** on every probed layer —
the SEVENTH consecutive zero-drift round (19–25). The round's
remediation surface is the standard verification-round alignment set
(docs-only; the app code is contract-pinned and drift-free):

- **Body DOM** (signature-multiset diff, 10 surfaces): zero
  non-bucketed deltas. Every only-live/only-clone delta classifies into
  the documented buckets — the lucide element-mix (the live's lucide
  version draws icons with `polyline`/`line`/`polygon` inner elements;
  the clone's lucide 0.525 draws the same icons with `path` — visible on
  every surface as 5–25 polyline/3–14 line/1 polygon only-live mirrored
  by 15–710 path only-clone), the live user's dismissed-insights empty
  state (Brain `w-12` + "No insights available yet" + the `py-8
  text-center` container) vs the clone's three seeded insight records,
  seed-data counts (expenses 100v1, income 4v1, accounts 4v1,
  investments 8v1, goals 3v1 — per-row/per-card node sets differ by
  exactly the row-count deltas), chart SVG data, the live's duplicated
  toaster viewport, and Next infra (the `next-route-announcer`, the
  font-loader classes on `body` — live's bare `body` vs clone's
  `antialiased … inter_*_variable`).
- **A probe-methodology finding (not drift)**: the round-25 capture
  tooling initially recorded aria/role attribute markers on the
  signature, exposing that the clone's lucide icons carry
  `aria-hidden="true"` while the live's do not — the documented
  deliberate-a11y-additions bucket (invisible to the canonical
  plain `tag.class` signature used since round 2; re-confirmed by
  direct attribute probes on both sides).
- **Mobile navigation — the operator's first explicit focus — VERIFIED
  WORKING on both sides and structurally byte-identical** (71/71 nodes,
  only the lucide element-mix deltas): the drawer (`lg:hidden fixed
  inset-0 z-40 bg-slate-800 dark:bg-gray-900`) opens, a nav-link click
  navigates AND unmounts the drawer, the Menu↔X glyph swaps both
  directions (`lucide-menu w-5 h-5` ↔ `lucide-x w-5 h-5`), the X button
  closes, and both sides render zero NEW console errors. Verified
  against the production build on the clone side.
- **TailwindCSS v4 — the operator's second explicit focus — CLEAN**:
  the 176 KB production CSS bundle carries `lg\:hidden`, `.bg-slate-800`
  with the raw `#1e293b` v3 hex, `.dark\:bg-gray-900`, all four `fin-*`
  keyframes (`fin-card-in`/`fin-overlay-in`/`fin-scale-in`/
  `fin-drawer-in`) with the `prefers-reduced-motion` gate, and
  `backdrop-filter`; the computed-style probes ON THE CSS VARIABLES
  return `#2563eb`/`#1e293b`/`#ef4444`/`#34d399`/`#4b5563` — the
  unlayered v3 pin wins the cascade; no dynamic class construction
  exists (the only template-literal className is layout.tsx's static
  `${inter.variable}`); consumer-element colors byte-match on both
  sides.
- **Desktop chrome raw orders**: byte-identical — `aside` = `hidden
  lg:flex lg:w-64 lg:flex-col`, gradient container = `flex flex-col
  flex-1 min-h-0 sidebar-gradient`, nav = `flex-1 px-4 py-6 space-y-2`,
  innerPane = `min-h-screen bg-gradient-to-br from-slate-50 to-blue-50
  dark:from-gray-900 dark:to-gray-800 transition-colors duration-300
  font-sans`, the bare-anchor > pill-div nav structure, and the
  active/inactive pill class strings (`…duration-200 bg-emerald-500/20
  text-white shadow-lg border border-emerald-400/30 backdrop-blur-sm` /
  `…text-slate-300 hover:bg-white/10 hover:text-white`).
- **HTTP layer**: byte-exact vs every round-17→24 pin — the
  security-header trio + hardening pair, the per-route description
  template (`Goals on Finara. <80-char truncation>.` verified live
  in-browser and clone static), the login-only viewport-fit=cover +
  theme-color #000000 + sized icon pair + `twitter:image:alt "Base44
  link preview"`, the per-route twitter:url + canonical, and the
  SPA-style HTTP 200 for unknown paths on both sides.
- **Focused interactive sweep**: matched on both sides — the FAB
  wrapper `fixed bottom-6 right-6 z-50` + `tabindex="0"` + sage button
  + `plus w-6 h-6 text-white`, the Quick Add chooser (overlay `fixed
  inset-0 bg-black/50 flex items-center justify-center p-4 z-40`, title
  "Quick Add", subtitle "What would you like to add?", both options),
  the step-2 form (the "Needs" default tab, both placeholders, Back
  enabled, Add disabled-until-filled), and the FAB close-toggle.
- **The live user's theme state left as found (dark)** — the applied
  state verified DARK before and after the probe (the live persists the
  theme server-side; the local `finara-theme` key is the clone's own
  storage mechanism and was null on the live at both ends).

## §A Context

Round 25 continues from the pushed round-24 state (remote main @
`6861af8`). The sandbox had been reset again — a fresh HTTPS re-clone,
`bun install` (597 packages), `cp .env.example .env`, `bun run db:push`
(the repo-root `db/custom.db` re-created through the round-21 db-path
contract), and the known `DATABASE_URL` shadow trap (the sandbox exports
an absolute `file:/home/z/my-project/db/custom.db` pointing outside the
repo) handled with `unset` on every server/gate invocation. The
Playwright chromium builds were at the wrong versions (1200/1243 vs the
1.62.1 runner's required 1234) — `bunx playwright install chromium`
rebuilt them before the E2E gate (the documented environment-lesson
class). The re-probe tooling was re-created fresh under
`/home/z/my-project/scripts/` (capture-surface.sh, capture-drawer.js,
diff-sigs.py, reparse.py) with evidence under
`/home/z/my-project/captures/r25/`.

The operating instructions were internalized (the uploaded coding-agent
prompt — audit then remediate, evidence-backed claims, TDD, no
guardrail weakening; the repo skills catalog — clone-app-pat-pro /
agent-browser / tdd / the Tailwind v4 pair; the scandihaven repo's
AGENTS/CLAUDE/PAD/SKILL re-read for the tech-stack patterns). The core
docs were re-read (AGENTS, CLAUDE, README, PAD v1.23,
financial-dashboard_SKILL.md, session_33, session_34, the round-24
plan, the Tailwind-V4-Validation-Report) and the codebase alignment
validated: 17 finara components + theme.ts, 17 pinned ui primitives,
18 unit files / 434 specs, 11 E2E spec files / 67 specs, 8 Prisma
models, 24 runtime dependencies, next 16.3.5 / prisma 6.19.2 /
tailwindcss 4.1.18 / eslint-config-next 16.3.5 installed — matching
the documented round-24 state exactly.

## §B Findings (all verified against the codebase 2026-09-23)

- **F1 — Zero parity drift** (verified, no action): the seventh
  consecutive zero-drift re-probe; every delta in the documented
  buckets on all 10 surfaces + the chrome raw orders + the HTTP layer.
- **F2 — Both operator focus areas clean** (verified, no action): the
  mobile navigation menu works end-to-end on both sides against the
  production build; no TailwindCSS v4 bug exists (bundle + cascade +
  dynamic-class scan + consumer colors all clean).
- **F3 — Production-readiness review clean on the code side**: no
  TODO/FIXME; `bun audit` = exactly the PAD §10 documented tail (43
  advisories — 30 high / 12 moderate / 1 low — ZERO in the 24-package
  runtime set); CI bytes marker-safe-verified clean (lint → typecheck →
  unit → build+E2E chain on push/PR to main); the installed framework
  versions match every doc claim; the seven round-24 doc fixes all
  hold (grep-verified: zero stray `task-management.git` / `16.1.3`
  outside historical records / `(378)` / `22-Round` references).
- **F4 — The round's remediation surface is the standard
  verification-round alignment set** (docs-only, the round-22/23/24
  precedent): the round-25 references in AGENTS (plans list), CLAUDE
  (ANALYZE pointer), README (parity-program row), PAD (v1.24 header +
  §10 round-25 row + verification paragraph), SKILL (last_updated +
  history-table row 25 + the Appendix B header 24 → 25-Round), the
  session log (session_35), and the date-relative screenshot refresh.
  No code changes — the 434 + 67 executable contracts stand unmodified
  as the verification record.

## §C Affected surfaces

- `docs/plans/2026-09-23-parity-remediation-round25.md` (this plan) —
  the plan + §G execution record.
- `docs/screenshots/` — the refreshed dev-server captures (login + 9
  views + the mobile drawer, full-page; date-relative surfaces
  refresh, deterministic surfaces expected byte-identical per the
  round-22/23/24 signature).
- `AGENTS.md` — the plans-list round-25 entry.
- `CLAUDE.md` — the ANALYZE round-25 pointer.
- `README.md` — the parity-program row (24 → 25 rounds).
- `Project_Architecture_Document.md` — the v1.24 header + the §10
  round-25 verification row + the verification paragraph.
- `financial-dashboard_SKILL.md` — `last_updated` + the history-table
  row 25 + the Appendix B header (the 25-Round Parity History).
- `docs/session_35.md` — the round-25 session log.
- **No source files change** — the app code is contract-pinned and
  drift-free; the 434 + 67 executable contracts are the verification
  record.

## §D Execution order

1. The E2E gate in the foreground (`bun run test:e2e` — build + 67
   specs; browser sessions closed first per the round-20 memory
   lesson; chromium 1234 pre-rebuilt).
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
numbers must equal the actual counts: 434 unit, 67 E2E, 8 models, 25
rounds). The 434 unit + 67 E2E executable contracts stand unmodified
as the verification record. Any future live drift that surfaces in
round 26+ resumes the red → green discipline (per the round-22/23/24
§E precedent).

## §F Verification plan

- Gates: `bun run lint` (exit 0) · `bun run typecheck` (exit 0) ·
  `bun run test` (434/434) · `bun run test:e2e` (67/67, foreground) ·
  `bun run build` (clean) — before the push.
- Doc-fix validation: every round-25 reference grep-verified (the
  plans-list entry, the ANALYZE pointer, the README row, the PAD
  header/§10 row, the SKILL history row + Appendix header, the session
  log present).
- Parity evidence: the signature-multiset diffs with every delta
  classified (the capture set under `/home/z/my-project/captures/r25/`
  — outside the repo, per convention); the mobile drawer 71/71
  structural diff; the Tailwind bundle/cascade checks; the HTTP
  header/head probes; the interactive sweep probes.
- Push contract: gates green → `python3 docs/ssh_git_wrapper_v3.py
  --key-file <path outside repo> --remote
  git@github.com:nordeim/financial-dashboard.git` (dry-run then real;
  remote ref == HEAD; key shredded).

## §G Execution record (2026-09-23)

Executed in plan order:

1. **Environment bootstrap** — the sandbox had been reset: HTTPS
   re-clone to `6861af8`, `bun install` (597 packages, 6.9s), `cp
   .env.example .env`, `bun run db:push` (the repo-root `db/custom.db`
   re-created through the round-21 db-path contract), `DATABASE_URL`
   shadow confirmed active and unset on every invocation, chromium
   1234 rebuilt (`bunx playwright install chromium` — the documented
   1–2ms-per-spec red-run prevention).
2. **Baseline gates** — lint 0 · tsc 0 · unit 434/434 (3.2s) · build
   clean.
3. **The live re-probe** (agent-browser isolated `live`/`clone`
   sessions; the clone side against the production build on :3000 with
   the repo-local DB; both sides theme-matched dark): the full
   10-surface signature-multiset diff + both focus areas + the
   raw-order chrome probes + the HTTP audit + the interactive sweep.
   Verdict: the live UNCHANGED — the SEVENTH consecutive zero-drift
   round (19–25). The probe re-authenticated once mid-session (both
   sessions dropped to /login after a browser restart — re-login
   clean, theme re-matched; the live theme state verified DARK before
   and after, left as found).
4. **Production-readiness review** — TODO/FIXME clean; `bun audit` =
   exactly the PAD §10 tail (43: 30h/12m/1l, zero runtime); CI bytes
   marker-safe-verified clean (all six needles + YAML parse); the
   installed versions match every doc claim; the round-24 fixes
   grep-verified holding. **The remediation surface: the standard
   verification-round alignment set (F4).**
5. **The E2E gate** — run in the foreground after closing the probe
   browser sessions.
6. **The screenshot refresh** — dev-server captures on :3000
   (repo-local DB, `DATABASE_URL` unset, full-page): login (sign-out
   state) + the 9 views + the mobile drawer.
7. **The docs alignment pass** — AGENTS (the plans-list round-25
   entry), CLAUDE (the ANALYZE round-25 pointer), README (the
   parity-program row 24 → 25 rounds), PAD v1.24 (the header + the
   §10 round-25 row + the verification paragraph), SKILL
   (last_updated + the history-table row 25 + the Appendix B header →
   the 25-Round Parity History), session_35.
8. **Final gates re-verified at close** — lint 0 · tsc 0 · unit
   434/434 · E2E 67/67 (step 5) · build clean.

Round 25 complete — the live re-verified at zero drift on every probed
layer for the seventh consecutive round with both operator focus areas
explicitly cleared (the mobile navigation menu works on both sides
against the production build; no TailwindCSS v4 bug exists). No source
files changed — the existing 434 + 67 executable contracts remain the
verification record. Standing lessons reaffirmed: run the E2E gate in
the foreground; a version-mismatched chromium build is an environment
issue, never a regression; probe slow live APIs with content-aware
waits; assert on bytes with marker-safe needle construction; and leave
the live account's theme state as you found it.
