# Session 9 — Round 11: interactive-state sweep (chart tooltip, negative amounts, goal complete-state)

Continuation session. Round 10 was complete and pushed (main @ `fe9e5ce`); the
Round 11 working tree had survived the session break with all implementation
edits intact (25 modified files + the round-11 plan, uncommitted) and 270/270
green. This session resumed at the interrupted browser verification (goal
overshoot flow) and drove the round to commit + push.

## What this session found and fixed

**Goal complete-state contract — corrected.** The interrupted verification
resumed on the clone's Add Progress dialog (150 against a 100 target): the
overshoot rendered uncapped (150.0% / $150.00 / $100.00) as probed. But the
previous session's reading "Add Progress stays enabled at 100%" did not
survive a fresh live probe: created a target-100 goal on live, added +100
(reached exactly 100%), captured the settled post-reload DOM — the live card
gains `ring-2 ring-emerald-200 dark:ring-emerald-700`, the badge row gains a
Complete badge (default-variant shadcn Badge + emerald palette + lucide
circle-check-big `w-3 h-3 mr-1`, DOM `</svg>Complete` with NO space), and the
Add Progress button is REMOVED entirely (not disabled). Re-verified at 150%
by PUTting current_amount 150 through the live API (Bearer token captured
from the app's own XHR via a header patch — no credentials persisted); both
states identical. The earlier "enabled button" reading had come from a
transient pre-refresh DOM. Complete condition is percent-based: the
negative-target goal (0.0% / $0 / −$500) shows NO badge. Implemented in
goals-view.tsx (ring merge on CARD_HOVER, Complete badge, `{!complete &&}`
button gate); view-surfaces + functional-parity pins updated. Clone verified
byte-exact against the captured live DOM (one deliberate delta: lucide
auto-adds `aria-hidden` — documented a11y bucket).

**Chart tooltip — the F1 evidence itself was wrong, twice corrected.** The
round-11 plan assumed the live's `var(--border)` "resolves #e5e5e5/#262626".
Computed-style probes showed otherwise: the live's theme tokens are raw HSL
triples (Tailwind v3 convention), so the tooltip's inline `var()` color refs
are defined-but-INVALID — background computes transparent, the border
shorthand invalidates entirely (border-style none, width 0 — NO border
renders), and the text color inherits. The live tooltip is a pure borderless
text overlay in BOTH themes. Two probe-method traps were hit and documented:
(1) a `border: 1px solid` intermediate fix rendered a visible border Recharts'
default would otherwise own — the final fix needs an explicit
`border: "none"`; (2) one computed-style read was accidentally taken against
the clone (a failed navigation left the browser on localhost) — always
`location.href` before probing. Final clone style:
`{ backgroundColor: "transparent", border: "none", borderRadius: 8 }`,
verified three ways: computed byte-match both themes, tooltip-crop pixel
analysis (identical text-glyph locations, 0 border-row pixels, transparent
interiors), and the suite. A VLM side-by-side verdict of "different" was
refuted by the pixel analysis — computed styles + pixel crops are ground
truth, VLM reads advisory.

**Console sweep.** All 9 views navigated fresh (about:blank → view): zero
console errors, zero warnings (only React DevTools info + HMR-connected
dev noise). The Round-10 leftover logout-error question is moot on this
tree — the full sign-out cycle was re-verified clean in the previous
session and nothing regressed.

**Environment hygiene.** Dev DB reset to pristine seed (2 probe goals
deleted + verified; 96 expenses / 4 income / 4 accounts / 3 goals /
8 investments); clone theme restored to light (seed default). Live state:
every probe entity deleted + verified (goals list = 1 seed goal), theme
restored to dark.

## Gates & delivery

- lint 0 · tsc 0 · **270/270** · build 0 (trajectory this round: 251 → 270)
- Evidence: `/home/z/my-project/captures/r11/*` (outside the repo, per
  convention)
- Plan: `docs/plans/2026-09-17-parity-remediation-round11.md` (§G execution
  record appended, including the two evidence corrections)
- Docs aligned: AGENTS.md, CLAUDE.md, README, PAD v1.10 (ADR-024 signed
  minor units / live zero-validation replication)
- Atomic commits on main, pushed via the SSH wrapper (dry-run → push →
  verify → shred)

## Suggested next round

Every interactive surface probed so far is at parity, including this
round's deep sweep (tooltips, legends, negative amounts end-to-end, goal
complete states, select popups, focus rings). The natural next steps from
PAD §10: the **Playwright E2E layer** to lock the golden paths
(sign-in → create/ edit/ delete on each entity → filters → export →
theme lifecycle), or a fresh probe of still-unexercised corners (CSV
import of negative rows, AI coach dialogs, export with EUR + non-US date
formats).
