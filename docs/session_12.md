我将从上次会话中断的地方继续。让我先检查一下本地工作区的当前状态，并执行 `git pull` 刷新。
工作日志显示 Round 11 在上次会话中已完全交付并推送（远程 main @ 4031185）。当前消息是新一轮的指令。让我刷新工作空间并查看文档。
A new `docs/session_10.md` came in from the remote. Let me check the updated log and read the key documents.
第 11 轮之后有一个新的远程提交 `26290be` 添加了 `session_10.md`。让我阅读一下该提交以及核心文档。
Let me read session_10.md directly in chunks.
Round 11 is confirmed complete and pushed (remote main @ 4031185 + session log 26290be). This session is a **new parity round (Round 12)**. Per the standing instruction, let me review the core documents.
Lines are very long. Let me read the docs in smaller chunks.
Now CLAUDE.md and README.md:
Now README.md and the PAD's key sections (§10 backlog especially):
Now the PAD — let me check its structure and key sections:
PAD §10 reviewed — the top open items are the **Playwright E2E layer** (MEDIUM, planned) and unexercised corners. Let me review session_9.md and the round-11 plan:
我已经审阅了所有的核心文档。现在让我检查一下 `skills` 文件夹（按照既定指示），设置环境，并验证基准门禁。
该仓库的 `skills/` 文件夹包含 `playwright-cli`、`e2e-testing-lessons` 和 `testing-patterns` —— 这与建议的下一轮（E2E 层）高度相关。让我查看一下目录和这些技能：
The skills are informative. Now let me verify the environment baseline — check if Playwright can be installed in this sandbox, and the current dev environment state:
Playwright browser binaries are already cached (chromium-1200, chromium-1234). Let me check for a global Playwright install and network access:
The global playwright@1.62.1 maps to cached chromium-1234 — offline-capable. Let me check the repo's package.json and test network/bun install feasibility:
已吸收所有技能上下文。环境支持建议的下一轮：**第 12 轮 = Playwright E2E golden-path 层**（PAD §10 中等优先级事项，已被 session_9 和 session_10 同时推荐），以及 EUR/非美国日期导出在线探测（最后一个未探测的角落）、一个 CI 工作流（PAD §10 高优先级）以及 `tailwind.config.ts` 清理。让我来制定计划：
**Round 12 plan** — Quality-infrastructure round:
1. **Baseline gates** (confirm 270/270 state)
2. **Live probe**: EUR + non-US date formats on exports (last unprobed corner → feeds E2E export specs)
3. **Playwright E2E layer**: golden-path suite locking rounds 4–11 contracts (~12 spec files, hermetic e2e.db, production build on :3100)
4. **CI workflow** (PAD §10 HIGH) + `tailwind.config.ts` cleanup
5. Docs + atomic commits + push

