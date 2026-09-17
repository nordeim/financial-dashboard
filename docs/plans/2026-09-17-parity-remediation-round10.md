# Round-10 Parity Remediation Plan — Visual verification sweep, token re-pin, theme lifecycle

Date: 2026-09-17 · Scope: the first full light+dark VLM screenshot sweep since round 5
(rounds 6–9 changed the DOM substantially), plus the behavioral probes the sweep surfaced.
All findings live-probed this round. Evidence:
`/home/z/my-project/captures/r10-*.{png,json}` (outside the repo, per convention).

## §A Context

Round-9 closed functional parity on settings propagation, exports, the import error card,
and the AI coach anatomy. What had NOT been re-verified since round 5 was **rendered visual
parity at the screenshot level** — rounds 6–9 restyled dialogs, orders, bulk bars, and routes
after the last VLM pass. This round captured the live app and the clone side-by-side
(9 views × 2 themes + login + mobile drawer, 1280×800, scroll-top, full-page), ran VLM
comparisons per pair, and chased every flag to ground truth (DOM geometry, computed styles,
CSS-variable dumps, and controlled live experiments — including 3 throwaway income sources
to reproduce a layout quirk, all cleaned up and verified restored).

## §B Findings (F1–F3 + verified-parity inventory)

**F1 — Sign-out does not reset the theme; sign-in does not follow the server theme
(functional gap, both sign-out paths):**

Live behavior (probed, real flows):
- Sign out (user menu, from dark) → `localStorage.theme` CLEARED + `dark` class REMOVED →
  the login page renders LIGHT (a stored dark theme is never applied on /login either —
  verified by setting it manually and reloading).
- Sign in → the theme comes from the **server-side user record** (`User.theme`, currently
  "dark" for this account) → the app shell applies dark; `localStorage.theme` stays null
  until the next in-app toggle.
- In-app toggle → class + localStorage + `PUT User/me` (the User record carries
  `currency`, `dateFormat`, AND `theme`).

Clone behavior today:
- Sign out keeps the `finara-theme` class applied → the login page renders DARK after
  signing out from dark (live never shows this state).
- Sign-in restores from localStorage only; there is no server-side theme, so a
  sign-out→sign-in cycle starts light in a fresh browser even when the user prefers dark.

