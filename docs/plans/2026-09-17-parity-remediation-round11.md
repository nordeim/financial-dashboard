# Round-11 Parity Remediation Plan — Interactive-state sweep: chart tooltip, negative-amount acceptance, investment-form attrs

Date: 2026-09-17 · Scope: the surfaces no previous round probed — **interactive
states** (chart hover tooltips, form validation attrs, keyboard focus rings,
select popups) and **negative-amount behavior end-to-end**. Every finding
live-probed this round with controlled create→observe→delete experiments (all
probe data cleaned up and verified removed). Evidence:
`/home/z/my-project/captures/r11-*` (outside the repo, per convention).

## §A Context

Round 10 closed the theme lifecycle, re-pinned the primary token family, and
ran the full light+dark VLM sweep — static rendering parity is verified across
all 9 views. What had NOT been systematically probed since round 1 were the
**interactive states that only appear during use**: the Recharts hover
tooltip, native form-validation attributes, keyboard focus rings, select
dropdown popups, and what each app does with **negative amounts**. This round
probed all of them side-by-side (live + clone in parallel browser sessions,
1280×800), chased every difference to ground truth (form-element dumps,
computed styles, network captures, controlled live mutations), and dismissed
the rest with evidence.

## §B Findings (F1–F2 + verified-parity inventory)

**F1 — Chart tooltip style: hardcoded values + dark-mode defect (4 deltas):**

Live tooltip (hover-probed on the Analytics Overview line chart AND the
Expenses-tab pie — identical style; the inline style is the live truth):

```html
<div class="recharts-default-tooltip" style="margin: 0px; padding: 10px;
  background-color: var(--background, #fff); border: 1px solid var(--border, #ccc);
  white-space: nowrap; border-radius: 8px; color: var(--foreground, #000);">
```

- computed font-size **16px** (inherited — no fontSize override), system stack
- cursor: the Recharts default line, `stroke="#ccc"` (clone default — match)

Clone today (`analytics-view.tsx`):
`tooltipStyle = { borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }`

Deltas: (1) radius 12 vs live **8**; (2) border `#E2E8F0` (slate-200 — wrong
family) vs live **`var(--border)`** (resolves #e5e5e5 light / #262626 dark);
(3) no background → Recharts default hardcodes **white in dark mode** vs
live's `var(--background)` (#0a0a0a dark) — a visible dark-mode defect; (4)
`fontSize: 12` vs live's inherited **16px**. The tooltip structure (default
content renderer, money formatter, item colors rgb(16,185,129)/rgb(239,68,68)/
rgb(59,130,246), label format "Jun 26") already matches exactly — only the
style object is wrong. Single fix point: the shared `tooltipStyle` const
feeds all 4 Tooltip instances (analytics is the only Recharts consumer).

**F2 — Negative amounts blocked at every layer; live accepts them everywhere
(systemic, 3 client layers + 3 API layers + investment-form attr deltas):**

Live evidence (controlled experiments, all cleaned up + verified):

| Live form / endpoint | Probe | Result |
|---|---|---|
| Add Expense + `POST /entities/Expense` | amount `-5.5` | **accepted** — row renders `--$5.50` (see below), Total Expenses → `-$1.00` |
| Add Income + `POST /entities/Income` | amount `-100` | **accepted** — card renders `-$100.00`, monthly equivalent `-$100.00` |
| Add Account + `POST /entities/BankAccount` | balance `-250` | **accepted** — card renders `-$250.00` |
| New Goal + `POST /entities/SavingsGoal` | target `-500` | **accepted** — renders `0.0% / $0.00 / -$500.00` (+"NaN days remaining" quirk, data-dependent) |
| Add Investment + `POST /entities/Investment` | shares `-10`, avg cost `-5`, current price **empty** | **accepted** — row renders `-10 / -$5.00 / $0.00 / -$0.00 / -$50.00` |
| Add Investment | portfolio % `-15.5` | **accepted** (POST 200) |

Form-attribute dumps (every numeric field, 9 forms probed: add/edit expense,
add income, add account, new goal, add progress, add investment ×4 fields,
filters min/max, quick-add step-2): live renders `required` + `step` but **NO
`min` attribute anywhere** — a negative value passes native validation
(`checkValidity() === true`, verified). The live expense row renders the
**double minus** `--$5.50` for negative amounts (its template is also
`-{formatMoney(...)}`) — the clone's identical template is already live-exact.

