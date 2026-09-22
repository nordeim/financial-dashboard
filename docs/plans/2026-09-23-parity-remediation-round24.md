# Round-24 Remediation Plan — the sixth zero-drift verification round + documentation-debt alignment

Date: 2026-09-23 · Scope: the standard full live re-probe with the two
operator-mandated focus areas re-verified — the mobile navigation menu
(anatomical + behavioral, both sides, on the production build) and the
TailwindCSS v4 audit (production bundle + runtime cascade +
dynamic-class scan) — plus the focused interactive sweep
(FAB/Quick Add chooser/step-2/close-toggle chain), the HTTP-layer audit
(security headers, per-route description metas, login-only head pins,
the SPA-200 unknown-path quirk), the fresh-environment gate
verification, and the codebase production-readiness review (CI workflow
byte integrity via marker-safe needles, dependency advisories vs the
PAD §10 tail, TODO/FIXME scan). The production-readiness review found
**seven documentation-drift items** accumulated across the
verification rounds — this round's remediation targets (docs-only; the
app code is contract-pinned and drift-free).

**The live app is UNCHANGED since round 23** on every probed layer —
the SIXTH consecutive zero-drift round (19–24):

- **Body DOM** (signature-multiset diff, 10 surfaces): zero
  non-bucketed deltas. Every only-live/only-clone delta classifies into
  the documented buckets: the live user's dismissed-insights empty
  state (Brain `w-12` + "No insights available yet" + the `py-8
  text-center` container) vs the clone's three seeded insight records
  (insight rows, type badges, dismiss X buttons, blue callouts,
  confidence footers — all verified inside `.insight-row`), seed-data
  row/badge/icon counts (income 4v1, expenses 100v1, accounts 4v1,
  investments 8v1, goals 3v1, activity/budget rows, category/priority
  badge distributions), chart SVG data (path/line/polyline/polygon/
  circle/rect), theme-state icons (live dark → Sun; clone light →
  Moon), the live's duplicated toaster viewport, Next.js infra
  (route-announcer, boot scripts, the font-loader divs — live's Base44
  `@import` div vs clone's `inter_*_variable` divs, byte-verified),
  and the live's Base44 CDN Tailwind (no CSS variables on the live —
  utilities embed v3 hexes directly; consumer-element probes match
  byte-exact: the emerald logo `rgb(52, 211, 153)` on both sides).
- **One live-side data change since round 23** (classified, not
  structural): the live user's account population was captured
  mid-load as the accounts empty state on the first pass — a
  content-aware re-capture (wait for "Main Checking") showed the
  account card renders (1 account: Main Checking/Chase) and the diff
  settled into the clean seed-data pattern. No structural delta; the
  empty state itself remains unprobed live-side (data bucket).
- **Desktop chrome**: byte-identical — the FAB wrapper `fixed bottom-6
  right-6 z-50` with `tabindex="0"`, the sage `w-14 h-14 rounded-full
  bg-primary-sage hover:bg-primary-sage/90 shadow-xl` button with
  `plus w-6 h-6 text-white`, the ViewHeader structure, the mobile top
  bar (`w-8 h-8` theme toggle + `h-9 w-9` menu button, both
  `text-gray-700 dark:text-gray-300`), and the drawer chrome.
- **Mobile navigation — the operator's first explicit focus — VERIFIED
  WORKING on both sides and structurally byte-identical** (70/70 nodes,
  identical classed-element sequence; only SVG icon element-mix
  differences — the lucide-artifact bucket): the drawer (`lg:hidden
  fixed inset-0 z-40 bg-slate-800 dark:bg-gray-900`) opens, a nav-link
  click navigates AND unmounts the drawer, the Menu↔X glyph swaps both
  directions (`lucide-menu w-5 h-5` ↔ `lucide-x w-5 h-5`), the X
  button closes, and both sides render zero NEW console errors (the
  live carries only its documented Base44 artifacts: the 403
  app-state-check error and the cdn.tailwindcss.com production
  warning). Verified against the production build on both sides.
