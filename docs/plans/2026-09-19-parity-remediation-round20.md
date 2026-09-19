# Round-20 Remediation Plan — the dead-code & dependency-hygiene round

Date: 2026-09-19 · Scope: the standard full live re-probe (10-surface + login
signature-multiset diff in BOTH modes, the per-element style/motion audit,
the dialog/chooser/FAB/Progress/mobile structural probes, the VLM
side-by-side sweep) plus the HTTP-transport and document-metadata layer
audit (the round-17 lesson — the live head had changed three rounds in a
row before this one).

**The live app is UNCHANGED since round 19** — first zero-drift round for
the head since round 16. The body-DOM signature diff is BYTE-IDENTICAL to
the round-19 captures on 10 of 11 surfaces (both modes; Analytics differs
only by the live user's shrinking trend-line dot count — a pure data-bucket
delta: 18 `recharts-dot` circles + 3 wrapper groups), RAW == SORTED
everywhere, every structural probe matches its pin (the motion audit
settles at 19 again — the live user's data grew back; the Add Expense
modal, the FAB chooser, the Progress indeterminate mechanism, the mobile
top bar + drawer slide-in (−300px → +35.6px overshoot → settle), the
SyncedBadge base-only render, the sidebar raw orders, the user menu), and
the HTTP layer matches every round-17/18/19 pin byte-exact (the per-route
description template on all three metas, the login-only viewport/theme-
color/icon-pair/og-descriptor/twitter:image:alt, the dashboard-canonical
quirk, robots/sitemap, the security-header trio). The VLM sweep returned
5/5 EQUIVALENT (Expenses + Dashboard initially flagged on full-page
scaling artifacts — the clone's 96-row Expenses page is far taller, so the
scaled-down comparison reads as "narrower sidebar"; the viewport-only
re-comparisons returned EQUIVALENT, and the measured sidebar is exactly
256px on both sides).

Zero parity drift means round 20 pivots to the codebase's own
production-readiness gaps, exactly like round 15 did: **the scaffold's
dead-code tail** — 31 vendored-but-unused shadcn primitives and 34 dead
runtime dependencies — plus two doc-drift findings.

Evidence: `/home/z/my-project/captures/r20/` (outside the repo, per
convention) — sorted + raw signature captures for both sides, the
live-r19-vs-live-r20 drift diff, the per-view diff report, the structural
probe transcripts, the VLM sweep screenshots + verdicts, and the
HTTP-layer probe transcripts (per-route head dumps both sides, headers,
robots, sitemap, the description table across all 12 routes).

## §A Context

Rounds 2–19 drove the clone to verified body-DOM parity, transport-layer
parity, per-route head STRUCTURE parity, and per-route description parity.
The round-20 re-probe (2026-09-19, agent-browser isolated sessions,
production build on :3000 with the repo-local DB, both sides dark-themed)
found the live **unchanged on every layer**. The codebase's own gates
open green (lint 0 · tsc 0 · 392/392 unit · build clean), but a
dependency-and-inventory audit found the scaffold's dead tail still
shipping:

- **31 vendored-but-unused shadcn primitives** in `src/components/ui/` —
  the base44 scaffold shipped the full primitive library; the app renders
  only 17 of them. The dead 31 form a closed cluster (verified: zero
  imports from app code, zero imports from the pinned set, zero
  references in any unit or E2E spec; the only cross-references are
  within the dead cluster itself — `sidebar.tsx` imports
  `sheet`/`skeleton`/`tooltip`/`separator`, `toggle-group.tsx` imports
  `toggle`).