Clone blockers (all must relax):

1. **`min="0"` on 12 numeric inputs** (live has none): accounts-view:267,
   add-transaction-dialog:330+476 (the FULL modal forms — quick-add-dialog was
   already fixed in round 8, pinned by view-surfaces "drops clone-only
   maxlength/min"), expense-filters-panel:100+123, goals-view:308+414,
   income-view:267, investments-view:402+416+432+446.
2. **`toMinorUnits` throws on negatives** (`parsed < 0` → RangeError) — the
   client conversion layer for every money form.
3. **API guards reject negatives**: `requireNonNegativeInt` (~15 money call
   sites across accounts/budgets/expenses/goals/income/investments POST+PUT),
   `requirePositiveNumber` (shares, portfolioPercent), and one inline guard
   `expenses/[id]/route.ts:35` (`body.amountMinor >= 0`).
4. **Investment client gate** (`investments-view.tsx:103`):
   `!(shares > 0) || !(avgPrice > 0) || !(currentPrice > 0)` + "must be
   positive numbers" toast — blocks negatives AND empty current price (live
   stores 0). Also `portfolioPercent > 0 ? … : null` silently drops
   non-positive values (live stored -15.5).
5. **Investment form attr deltas** (live dump vs clone): shares `step`
   live **0.01** vs clone 0.0001; current price **not required** on live vs
   required in clone; portfolio % `step` live **0.1** vs clone 0.01.
6. **`formatMoney(-0)` renders `$0.00`** — live (Intl direct) renders
   **`-$0.00`** (verified: the negative-shares/zero-price investment value
   column). `Object.is(-0)` handling missing.

Fix direction (parity principle — deliberate replication of the live
zero-validation behavior, documented as ADR-024): money remains **signed
integer minor units**; every layer accepts negatives exactly like live.

**Verified parity / dismissed (no work):**

- **Select popup (portal surface, first live capture this round):**
  SelectContent/Viewport/SelectItem/ItemIndicator class strings are EXACT
  (content incl. popper translate classes, viewport `p-1` + trigger-height/
  width vars, classic item `focus:bg-accent`, indicator `absolute right-2
  flex h-3.5 w-3.5` + lucide-check `h-4 w-4`). The trigger was already pinned;
  this round adds source pins for the popup (F3 hardening below).
- **Focus rings:** identical class sets (`focus-visible:ring-1 ring-ring` on
  the sage header CTA; tabs `ring-2 ring-offset-2`) AND identical computed
  rendering in dark after the round-10 token fix — keyboard-focused tab
  renders `rgb(10,10,10) 0 0 0 2px, rgb(212,212,212) 0 0 0 4px` on BOTH apps
  (the live's first probe caught the `transition-all` mid-frame — re-probed
  after settle).
- **Chart cursor** (default `#ccc` line), **X-axis labels** (`Apr 26 … Sep 26`
  — MMM yy, identical), **tooltip item structure + series colors** (identical).
- **Expense-row double minus for negatives** — live renders `--$5.50` too;
  the clone's `-{formatMoney()}` template is live-exact.
- **Negative money rendering** `-$5.50` (sign before symbol) and total
  subtraction — clone matches.
- **Progress-bar aria attrs** (`aria-valuemin` etc.) — clone-only a11y
  additions, documented bucket (live has no aria on progress bars).
- **Live expenses have no pagination** — already documented in
  expenses-view.tsx:78.

## §C File-by-file change specs

1. **`src/components/finara/analytics-view.tsx`** — F1: replace `tooltipStyle`
   with `{ backgroundColor: "var(--background, #fff)", border: "1px solid
   var(--border, #ccc)", borderRadius: 8, color: "var(--foreground, #000)" }`
   (drop `fontSize: 12` → inherits 16px like live).
2. **`src/lib/money.ts`** — F2: `toMinorUnits` drops the `parsed < 0`
   rejection (keep the non-finite guard; `"-1"` → -100);
   `formatMoney` gains `Object.is(amountMinor, -0)` → `-$0.00`.