- **TailwindCSS v4 — the operator's second explicit focus — CLEAN**:
  the production CSS bundle (176 KB main chunk + 9 KB) carries
  `lg\:hidden`, `.bg-slate-800` with the raw `#1e293b` v3 hex,
  `.dark\:bg-gray-900`, all four `fin-*` keyframes
  (`fin-card-in`/`fin-overlay-in`/`fin-scale-in`/`fin-drawer-in`) with
  the `prefers-reduced-motion` gate, and `backdrop-filter`; the
  v4.1.18 regenerated ramp is present-but-overridden — three
  definitions per variable in the bundle (v4 oklch/lab, v4 hex, and
  the unlayered v3 pin), and the computed-style probes ON THE CSS
  VARIABLES return `#2563eb`/`#1e293b`/`#ef4444`/`#34d399`/`#4b5563`
  — the unlayered pin wins the cascade with zero oklch leaking; no
  dynamic class construction exists (the only template-literal
  className in the tree is layout.tsx's static `${inter.variable}`).
- **HTTP layer**: byte-exact vs every round-17→23 pin — the
  security-header trio (Referrer-Policy strict-origin-when-cross-origin,
  X-Content-Type-Options nosniff, HSTS max-age=31536000) + the
  hardening pair (X-Frame-Options DENY, Permissions-Policy
  camera=(), microphone=(), geolocation=()); the per-route description
  template on all three metas (verified on /Dashboard full + /Goals
  `Goals on Finara. …` in-browser after the SPA's client-side head
  update); the login-only viewport-fit=cover + theme-color #000000 +
  sized icon pair (icon sizes="any" + apple-touch-icon 180×180) +
  `twitter:image:alt "Base44 link preview"`; the per-route twitter:url
  + canonical; and the SPA-style HTTP 200 for unknown paths (both
  sides). Next's `initial-scale=1` vs the live's `1.0` remains the
  documented micro-delta.
- **Focused interactive sweep**: matched on both sides — the FAB
  (wrapper/sage button/plus glyph), the Quick Add chooser (overlay
  `fixed inset-0 bg-black/50 flex items-center justify-center p-4
  z-40`, title "Quick Add", subtitle "What would you like to add?",
  Add Income + Add Expense `w-full justify-start gap-3 h-12`), the
  step-2 form (the "Needs" default segmented tab, Back, Add
  disabled-until-filled), and the FAB acting as the close toggle.
- **The live user's theme state left as found (dark)** — verified
  before and after the probe (the round-23 Lesson 18 discipline).

## §A Context

Round 24 continues from the pushed round-23 state (remote main @
`a944ea9`). The sandbox had been reset again — a fresh HTTPS re-clone,
`bun install`, `cp .env.example .env`, `bun run db:push` (the repo-root
`db/custom.db` re-created through the round-21 db-path contract), and
the known `DATABASE_URL` shadow trap (the sandbox exports an absolute
`file:/home/z/my-project/db/custom.db` pointing outside the repo)
handled with `unset` on every server/gate invocation. The Playwright
chromium builds survived the reset; the round-22/23 note that the
re-probe tooling under `/home/z/my-project/scripts/` was wiped held
true — the capture/diff scripts were re-created fresh
(`capture-surface.sh`, `diff-sigs.py`, `diff-raw.py`,
`check-ci-bytes.py`) with evidence under `/home/z/my-project/captures/r24/`.

The operating instructions were internalized (the uploaded
coding-agent prompt — audit then remediate, evidence-backed claims,
TDD, no guardrail weakening; the repo skills catalog —
clone-app-pat-pro / agent-browser / tdd / the Tailwind v4 pair; the
scandihaven repo's tech-stack patterns re-read for context). The core
docs were re-read (AGENTS, CLAUDE, README, PAD v1.22,
financial-dashboard_SKILL.md, session_31, session_32, the round-22/23
plans) and the codebase alignment validated: 17 finara components +
theme.ts, 17 pinned ui primitives, 18 unit files / 434 specs, 11 E2E
spec files / 67 specs, 24 runtime dependencies — matching the
documented round-23 state exactly.

## §B Findings (all verified against the codebase 2026-09-23)

- **F1 — Zero parity drift** (verified, no action): the sixth
  consecutive zero-drift re-probe; every delta in the documented
  buckets on all 10 surfaces.
- **F2 — Both operator focus areas clean** (verified, no action): the
  mobile navigation menu works end-to-end on both sides against the
  production build; no TailwindCSS v4 bug exists (bundle + cascade +
  dynamic-class scan all clean).
- **F3 — Documentation drift: the git-push runbook references the
  WRONG REPO.** `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` was
  generalized from another project — five references to
  `git@github.com:nordeim/task-management.git` and the line-22 claim
  "no hosted CI on this repo (no `.github/workflows`)" are both wrong
  for THIS repo (the remote is `nordeim/financial-dashboard.git`; CI
  has existed since round 12). An agent following the runbook verbatim
  would push to the wrong remote. FIX: point every reference at the
  financial-dashboard remote and correct the CI claim to the real
  chain (CI runs the same gates; the local gate is its mirror).
- **F4 — Documentation drift: the Prisma model count is stale in
  three files.** README:112 says "7 models", SKILL:373 says "7
  models", PAD:298 + PAD:358 say "7 models" — the schema has had
  **8** since round 13 added `Insight` (PAD:807 already says 8
  correctly). FIX: 7 → 8 in all four places.
- **F5 — Documentation drift: the PAD §1.2 tech-table Next.js version
  is stale.** PAD:35 says "16.1.3"; round 15 upgraded to 16.3.5 (the
  PAD's own §10 round-15 row documents the upgrade). FIX: 16.1.3 →
  16.3.5 in the tech table. (The Prisma "6.19" claim is correct — the
  lockfile resolves 6.19.2.)
- **F6 — Documentation drift: the PAD §3.2 directory tree lists
  `tailwind.config.ts [legacy]`.** It was deleted in round 12 (the
  PAD's own §10 round-12 row documents the deletion). FIX: remove it
  from the tree (and `postcss.config.mjs` is verified present, so the
  tree line becomes `(eslint.config.mjs, tsconfig.json,
  postcss.config.mjs, components.json)`).
- **F7 — Documentation drift: the PAD §8.4 CI description cites
  `bun run test` (378).** The unit suite has been 434 since round 20
  (the PAD's own §7 says 434). FIX: 378 → 434.
- **F8 — Documentation drift: the PAD §11 glossary's
  monthly-equivalent entry is imprecise.** It reads "(biweekly ×26/12,
  weekly ×52/12, quarterly ÷3)" — omitting `annual ÷12` (in the live
  set) and presenting `quarterly` (a legacy-data guard per ADR-007 and
  `money.ts`'s own comment) as a live frequency. FIX: align the
  glossary with the ADR-007 wording (annual ÷12 in the live set;
  quarterly ÷3 and one-time → 0 as legacy guards).
- **F9 — Documentation drift: SKILL Appendix B header says "The
  22-Round Parity History" while the table lists rounds through 23.**
  FIX: "The 23-Round Parity History" (and the round-24 history row +
  last_updated join it in this round's alignment pass).
- **F10 — No code defects**: no TODO/FIXME in code; the CI bytes
  marker-safe-verified clean (with a fresh live re-demonstration of
  the ANSI artifact — the round-24 byte-check script's OWN printed
  label rendered `branches == ain]` while the boolean said PASS);
  `bun audit` reports exactly the PAD §10 documented tail (43
  advisories — 30 high / 12 moderate / 1 low — all in the dev/CLI
  transitive trees, ZERO in the 24-package runtime set); the
  `.env.example` round-21 alignment holds; screenshots present.

## §C Affected surfaces

- `docs/plans/2026-09-23-parity-remediation-round24.md` (this plan) —
  the plan + §G execution record.
- `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` — F3: the repo
  remote + CI claim.
- `README.md` — F4 (model count) + the parity-program row (23 → 24
  rounds).
- `financial-dashboard_SKILL.md` — F4 (model count) + F9 (Appendix B
  header) + the round-24 history row + `last_updated`.
- `Project_Architecture_Document.md` — F4 (×2), F5, F6, F7, F8 + the
  v1.23 header + the §10 round-24 verification row.
- `AGENTS.md` — the plans-list round-24 entry.
- `CLAUDE.md` — the ANALYZE round-24 pointer.
- `docs/session_33.md` — the round-24 session log.
- `docs/screenshots/` — the refreshed dev-server captures (login + 9
  views + the mobile drawer, full-page).
- **No source files change** — the app code is contract-pinned and
  drift-free; the 434 + 67 executable contracts are the verification
  record.

## §D Execution order

1. Documentation remediation (F3–F9): the runbook remote/CI fix, the
   model-count corrections, the PAD version/tree/count/glossary fixes,
   the SKILL Appendix header — each fix grep-verified against the
   codebase (the corrected claims must match the measured reality:
   `grep -c "^model " prisma/schema.prisma` = 8; the installed next =
   16.3.5; `bun run test` = 434).
2. The E2E gate in the foreground (67 specs; close lingering browser
   sessions first — the round-20 memory lesson).
3. The screenshot refresh from the dev server on :3000 (repo-local DB,
   `DATABASE_URL` unset; sign out first for the login capture;
   full-page captures).
4. The docs alignment pass (README/PAD v1.23/SKILL/AGENTS/CLAUDE
   round-24 references + session_33).
5. Final gates re-verified at close, then the atomic commits + the
   SSH-wrapper push to `main`.

## §E TDD plan

Not applicable — zero code changes. The remediation surface is
documentation-only; the "test" for each fix is the grep-verification
against the measured codebase state (the corrected number must equal
the actual count). The 434 unit + 67 E2E executable contracts stand
unmodified as the verification record. Any future live drift that
surfaces in round 25+ resumes the red → green discipline (per the
round-22/23 §E precedent).

## §F Verification plan

- Gates: `bun run lint` (exit 0) · `bun run typecheck` (exit 0) ·
  `bun run test` (434/434) · `bun run test:e2e` (67/67, foreground) ·
  `bun run build` (clean) — before the push.
- Doc-fix validation: every corrected claim grep-verified (8 models,
  16.3.5, 434, no `tailwind.config.ts` in the tree, no
  `task-management` references remaining, the glossary aligned with
  ADR-007).
- Parity evidence: the signature-multiset diffs (sorted + raw for the
  drawer) with every delta classified; the capture set under
  `/home/z/my-project/captures/r24/` (outside the repo, per
  convention).
- Push contract: gates green → `python3 docs/ssh_git_wrapper_v3.py
  --key-file <path outside repo> --remote
  git@github.com:nordeim/financial-dashboard.git` (dry-run then real;
  remote ref == HEAD; key shredded).

## §G Execution record (2026-09-23)

Executed in plan order, every step green:

1. **Environment bootstrap** — the sandbox had been reset: HTTPS
   re-clone to `a944ea9`, `bun install` (597 packages, 6.7s), `cp
   .env.example .env`, `bun run db:push` (the repo-root `db/custom.db`
   re-created through the round-21 db-path contract), `DATABASE_URL`
   shadow confirmed active and unset on every invocation. The re-probe
   tooling re-created fresh under `/home/z/my-project/scripts/`
   (capture-surface.sh, diff-sigs.py, diff-raw.py, check-ci-bytes.py,
   capture-screenshots.sh) with evidence under
   `/home/z/my-project/captures/r24/`.
2. **Baseline gates** — lint 0 · tsc 0 · unit 434/434 · build clean.
3. **The live re-probe** (agent-browser isolated `live`/`clone`
   sessions; the clone side against the production build on :3000
   with the repo-local DB): the full 10-surface signature-multiset
   diff with both focus areas layered on. Verdict: the live UNCHANGED
   — the SIXTH consecutive zero-drift round (19–24). Two probe-time
   false alarms chased to ground, both live-side data-timing, not
   drift: (a) the first live Investments capture landed on /login (a
   transient auth redirect — the session token was valid; the
   re-capture clean), and (b) the first live Accounts capture caught
   the empty state mid-load (the live API populated the account card
   after the 2s wait — a content-aware re-capture showed the
   Main Checking card and the diff settled into the seed-data
   pattern). The live theme state was verified dark before AND after
   the probe (left as found).
4. **Production-readiness review** — CI bytes clean (marker-safe
   needles + YAML parse; the ANSI artifact re-demonstrated inside the
   round's own script output labels — `branches == ain]` printed while
   the boolean said PASS); `bun audit` = exactly the PAD §10 tail (43
   advisories: 30 high / 12 moderate / 1 low, ZERO in the 24-package
   runtime set); no TODO/FIXME in code; `.env.example` aligned. **The
   review's remediation surface: the seven documentation-drift items
   (F3–F9).**
5. **Documentation remediation executed** — F3 the push-runbook
   (8 wrong-repo references → `financial-dashboard.git` + the CI claim
   corrected to the real chain); F4 the model counts (README ×1,
   SKILL ×1 + the wrong model names → the actual 8: Account,
   IncomeSource, Expense, Budget, Goal, Investment, Setting, Insight;
   PAD ×2); F5 the PAD tech-table 16.1.3 → 16.3.5; F6 the PAD
   directory tree's `tailwind.config.ts [legacy]` removed; F7 the PAD
   CI count 378 → 434; F8 the PAD glossary's monthly-equivalent entry
   aligned with ADR-007; F9 the SKILL Appendix B header → the 24-Round
   Parity History. Every fix grep-verified (zero `task-management`
   references, zero "7 models", zero "(378)", 8-model mentions in all
   three files, the 24-Round header ×2).
6. **The E2E gate** — first run RED at 1–2ms/spec: the documented
   round-19/21 environment-lesson class (the workspace reset left
   chromium 1200/1243 but @playwright/test 1.62.1 needs the 1234
   headless shell); `bunx playwright install chromium` rebuilt it; the
   re-run GREEN: **67/67 in 3.3 minutes** (zero flakes, zero console
   errors per the sweep specs).
7. **The screenshot refresh** — dev-server captures on :3000
   (repo-local DB, `DATABASE_URL` unset, full-page): login (sign-out
   state) + the 9 views + the mobile drawer. The first pass captured
   the login page 11 times (a snapshot-ref extraction bug in the
   capture script — the sign-in never fired); the script was fixed to
   semantic locators and the re-run captured the signed-in surfaces
   (dashboard 528K, expenses 1.5M with the full 96-row list, the
   mobile drawer 356K with the drawer open).
8. **The docs alignment pass** — AGENTS (the plans-list round-24
   entry), CLAUDE (the ANALYZE round-24 pointer), README (the
   parity-program row 23 → 24 rounds), PAD v1.23 (the header + the
   §10 round-24 row + the verification paragraph), SKILL
   (last_updated + the history-table row 24 + the Appendix B header).
9. **Final gates re-verified at close** — lint 0 · tsc 0 · unit
   434/434 · E2E 67/67 (step 6) · build clean (the E2E gate's own
   `next build`).

Round 24 complete — the live re-verified at zero drift on every
probed layer for the sixth consecutive round with both operator focus
areas explicitly cleared (the mobile navigation menu works on both
sides against the production build; no TailwindCSS v4 bug exists),
and the accumulated documentation debt remediated (seven fixes, each
grep-verified against the measured codebase state). No source files
changed — the existing 434 + 67 executable contracts remain the
verification record. Standing lessons reaffirmed: run the E2E gate in
the foreground; a 1–2ms-per-spec red run is a missing browser
executable, never a regression (re-verified this round at 1234 vs
1200/1243); probe with content-aware waits on slow live APIs; and
assert on bytes with marker-safe needle construction — the ANSI
artifact eats `[`-prefixed tokens in ANY output stream, including a
verification script's own printed labels.