Fix (mirrors the live lifecycle with the clone's own Settings record as the "user record"):
1. `prisma/schema.prisma`: `Setting.theme String @default("light")` (+ `db:generate`,
   `db:push`; the seeded settings row gains the column with the default).
2. `/api/settings` GET returns `theme`; PUT validates `theme ∈ {light, dark}` and persists.
3. `theme.ts`: add `resetTheme()` — applies light + clears the stored key (the live
   sign-out semantics); keep the existing store otherwise.
4. `finara-app.tsx` `handleSignOut` (line ~185): call `resetTheme()` — the single
   handler already routes BOTH sign-out paths (UserMenu + mobile drawer), so one seam
   covers both (validated: sidebar.tsx wires `onSignOut={handleSignOut}` twice).
5. `finara-app.tsx` `handleSignIn` (line ~177): write the session immediately, then
   fetch `/api/settings` async and `setTheme(settings.theme)` when it resolves (the
   server theme wins on entry, exactly like live's post-login User/me hydration —
   live shows the same brief async apply).
6. Theme toggles (`sidebar.tsx` lines ~125 + ~261, the two `toggleTheme()` call sites):
   a local `toggleThemeAndPersist()` wrapper fires `PUT /api/settings { theme }`
   fire-and-forget after the local apply (apply first, PUT never blocks).

**F2 — Semantic token mis-pin: `--primary`/`--primary-foreground` are sage in the clone
but classic shadcn neutral on live (ADR-019 correction; plus 3 sibling token fixes):**

Direct CSS-variable dumps on `document.documentElement` (this round, both themes):

| Token | Live light | Live dark | Clone today |
|---|---|---|---|
| `--primary` | `0 0% 9%` (#171717) | `0 0% 98%` (#fafafa) | #059669 (both) |
| `--primary-foreground` | `0 0% 98%` (#fafafa) | `0 0% 9%` (#171717) | #ffffff (both) |
| `--ring` | `0 0% 3.9%` (#0a0a0a) ✓ | `0 0% 83.1%` (#d4d4d4) | #0a0a0a (both) |
| `--destructive` | `0 84.2% 60.2%` (#ef4444) ✓ | `0 62.8% 30.6%` (#7f1d1d) | #ef4444 (both) |
| `--destructive-foreground` | `0 0% 98%` (#fafafa) | `0 0% 98%` (#fafafa) | **missing** |

Root cause: round 6 probed the budget-fill ELEMENT (sage via an explicit class) and
misattributed the value to the `--primary` VARIABLE. This round probed the variables
themselves. Rendered evidence (all live-computed):
- Goals + budget progress fills (`bg-primary`): live = #171717 light / #fafafa dark
  (monochrome), clone = sage. VLM-cropped screenshot confirms ("fill color is black").
- Goals track (`bg-primary/20`): live = neutral 20% translucent, clone = mint.
- Checked Switch (income-edit Active, light): live rgb(23,23,23), clone sage.
- Checked checkbox (expenses row, light): live rgb(23,23,23), clone sage.
- Default-variant buttons: Upload and Extract (disabled, dark) live bg #fafafa vs clone
  sage (the VLM's "gray vs green" flag); AI-coach send (dark) live bg #fafafa/color
  #171717; import error "Start New Import" same pattern.
- Quick Add step-2 Add: identical class strings (tw-merge drops `bg-primary` for
  `bg-primary-sage`) but `text-primary-foreground` resolves white in the clone vs #171717
  on live in dark.
- Error toasts (dark): `bg-destructive` would render #7f1d1d on live vs #ef4444 in the
  clone (toast surfaces are a documented round-4 clone delta, but the token should match
  the live design system).
- Dark `--ring` #0a0a0a is nearly invisible on dark surfaces — the fix restores the live's
  #d4d4d4 focus rings.

The sage CTAs are unaffected: they style via the separate `--primary-sage` token
(globals.css Finara block), which stays.

Fix: `globals.css` — `:root`: `--primary:#171717`, `--primary-foreground:#fafafa`, add
`--destructive-foreground:#fafafa`; `.dark`: `--primary:#fafafa`,
`--primary-foreground:#171717`, `--ring:#d4d4d4`, `--destructive:#7f1d1d`, add
`--destructive-foreground:#fafafa`. Re-pin `design-tokens.test.ts` (the two sage-primary
specs flip to the neutral values with a comment citing the variable-level probe).

**F3 — Mobile drawer menu icon never swaps to X:**

Live (probed this round): closed → `lucide-menu w-5 h-5`; open → `lucide-x w-5 h-5`
(the r8 mobile-header capture already showed the X state). The clone's mobile header
button always renders `<Menu>` (only the aria-label swaps). Fix in `sidebar.tsx`:
`{menuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}`
(lucide `X`, `w-5 h-5` — matches the live class order discipline).

**Verified parity / dismissed flags (no work):**

- **EUR quick-amount chips (round-9 deferred item, now live-captured):** expense
  `+ EUR1 | + EUR5 | + EUR10 | + EUR50 | + EUR100 | + EUR500`, income
  `+ €1.00 | + €5.00 | + €10.00 | + €50.00 | + €100.00 | + €500.00` — the clone's
  reasoned templates are exactly right.
- **Settings save flow:** live saves via an explicit "Save Settings" button (selects only
  set client state; PUT fires on click) — the clone matches (button + handleSave + PUT).
- **Live settings live on the User record** (`currency`/`dateFormat`/`theme` via
  `PUT User/me`); the clone keeps them in Settings — internal storage difference,
  user-invisible (the F1 fix aligns the theme lifecycle).
- **Income grid "single vs multi column":** data difference (live: 1 income card; clone:
  4). Classes identical (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
- **Income 30px horizontal overflow with a long title in column 3:** reproduced ON LIVE by
  experiment (3 throwaway income sources; scrollWidth 1280→1310, trash button at
  right:1310) — a live-app quirk the clone replicates faithfully; probe data deleted and
  the live restored to the single "Salary" source (verified).
- **Import page horizontal overflow:** both apps — the hidden file input (both starting at
  x=338) extends past the viewport (live to 1618, clone to 1296). Shared quirk, invisible.
- **Synced badge + avatar:** DOM and geometry identical (badge 86.86×22, wifi 12×12,
  avatar 224×36, aside 256). Round-1 VLM flags were crop-scaling artifacts.
- **FAB geometry:** desktop + mobile identical (24px insets, 56×56).
- **Next.js dev "N" indicator** in clone captures: dev-server-only overlay; production
  builds do not render it. Not an app defect.
- **Login demo-credentials affordance:** documented deliberate delta (round-4 bucket).
- **VLM sweep verdicts:** light 8/9 + dark 7/9 VISUALLY EQUIVALENT; every other flag
  resolved to F2/F3, a data difference, or a capture artifact (above).

## §C File-by-file change specs

1. **`src/app/globals.css`** — F2 token corrections (5 value changes + 1 addition, light
   and dark blocks as tabulated in §B).
2. **`src/lib/__tests__/design-tokens.test.ts`** — re-pin `primary`,
   `primary-foreground` (light+dark) to the neutral values; add `ring` dark, `destructive`
   dark, `destructive-foreground` pins; update the spec titles/comments to cite the
   variable-level probe (element-level round-6 probe was the misattribution source).
3. **`prisma/schema.prisma`** — F1: `Setting.theme String @default("light")`.
4. **`src/app/api/settings/route.ts`** — F1: return + validate + persist `theme`.
5. **`src/components/finara/theme.ts`** — F1: `resetTheme()` export (applies light +
   clears the stored key — the live sign-out semantics); no change to the existing
   store semantics.
6. **`src/components/finara/sidebar.tsx`** — F3: menu icon swaps Menu↔X (`w-5 h-5`);
   F1: the two `toggleTheme()` call sites (lines ~125 + ~261) gain the fire-and-forget
   theme PUT via a local `toggleThemeAndPersist()` wrapper (apply first, PUT never
   blocks).
7. **`src/components/finara/finara-app.tsx`** — F1: `handleSignOut` (line ~185) calls
   `resetTheme()` — the single handler already routes BOTH sign-out paths (UserMenu +
   mobile drawer via `onSignOut`, lines 234 + 242); `handleSignIn` (line ~177) writes
   the session immediately, then fetches `/api/settings` async and
   `setTheme(settings.theme)` when it resolves (server theme wins on entry, exactly
   like live's post-login User/me hydration).
8. **`src/lib/__tests__/functional-parity.test.ts`** (new "theme lifecycle + round-10
   pins" section) — source contracts: resetTheme exists and `handleSignOut` calls it;
   `handleSignIn` applies the fetched theme; toggles PUT the theme; settings route
   validates the enum; globals.css carries the corrected token literals; sidebar
   renders the X swap.
9. **Docs pass** — AGENTS.md (token invariant correction + theme-lifecycle invariant +
    round-10 plan reference), CLAUDE.md (ANALYZE round-10 ref, parity gates list),
    README.md (dark-mode row: theme follows the account across sign-out; test count),
    PAD (ADR-019 amendment note, ADR-023 theme lifecycle, key files, test distribution).

## §D TDD plan (red → green)

New/updated specs (target: 242 → ~250):

1. `design-tokens.test.ts` (updates): `--primary` light `#171717` / dark `#fafafa`;
   `--primary-foreground` light `#fafafa` / dark `#171717`; `--ring` dark `#d4d4d4`;
   `--destructive` dark `#7f1d1d`; `--destructive-foreground` `#fafafa` both themes.
2. `functional-parity.test.ts` (new section "theme lifecycle + round-10 pins"):
   - `theme.ts` exports `resetTheme` and its source shows light-apply + storage clear.
   - `finara-app.tsx` `handleSignOut` calls `resetTheme()` (single seam, both paths).
   - `finara-app.tsx` `handleSignIn` fetches settings and applies `theme`.
   - Toggle call sites PUT the theme to `/api/settings`.
   - `api/settings/route.ts` validates `theme ∈ {light, dark}`.
   - `schema.prisma` carries `theme String @default("light")`.
   - `sidebar.tsx` renders the Menu↔X conditional (`menuOpen ? <X` present).
   - `globals.css` literals: `--primary: #171717`, dark `--primary: #fafafa`,
     `--ring: #d4d4d4`, `--destructive: #7f1d1d`.

Red first (the pins fail against today's sage/missing values), then green.

## §E Verification plan

- Gates: `bun run lint` · `bun run typecheck` · `bun run test` (242 + new) ·
  `bun run build`; `db:push` applies the schema change cleanly (dev DB keeps its data).
- Browser (dev server): dark sign-out → login renders LIGHT (class removed); sign-in →
  dark returns (server theme); toggle → persists across reload AND across
  sign-out→sign-in; goal/budget progress fills render monochrome (light #171717, dark
  #fafafa) via computed-style probes; Upload-and-Extract disabled renders the neutral
  gray; AI send button neutral; checked switch/checkbox neutral; mobile drawer opens with
  the X icon and closes back to hamburger; zero console errors.
- VLM re-shoot (spot): dark Goals + light Import + dark Import pairs re-compared —
  the F2 color deltas should clear.
- Live etiquette: already restored (theme dark, USD + MM/dd/yyyy, income back to the
  single Salary card, left at `/`); no further live mutations needed this round.

## §F Validation against the codebase (pre-execution)

- `globals.css` lines 66–67/102–103 hold the sage values; the `.dark` block (93–127)
  carries the wrong `--ring` (113) and `--destructive` (110); `--destructive-foreground`
  is absent from both blocks — the fix is 6 lines.
- `design-tokens.test.ts:70–103` pins the sage primary (2 specs to rewrite + siblings to
  add). No other test pins these tokens (grep confirmed: `--primary` appears only there).
- `sidebar.tsx:270–278` is the mobile menu button (Menu always rendered, only the
  aria-label swaps).
- BOTH sign-out paths route through `finara-app.tsx` `handleSignOut` (line 185, wired
  via `onSignOut` at lines 234 + 242) — one seam covers UserMenu + mobile drawer.
- `handleSignIn` (finara-app.tsx line 177) stores the session then navigates — the
  async theme fetch slots in after the session write (no login delay).
- The two `toggleTheme()` call sites live in sidebar.tsx (lines 125 + 261).
- `theme.ts` is the single theme seam (no other module writes the class) — `resetTheme`
  is a clean addition; `setTheme` already exists for the sign-in apply.
- `api/settings/route.ts` GET/PUT already round-trips the Settings row; adding `theme`
  follows the existing currency/dateFormat validation pattern (`categories.ts` gains a
  `THEMES` const? No — a 2-value enum literal validated inline like the date formats…
  date formats validate against `DATE_FORMATS`; currencies against `CURRENCIES` — add
  `THEMES = ["light", "dark"]` to `ui-maps`? Cleaner: a local const in the route, pinned
  by the spec. Prefer `categories.ts` only if the test file convention requires it —
  it does not; keep it local.)
- Risks: (a) `db:push` on the dev DB adds a column with a default — non-destructive;
  (b) the settings PUT from the toggle is fire-and-forget — a failed PUT must not break
  the local apply (order: apply locally, then PUT); (c) the F2 flip changes several
  rendered surfaces at once — the design-tokens + functional-parity pins plus the
  browser computed-style probes cover each one.

## §G Execution record (2026-09-17)

**TDD:** RED first — 12 spec-level failures isolated (9 new specs + 3 re-pinned
design-token values failing against the sage/missing values), 240 existing green.
GREEN: 251/251 across 13 files (design-tokens 10 → 12; functional-parity 32 → 39).

**Deviations from §C/§D (validated against the codebase before implementing):**

- **No `prisma/schema.prisma` change.** The plan drafted `Setting.theme String
  @default("light")`, but the clone's `Setting` model is KEY-VALUE (`key`/`value`
  rows — `currency` and `dateFormat` are rows, not columns). The theme is therefore
  a seeded `theme="light"` ROW + a route-level `THEMES` enum validation, exactly
  like the existing currency/dateFormat pattern. No migration, no `db:push`, no
  dev-DB touch (§F risk (a) moot). `types.ts` `SettingsDto.theme: "light" | "dark"`
  carries the contract.
- The seed writes the `theme` row (`light`) alongside the other settings rows.

**Implemented (files):**

1. `globals.css` — F2: `--primary`/`--primary-foreground` neutral (light
   `#171717`/`#fafafa`, dark `#fafafa`/`#171717`), dark `--ring #d4d4d4`, dark
   `--destructive #7f1d1d`, `--destructive-foreground #fafafa` both themes + the
   `@theme inline` color mapping; explanatory comments cite the variable-level probe.
2. `theme.ts` — `resetTheme()` (remove key + apply light + notify, no re-persist).
3. `finara-app.tsx` — `handleSignOut` calls `resetTheme()` (both sign-out paths);
   `handleSignIn` fetches `/api/settings` async → `setTheme(theme)` (offline-tolerant).
4. `sidebar.tsx` — `toggleThemeAndPersist()` (apply → fire-and-forget PUT) wired to
   BOTH toggle call sites; the mobile menu button renders
   `menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>` (F3).
5. `api/settings/route.ts` — `theme` in SETTING_KEYS/DEFAULTS/DTO round-trip with
   `THEMES = ["light","dark"]` validation on PUT (invalid values ignored, like the
   other settings keys).
6. `seed.ts` / `types.ts` — the `theme` row + the DTO field.
7. `design-tokens.test.ts` — primary pair re-pinned (light+dark), ring/destructive
   dark + destructive-foreground pins added; comments cite the variable-level probe
   and the round-6 element-probe misattribution.
8. `functional-parity.test.ts` — "theme lifecycle (round 10 F1/F3)" describe block:
   7 source-contract specs (resetTheme semantics, sign-out seam, sign-in apply,
   toggle persistence x2 sites, settings enum validation, Menu↔X, token literals).

**Gates:** lint 0 · typecheck 0 · tests 251/251 · build 16/16 routes.

**Browser verification (executed):**

- F1 lifecycle, both directions: sign-out from dark → `/login` renders LIGHT with
  `localStorage["finara-theme"]` ABSENT (null — matches the live key-absence, not a
  "light" write); sign-in → server "dark" applied async; toggled server to "light"
  then signed out/in → light returns (server wins in both directions); restored
  dark via the real menu toggle and confirmed the PUT persisted (`GET /api/settings`
  → `theme:"dark"`).
- F2 rendered surfaces (computed styles): light + dark `--primary`/`--primary-foreground`
  /`--ring`/`--destructive` all equal the live dumps; goal fills #171717 (light) /
  #fafafa (dark); budget fills, checked switch, checked checkbox, disabled default
  buttons all neutral monochrome.
- F3: mobile drawer opens with the X glyph, closes back to hamburger.
- Console: zero errors across the full sign-in → toggle → sign-out cycle on fresh
  sessions. The sign-out console error observed in a long-lived session was
  stash-verified PRE-EXISTING and does not reproduce on fresh sessions (dev-only
  Fast-Refresh state) — documented, not a round-10 regression.

**VLM re-shoot (plan §E):** dark Goals + light Import + dark Import re-captured
post-fix and re-compared — all three **VISUALLY EQUIVALENT**. (The first dark-Goals
re-capture caught a light render — the F1 verification cycle had left the server
theme "light" at capture time; re-captured with class=dark confirmed.) Full-sweep
totals: light 8/9 + dark 7/9 equivalent pre-fix; every flag resolved to F2/F3, a
data difference, or a capture artifact (§B inventory).

**Live etiquette:** the live app was left dark/USD/MM-dd at `/` with the probe data
removed (verified in the earlier session); no live mutations this execution pass.

**Docs:** AGENTS.md (251 tests; ADR-019 amendment text; ADR-023 theme-lifecycle
invariant; Menu↔X; round-10 plan reference), CLAUDE.md (round-10 in ANALYZE, 251
tests, theme-follows-account principle, parity gates list), README (dark-mode row,
`--primary` token row + corrected `--primary-sage` usage, round-10 paragraph, 251
tests ×4, settings API row, verification paragraph), PAD v1.9 (ADR-019 amendment,
ADR-023, §7.1 distribution 251 + per-file counts, §7.2 evidence, §10 round-10
resolved entry, §11 key files incl. theme.ts).