3. **`src/lib/api.ts`** — F2: rename + relax the two guards:
   `requireNonNegativeInt` → **`requireSignedInt`** (any safe integer;
   message `${field} must be an integer (minor units)`),
   `requirePositiveNumber` → **`requireFiniteNumber`** (any finite number;
   message `${field} must be a number`). All current call sites are money or
   shares/percent fields — every one is parity-required to accept negatives
   (probed), so no non-money usage keeps the old semantics.
4. **Route files** — F2: swap the guard imports/call sites:
   `accounts/route.ts`, `accounts/[id]/route.ts`, `budgets/route.ts`,
   `expenses/route.ts`, `expenses/[id]/route.ts` (inline `>= 0` dropped from
   the amount branch — keep `Number.isInteger`), `goals/route.ts`,
   `goals/[id]/route.ts`, `income/route.ts`, `income/[id]/route.ts`,
   `investments/route.ts`, `investments/[id]/route.ts`.
5. **View files — remove `min="0"` (12 instances):** accounts-view,
   add-transaction-dialog (×2), expense-filters-panel (×2), goals-view (×2),
   income-view, investments-view (×4).
6. **`src/components/finara/investments-view.tsx`** — F2 beyond the mins:
   shares `step="0.0001"` → `step="0.01"`; current-price Input drops
   `required` (live optional — empty → 0); portfolio % `step="0.01"` →
   `step="0.1"`; `handleSubmit` drops the `> 0` gate (keep a
   `Number.isFinite` NaN defense — unreachable through native inputs, but
   protects the payload), empty `currentPrice` → `0`, `portfolioPercent`
   passes through any finite parsed value (no `> 0` filter).
7. **`src/lib/__tests__/money.test.ts`** — flip the negative-rejection spec
   to negative-conversion + NaN/Infinity rejection; add the `-0` rendering
   spec.
8. **`src/lib/__tests__/functional-parity.test.ts`** — new "round 11" section:
   no `min="0"` across the 6 view files; investment attrs (steps, optional
   current price, no positivity gate, currentPrice→0 fallback, portfolio
   passthrough); `money.ts` no `parsed < 0`; `api.ts` guard names; every
   route uses `requireSignedInt` for amounts; `expenses/[id]` no `>= 0`;
   `tooltipStyle` var-literals + `borderRadius: 8` and NOT the old values.
9. **`src/lib/__tests__/ui-primitives.test.tsx`** — F3 hardening: source
   contracts for the Select popup (portal surfaces cannot render under
   `renderToStaticMarkup` — the existing header comment says they are
   "covered by the browser E2E pass"; this round's live capture now pins
   them): content/viewport/item/indicator class literals from select.tsx.
10. **Docs pass** — AGENTS.md (test count, round-11 ref, signed-minor-units
    note), CLAUDE.md (ANALYZE round-11 ref, parity-gates additions, count),
    README (round-11 paragraph, count ×4), PAD v1.10 (ADR-024 signed minor
    units / live zero-validation replication, §7.1 distribution, §7.2
    evidence, §10 round-11 entry, §11 key files).

## §D TDD plan (red → green)

Target: 251 → ~263.

1. `money.test.ts`: `toMinorUnits("-1")` → -100, `toMinorUnits(-12.99)` →
   -1299 (RED: throws today); `toMinorUnits("abc")`/NaN/Infinity still throw;
   `formatMoney(-0)` → `-$0.00` (RED: `$0.00` today), `formatMoney(0)` → `$0.00`.