- **34 dead runtime dependencies** — 9 with zero imports anywhere
  (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`,
  `@hookform/resolvers`, `@tanstack/react-query` (the app uses the
  hand-rolled `use-api.ts` hook, not react-query), `@tanstack/react-table`,
  `date-fns` (dates go through the hand-rolled `date-format.ts`),
  `zod` (API validation is the hand-rolled `require*` guards in
  `src/lib/api.ts`), `zustand`) and 25 imported ONLY by the dead ui files
  (15 Radix primitives, `cmdk`, `embla-carousel-react`, `input-otp`,
  `next-themes`, `react-day-picker`, `react-hook-form`,
  `react-resizable-panels`, `sonner`, `vaul`).
- **Two doc-drift findings**: the AGENTS.md ADR-015 pinned-set list names
  `separator` but not `dialog` (the suite pins the reverse —
  `ui-primitives.test.tsx` covers `dialog`; `separator.tsx` is neither
  app-rendered nor test-referenced), and the README file-hierarchy says
  "App components (16)" (the finara directory carries 17 view/shell
  components plus the `theme.ts` store).

Round-15 precedent: when the live re-probe finds zero drift, the round
closes the codebase's own production-readiness gaps with the same TDD
discipline (that round removed seven advisory-carrying zero-import
dependencies and pinned the removal in `manifest-contracts.test.ts`).
Round 20 completes that sweep: everything the scaffold shipped that the
app never renders or imports goes, and the manifest contract grows to pin
it. Nothing app-rendered changes — the body DOM must stay byte-identical
(a pure infra round, like round 15).

## §B Findings (all verified against the codebase 2026-09-19)

**F1 — the 31-file vendored-but-unused primitive cluster.** Dead files:
`accordion, alert-dialog, aspect-ratio, avatar, breadcrumb, calendar,
carousel, chart, collapsible, command, context-menu, drawer, form,
hover-card, input-otp, menubar, navigation-menu, pagination, popover,
radio-group, resizable, sheet, sidebar, skeleton, slider, sonner,
textarea, toggle, toggle-group, tooltip` — plus `separator` (in the
AGENTS.md pinned list but neither app-rendered nor test-pinned; the
app-rendered `dropdown-menu.tsx` renders its separator through the
dropdown-menu package itself, not through `separator.tsx`). The app-
rendered set (17, all kept): `alert, badge, button, card, checkbox,
dialog, dropdown-menu, input, label, progress, scroll-area, select,
switch, table, tabs, toast, toaster`. Verification: for each dead file,
`rg "ui/<name>['\"]|\./<name>['\"]"` over `src/` + `e2e/` returns zero
references outside the dead cluster; the unit suite references only the
13 pinned primitives; the E2E suite references none.

**F2 — the 34 dead runtime dependencies.** Zero-import (9): `@dnd-kit/core`,
`@dnd-kit/sortable`, `@dnd-kit/utilities`, `@hookform/resolvers`,
`@tanstack/react-query`, `@tanstack/react-table`, `date-fns`, `zod`,
`zustand`. Dead-only importers (25): `@radix-ui/react-accordion`,
`@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`,
`@radix-ui/react-avatar`, `@radix-ui/react-collapsible`,
`@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`,
`@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`,
`@radix-ui/react-popover`, `@radix-ui/react-radio-group`,
`@radix-ui/react-separator`, `@radix-ui/react-slider`,
`@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`,
`@radix-ui/react-tooltip`, `cmdk`, `embla-carousel-react`, `input-otp`,
`next-themes`, `react-day-picker`, `react-hook-form`,
`react-resizable-panels`, `sonner`, `vaul`. Kept (verified used):
`prisma` (the five db:* scripts), `react-dom`, `sharp` (the round-15
manifest floor), `react-markdown` (AI coach), `recharts` (analytics),
`lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`,
the 11 app-rendered Radix primitives, `@prisma/client`,
`z-ai-web-dev-sdk`. Note: `@radix-ui/react-separator` remains in the
lockfile as a transitive dependency of `@radix-ui/react-dropdown-menu`
(the kept primitive) — the round removes the DIRECT declaration only, so
the removal pin for it checks `package.json`, not lockfile absence.

**F3 — doc drift.** (a) AGENTS.md's ADR-015 pinned-set enumeration names
`separator` and omits `dialog`; the suite pins the opposite. (b) README's
file hierarchy says "App components (16)"; the directory carries 17
components + `theme.ts` (the session logs have said 17 since round 13).

**Verified UNCHANGED (non-findings):** the live head on all 12 probed
routes (byte-exact vs the round-19 pins — the description template on the
8 view routes × all three metas, FULL text on `/`, `/Dashboard`, `/login`,
404s, the login-only viewport-fit/theme-color/sized-icon-pair/
og-descriptor/twitter:image:alt), the security headers (trio + no
X-Powered-By on the live; the clone's hardening pair), robots.txt (the
wildcard shape), sitemap.xml (the 9-URL set), the body DOM (byte-identical
to r19 on 10/11 surfaces, both modes; Analytics = chart-data dots only),
every structural probe (motion 19 settled, modal, chooser, Progress
translateX(−75.5%), the drawer −300px → +35.6px → settle, SyncedBadge
base-only, sidebar raw orders, user menu 2 items span-wrapped), and the
VLM sweep 5/5 (2 viewport-only re-comparisons cleared full-page scaling
artifacts). `bun audit` shows no NEW runtime advisories — the tail is the
accepted dev/CLI tooling set recorded in PAD §10.

## §C Affected surfaces

1. `src/components/ui/` — F1: the 31 dead files deleted; the directory
   ends at exactly the 17 app-rendered primitives.
2. `package.json` + `bun.lock` — F2: the 34 dead dependencies removed
   (`bun install` regenerates the lockfile).
3. `src/lib/__tests__/manifest-contracts.test.ts` — the round-20 RED
   specs: the extended banned set (7 + 34) and the new ui-inventory
   contract (`src/components/ui/` contains EXACTLY the 17 app-rendered
   files — no dead file returns, no live primitive is lost).
4. Docs: AGENTS.md (the ADR-015 pinned-set correction — `dialog` in,
   `separator` out with the dead-cluster note; the round-20 reference),
   CLAUDE.md (the round-20 ANALYZE reference + counts), README (the
   component count fix + the dependency-hygiene paragraph + counts), PAD
   v1.19 (§7 counts, §10 round-20 row, §11 the ui-inventory seam), this
   plan's §G, `docs/session_26.md`.
5. `docs/screenshots/` — refreshed dev-server captures of the remediated
   app (login + the 9 views + the mobile drawer).
6. `.env.example` — no new env vars; re-verified aligned.

## §D Execution order

1. RED: extend `src/lib/__tests__/manifest-contracts.test.ts` — the 34
   new package.json exclusions + the ui-inventory contract (the exact
   17-file set). Run the suite — expect exactly the round-20 specs red
   (the packages/files are still present), 392 passing.
2. GREEN: F1 (delete the 31 dead ui files) → F2 (`bun remove` the 34
   packages / edit package.json + `bun install`) → re-run the suite.
3. Gates: `bun run lint` · `bun run typecheck` · `bun run test`
   (392 + the round-20 specs) · `bun run build`.
4. Post-fix verification: rebuild + restart the production server; re-run
   the body-DOM signature diff on the clone (Dashboard root + Goals, both
   modes) — must be BYTE-IDENTICAL to the pre-fix captures (nothing
   app-rendered changed); re-curl the per-route head on /Goals + /login
   (the round-18/19 pins must hold); `bun audit` re-run (the runtime set
   stays clean; the tail may shrink).
5. E2E gate: `bun run test:e2e` (67 specs — the full pre-push contract).
6. Screenshots: dev server on :3000, login + 9 views + mobile drawer →
   `docs/screenshots/`.
7. Docs (§C.4) + atomic commits + push (SSH wrapper, main only).

## §E TDD plan

Red → green per finding. The spec changes (all in
`src/lib/__tests__/manifest-contracts.test.ts`):

- **The extended banned set**: each of the 34 dead packages is excluded
  from `package.json` `dependencies` (the round-15 pattern —
  `it.each(banned)("dependencies excludes %s")`). The lockfile-absence
  check applies to the packages that are NOT transitive dependencies of
  kept packages (all except `@radix-ui/react-separator`, which stays in
  the tree via `@radix-ui/react-dropdown-menu`; its pin is the
  package.json exclusion only — verified empirically after the removal).
- **The ui-inventory contract (NEW)**: reading `src/components/ui/` yields
  EXACTLY the 17 app-rendered file names — pins both directions (no dead
  primitive returns, no live primitive is lost) and replaces the
  per-file absence checks as the durable guard.
- The round-15 pins that hold (the next/eslint-config-next/sharp floors,
  the original seven-package ban + lockfile absence) stay unchanged.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit green (392 + the round-20 specs) ·
  build exits 0 · E2E 67/67.
- Body-DOM regression check: the clone signature diff pre-fix vs
  post-fix is BYTE-IDENTICAL (Dashboard root + Goals, both modes) — the
  round must not move anything app-rendered.
- HTTP-layer re-probe on the fresh build (curl): /Goals + /login render
  the round-18/19 pins (the description template, the login-only
  viewport/theme-color/icon pair/og descriptor/twitter:image:alt).
- Dependency verification: `bun install` clean, `bun pm ls` shows no
  direct resolution of the removed set (separator stays transitive),
  `bun audit` runtime posture unchanged.
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-19)

Both findings remediated red → green in plan order; every gate green.

**RED:** the round-20 specs in `src/lib/__tests__/manifest-contracts.test.ts`
failed exactly as designed — 36 failing (the 34 package.json exclusions, the
lockfile-absence table, the ui-inventory contract), 392 passing (every
existing contract untouched).

**GREEN (per finding):** F1 — the 31 dead ui files deleted
(`src/components/ui/` ends at exactly the 17 app-rendered primitives);
F2 — `bun remove` on the 34 packages (157ms, lockfile regenerated). One
empirical correction during GREEN: the lockfile-absence table was drafted
conservatively (excluding `@radix-ui/react-separator` on the assumption
that the kept dropdown-menu primitive depends on it transitively) —
verification showed it FULLY left the tree (the vendored dropdown-menu
renders its `DropdownMenuSeparator` through the dropdown-menu package
itself, importing only `@radix-ui/react-dropdown-menu`), so the spec was
tightened to include it before the final suite run.

**Post-fix verification (fresh production build, repo-local DB):**
- Body-DOM regression check: the clone signature diff pre-fix vs post-fix
  is BYTE-IDENTICAL (525/525 on the Dashboard root, 525/525 on
  /Dashboard, 268/268 on Goals, both modes) — the round moved nothing
  app-rendered (a pure infra round, as designed).
- HTTP-layer re-probe on the fresh build: /Goals renders the
  round-19 description template on all three description metas
  byte-identical to the live; /login carries theme-color #000000 +
  viewport-fit=cover + the sized icon pair + og:image:alt +
  twitter:image:alt "Base44 link preview" — every round-17/18/19 pin
  holds.
- Dependency verification: the runtime set is 24 packages (from 58), every
  one imported by app code; `bun audit` unchanged (43 findings, 0
  critical — the accepted dev/CLI tooling tail; the removed packages
  carried no runtime advisories).

**E2E incident + recovery:** the first E2E attempt failed massively (specs
failing at 1-2ms across all files) — NOT a code regression: the round-20
probe phase had left ~66 chromium processes across seven agent-browser
sessions (live, live-logout, clone, clone-logout, clone2, e2eprobe…)
alive, exhausting the sandbox's process/memory budget so the Playwright
browser contexts could not launch (the same class of environment failure
as round-19's missing chromium build). All sessions closed, memory freed
(1.8Gi → 430Mi used), and the re-run went green.

**Gates (final):** lint 0 · tsc 0 · unit 428/428 (392 + 36 net-new) ·
build clean · E2E 67/67 (on the clean re-run).

**Deliverables:** AGENTS/CLAUDE/README/PAD v1.19 aligned (the ADR-015
pinned-set correction — `dialog` in, `separator` out with the dead-cluster
note; the round-20 references; counts 392 → 428; the README component
count 16 → 17 + theme store and the stale `__tests__` 311 → 428; the
Security § dependency-posture extension; PAD §7 per-file counts
refreshed + site-metadata finally listed; §10 the round-20 resolved row;
§11 the manifest-contracts seam entry); `docs/screenshots/` refreshed
(dev server: login + the 9 views + the mobile drawer); this plan's §G;
`docs/session_26.md`. `.env.example` re-verified aligned (no new env
vars).