Starting with the baseline — checking dev server and DB state:
Workspace is fresh (no DB, no server). Setting up the environment:
The DB resolved to `/home/z/my-project/db/custom.db` (parent dir) — the previous session's DB. Let me check the schema and this DB's state:
The dev DB from the previous session lives at `/home/z/my-project/db/custom.db` (CWD-relative resolution). Let me verify its state and run the baseline gates:
Pristine seed confirmed (96/4/4/3/8/3). Running baseline gates:
All four gates green (lint 0 · tsc 0 · 270/270 · build 0) — codebase matches the documented Round 11 state. Now the live probe. Let me load the agent-browser skill:
Let me start the dev server and study the clone's export implementation before probing the live app:
The documented Turbopack cache-corruption issue. Resetting `.next` and restarting per the known procedure:
开发服务器已启动。现在让我研究一下克隆项目的导出实现：
The clone's exports ignore settings entirely (ISO dates always). The probe question: does the LIVE export follow currency/dateFormat settings? Let me check the settings route and then probe the live app:
克隆项目在导出时会忽略设置。现在进行实际探测。正在打开实际应用：
Logged in. Let me check the current settings state (to restore later):
Defaults confirmed (USD / MM/dd/yyyy). Now let me patch XHR to capture the live export request (token + URL), then trigger the Analytics Export:
Navigation resets the patch (SPA — full nav reloads). Correct order: land first, then patch, then click Export:
The live builds the CSV **client-side** from 3 entity GETs (no server export endpoint). Let me capture the generated blob + filename via Blob/anchor patches:
Default-settings CSV captured — matches the clone exactly (ISO dates, microsecond timestamps, raw decimals, ISO filename date). Now switch live settings to EUR + dd/MM/yyyy:
Settings switched to EUR + dd/MM/yyyy. Now re-export from Analytics under the new settings:
**关键一致性判定**：在 EUR + dd/MM/yyyy 设置下，实时 CSV 与默认设置的导出在**字节上完全一致**（ISO 日期、原始小数、ISO 文件名）。现在进行 GDPR JSON 导出探测：
GDPR 导出也与设置无关（ISO 日期、原始小数、ISO 文件名）—— **克隆完全一致**。让我获取用于证据存档的完整 JSON，然后恢复线上设置：
Live GDPR shape matches the clone field-by-field. Restoring live settings to defaults (probe etiquette):
线上状态已完全恢复（USD/MM-dd-yyyy已持久化，主题未变 — 深色）。**F0 探测判定：实时导出与设置无关 → 克隆完全一致。** 现在让我研究一下 E2E 设计中的关键代码库文件：
在确定计划之前，让我检查一下剩下的一些部分——演示常量、用户菜单退出、AI 教练触发器：
All pieces mapped. Quick environment checks before writing the plan:
`tailwind.config.ts` is unreferenced (safe to delete). Now writing the Round 12 plan document:
Plan written. Now implementing — first, the config and helpers, then studying view DOM details for accurate selectors:
Now writing the Playwright config:
Now let me study the login form structure for precise selectors:
Now writing the E2E helpers:
Now the auth spec (route contracts from ADR-021):
Let me verify the 404 view and view headings before going further:
Headings confirmed. But there's a critical Playwright subtlety — SPA `replaceState`/`pushState` don't fire navigation events, so `waitForURL` may hang. Let me check the sign-in/sign-out navigation code:
Confirmed: SPA uses replaceState/pushState — I'll use UI markers + `expect.poll` instead of `waitForURL` for SPA transitions. Fixing the helpers:
Now updating the auth spec to use the same pattern:
Before writing all specs, let me validate the infrastructure with a smoke run. Adding package.json scripts first:
Chromium is cached. Let me stop the dev server (avoiding the known `.next` corruption issue), then smoke-run the auth spec:
CJS/ESM issue — the config is transpiled as CJS. Using `__dirname` directly:
7/8 passed — infrastructure works. One failure on the title assertion. Let me inspect:
Interesting — the E2E layer surfaced its first contract question: on an unauthenticated deep link, the clone renders the login form but **keeps the deep-link title** ("Goals | Finara"). Let me check the clone's redirect code and the live behavior:
The clone's redirect replaces the URL but never touches `document.title`. Is that live-exact? Probing the live with a fresh (logged-out) browser session:
**Real parity delta found!** Live title on unauth redirect = bare **"Finara"**, clone keeps "Goals | Finara". Let me also probe the live's direct /login title:
**Second delta**: live `/login` title is bare "Finara" — the clone's `Login | Finara` (routes.ts:58) is wrong. Let me check what round 8 actually pinned and verify the live 404 title while I'm here:
The round-8 plan itself documented `/login` title as **unprobed** — today's E2E run + live probe closes that gap: live renders bare **"Finara"**. Let me also verify the live 404 title to complete the contract:
404 while logged out just gates to login. Let me verify the authenticated 404 title with the main (logged-in) session:
Round-8's 404 pin confirmed live-exact. The complete title contract is now fully probed — the clone has **two title deltas on the login surface**. This is a genuine TDD fix. Let me find the existing route specs:
The route pins are in view-surfaces.test.ts (login title not value-pinned — the gap). This is a genuine TDD fix: **RED specs first**. Let me check for other references to the wrong title:
Writing the RED unit specs (round-12 section):
Now let me find the end of functional-parity.test.ts to append the round-12 section:
RED confirmed (3 new specs, 269 others green). Now the GREEN implementation:
272/272 GREEN, tsc OK — but lint crashed scanning the playwright-report artifacts. Adding them to eslint ignores:
Lint green. Updating the E2E auth spec to the live-exact title and re-running:
Build failed — let me see the error:
My render-time adjustment runs during SSR prerender (`document` undefined) — the authed bounce avoids this via the session guard. Adding the SSR guard:
Both failures share a root cause candidate: during hydration, `useSyncExternalStore` starts with the null **server snapshot** — my adjustment fires for authenticated visitors too (momentarily), triggering the authed /login bounce (explains the 404 failure). But the unauth title still not updating needs debugging. Let me test in a live browser against the dev server:
The known `.next` corruption (build clobbered dev's cache, as anticipated). Resetting:
已在开发环境中复现：登录表单渲染但标题从未更新。让我检查一下控制台，看看 React 是否在 hydration 期间拒绝了 render-time 的 `setState`：
没有报错 —— 静默失效。让我验证一下修改的位置，并检查 hydration-time 的 render-time setState 是否真正执行了：
The placement is correct. Let me instrument temporarily to see whether the branch fires at all:
该重载直接访问了 `/login`（URL 已被重定向）。正在测试全新深链接的情况：
**Root causes found** (two distinct issues):
1. **Title**: the App Router keeps `<title>` in the React tree — hydration resets any render-phase `document.title` write. Fix: sync the title from a **post-commit effect**.
2. **404 regression**: during hydration the render snapshot is always session-less, so my adjustment fired for authenticated visitors too → the authed /login bounce kicked in. Fix: check the **live session store** (`readSessionCache()`) — the same discipline the redirect effect documents.

Implementing both:
Updating the functional-parity pins to match the corrected implementation:
仍然是 "Goals | Finara" —— 让我测试一下 hydration 之后是否有东西在主动重写标题：
Manual writes stick — so it's a hydration-ordering race. Let me instrument the title effect to see which write is losing:
The effect fires ("Finara" written) but the **late `<title>` hydration overwrites it after**. Let me check what the live serves as raw HTML title (is per-route SSR title even a live behavior?):
The live also serves "Goals | Finara" in raw HTML — its client rewrite just wins (no tree-managed `<title>`). The clone needs a post-hydration re-assert. Let me test the macrotask approach:
The reset happens even after the macrotask — a late hydration segment owns it. Let me catch the exact moment with a MutationObserver:
等等——我一直在针对**开发模式**进行调试（它具有 `StrictMode` 双重效应和不同的 hydration 调度）。生产环境的行为可能会有所不同。在针对开发环境的异常行为进行过度设计之前，让我先直接测试生产构建：
Production behaves identically — a late writer runs after the first macrotask. Let me find its timing with a ladder probe:
The ladder started too late. Let me trap the writer directly — instrumenting a `document.title` setter trap at module load (before hydration) to capture the culprit's stack:
Transient next/font network failure. Retrying:
Only MY writes go through the `document.title` setter — the reset must be a direct **`<title>` textContent mutation** (React hydrating the node). Let me confirm with a MutationObserver installed at module load:
**Mechanism confirmed**: React hydrates the `<title>` node's textContent AFTER client effects — clobbering client title corrections. The deterministic fix: a MutationObserver-guarded title sync that restores the route title whenever an external write lands. Implementing the final version (and removing all debug instrumentation):
**"Finara"** — 修复已在生产环境生效！现在正通过 Playwright 运行完整的身份验证规范：
所有 8 个 auth 测试用例均已通过。现在让我来编写剩余的测试用例——首先研究 expenses view 的结构（最复杂）：
Wait — line 161 shows an "Amount must be greater than zero" toast, but round-11 verified negative expenses work. Let me check that validation logic:
Negative passes, only zero is blocked (the live's zero-validation, replicated in round-11). Now writing the expenses spec:
Now let me check the income/goals/accounts/investments dialog structures:
Writing the remaining CRUD spec files:
现在让我先检查一下 analytics 视图，然后再编写其 spec：
Now the import-export spec — checking the import flow structure first:
**Round-12 E2E finding**: the import route still rejects negative `amountMinor` (line 55) — a layer round-11's ADR-024 missed (the import route wasn't in its route list). Let me check the full picture:
Two ADR-024 violations in the import path (rows mode + finara-export restore). Let me check the existing test pins before fixing:
No existing pins — clean TDD fix. Writing RED specs for the import negative-amount relaxation:
RED confirmed. Now the GREEN fixes:
My test payload shape is wrong — let me check the normalizer's actual contract:
My spec bug — the normalizer returns arrays, not `{inserts}`. Fixing the spec:
274/274 GREEN. Now checking the import view's step-2 UI for the E2E flow:
Now writing the import-export spec with fixtures:
Now the settings/theme spec — checking the settings view toggles:
Critical ordering issue: specs that change settings (EUR/date-format) run before specs asserting `$` rendering (serial suite, shared DB). Adding settings restoration:
Now the dashboard, mobile, and console-sweep specs. Checking dashboard structures:
已编写全部 11 个 spec 文件（约 66 个 spec）。首先运行 lint + typecheck（e2e 文件现已包含在作用域内）：
Found it — I attached `.first()` to the `expect()` result instead of the locator. Let me find and fix all instances:
All green. Rebuilding and running the FULL E2E suite:
43 个通过，23 个失败 —— 正在系统地排查失败原因：
Multiple distinct failure groups. Let me inspect the page snapshots from the failing tests to see what actually rendered:
The expenses-list failures are my spec bugs (CardTitle renders a `div`, not a heading — visible in the snapshot). But the FAB timeout needs investigation. Checking the Button primitive's prop spreading:
Button spreads props correctly. Let me verify the FAB live — starting the prod server and probing:
FAB exists in the DOM with correct aria-label. Playwright uses the accessibility tree — let me check whether an ancestor hides it:
No a11y issues. Let me run a one-off Playwright script against the live server to debug exactly what Playwright sees:
脚本路径崩溃，但测试运行器正常工作。让我写一个诊断测试来代替：
Browser launch itself is failing now — likely zombie chromium processes from the crashes. Cleaning up:
65 zombie chromium processes were the likely culprit for the late-suite failures. Re-running diagnostics clean:
FAB found and clickable when resources are clean — the late-suite failures were zombie-process exhaustion. Now let me fix the real spec bugs. Checking the remaining unknowns:
Confirmed — strict-mode violations from multiple matches. Let me check the income edit prefill, then fix all specs:
Income edit prefill is `"500.00"` (toFixed(2)). Now applying all spec fixes systematically:
All gates green. Re-running the full E2E suite:
54 passed now (was 43). Triaging the remaining 12:
Multiple specific issues. Let me investigate each — first the goals Add Progress dialog and quick-add step-2 submit labels:
Goal dialog submit is "Add Amount" and quick-add step-2 is "Add" — fixing. Let me also see the FAB toggle-close failure detail:
The chooser overlay **intercepts pointer events over the FAB** — the FAB-X toggle may be broken in the clone! Is the live's FAB clickable while its chooser is open? Probing:
会话已登出。正在重新登录以探测 FAB：
**Genuine parity bug found**: the live's FAB stays on top (`inFab: true`, plus rotated 45°) — the clone's chooser overlay covers it. Let me find the stacking-context culprit in the clone:
My probe's filter has false positives (`auto` values). Re-probing with correct defaults:
No ancestor stacking contexts — z-50 should beat z-40. Let me hit-test the clone directly with the chooser open:
z-50 should beat z-40, yet the hit test says otherwise. Let me compare the LIVE's chooser structure — where its FAB sits:
The live's chooser is a plain div **inside the app tree** (no Radix portal). Let me check if Radix's modal lock is disabling pointer events on the clone's body:
**Root cause**: Radix's modal lock sets `pointer-events: none` on body — the FAB inherits it and dies. Let me check how the live treats the FAB under a FULL modal (not just the chooser):
Live contract confirmed: **chooser overlay z-40 with FAB on top (clickable); full modal overlay z-50 covering the FAB**. The clone's Radix modal lock breaks the chooser case. Let me check the QuickAddDialog's root and the clone's dialog overlay z:
The design intent was right — only Radix's modal body-lock breaks it. TDD fix — RED pin first, then `modal={false}`:
275/275. Now fixing the remaining spec issues — checking the investments delete label and account card structure:
Now investigating the zero-toast and import-garbage mysteries. Rebuilding with all fixes first:
The toast is **"Enter a valid positive amount"** — `toMinorUnits("0")` throws! Let me check:
My JS probe was flawed (bypassed React state). Let me re-run the actual zero-amount test against the fresh build:
Toast works — just a strict-mode violation (toast title + aria-live span). Fixing, then checking the import test:
My fixture is single-line — it hits the "header row + data row" error, not the column error. Fixing the assertion:
24 个通过，剩余 7 个。正在检查新的失败详情：
Two issues: my replace broke the step-1 chooser click, and the FAB toggle now double-fires (Radix's outside-dismiss closes, then the click re-opens). Checking if DialogContent forwards `onPointerDownOutside`:
DialogContent 转发了 props。应用双次触发（double-fire）修复：
Now fixing the spec bugs (step-1 chooser click, goal card scoping, account delete label):
The goals assertions need proper card scoping, and the FAB toggle still fails. Let me debug the toggle manually:
JS clicks work — physical Playwright clicks don't. Writing a diagnostic test with physical mouse clicks:
Both clicks land on the FAB, yet the chooser stays open — an odd number of toggles is happening. Let me read the QuickAddDialog's close wiring:
The outside-dismiss still fires despite my preventDefault — the DialogContent may not forward that handler. Reading it:
Props forward correctly. Let me instrument the close/toggle flow to see exactly what fires on click2:
**Found it**: Radix fires `onFocusOutside` (the FAB takes focus on mousedown) → dismiss → then the click toggles it back open. Suppressing via `onInteractOutside` (covers both pointer + focus):
**Fixed** — only the toggle fires now, chooser closes. Removing instrumentation and updating the unit pin:
275/275. Now fixing the goalCard scoping — checking CARD_HOVER classes first:
The money/badge elements live in different branches — the `..` climb is too shallow. Checking the exact structures:
Python quoting error — the income fix didn't apply. Retrying:
The first fix never landed (the script aborted). Applying it now:
All quick-add tests pass. Running the FULL suite for the all-green check:
**ALL 66 E2E TESTS PASS** (3.4 min). Running a second consecutive run to confirm zero flakes:
**66/66 twice — zero flakes. Dev DB untouched (pristine 96).** Now the CI workflow and tailwind.config.ts cleanup:

我将从上次会话中断的地方继续。上一次操作是“现在开始进行 CI workflow 和 tailwind.config.ts 的清理”工作。让我先确认一下当前工作区的状态。
工作区已确认：第 12 轮的修改均未提交。CI 工作流目录为空，且 `tailwind.config.ts` 依然存在 —— 这正是未完成的任务。让我检查一下剩余部分的状态。
基础设施已就位。我来查看一下 Round 12 计划中剩余的任务和 worklog。
状态已确认。Round 12 剩余工作：**CI 工作流、tailwind.config.ts 清理、文档更新、最终门禁、commit + push**。让我阅读一下计划的任务部分，以便严格按照规范执行。
I have full context now. The E2E suite (66 specs, 2× all-green) and the mid-round parity fixes (title contract, import negatives, FAB toggle) are complete. Remaining: **CI workflow → tailwind.config.ts deletion → docs → final gates → commit+push**. Setting up the TODO list:
**任务 1：CI 工作流。** 让我先检查一下工作流需要与之对齐的相关事实（`bun` 版本、`prisma` 设置、`playwright` 配置环境处理）。
`playwright` 配置很扎实。在编写 `CI` 工作流之前，有一个关键的 `CI` 正确性检查：`next build` 是否需要 `DATABASE_URL` / `.env` 文件（在 `CI` 中不会存在）？让我验证一下。
`.env` 被 gitignore 了（在 CI 中不存在）。关键问题是：当没有 `.env` 时，`next build` 是否会评估 Prisma？直接进行测试：
`next build` 在没有 `.env` 的情况下是绿色的（所有 API 路由均为动态）。让我再验证一下单元测试套件不需要 `.env`，然后编写 CI 工作流。
275/275 unit + no-env build confirmed — CI needs no DATABASE_URL beyond the webServer's own. One more check: does a fresh clone have the `db/` directory (for `prisma db push` to create e2e.db)?
`db/.gitkeep` 已提交 —— 新克隆是安全的。现在开始编写 CI 工作流：
Now validating the workflow per plan §E (YAML parse + every referenced script exists):
CI validated. Let me also verify `bun install --frozen-lockfile` works (CI uses it; bun.lock was modified this round):
任务 1 已完成。**任务 2：删除 `tailwind.config.ts` (F3)。** 正在重新验证其是否未被引用，然后删除：
`rg` 遇到了一个大型目录。使用优化后的 Grep 工具：
Dead v3 config confirmed (v4 CSS-first pipeline is active). Checking globals.css plugin usage, then deleting:
Config removed. Checking whether `tailwindcss-animate` (imported only by that config) is now a dead dependency:
`tailwindcss-animate` 现在是一个废弃的依赖（v4 改为使用 `tw-animate-css`）。作为 F3 清理工作的一部分，将其移除：
Post-deletion build verification (plan §E):
构建成功。**任务 3：验证 dev DB 未被修改。** 正在检查两个潜在的 DB 位置（已记录的路径歧义）：
开发数据库完好无损，位于父目录位置（mtime 09:34，早于 E2E 运行时间 11:50）。表名不同 —— 正在列出实际表名：
开发数据库保持初始状态（96/4/4/3/8/3，E2E 前的 mtime）。任务 1-3 已完成。在编写执行记录和文档之前，让我先查看一下本轮具体的源码差异（source diffs），以便进行准确的提交分组和文档编写：
所有差异已验证。现在开始**任务 4：§G 执行记录**。首先收集 E2E 规范清单和证据文件以供参考：
现在开始撰写 §G 执行记录：
Verifying the plan edit landed correctly:
§G 已到位。**任务 5：文档检查。** 阅读当前的 AGENTS.md 章节以进行更新：
我已掌握 AGENTS.md 的完整上下文。正在进行更新（命令表、推送契约、E2E 不变量、ADR-021/024 修正、FAB 不变量、tailwind.config 移除、参考列表）：
All AGENTS.md edits landed. Now CLAUDE.md:
正在更新 CLAUDE.md（日期、ANALYZE 第 12 轮参考、VERIFY 门禁、命令表、测试策略、tailwind 行、E2E 交付、FAB 流程）：
CLAUDE.md 已完成。接下来是 README.md：
All README context gathered. Applying the updates:
README 已完成。现在进行 PAD v1.11 —— 正在检查其结构：
让我获取每个文件精确的测试计数，并阅读 §10/§11：
Applying all PAD v1.11 edits (header, §7.1–7.4, §8.4, §10, §11):
正在验证所有 PAD 修改是否已正确应用：
Shell seems slow — using the Grep tool instead:
PAD 已完成。现在是最后一部分文档 —— `docs/session_11.md`。首先检查 session_10 的约定：
已理解会话日志约定。正在编写 `docs/session_11.md` 以记录第 12 轮：
session_11.md 已编写。**任务 6：最终门禁。** 首先检查开发服务器状态（已记录的构建/开发缓存交互）：
清理环境。按顺序运行门禁——先执行 lint/typecheck/unit：
lint 0 · tsc 0 · 275/275. Now the full E2E gate (build + 66 specs) on the finished tree:
**全部门通过：lint 0 · tsc 0 · 275/275 · E2E 66/66**（`[ai/insights]` 429 行是已记录的确定性回退路径，正按设计运行）。执行 commit 前检查 —— 开发数据库完好性、僵尸进程、secrets：
All hygiene checks pass (dev DB pristine, no zombies, no secrets). The bun.lock hunks interleave (playwright side-effects + animate removal), so deps ride with the E2E infra commit (noted in its body). **Task 7: atomic commits.** Setting up the sequence:
完整清单已确认，无冗余文件。正在执行提交序列 —— **提交 1 (RED specs)**：
All 8 commits landed, tree clean. **Task 8: push via the SSH wrapper.** Writing the key (0600) and checking the wrapper interface:
Dry-run first:
没有 SSH 二进制文件 —— 这是已记录的沙盒环境情况。正在阅读运行手册的 paramiko-shim 章节：
运行手册中有一个附录 A 的 shim。正在检查工作区中是否还存在上一次会话的 shim：
上一次会话的 `shim` 保持完好——只是不在 `PATH` 中。正在重新运行预运行（dry-run），并已配置好 `shim`：
Dry-run clean — fast-forward `26290be..048273c`. Real push:
已推送并验证。正在粉碎操作员密钥副本：
**任务 9：工作日志。** 正在追加第 12 轮记录：
**第 12 轮已完成并推送** —— 远程 `main` 分支 @ `048273c`（快速转发 8 个原子提交，已验证；两个密钥副本均已销毁）。

从中断的会话中恢复：E2E 套件已经是 2 倍全绿（all-green）状态。本次延续完成了 **CI 工作流**（结构上已验证 —— 请在 GitHub 上检查其首次远程运行）、`tailwind.config.ts` + 无用依赖的清理，以及完整的文档同步（计划第 §G 节、AGENTS、CLAUDE、README、PAD v1.11、会话日志）。最终检查项：lint 0 · tsc 0 · **275/275 unit + 66/66 E2E**。

建议的后续步骤：在 GitHub 上观察 **Actions 选项卡** 以进行首次 CI 运行；未来轮次的候选方案是 PAD 第 10 节中剩余的未决项（prisma 迁移历史，auth 加固）。
