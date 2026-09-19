The workspace has been reset (git has no remote, only an initial commit). I need to clone the repository fresh. Let me start.
Repo cloned successfully — it's at round-16 of parity remediation. Now let me review the core documentation files.
Now let me read AGENTS.md.
Now CLAUDE.md:
Now the Project_Architecture_Document.md (816 lines):
Now the session logs and round-16 plan:
Now let me read the round-16 plan (the model for the next round's plan):
I now have a complete picture. Round 16 is complete and pushed; this session is **Round 17**. Let me set up the environment and review the repo's skills catalog in parallel.
agent-browser skill loaded. Now let me set up the database, run baseline gates, and clone scandihaven for the tech-stack patterns review.
The parent workspace's pre-set `.env` shadowed the repo's `.env` (Prisma CLI walks up parent dirs). The DB landed at `/home/z/my-project/db/custom.db` instead of the repo's `db/`. Let me fix this so the repo's own `.env` is authoritative:
The scaffold exported `DATABASE_URL` into the shell, which overrides .env files. Let me unset it and set up the repo-local DB properly:
DB is now repo-local. Now baseline gates + scandihaven clone in parallel:
Baseline gates green: **lint 0 · tsc 0 · 359/359 unit** — matches the documented Round-16 state exactly. Now the scandihaven tech-stack review:
The scandihaven patterns (integer minor units, Tailwind v4 CSS-first, strict TS, TDD seams, idempotent seeding) are all already institutionalized in this repo. Now let me validate my codebase understanding and start the Round-17 live re-probe. First, the route table and key source structure:
Codebase structure validated against docs. Now let me kick off the production build (detached) and write the capture tooling:
Build in progress. Meanwhile, let me start the live-site re-probe:
The output is double-encoded. Let me write a loader that normalizes it:
Now log in to the live site and capture all 9 views:
Build done. Let me check the live theme state, then capture all 9 live views:
All 9 live views captured, titles match pins. Now the live structural probes — motion audit first (round-16 baseline: 19 settled motion elements on Dashboard):
Motion audit matches the round-15/16 baseline exactly (19 settled elements). Now the dialog + chooser probes on Expenses:
Modal structure matches round-14 pins exactly. Close it and probe the FAB chooser:
The modal is still open (Escape didn't fire on it). Let me close it via its X button, then probe the FAB:
Chooser matches pins. Now the Progress mechanism probe on Goals:
Progress mechanism matches pins. Now the mobile chrome + drawer animation probe:
Button 0 is the theme toggle (I toggled it twice — back to dark, no harm). Button 1 is the menu. Now sample the drawer animation properly:
The drawer IS open (nav links visible). Let me examine its actual DOM structure:
The drawer root carries the settled `opacity: 1; transform: none;` (round-16 F6 pin confirmed). Let me close and re-open to sample the slide-in animation on the correct root:
Drawer animation rAF sample matches the round-16 pin exactly (−300px → +35px overshoot → settle ~590ms). All structural probes match. Now the clone side — start the production server:
Clone logged in (light theme). To minimize diff noise (live renders dark), let me toggle the clone to dark via the user menu:
Now capture all 9 clone views in dark mode:
Now run the sorted + raw-order diffs for all 10 surfaces:
No RAW-vs-SORTED discrepancies (class orders hold from round 16). The deltas are class-set/count deltas — most likely data-driven. Let me classify them view by view:
The Dashboard deltas classify as seed-data counts, but the `polyline 25 vs 0` needs investigation. Let me verify directly:
The icon census is data-driven, but I need to see HOW the live's icons render (polyline vs path internals — the lucide-internals bucket):
Live renders old lucide `polyline` internals, clone renders `path` — the documented lucide-internals bucket. Let me classify the remaining views:
All data-view deltas are pure seed-count differences. Let me verify the live data state (the live account appears to hold minimal data now):
Live account data was reduced to 1 expense (data delta, not parity). Now the remaining views:
**Zero non-bucketed deltas across all 10 surfaces, both diff modes.** Let me spot-verify the round-16 fixed surfaces directly on the live (SyncedBadge, sidebar orders, pane order):
Nav icons, gradient container, pane all match round-16 pins. But the SyncedBadge wasn't found — let me inspect the sidebar bottom:
SyncedBadge renders the Badge base only — round-16 pin holds. Let me run the remaining structural probes (user menu) and check `bun audit` for the production-readiness picture:
User menu matches round-7 pins. The live is structurally unchanged since round 16 — **zero live drift**. Following the round-15 precedent, the round pivots to the codebase's own production-readiness. Let me check the audit posture:
Audit tail is identical to round-15's accepted state (43 findings, 0 critical, all dev/CLI-time). Let me check the clone server logs for runtime errors and verify the migration-baseline sync:
Clean logs, migrations in sync. Let me do a visual sweep — side-by-side screenshots of both sides for the record:
Two screenshots are wrong (navigation hadn't completed / missing open). Let me retake them with URL verification:
Mystery solved — the earlier failed relative-path loop left the live browser on /Goals, so `live-Dashboard.png` actually captured Goals. Let me retake it properly:
All screenshots correct now. Let me run a VLM side-by-side sanity sweep (the final verification layer from prior rounds' discipline):
**VLM sweep: 4/5 EQUIVALENT; Goals flagged only the card count (data bucket — live has 1 goal, clone seeds 3). Zero live drift confirmed.** Per the round-15 precedent, the round now pivots to production-readiness. Let me hunt for codebase gaps:
Chromium reinstalled (workspace reset had wiped it). Now let me examine production-readiness surfaces — security headers, metadata, config:
No security headers on the clone. Let me check what the live app sends (parity consideration):
The live sends `referrer-policy`, `x-content-type-options`, `strict-transport-security` — the clone sends none. A genuine HTTP-layer parity + production gap (invisible to DOM diffs). Let me check the clone's API headers too:
Real findings emerging at the HTTP/metadata layer. Let me complete the picture — icons, robots, and the full header set:
The live's og:title/og:url mirror the per-route title (bare `Finara` for `/`+`/Dashboard`+`/login`, `X | Finara` elsewhere, canonical root for the dashboard). Let me validate the implementation surfaces in the clone before planning:
Let me check remaining details — logo.svg usage, image tooling, and the metadata test seams:
All surfaces validated. Let me check for existing test coverage that might interact with these changes:
No conflicts. The probe phase is complete. Let me now write the Round-17 remediation plan:
Plan written. Now let me validate it against the codebase before execution:
Config imports cleanly in Vitest. Let me validate the PNG conversion (F3) before writing specs:
PNG conversion is pixel-identical. Plan fully validated. Let me check the repo's contract-test style before writing the RED specs:
Now the RED phase. Let me check the source-reading test convention, then write the specs:
Now run the suite to confirm the RED state (exactly the new specs must fail):
RED confirmed (the seam module doesn't exist). Now the GREEN phase — F4 first, the pure seam:
Now F1 — next.config.ts security headers:
Now F2 — layout.tsx head metadata:
Now F4's page consumers + F5's robots/sitemap metadata routes:
Now F3 — the asset work (PNG conversion + dead-asset deletions):
Now run the new specs for GREEN:
17/18 — the layout spec pinned the env literal, but that logic correctly lives in the `siteBaseUrl()` seam (already pinned by its own spec). Let me align the layout contract to pin the wiring:
TypeScript field name fix — Next's type is `changeFrequency` (serializes to the `<changefreq>` XML element):
**GREEN: 377/377 unit (359 + 18 new) · lint 0 · tsc 0.** Now rebuild and verify the HTTP layer end-to-end:
Clean build with `/robots.txt` + `/sitemap.xml` routes. Restart the server and verify:
Now the per-route head metadata verification:
Head metadata is live-exact on every route. Let me verify the remaining og fields + run the body-DOM regression check:
The page-level `openGraph` **replaced** the layout's (Next does shallow per-key merge) — og:image/site_name/type are missing. The seam must carry the complete openGraph. Let me fix:
Update the spec to pin the description at its new source (the seam) plus the layout wiring:
Complete og block renders live-exact. Now the body-DOM regression check (must be unchanged):
**Body DOM byte-identical** (179/179 both modes) — the round is purely transport/metadata-layer. Now the full gates + E2E. First free resources per the round-15/16 lesson:
E2E running. Meanwhile, the documentation updates — first `.env.example`:
Now AGENTS.md — find the count references and the right insertion points:
Now the AGENTS.md updates — counts, the new invariant, and the reference:
Now add the round-17 reference to AGENTS.md §Reference:
Now CLAUDE.md updates:
CLAUDE.md done. E2E progressing (14/67). Now README.md:
Now add the security-headers row to README's Security section:
README done. Check E2E progress, then the PAD:
Now PAD §8.2 env vars and §10 round-17 paragraph:
Now the PAD §10 round-17 resolved paragraph + the v1.16 header:
Now the PAD header (v1.16) and the §11 key-files entries:
E2E at 46/67 all green. Now the plan's §G execution record:
E2E at 50/67. Meanwhile, the session log:
E2E at 58/67. Let me check the existing screenshots folder while waiting:
**E2E GATE GREEN: 67/67.** All gates pass. Now the screenshots deliverable — dev server + captures:
All 9 views captured with verified content. Now the mobile drawer:
All 11 screenshots refreshed. Quick sanity check on the captures, then final gates:
All gates green. Now the atomic commits (RED → GREEN → docs, per repo convention):
The sandbox identity matches the prior rounds' convention. Making the atomic commits:
All commits landed, tree clean. Now the push. Let me review the runbook first:
The reset wiped both (the known round-16 situation). Rebuild the shim infrastructure:
Now deploy the shim to a workspace bin dir (outside the repo), per Appendix A:
Now write the operator key (outside the repo, 0600) and run the dry-run:
Dry-run clean: fast-forward `c759c7d..f142fec`. Executing the real push:
**Pushed and verified — remote main @ `f142fec` == local HEAD, key shredded.** Let me update the worklog and close out:
**Round 17 complete and pushed — remote `main` @ `f142fec` (3 atomic commits), all gates green.**

**What this round found:** the live app is structurally *unchanged* since round 16 (zero non-bucketed deltas across all 10 surfaces in both sorted and raw-order diffs; only its account *data* was reset). But extending the audit to the **HTTP/metadata layer** — which the body-DOM diff is structurally blind to — surfaced five real gaps, all fixed TDD-first (19 new specs):

- **Security headers**: the live's edge trio (Referrer-Policy, X-Content-Type-Options, HSTS) + hardening pair now on every response; `X-Powered-By` suppressed
- **Head metadata**: per-route og:title/og:url via a new pure seam (`route-metadata.ts`) — including the live's dashboard-canonical→`/` quirk — plus theme-color, viewport-fit, the live's exact description, PWA metas
- **Favicon**: now the actual Finara logo (converted from a mislabeled JPEG to a true PNG)
- **SEO files**: live-shaped `robots.txt` + the exact 9-URL `sitemap.xml` (previously fell through to the 404 page)

**Verification:** body-DOM byte-identical pre/post (179/179) · lint 0 · tsc 0 · **378/378 unit** · **E2E 67/67** · screenshots refreshed in `docs/screenshots/` · `.env.example` documents the new `NEXT_PUBLIC_SITE_URL` · PAD v1.16 + session_20 aligned.

**Suggested next:** watch the CI run on `f142fec`, or launch Round 18 with a fresh probe — the HTTP-layer audit is now part of the standard opener alongside the raw-order diff.
