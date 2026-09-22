I've internalized the coding agent instructions. This is a comprehensive web development remediation task (Mode C→A/B: audit, then remediate). Let me set up a structured plan and begin.
工作区已被重置（没有 financial-dashboard 代码）。让我克隆这两个仓库并检查环境。
Both repos cloned. Now let me review the key documentation files.
Now let me review the session logs and round-20 plan.
I now have a solid understanding of rounds history. My task is essentially **Round 21**. Let me validate the codebase structure against the documented state.
Codebase matches the documented round-20 state exactly (17 finara components + theme.ts, 17 pinned ui primitives, 24 runtime deps, 17 unit test files, 11 E2E spec files). Now let me review the skills catalog.
Let me review the key skills the user pointed to: Tailwind v4 skills, agent-browser, tdd, and the distill skills.
Now let me examine the mobile navigation implementation in the codebase — the user's specific concern.
The mobile drawer uses `entranceStyle(0, "fin-drawer-in")` — a potential dynamic-class Tailwind v4 issue. Let me inspect `ui-bits.tsx` and `globals.css`.
The CSS keyframes are properly defined. Now let me set up the environment per the user's instructions (`.env` with `DATABASE_URL="file:../db/custom.db"`, db/ at repo root).
**Finding #1 (doc/env drift):** The `.env.example` references `src/lib/db-path.ts`, `tests/db-path.test.ts`, `docs/DEPLOYMENT.md`, and a `db:seed` script — none of which exist. Let me check how the DB path is actually resolved.
The last commit (`9f0882c` by a different author) pre-documented work that doesn't exist yet: `src/lib/db-path.ts`, `tests/db-path.test.ts`, `docs/DEPLOYMENT.md`. This aligns with the user's instruction to "change the relevant code files to reference the database in the right folder." Let me check the environment shadow-trap mentioned in session logs, then set up.
Confirmed: the sandbox exports `DATABASE_URL=file:/home/z/my-project/db/custom.db` (the shadow trap from session_26). Now let me set up the repo environment and create the worklog.
CLI resolves correctly to repo-root `db/custom.db`. Now let me run the baseline gates.
Baseline gates green (lint 0 · tsc 0 · 428/428) — matches documented round-20 state. Now let me empirically test the runtime DB-path resolution with the relative URL.
The empty 0-byte DB is from my test sequence (I deleted the pushed DB). Let me restore and verify properly.
Runtime resolves correctly when CWD = repo root. The gap is CWD-independence (the phantom `db-path.ts`). Now let me stop the dev server and probe the live site — the standard round opener, with focus on the mobile nav menu.
Logged into the live app. Now the critical probe — **mobile navigation menu** on the live site.
Live drawer opens correctly. Let me capture its full anatomy and behavior.
Live mobile nav works perfectly (open → navigate → close, X swap). Now the same probes on the **clone** — where the suspected Tailwind v4 bug lives.
Clone drawer opens with matching anatomy. Let me test link-click navigation and console errors.
Dev-mode mobile nav works. The Tailwind v4 skill warns about **production-only** class disappearance — let me verify against a production build.
The mystery is solved — the extra ramp is Tailwind v4.1.18's own regenerated default palette; the unlayered v3-pin block correctly wins the cascade (runtime-verified `rgb(30,41,59)` = v3 `#1e293b`). Let me scan for dynamic class construction (the classic v4 purge bug).
No dynamic class construction — all classes are full literals through `cn()`. **Mobile nav + Tailwind v4 audit: clean in dev and production.** Let me check the remaining infrastructure (SSH wrapper, distill skill files) and probe a few more live surfaces for drift.
Let me check ssh/paramiko availability for the later push, then run the standard live-vs-clone drift check on the dashboard surface.
SSH push path is understood (needs paramiko + shim). Now the standard live-vs-clone drift check. Let me write the signature capture tooling.
The dashboard diff shows mostly data-bucket deltas (insights empty-state on live, row counts, chart SVG), but two chrome-level items need verification: the toaster viewport and SyncedBadge. Let me probe them directly.
The chrome elements are **byte-identical** — my earlier clone capture was at the mobile viewport (stale session state). Let me recapture both at desktop.
Found a real structural delta: **live has 2 toast viewports, clone has 1**. Let me investigate.
A precise delta: live renders a **nested double viewport**, clone renders **single viewport with `tabindex="-1"`**. Let me check the pinned primitive.
The double-viewport is a **documented round-4 by-design delta** (PAD §10). Let me verify the chart SVG deltas are data-only (grid config), then check the HTTP layer.
Chart/icon deltas classify as data-bucket. **Dashboard verdict: no non-bucketed drift.** Now the HTTP-layer audit (standard opener since round 17).
**HTTP 层：所有 round-17/18/19/20 的配置均完全一致（byte-exact）—— 线上环境自 round 20 以来未发生任何偏移（drift）。** 在进行修改之前，让我检查一下 CI 工作流并运行 E2E 基准测试。
**CRITICAL FINDING:** The CI workflow has corrupted trigger branches — `branches: ain]` instead of `branches: [main]`. Let me verify.
The YAML parses correctly (`branches: ['main']`) — the `ain]` was a terminal escape artifact. Let me confirm with raw bytes.
CI 文件正常（纯净的 `[main]` 字节 —— 之前是终端显示问题）。现在让我关闭浏览器会话（第 20 轮的经验教训），停止 :3000 服务，并运行 E2E 基准测试。
While E2E runs, let me validate the remediation plan against the codebase — checking all DATABASE_URL consumers and the .gitignore.
Prisma 6.19 supports `datasourceUrl` — clean wiring path. Let me check E2E progress and write the round-21 remediation plan.
All specs failing at 1-2ms — the webServer/browser-launch failure pattern. Let me find the root cause.
Root cause: the Playwright chromium binary is missing (workspace reset). Let me install it.
E2E is running clean. While it completes, let me write the round-21 remediation plan (the user's mandated planning step).
E2E baseline is passing (43/67 so far). Let me update my task list and begin the TDD RED phase.
**RED confirmed** — the new spec fails on the missing module, 428 existing tests untouched. Now GREEN: implement the resolver.
**GREEN: 434/434** (428 + 6 new). Let me check the E2E baseline and run the remaining gates.
E2E baseline: **67/67 green**. Now lint/typecheck/build with the new code.
Lint passes; typecheck has a weak-type issue (`ProcessEnv` vs my all-optional interface). Fixing with an index signature (no casts needed):
All gates green (lint 0 · tsc 0 · 434/434 · build clean). Now the runtime CWD-independence verification.
`bunx --cwd` syntax failed. Let me probe the subdirectory-CWD resolution directly with a node script.
**CWD-independence verified at runtime.** Let me verify the missing-env error path, then re-run E2E with the db.ts change.
Crisp error verified. While E2E runs, let me align `.env.example` (finding F2).
`.env.example` aligned with reality. Let me check E2E progress and begin docs alignment.
Now AGENTS.md — adding the db-path invariant and round-21 reference.
While E2E finishes (35/67 green), let me update the PAD.
E2E at 47/67 green. Let me write the session log and plan §G record.
E2E at 62/67. Now the major deliverable — `financial-dashboard_SKILL.md`. Let me gather precise facts from the codebase first.
Now writing the SKILL.md — a comprehensive distilled reference (in parts due to size).
**E2E: 67/67 passed with the db-path change.** All gates green. Now the screenshots deliverable.
All 11 screenshots captured. Quick integrity check, then stop the dev server and prepare commits.
The old screenshots were full-page captures (expenses.png was 1.6MB for the 96-row list). Let me retake with full-page mode to match the convention.
Full-page screenshots now match the established convention. Final cleanup and complete gate verification before commits.
All gates green. Now the atomic commits following the round convention (RED → GREEN → docs → SKILL).
All 4 atomic commits landed. Now the SSH push — following the runbook (key outside repo, paramiko shim, dry-run, push, shred).
Dry-run clean (fast-forward `9f0882c..896fa96`). Executing the real push.
**Push verified — remote main @ `896fa96` == local HEAD, key shredded.** Let me write the worklog and finalize.
**Round 21 complete and pushed — remote `main` @ `896fa96` (4 atomic commits), all gates green.**

**What the audit found:** the live Finara app is at **zero drift** on every layer. Your two focus areas came back clean: the **mobile navigation menu works perfectly** on both live and clone (byte-identical drawer anatomy, open→navigate→close, Menu↔X swap, zero console errors — verified in dev *and* production), and **no Tailwind v4 bug exists** — the production bundle carries every drawer utility + keyframe, and the v3 palette pin correctly beats v4.1.18's regenerated ramp.

**What was remediated:** the `.env.example`'s documented-but-missing **database-path contract** — `src/lib/db-path.ts` now resolves `DATABASE_URL="file:../db/custom.db"` CLI-equivalently and CWD-independently (TDD: 434/434 unit, 67/67 E2E), plus `.env.example` drift fixes, refreshed screenshots, PAD v1.20, and the new `financial-dashboard_SKILL.md`.

**Suggested next:** watch the CI run on `896fa96`, or launch Round 22 — keep the head audit in the opener, and remember to rebuild Playwright browsers after any workspace reset.
