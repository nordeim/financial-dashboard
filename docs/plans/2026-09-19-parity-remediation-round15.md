# Round-15 Remediation Plan — security-upgrade + migration-baseline round

Date: 2026-09-19 · Scope: the round opened with the standard full live
re-probe (9-view + login signature-multiset diff both directions, style-
attribute/motion audit, dialog/chooser/FAB/Progress/Analytics/mobile probes).
**The live app is UNCHANGED since round 14 — every delta classifies into the
documented buckets (seed-data counts, lucide internals, the insight empty
state, the demo-credentials affordance, the CSS-replication animation
properties), and every structural probe matches the round-14 pins exactly.**
Visual parity holds; no live drift to remediate. The round therefore pivots
to the codebase's own production-readiness gaps: a dependency-security audit
(`bun audit`) surfaced two CRITICAL runtime advisories in the framework, and
the PAD §10 backlog carries the open MEDIUM "no Prisma migration history"
item. This round closes both.

Evidence: `/home/z/my-project/captures/r15/` (outside the repo, per
convention).

## §A Context

Rounds 2–14 drove the clone to verified parity with the live app. The
round-15 re-probe (2026-09-19, agent-browser isolated sessions, production
build on :3000) confirmed:

- The signature-multiset diff is semantically IDENTICAL to the round-14
  post-fix baseline (per-view differing-signature counts 52/25/26/26/18/0/3/
  34/3 — byte-for-byte the same delta sets after normalizing report
  formatting). No new live-side or clone-side structural delta.
- The motion audit: the live's Dashboard carries 19 settled motion elements
  (unchanged map); the clone's 27 is fully data-explained (3 budget rows vs
  1 → +4, 6 activity rows vs 2 → +4; 19+8=27) with the documented
  CSS-replication `animation` property as the only per-element delta.
- Dialog overlay/card/DIV-title, FAB chooser (overlay/wrapper/card/header/
  close/options), Progress indeterminate mechanism, Analytics controls, and
  mobile chrome all probe live-exact.

With parity holding, the audit pass found the genuine gaps:

1. **`bun audit`: 90 advisories (3 critical, 48 high, 34 moderate, 5 low).**
   The runtime-relevant subset (direct `dependencies`, shipped to the
   server/browser):
   - `next` 16.1.3 — **CRITICAL** GHSA-2xp9-vwfh-vxw4 (unauthenticated RCE
     in the Image Optimization API when AVIF files are used) and GHSA-
     p293-qw3h-jr36 (unauthenticated RCE on windows-hosted servers), plus
     MODERATE GHSA-955p-x3mx-jcvp (unauthenticated disclosure of internal
     Server Function endpoints). Fixed in 16.2.5+.
   - `sharp` ^0.34.3 — **HIGH** GHSA-f88m-g3jw-g9cj (inherited libvips
     CVE-2026-33327/33328/35590/35591). Fixed in 0.35.0+.
   - `next-auth` ^4.24.11 (unused — zero imports in src) — **CRITICAL**
     GHSA-7rqj-j65f-68wh (email-normalizer homoglyph bypass) + HIGH
     GHSA-xmf8-cvqr-rfgj (getToken() uncaught exception). Fixed in 4.24.15.
   - `next-intl` ^4.3.4 (unused) — 2 MODERATE (open redirect; prototype
     pollution with precompiled messages). Fixed in 4.9.1+.
   - `uuid` (transitive via next-auth; also a direct dep, unused) —
     MODERATE GHSA-w5hq-g745-h8pq.
   - `framer-motion` ^12.23.2 — no advisory, but the manifest contradicts
     the documented repo policy ("No framer-motion dependency — do not add
     one", AGENTS.md motion-system invariant). Zero imports in src
     (round-14 CSS-replicated the motion system precisely so the dependency
     is not needed).
   The remaining ~80 advisories are ALL in dev-time transitive trees
   (eslint/babel/browserslist/picomatch/ajv/js-yaml/lodash chains) — never
   shipped to the server or browser runtime.
2. **No Prisma migration history** (PAD §10 MEDIUM, Open): the schema is
   managed exclusively via `prisma db push` (declarative sync). Schema
   evolution on live data is unsafe with db:push (it can silently
   accept-data-loss). The `db:migrate`/`db:reset` scripts exist but have no
   `prisma/migrations` directory to operate on.

## §B Findings (all verified 2026-09-19)

**F1 — `next` critical RCEs (CRITICAL, runtime).** next 16.1.3 < 16.2.5
carries two unauthenticated-RCE advisories and one moderate disclosure.
Upgrade path: **16.3.5** (the current `latest` dist-tag), not the 16.2
security line — because next@16.2.x's own optionalDependency pins
`sharp ^0.34.5` (still inside the vulnerable range), so a 16.2.x + sharp
0.35 combination would nest a second, vulnerable sharp copy under next.
next@16.3.5 pairs with `sharp ^0.35.4` natively. Peer deps verified
compatible: react 19.2.3 (^19.0.0 ✓), @playwright/test 1.62.1 (^1.51.1 ✓).
`eslint-config-next` bumps in lockstep (16.3.5) — the lint rule set may
change across the minor; any new error is a genuine finding to fix forward,
never a guardrail to loosen.

**F2 — `sharp` high (HIGH, runtime).** Direct dep ^0.34.3 → **^0.35.4**,
aligning with next@16.3.5's own range so a single hoisted copy serves both
(no nested duplicate).

**F3 — unused advisory-carrying dependencies (HIGH, hygiene + security).**
`next-auth`, `next-intl`, `framer-motion`, `uuid` have ZERO imports across
src/ (including the vendored ui primitives), e2e/, prisma/, and config
files; no NEXTAUTH_* env vars; `.env.example` carries only DATABASE_URL.
Remove all four from `dependencies`. This kills their advisory trees at the
root (next-auth's critical/high; next-intl's moderates; uuid's moderate via
the next-auth tree) and aligns the manifest with the documented
no-framer-motion policy.

**F4 — Prisma migration baseline (MEDIUM, PAD §10).** Adopt
`prisma/migrations` with a baseline migration generated from the current
schema (`prisma migrate diff --from-empty --to-schema-datamodel`), plus
`migration_lock.toml` (provider sqlite). The dev and E2E workflows stay on
`db:push` (declarative sync is correct for disposable dev/hermetic DBs —
the Playwright webServer resets db/e2e.db with it; CI runs the same chain).
Production deploys gain the safe path: `bun run db:deploy` →
`prisma migrate deploy`. Verification: apply the baseline to a scratch DB
via migrate deploy, then run `prisma db push` against it and confirm
zero pending changes (proves baseline ≡ schema).

**F5 — dev-tooling advisory tail (LOW, documented acceptance).** The ~80
remaining advisories live exclusively in dev-time transitive trees. A
wholesale `bun update` would churn the lockfile and risk the toolchain for
zero runtime exposure. Documented as accepted dev-only risk in the PAD §10
with the re-audit evidence (runtime criticals/highs = 0 after this round).

## §C Affected surfaces

1. `package.json` + `bun.lock` (via `bun add` / `bun remove` — never
   hand-edited; committed atomically since CI installs
   `--frozen-lockfile`).
2. `prisma/migrations/migration_lock.toml` + `prisma/migrations/
   20260919000000_init/migration.sql` (new, generated).
3. `src/lib/__tests__/manifest-contracts.test.ts` (new) — the dependency
   contract: next ≥ 16.2.5 (advisory floor), eslint-config-next major.minor
   == next major.minor (lockstep), sharp ≥ 0.35.0, the banned-dependency
   set (next-auth/next-intl/framer-motion/uuid) absent from dependencies
   AND from bun.lock resolutions.
4. `src/lib/__tests__/migrations-baseline.test.ts` (new) — the baseline
   contract: migration_lock.toml provider sqlite; the init migration.sql
   exists; every `model` in schema.prisma has its CREATE TABLE in the
   baseline (a new model without a migration fails the spec — the drift
   guard the PAD item asked for).
5. Docs: AGENTS.md (dependency-hygiene invariant, migration-baseline
   invariant, round-15 reference, counts), CLAUDE.md (round-15 ANALYZE/VERIFY
   references, counts), README (security/hygiene row, counts), PAD v1.14
   (§10 rows: the migration item Resolved, the round-15 row, the dev-tooling
   acceptance note), this plan's §G, `docs/session_16.md`.

## §D Execution order

1. RED: write both new spec files; run the suite — expect exactly the new
   manifest/baseline specs red (next version floor, sharp floor, banned
   deps present, migrations absent), everything else green.
2. GREEN: `bun add next@16.3.5 eslint-config-next@16.3.5 sharp@^0.35.4` →
   `bun remove next-auth next-intl framer-motion uuid` → `bun install`
   (lockfile settles) → generate the migration baseline + lock file →
   `npm pkg set scripts.db:deploy="prisma migrate deploy"`.
3. Gates: `bun run lint` (watch for new eslint-config-next 16.3 rules —
   fix forward, never suppress) · `bun run typecheck` · `bun run test`
   (334 + the new specs) · `bun run build` · `bun run test:e2e` (67 — the
   critical end-to-end validation of the framework bump).
4. Post-upgrade runtime verification: restart the production server on the
   fresh build, re-run the signature spot-check against the round-15 live
   captures (proves the framework bump introduced zero rendering delta),
   plus the chooser/dialog spot probes.
5. `bun audit` re-run — confirm 0 critical/high in the runtime dependency
   set; record the dev-only tail counts for the PAD.
6. Baseline verification: scratch-DB migrate deploy → db push reports no
   changes → delete the scratch DB.
7. Docs + atomic commits + push (SSH wrapper, main only).

## §E TDD plan

Red → green per finding: F1/F2/F3 manifest specs (red on current manifest)
→ F4 baseline specs (red on missing migrations) → dependency changes +
baseline generation (green) → full gate → browser re-verification. The
regression tests then guard the invariants permanently: a future
`bun add` of a banned package, a next bump that skips eslint-config-next,
or a schema edit without a migration all fail the unit gate.

## §F Verification plan

- Gates: lint 0 · tsc 0 · unit (334 + new specs) all green · build exits 0
  · E2E 67/67 on the upgraded framework (two consecutive runs if any
  flake appears — treat any red as a regression per CLAUDE.md).
- `bun audit`: zero critical/high reachable from `dependencies`; the
  remaining advisories classified dev-only with counts recorded.
- Migration baseline: `migrate deploy` on a scratch DB succeeds; `db push`
  on the migrated DB reports "already in sync" (baseline ≡ schema).
- Browser: production server on the new build; the signature spot-check
  vs the r15 live captures shows the same documented-bucket deltas only
  (no new delta from the upgrade).
- Push contract: wrapper dry-run then real push; remote ref == HEAD.

## §G Execution record (2026-09-19)

All findings remediated red→green in plan order; every gate green.

**F1 — next 16.1.3 → 16.3.5 + eslint-config-next 16.3.5 (lockstep).** The
16.2 security line was considered and rejected: next@16.2.x's own
optionalDependency pins `sharp ^0.34.5` (inside the vulnerable range), so
16.2 + direct sharp 0.35 would nest a second, vulnerable sharp copy under
next; next@16.3.5 (the current `latest` dist-tag) pairs with `^0.35.4`
natively. Peer deps verified compatible before the bump (react 19.2.3,
@playwright/test 1.62.1). Post-upgrade: lint 0 (no new eslint-config-next
16.3 rule errors), tsc 0, build clean, E2E 67/67, and the rendered DOM is
BYTE-IDENTICAL across all 9 views (the post-upgrade signature captures
match the pre-upgrade files byte-for-byte; the live-vs-clone diff totals
are unchanged — only-live=15, only-clone=28, all documented buckets).

**F2 — sharp ^0.34.3 → ^0.35.4.** Aligned with next@16.3.5's own range —
a single hoisted copy, no nested duplicate.

**F3 — seven unused dependencies removed.** The planned four (next-auth,
next-intl, framer-motion, uuid — zero imports, no config references, the
manifest now matches the documented no-framer-motion policy) plus a
follow-on find from the audit trace: `@mdxeditor/editor`,
`react-syntax-highlighter`, and `@reactuses/core` — same class (unused
direct deps, zero imports) whose transitive trees carried advisories
(prismjs/lexical via mdxeditor, js-cookie via @reactuses). Removal verified
safe: tsc 0 (nothing imports them), lint 0, E2E 67/67.

**F4 — the migration baseline.** `prisma/migrations/
20260919000000_init/migration.sql` (8 CREATE TABLEs, 105 lines) generated
via `prisma migrate diff --from-empty --to-schema-datamodel`, plus
`migration_lock.toml` (provider sqlite), plus the `db:deploy` script
(`prisma migrate deploy`, added via `npm pkg set`). Verification:
`migrate deploy` applied the baseline to a scratch DB, then `db push`
against it reported "already in sync with the Prisma schema" — baseline ≡
schema. Dev and E2E workflows unchanged (db:push; the Playwright webServer
reset is untouched and CI runs the same chain).

**F5 — the audit tail, classified and documented.** `bun audit` after
remediation: **43 advisories (0 critical, 30 high, 12 moderate, 1 low)**
— down from 90 (3 critical, 48 high, 34 moderate, 5 low). Every remaining
finding lives in dev-time or CLI-time transitive trees: the eslint chain
(@babel/core, browserslist, picomatch, brace-expansion, minimatch), the
vitest/eslint tooling (ajv, js-yaml, lodash, nanoid, flatted, defu,
deepmerge-ts, diff), the tailwind build chain (postcss), and prisma's own
CLI tree (effect via @prisma/config — loaded only by the prisma CLI at
db push/generate time, never by @prisma/client at app runtime). None ship
to the browser or the served runtime. Accepted and recorded in the PAD
§10; a wholesale `bun update` would churn the lockfile for zero runtime
exposure.

**Gates (final):** lint 0 · tsc 0 · unit 348/348 (was 334; +14: 8
manifest-contracts + 3 migrations-baseline + 3 follow-on banned-list
extensions) · E2E 67/67 (twice — after the framework bump and again after
the removals) · build clean · `bun audit` 0 critical (runtime set clean).
Browser verification (production build on next 16.3.5): 9-view signature
captures byte-identical to the pre-upgrade build; the motion system intact
(27 motion elements, 21 with animation properties); the chooser opens with
the live-exact overlay + fin-overlay-in animation.

**Environment lesson (recorded in session_16):** the E2E gate OOM-crashed
Chromium (`browserContext.newPage: Target crashed`) while four
agent-browser Chromium instances from the live-probing phase were still
resident on the 4GB machine — the round-14 resource lesson now extended:
close probe sessions BEFORE the gate, not just dev servers.

Evidence: `/home/z/my-project/captures/r15/` (live + clone + clone-post
signature captures, the initial + post-upgrade diff reports, style-audit
dumps, dialog/chooser/FAB/Progress/Analytics probes, screenshots; the
audit transcripts).

