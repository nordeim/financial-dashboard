I'll start executing this workflow. Let me first set up a task list and check the workspace state.
The workspace has been reset (only an initial commit, no remote). Let me clone the repository.
Workspace cloned successfully. The latest commits show round-18 GREEN + docs alignment. Now let me review the project documents.
Let me read the AGENTS.md file in sections directly.
The file has very long lines. Let me use a different approach to read them.
Now let me read the latest session documents.
Round 18 is complete and pushed. The current task is **Round 19**. Let me read the round-18 plan and remaining core docs.
Now let me review CLAUDE.md and README.md.
Now let me validate the codebase structure against the documented round-18 state and check the worklog.
结构符合文档中描述的第 18 轮状态。现在让我设置环境并运行 baseline gates。
The known environment trap from session_22 just surfaced — the sandbox's pre-set `DATABASE_URL` shadows the repo `.env`. Let me handle it.
The env var is re-injected per command — I must `unset DATABASE_URL` in every relevant command. Now running baseline gates.
所有基线检查点均已通过（lint 0 · tsc 0 · 389/389 单元测试）——与记录的第 18 轮状态完全一致。让我查阅一下 repo 的技能目录和前几轮的捕获工具。
Tooling is available. Let me validate the round-18 seams in the codebase before starting the probe.
The round-18 seam is verified in code. Let me set up the worklog and captures infrastructure, then check how previous rounds captured signatures.
Now let me write the initial worklog entry and set up the round-19 infrastructure.
Now let me start the live-side probe with agent-browser.
已登录线上环境。让我检查一下主题状态并设置视口（viewport）。
The viewport is 1280x577 (default). Let me build the capture tooling — first test the eval output encoding.
Now let me write the capture tooling script.
All 10 live surfaces captured. Now capture the login page on an isolated logged-out session.
Login captured. Now the structural probes on the live — starting with the motion audit on the Dashboard.
15 elements vs the pinned 19 — let me wait longer and count precisely (elements may still be animating).
Live drift suspected — 15 settled vs pinned 19. Let me dump the full context of these elements.
The AI Insights card appears missing from the live Dashboard. Let me verify.
The live AI Insights card has NO motion wrapper now. Let me check the clone's implementation and any pinned tests.
The motion structure matches the live (the 19→15 delta is the live user's data shrinking — 2 recent rows now vs 6 before, a data-bucket difference). Let me continue with the structural probes — the Add Expense modal.
Clicking "Add Transaction" on the live Dashboard navigated to the Expenses view — this differs from the clone's behavior (opens a modal). Let me verify carefully.
The clone matches (Add Transaction → /Expenses anchor). The modal probe needs the Expenses view's "Add Expense" button. Let me do that.
Modal matches all pins. Now let me close it and probe the FAB chooser.
Chooser matches pins. Now the Progress indeterminate probe on Goals.
Progress matches. Now the mobile chrome + drawer probe — let me check viewport options.
Found the bug — the script keeps the `/devtools/browser/UUID` path in the HTTP URL. Let me fix it.
Mobile viewport active. Now the mobile chrome probe.
Top bar matches. Now the drawer probe — install a rAF sampler, then open the drawer.
Drawer opened with animation samples captured. Let me verify the full animation shape.
Animation matches the pin (−300 → +36 overshoot → settle). Now the drawer root structure.
Drawer bottom matches. Let me capture a mobile screenshot, then close the drawer and restore desktop viewport.
SyncedBadge is mobile-only (matches round-16 pin). Now the sidebar raw-order probe.
Sidebar matches. Now the user-menu anatomy probe.
User menu matches pins. Now the critical HTTP-layer audit on the live.
Key drift found — the live's `/Goals` main `description` meta now carries the "Goals on Finara…" template. Let me see the full Goals + 404 heads.
Major findings. Let me check the live response headers and robots/sitemap.
HTTP layer unchanged (trio + robots + sitemap). Now let me start the clone production server and capture its side.
Two clear HTTP-layer deltas found. Let me verify the pattern across all 8 view routes on the live.
Confirmed — the template now applies to all three description metas on all 8 view routes. Let me verify the twitter:image:alt scope.
F1 and F2 confirmed. Let me verify the clone's headers/robots/sitemap still hold.
HTTP-layer findings are mapped. Now let me capture the clone-side signatures — login first on an isolated session.
Both sides captured. Now the signature diff in both modes.
No class-order drift (RAW==SORTED everywhere). Now let me classify the only-live deltas per surface.
Small surfaces classify into documented buckets. Now the larger surfaces.
Body DOM verdict: zero non-bucketed deltas — live unchanged since round 18. Now the VLM sweep — capturing both sides' screenshots.
Screenshots didn't land in the target dir — let me retake with absolute paths.
All screenshots captured. Now the VLM side-by-side sweep.
The VLM flags a theme mismatch — let me inspect the actual screenshots.
My earlier click on the mobile top bar hit the theme toggle and flipped the live to light. Let me toggle it back to dark and retake the screenshots.
VLM flags Analytics — let me verify the summary-cards claim against the DOM (the signature diff said zero non-bucketed deltas).
Both sides have the cards — the VLM flag is a viewport-cropping artifact. Let me confirm with full-page screenshots.
**VLM 5/5 EQUIVALENT** (Analytics confirmed on full-page). The probe phase is complete. Let me update the worklog and examine the spec before writing the plan.
Now let me check the session log convention with git before writing the plan.
Now let me write the round-19 remediation plan.
Plan written. Now let me validate it against the codebase before execution.
The plan is fully validated. Now the RED phase — updating the spec with the round-19 contracts.
RED specs in place. Running the suite to confirm the RED state.
RED confirmed — exactly the 3 designed specs fail, 389 pass. Now GREEN — implementing in the seam.
Let me update the seam's docblock and run the gates.
GREEN — 392/392. Now rebuild and verify the HTTP layer end-to-end.
Both fixes verified live-exact. Let me byte-compare against the live's strings.
Byte-exact matches. Now the body-DOM regression check.
Body DOM byte-identical. Now the E2E gate — freeing the server first per the established lesson.
While E2E runs (~3.4 min), let me do the docs updates — starting with AGENTS.md.
Let me check E2E progress and start the docs updates.
Now the HTTP-layer invariant in AGENTS.md — amending with the round-19 pins.
Now the Reference section — adding the round-19 plan entry.
E2E failures detected — let me investigate.
Found it — the Playwright chromium build 1234 is missing from the reset cache. Installing it.
While E2E re-runs, let me continue with CLAUDE.md updates.
Let me add the round-19 plan reference to CLAUDE.md's ANALYZE step.
Now README.md updates.
E2E is passing now. Let me fix the remaining count in README line 26.
Now the PAD updates — header, §7 counts, §10 round-19 row, §11 seam entries.
E2E passing steadily. Let me fill in the plan's §G execution record.
Now writing the session_24 log.
While E2E finishes, let me verify .env.example alignment.
.env.example is aligned (round 19 adds no env vars). Let me review the full change set while E2E completes.
**E2E GATE GREEN: 67/67.** All gates pass. Now the screenshots deliverable — starting the dev server.
All 11 screenshots captured. Let me spot-check two of them.
Screenshots verified. Now let me stop the dev server and review the push runbook.
The runbook is clear. Let me check the ssh shim requirement and prepare the commits.
Paramiko ready. Now let me create the ssh shim outside the repo.
Shim deployed. Now let me verify the wrapper integrity and make the atomic commits.
All three atomic commits landed. Now the push — writing the operator key outside the repo.
Key verified. Now the dry-run with the wrapper.
Dry-run clean (fast-forward 961a64f..8488f5c). Executing the real push.
**Pushed and verified — remote main @ 8488f5c == local HEAD, key shredded.** Let me finalize the worklog.
**Round 19 complete and pushed — remote `main` @ `8488f5c` (3 atomic commits), all gates green.**

**What this round found:** the live app's *body DOM* is unchanged since round 18 (zero non-bucketed deltas on all 11 surfaces, both diff modes; every structural probe matched its pin; VLM 5/5 EQUIVALENT). But the HTTP-layer audit found the live's `<head>` changed a **third round in a row**: the `X on Finara.` description template now applies to the main `description` and `og:description` metas on the 8 view routes (round 18 had it on twitter:description only), and `/login` renders `twitter:image:alt`. Both fixed TDD-first (389 → 392 specs) with the body DOM verified byte-identical pre/post.

**Verification:** lint 0 · tsc 0 · **392/392 unit** · **E2E 67/67** · head metadata byte-exact vs the live at the curl level · 11 screenshots refreshed · PAD v1.18 + session_24 aligned · `.env.example` verified.

**Suggested next:** watch the CI run on `8488f5c`, or launch Round 20 — the live `<head>` has now changed three rounds running, so keep the per-route head audit in the opener alongside the raw-order diff.