2. `functional-parity.test.ts` source contracts (RED against today's sources):
   `min="0"` absent from the 6 files; `step="0.01"` on shares +
   `step="0.1"` on portfolio_percentage + current_price not required;
   investments submit has no `> 0` gate / "must be positive" toast;
   `parsed < 0` absent from money.ts; `requireSignedInt`/`requireFiniteNumber`
   present + old names absent in api.ts; route sources use the new guards;
   `>= 0` absent from expenses/[id]; `tooltipStyle` contains the four var
   literals + `borderRadius: 8`, not `#E2E8F0`/`fontSize: 12`/`borderRadius: 12`.
3. `ui-primitives.test.tsx` select-popup source pins (RED only for absence of
   the readFileSync harness in that file — the class literals already match,
   so these land green once written; they lock the round-11 capture).

## §E Verification plan

- Gates: `bun run lint` · `bun run typecheck` · `bun run test` (~263) ·
  `bun run build`.
- Browser (dev): hover the Analytics chart in dark → tooltip renders dark bg
  (#0a0a0a) + #262626 border + 8px radius + 16px text; light → white bg +
  #e5e5e5 border. Add an expense with amount `-5.5` → saved, row renders
  `--$5.50`, totals subtract; delete it. Add investment with shares `-10`,
  avg cost `-5`, empty current price → saved with `$0.00` current; portfolio
  % `-15.5` accepted; delete. Filters panel accepts negative min. Goal
  target `-500` accepted. Zero console errors.
- VLM spot check: dark Analytics with tooltip hovered, side-by-side.
- Live etiquette: no further live mutations needed (all probe entities
  deleted + verified; theme left dark/USD at `/`).

## §F Validation against the codebase (pre-execution)

- `analytics-view.tsx:94` holds the old `tooltipStyle` (single consumer ×4).
- The 12 `min="0"` lines verified by grep (§B.1 list) — quick-add-dialog is
  NOT among them (already clean).
- `money.ts:14-16` holds `parsed < 0`; `formatMoney` uses `Math.abs` + manual
  sign (only `-0` mishandled).
- `api.ts:26-46` holds both guards; call sites enumerated in §C.4 (grep
  verified — the only inline guard is expenses/[id]:35).
- `investments-view.tsx:98-118` holds the positivity gate + portfolio filter;
  form attrs at 398-449 (shares 0.0001, current required, portfolio 0.01).
- Risk: (a) relaxing `toMinorUnits` affects the CSV import path
  (`import-view.tsx:192`) — consistent with live (same zero-validation
  pattern; the live import of negative rows is unprobed but the direction is
  permissive-only); (b) KPI/filter math with negatives — arithmetic only,
  `percent()` is zero-division-safe, budget "limit-0 footer" semantics
  unchanged; (c) the guard RENAME touches 12 route files — mechanical,
  typecheck-verified; (d) `formatMoney(-0)` — `Object.is` check, no effect on
  positives/ordinary negatives.

## §G Execution record (2026-09-17)

**TDD trajectory: 251 → 270 specs, all green.** RED batches confirmed first
(10 F2 specs + money flips), implementation landed in §C order, then two
in-execution discoveries extended the round (below). Final gates: lint 0 ·
tsc 0 · 270/270 · build 0.

### Delivered as planned (§C.1–§C.9)

- **F1 tooltip** (`analytics-view.tsx`): single shared `tooltipStyle`
  rewritten; 4 Tooltip instances inherit it (§ correction below).
- **F2 money layer** (`money.ts`): `toMinorUnits` accepts negatives
  (`"-1"` → -100; non-finite still throws); `formatMoney` renders
  `-$0.00` for `-0` (`Object.is` check).
- **F2 API layer** (`api.ts` + 11 route files): guards renamed
  `requireNonNegativeInt` → `requireSignedInt`,
  `requirePositiveNumber` → `requireFiniteNumber`; the inline
  `expenses/[id]` `>= 0` branch dropped (kept `Number.isInteger`).
- **F2 form layer**: all 12 `min="0"` removed across 6 view files;
  investments form attrs aligned (shares step 0.01, portfolio step 0.1,
  current price optional → empty becomes 0); the positivity gate and
  `portfolioPercent > 0` filter dropped (finite-NaN defense kept).
- **F2 goals API**: POST `currentAmountMinor > targetAmountMinor` check
  removed; PATCH `Math.min` cap removed; `contribution > 0` silent no-op
  KEPT (matches the live PUT-200-unchanged probe).
- **F3 select-popup pins** (`ui-primitives.test.tsx`): +4 source contracts
  for SelectContent/Viewport/Item/ItemIndicator class literals.

### In-execution discovery 1 — legend census (GREEN phase, 265th spec batch)

The F1 spec's `not.toContain("fontSize: 12")` caught a second hardcoded
12px the plan missed: the Recharts `<Legend wrapperStyle={{ fontSize: 12 }}>`.
Live legend probe: **exactly ONE legend in the whole app** (Analytics
Overview — 16px inherited, default icon type); the Expenses-tab pie and the
Investments-tab charts carry NONE. The clone had three legends (two extra,
all 12px). Fix: removed the two extra `<Legend iconType="circle">`, dropped
the remaining legend's `wrapperStyle`. Census now 1/0/0/0, pinned.

### In-execution discovery 2 — default filter hid negative rows (266th spec)

Browser verification exposed it: the API persisted a −5.50 expense (201)
but the view never showed it. `defaultExpenseFilters()` seeded
`minMinor: 0`, excluding negatives from the default view. Live default:
the min input is EMPTY (placeholder "0.00") and negatives render. Fix:
`minMinor: 0` → `null` in the default factory; panel already renders null
as empty (live-exact). Spec added in `expense-filters.test.ts`.

### In-execution discovery 3 — goal complete-state contract CORRECTED (270th spec batch)

Live probes (create target-100 goal → +100 progress → +50 more, all
cleaned up + verified): the earlier "Add Progress stays enabled at 100%"
reading was WRONG — drawn from a transient pre-refresh DOM. The settled
post-reload truth at BOTH 100% and 150%:

1. the card gains `ring-2 ring-emerald-200 dark:ring-emerald-700`;
2. the badge row gains a Complete badge — default-variant shadcn Badge
   (`border-transparent shadow hover:bg-primary/80`) + emerald palette
   (`bg-emerald-100 text-emerald-800 dark:bg-emerald-700
   dark:text-emerald-100`) + lucide `circle-check-big` icon
   (`w-3 h-3 mr-1`, no JSX space — live DOM is `</svg>Complete`);
3. the **Add Progress button is REMOVED entirely** (not disabled).

Complete condition is percent-based (`progress >= 100`) — the
negative-target goal (0.0% / $0 / −$500) shows NO badge. Implemented in
`goals-view.tsx`; both view-surfaces and functional-parity pins updated.

### F1 evidence CORRECTION (verification phase — computed + pixel probes)

The §B claim that the live's `var(--border)` "resolves #e5e5e5 light /
#262626 dark" was **wrong**. The live's theme tokens are raw HSL triples
(Tailwind v3 convention, e.g. `--border: 0 0% 14.9%`) — defined but
**invalid as direct color values**, so the tooltip's inline `var()` refs
compute as: background **transparent**, the border shorthand **entirely
invalidated** (computed `border-style: none`, `border-width: 0` — NO
border renders), color **inherited**. The live tooltip is a pure
borderless text overlay (#fafafa text on dark, #0a0a0a on light; 8px
radius, 10px padding, 16px inherited font). Probe method note: the
computed-style readout must be taken on the ACTUAL page (a mistargeted
eval against the clone produced the wrong border-style read once — always
`location.href` before probing). Final clone fix:
`{ backgroundColor: "transparent", border: "none", borderRadius: 8 }`
(the explicit `border: "none"` is required — Recharts' own default
`1px solid #ccc` resurfaces otherwise). Verified three ways: computed
byte-match both themes, tooltip-crop pixel analysis (text-glyph locations
identical, 0 border pixels, transparent interiors on both), and 270/270
suite.

### Verification summary

- Gates: lint 0 · tsc 0 · **270/270** · build 0.
- Browser (dev): dark + light Analytics tooltip = computed byte-match
  with live (transparent / none / 0px / inherited / 8px / 16px); legend
  census 1/0/0/0; negative expense −5.5 renders `--$5.50` (the live
  double-minus quirk) and subtracts from totals; negative investment
  (−10 shares / −$5 cost / empty price) renders byte-identical to the
  live probe row incl. `-$0.00`; negative goal renders live-exact (no
  badge); overshoot goal renders ring + Complete + no button (matches
  live at 150%); 9-view console sweep: zero errors / zero warnings.
- VLM cross-check: dark tooltip pair judged "different" by the VLM but
  refuted by pixel-level analysis (identical glyph positions, both
  transparent) — computed styles + pixel crops are the ground truth;
  VLM reads are advisory only.
- Dev DB reset to pristine seed (96 expenses / 4 income / 4 accounts /
  3 goals / 8 investments); theme restored to light (seed default).
- Live etiquette: every live probe entity deleted + verified
  (goals list = 1 seed goal); live theme restored to dark; the probe
  used the app's own Bearer token from an XHR header patch (no
  credentials persisted).
