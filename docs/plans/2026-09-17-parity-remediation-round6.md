# Round-6 Parity Remediation Plan — Computed-Token Parity, Modal Anatomy, Login Page

**Date:** 2026-09-17
**Base:** `6042b1e` (main, round-5 complete + session docs; gates: lint 0 / tsc 0 / 101 tests / build 0 — re-verified before audit)
**Auditor method:** live login → per-view DOM captures (9 views + 8 dialogs + login + dark + mobile) → signature-multiset DOM diff vs clone → computed-style probes (tokens, radii, blurs, shadows) → VLM side-by-side. Evidence archive: `/home/z/my-project/captures/` (outside the repo).

## §A Audit summary

Round-5 closed the font/palette/chart gaps, but this audit — the first to probe **computed styles of the shadcn semantic tokens and the Tailwind v4 utility scales** (radius/blur), and the first to capture **every live dialog's header/body anatomy** — found three systemic visible deltas plus a set of per-element ones. Every finding below is live-probed (not inferred), with the probe value recorded.

The repo is functionally at parity: all API flows, filters, pagination, CRUD, dark mode, mobile drawer, FAB flow, and Quick Add match. The gaps are visual/structural.

## §B Findings

### Systemic (affect every surface)

**F1 — shadcn semantic tokens drift from the live app's classic neutral theme.**
Live probes (test-div `bg-background`/`text-muted-foreground`/etc. + real elements, light + dark):

| Token | Live (light) | Live (dark) | Clone today |
|---|---|---|---|
| `--background` | `#ffffff` (outline btn bg rgb(255,255,255)) | `#0a0a0a` | oklch(0.968…) grayish / oklch(0.145…) |
| `--foreground` | `#0a0a0a` | `#fafafa` | slate-950-ish oklch |
| `--muted-foreground` | `#737373` (th rgb(115,115,115)) | `#a3a3a3` | oklch ≈ #52525b (darker, bluer) |
| `--border` / `--input` | `#e5e5e5` (outline btn border rgb(229,229,229)) | `#262626` | oklch ≈ #e4e4e7 blue-tinted |
| `--secondary` / `--accent` / `--muted` | `#f5f5f5` | `#262626` | oklch variants |
| `--ring` | `#0a0a0a` (hsl "0 0% 3.9%") | (same family) | emerald-600 oklch |
| `--primary` | `#059669` rgb(5,150,105) ✓ ≈ | emerald | ≈ correct — pin exact hex |

Visible impact: outline buttons render light-gray instead of white (VLM confirmed), all muted text (table headers, helper text) is darker/bluer than live, focus rings are emerald instead of near-black, card borders are blue-tinted instead of neutral. Severity: **Critical (visual)**.

**F2 — Radius scale drift (Tailwind v4 vs the live app's v3).**
Live probes: `rounded-md` 6px, `rounded-lg` 8px, `rounded-xl` 12px, `rounded-sm` 2px (dropdown items), `rounded-2xl` 16px (✓ already equal). Clone computes 8/10/14/4 (v4 regenerated scale; the `--radius: 0.625rem` calc chain in `@theme inline`). Affects **every** button (53× rounded-md), card/modal (34× rounded-xl), and medium surface (16× rounded-lg). VLM saw KPI icon tiles render "pill" vs live "rounded square". Severity: **Critical (visual)**.

**F3 — `backdrop-blur-sm` renders 8px vs live 4px.**
Tailwind v4 shifted the blur scale (added `blur-xs`). All 12 glass surfaces (cards, mobile top bar) blur double the live amount. Fix by pinning `--blur-sm: 4px`. Severity: **High (visual)**.

### Modal anatomy (all full modals)

**F4 — Live modal headers are a flex row containing the title AND an in-flow close button; the clone renders a bare title with an absolutely-positioned close at content end.**
Live anatomy (Add Expense, Add Income, Add Investment, Edit Income, AI Coach):
`DialogHeader(p-6) > div.flex.items-center.justify-between > [title-div(icon+text), button.ghost.h-9.w-9(X)]`. The Quick Add chooser already implements this correctly (round-4). The clone's other dialogs don't. Fix per-dialog (Quick Add is the model; keep `showCloseButton={false}` on DialogContent and render the in-flow close). Severity: **High**.

**F5 — DialogContent card base carries `relative`** (live card has none). Remove from the base in `dialog.tsx` once close buttons are in-flow (F4). Export the base string for the pin spec. Severity: **Medium**.

**F6 — Per-dialog width / dark-card / max-height matrix mismatches.**

| Dialog | Live | Clone today |
|---|---|---|
| Add/Edit Expense | `max-w-2xl` + `max-h-[90vh] overflow-y-auto`, `bg-white dark:bg-gray-800` | ✓ width/scroll (fix header/body only) |
| Add Income Source (kind=income) | `max-w-lg` + max-h-90vh | inherits `max-w-2xl` ✗ |
| Edit Income Source | `max-w-lg` + max-h-90vh | `max-w-md` ✗ |
| Add/Edit Investment | `max-w-md` + max-h-90vh | `max-w-lg` ✗ |
| New/Edit Goal | `max-w-md`, NO max-h/scroll, `dark:bg-gray-900 dark:text-white` | `max-w-lg` + max-h ✗ |
| Add Account | `max-w-md`, NO max-h, `bg-card`, **overlay `bg-black/60`** | `max-w-lg` + max-h, black/50 ✗ |
| Add Progress | `max-w-sm`, NO max-h, `dark:bg-gray-900 dark:text-white` | max-w-sm ✓ but has max-h ✗ |
| AI Coach | `max-w-2xl h-[80vh] flex flex-col` | ✓ |

Severity: **High** (widths are immediately visible).

**F7 — Live edit dialogs render NO DialogDescription subtitle; the clone's accounts/goals/investments/income dialogs all render one.** Live headers are title-only. Remove the descriptions (and `aria-describedby={undefined}` on Content to suppress the Radix warning). Severity: **High (visible text delta)**.

**F8 — Add Expense quick-select/manual structure deltas:**
1. Each quick-select tile is wrapped in `div tabindex="0"` on live (framer wrapper); clone renders bare buttons.
2. Live tile button classes include a bare `flex` (tailwind-merge replaces the Button base `inline-flex`); clone renders `inline-flex … flex-col`. Add `flex` to the tile className.
3. Quick-amount chips: live = Button outline (`inline-flex … border border-input bg-background shadow-sm hover:bg-accent … h-9 px-4 py-2`) each wrapped in `div tabindex="0"`; clone = raw `<button>` missing the base classes, no wrapper.
4. "Quick Add Amount" label: live = Label component classes (no `mb-2`); clone = `p.mb-2`. 
5. Body wrapped in `div.p-6.pt-0` (CardContent); clone goes straight to `div.mb-6` (AI Coach already has the wrapper ✓).
Severity: **High**.

**F9 — AI Coach assistant bubble leaks `node="[object Object]"`.** react-markdown v10 passes `node` to custom components; the clone spreads it onto `<p>`. Destructure it out. Severity: **Medium (DOM artifact)**.

### Element-level

**F10 — FAB wrapper `tabindex="0"`** on live (`div.fixed.bottom-6.right-6.z-50[tabindex=0]`); clone lacks it (Dashboard + Expenses). Severity: Low.

**F11 — Expenses search icon:** live `… top-1/2 transform w-4` (with `text-gray-400`); clone has `pointer-events-none` instead of `transform`. Severity: Low.

### Login page (first impression)

**F12 — Logo structure:** live = `span.flex.shrink-0.overflow-hidden.rounded-full.relative.h-20.w-20.sm:h-24.sm:w-24.shadow-lg.ring-4.ring-white/50.group-hover:shadow-xl.transition-all.duration-300` wrapping `img.aspect-square.h-full.w-full.object-cover`; clone = single img with the visual classes + `transition-shadow` (live: `transition-all`) + `width/height` attrs. Severity: Medium.

**F13 — Google button:** live is a raw `<button class="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[16px] group">` with the icon in a `div.-ml-4.transition-transform.duration-200`; clone uses the shadcn Button base (different class set) and a `span` wrapper. Severity: Medium.

**F14 — Top gradient strip:** live `absolute top-0 left-0 right-0 h-1`; clone `absolute inset-x-0 top-0 h-1`. Severity: Low.

**F15 — Divider line:** live `shrink-0 h-[1px] w-full bg-slate-200`; clone `h-px w-full`. Severity: Low.

**F16 — Form wrapper:** live `<form class="space-y-4 sm:space-y-5">` (no `novalidate`) directly containing the field groups; clone `<form noValidate>` + an extra `div.space-y-4.sm:space-y-5` wrapper. Severity: Medium.

**F17 — Email/lock icons:** live `text-slate-500` + `transform` (no pointer-events-none); clone `text-slate-400` + `pointer-events-none`. **Visible color delta.** Severity: Medium.

**F18 — Login inputs:** live carry `px-3 py-2 … ring-offset-background … focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 … pl-10 h-11 sm:h-12 …` (no `shadow-sm`, no `transition-colors`, `py-2` not `py-1`); clone inherits the classic Input base (`py-1`, `shadow-sm`, `ring-1`). Severity: Medium (input height/padding differs).

**F19 — Sign-in button:** live base differs — `gap-1` (clone `gap-2`), `px-3 py-2` (clone `px-4 py-2`), `ring-offset-background focus-visible:ring-2 … ring-offset-2` (clone `ring-1`). Severity: Medium.

**F20 — Sign-up button:** live = plain text + `span.font-medium.text-slate-700` around "Sign up"; clone puts `font-medium` on the whole button. Severity: Low.

**F21 — Mobile-only spacer:** live renders `div.mt-8.text-center.text-xs.text-slate-400.sm:hidden > p(&nbsp;)` after the card; clone missing. Severity: Low.

**F22 — Label ids:** live `for="email"` / `for="password"`; clone `login-email` / `login-password`. Severity: Low (align for exactness).

**F23 — Toaster on the login page:** live login renders no shadcn toaster viewport; the clone does (from `layout.tsx`). **Decision: keep** — the clone's login uses toasts for the Google/Forgot/Sign-up affordances (documented clone features), and the empty viewport div is invisible. Reclassify as a documented inert infra delta.

### Documented buckets (no action — deltas classified during the audit)

lucide polyline-vs-path internals & `lucide-trash-2 lucide-trash2` dual class (same glyphs); `fade-in-up`/`stagger-*` (ADR-013); Next.js infra (`script`, `next-route-announcer`, body classes); sun/moon icon (theme-state artifact of capture); live's duplicated toaster viewport (base44 quirk); data-count deltas (seed data vs live user's sparse data); `href="/"` vs `href="/Dashboard"` (ADR-001); `aria-*`/`aria-hidden` additions (a11y); oklab-vs-rgba notation for `/alpha` utilities (equivalent colors); `rounded-full` `calc(infinity)` vs `9999px` (equivalent); shadow-lg extra zero-inset layers (invisible); demo-credentials box on login (documented clone affordance).

## §C Fix design

### C.1 Token pin (F1–F3) — `src/app/globals.css`

Replace the `:root` and `.dark` semantic-token values with the live-probed classic-neutral set (keep `--primary` emerald and the Finara custom tokens untouched):

```css
:root {
  --radius: 0.5rem;            /* informational; utilities pinned below */
  --background: #ffffff;
  --foreground: #0a0a0a;
  --card: #ffffff;
  --card-foreground: #0a0a0a;
  --popover: #ffffff;
  --popover-foreground: #0a0a0a;
  --primary: #059669;
  --primary-foreground: #ffffff;
  --secondary: #f5f5f5;
  --secondary-foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --accent: #f5f5f5;
  --accent-foreground: #0a0a0a;
  --destructive: #ef4444;          /* classic neutral destructive (Reasoned: not live-probed — destructive toasts only) */
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #0a0a0a;
  /* chart/sidebar tokens: unchanged (not app-rendered) */
}
.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #0a0a0a;
  --card-foreground: #fafafa;
  --popover: #0a0a0a;
  --popover-foreground: #fafafa;
  --primary: #059669;
  --primary-foreground: #ffffff;
  --secondary: #262626;
  --secondary-foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --accent: #262626;
  --accent-foreground: #fafafa;
  --destructive: #ef4444;
  --border: #262626;
  --input: #262626;
  --ring: #0a0a0a;
}
```

In the `@theme inline` block, replace the `calc()` radius chain with the v3 literals and pin the blur:

```css
--radius-sm: 0.125rem;   /* 2px  — v3 rounded-sm */
--radius-md: 0.375rem;   /* 6px  — v3 rounded-md */
--radius-lg: 0.5rem;     /* 8px  — v3 rounded-lg */
--radius-xl: 0.75rem;    /* 12px — v3 rounded-xl */
--blur-sm: 4px;          /* v3 backdrop-blur-sm */
```

Notes:
- `@theme inline` values apply at build (no cascade concerns, unlike the palette pin's unlayered `:root` block).
- Verify `rounded-2xl` (16px) stays correct (v4 default `--radius-2xl: 1rem` is already equal — leave it).
- The existing unlayered `:root` palette pin (ADR-018) stays exactly as-is.

### C.2 Dialog anatomy (F4–F8)

1. `dialog.tsx`: remove `relative` from the card base; export `DIALOG_CARD_BASE` for the pin spec; add optional `backdropClassName` prop (merged onto the Radix-Close backdrop) for Add Account's `bg-black/60`; keep default `bg-black/50`. Default rendering is otherwise unchanged (pins unaffected).
2. `add-transaction-dialog.tsx`:
   - `DialogContent className` becomes kind-aware: expense → `max-h-[90vh] max-w-2xl overflow-y-auto`; income → `max-h-[90vh] max-w-lg overflow-y-auto`.
   - `showCloseButton={false}`; DialogHeader renders the live row: `div.flex.items-center.justify-between > [DialogTitle(icon+text), in-flow ghost h-9 w-9 X close]` (Quick Add pattern).
   - Body wrapped in `div className="p-6 pt-0"`.
   - Quick-select tiles: `div tabIndex={0}` wrapper + `flex` added to the tile className (`h-16 w-full flex flex-col gap-1 …`).
   - Quick-amount chips: Button `variant="outline" className="h-9 px-4 py-2"` inside `div tabIndex={0}`; label becomes `<Label className="text-sm font-medium leading-none">Quick Add Amount</Label>` (no mb-2).
3. `ai-coach-dialog.tsx`: header row + in-flow close; strip `node` from the markdown `p` component.
4. `income-view.tsx` edit dialog: `max-w-lg`, header row + close, drop description, `p-6 pt-0` body, dollar-sign title icon (live uses DollarSign, not TrendingUp, for Edit Income Source).
5. `investments-view.tsx`: `max-w-md`, header row + close (trending-up icon), drop description, `p-6 pt-0`.
6. `goals-view.tsx`: New/Edit Goal → `max-w-md` NO max-h/scroll, `dark:bg-gray-900 dark:text-white` card, target icon, no close button, no description, `p-6 pt-0`. Add Progress → `max-w-sm`, drop max-h, `dark:bg-gray-900 dark:text-white`, trending-up icon, `p-6 pt-0`.
7. `accounts-view.tsx`: `max-w-md` NO max-h/scroll, `bg-card` card, `backdropClassName="bg-black/60"`, plain title (no icon, no close), no description, `p-6 pt-0`.

### C.3 Element-level (F10–F11)

- FAB wrapper div gets `tabIndex={0}` in `dashboard-view.tsx` + `expenses-view.tsx`.
- Expenses search icon: `text-gray-400` + add `transform`, drop `pointer-events-none`.

### C.4 Login page (F12–F22)

Apply the live-exact structures/classes listed in §B (logo span+img, raw Google button + div icon wrapper, `left-0 right-0` strip, `shrink-0 h-[1px]` divider, form-carried `space-y-4 sm:space-y-5` without `noValidate`, slate-500 icons with `transform`, live input class string, live sign-in class string, sign-up span, mobile-only spacer, `email`/`password` label ids). Keep the demo-credentials box and the toast affordances (documented clone features).

## §D TDD plan (red → green)

New/changed specs, written FIRST and confirmed red:

1. `src/lib/__tests__/design-tokens.test.ts` — parses `globals.css`; asserts each `:root`/`.dark` semantic token equals the probed hex; asserts `@theme inline` radius/blur pins (`--radius-sm: 0.125rem`, `--radius-md: 0.375rem`, `--radius-lg: 0.5rem`, `--radius-xl: 0.75rem`, `--blur-sm: 4px`).
2. `src/lib/__tests__/ui-primitives.test.tsx` — add: `DIALOG_CARD_BASE` export contains the live card string and NOT `relative` (base must not grow a `relative`).
3. `src/lib/__tests__/login-view.test.tsx` — `renderToStaticMarkup(<LoginView …/>)` pins: logo span/img structure, Google button class string, icon classes (`text-slate-500` + `transform`, no `pointer-events-none`), input class string (`py-2`, `ring-offset-background`, `focus-visible:ring-2`, no `shadow-sm`), sign-in button (`gap-1`, `px-3 py-2`, `ring-offset-2`), sign-up `span.font-medium.text-slate-700`, divider `shrink-0 h-[1px]`, form `space-y-4 sm:space-y-5` with no `novalidate`, mobile spacer `sm:hidden`.

Component-structural fixes (headers, wrappers, tabindex) are portal/interaction-dependent — verified by the browser DOM re-diff per the established workflow (§E), not by static specs.

## §E Execution & verification

- [T1] RED: write the three spec additions; run `bun run test` — expect exactly the new specs failing.
- [T2] GREEN tokens: apply C.1 → design-tokens spec green; full suite green.
- [T3] dialog.tsx base changes (C.2.1) + primitive spec addition green.
- [T4] add-transaction-dialog restructure (C.2.2).
- [T5] ai-coach + income + investments + goals + accounts dialogs (C.2.3–7).
- [T6] FAB tabindex + search icon (C.3).
- [T7] login-view restructure (C.4) + login spec green.
- [T8] Gates: `bun run lint && bun run typecheck && bun run test && bun run build` all green.
- [T9] Browser verification (dev server): login → all 9 views light+dark; per-dialog header/body checks vs the captured live DOMs; computed-style re-probes (tokens/radius/blur equal live); FAB tabindex; search icon; expenses quick-select flow round-trip; zero console errors.
- [T10] DOM re-diff per view vs the live captures; every residual classified into §B documented buckets.
- [T11] VLM side-by-side spot check (dashboard, expenses, login) — expect the radius/blur/token findings gone.
- [T12] Docs: README (design-system section: token pin note), AGENTS.md (invariants: semantic-token pin + radius/blur pin + modal anatomy rules), PAD v1.5 (ADR-019), this plan's execution record.
- [T13] Atomic Conventional Commits on main; push via `docs/ssh_git_wrapper_v3.py`.

## §F Validation of this plan against the codebase (pre-execution)

- `globals.css` `:root`/`.dark` blocks and `@theme inline` radius chain confirmed at lines 36–127 — exactly as described in C.1.
- `dialog.tsx` confirmed: base string with `relative` (line 57), absolute close (line 63), `overlayClassName` prop exists; `backdropClassName` does not (to add).
- `add-transaction-dialog.tsx`: single static `DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"` (line 238) — confirmed kind-unaware.
- `quick-add-dialog.tsx` implements the header-row pattern — reusable model.
- Dialog usages confirmed at accounts:203, goals:275+379, income:229, investments:332 — all with descriptions and the shared width/max-h set.
- Login deltas confirmed against `login-view.tsx` lines 48–218.
- Risk check: pinning `--radius-*` changes shadcn primitives' rounded utilities to v3 values — that is the desired outcome (live renders v3 radii through the same utilities). No primitive class-string pins change (they pin strings, not computed values), so the existing 101 tests stay green.
- Risk check: removing DialogDescription from edit dialogs removes visible subtitle text — matches live (probed: title-only headers on all five edit/add dialogs).
- Risk check: `--ring: #0a0a0a` changes focus-ring color everywhere — matches live probes ("0 0% 3.9%").

## §G Execution & verification record (2026-09-17)

**TDD red phase:** 21 failing tests written first — `design-tokens.test.ts` (10), `login-view.test.tsx` (10), one new `ui-primitives.test.tsx` spec (1). All 101 existing tests stayed green through the red phase.

**Green phase (per the plan's task order):**
- T2 `globals.css`: `:root`/`.dark` semantic tokens → live-probed hex set; `@theme inline` radius chain → v3 literals + `--blur-sm: 4px`.
- T3 `dialog.tsx`: `DIALOG_CARD_BASE` exported (no `relative`), optional `backdropClassName` prop.
- T4 `add-transaction-dialog.tsx`: kind-aware width (expense 2xl / income lg), header row + in-flow close, `p-6 pt-0` body, tile `div tabIndex={0}` wrappers + bare `flex` on tiles, Button-based quick-amount chips in `div tabIndex={0}`, Label-based "Quick Add Amount".
- T5 dialogs: ai-coach (header row + close + `node`-prop strip), income edit (lg, DollarSign icon, no description, body wrapper), investments (md, TrendingUp icon, no description), goals New/Edit (md, no scroll, dark gray-900 card, Target icon, no close, dark field classes) + Add Progress (sm, no scroll, dark card, TrendingUp), accounts (md, no scroll, bg-card, black/60 backdrop, plain title, stacked Name→Bank→Type→Balance, pt-4 buttons).
- T6 FAB wrappers `tabIndex={0}` (dashboard + expenses); expenses search icon `transform` (no pointer-events-none).
- T7 login page: span-wrapped logo, raw Google button + div icon wrapper, `left-0 right-0` strip, `shrink-0 h-[1px]` divider, form-carried spacing (no noValidate/extra div), slate-500 + transform icons, `LOGIN_INPUT_CLASSES`, gap-1 px-3 py-2 ring-2 submit, sign-up span, `sm:hidden` spacer, email/password ids.

**Mid-verification regression caught and root-caused:** removing `relative` from the dialog card let the round-4 backdrop-Close (absolute inset-0) paint above the static card and swallow clicks. Live probes then showed the correct contract: the live overlay itself carries `bg-black/50`, full modals do NOT dismiss on overlay click (Add Expense stayed open through a real click), and only the Quick Add chooser dismisses. Fix: backdrop-Close removed entirely; `bg-black/50` moved onto the overlay base (live-exact overlay class set); Quick Add wires its own `onPointerDown` for its live dismiss behavior. This is both more live-exact and functional.

**Gates:** lint 0 · tsc 0 · **122/122 tests** (101 + 21 new) · `next build` 0.

**Browser verification (executed):** fresh-cache dev server; login (incl. invalid-credentials Alert); computed-style re-probes equal live — `bg-background` rgb(255,255,255), `text-muted-foreground` rgb(115,115,115), `border-input` rgb(229,229,229) (light) and rgb(10,10,10)/rgb(163,163,163) (dark), `rounded-md` 6px, `rounded-xl` 12px, `backdrop-blur-sm` blur(4px); dialog anatomy verified per dialog (Add Expense header row + close + p-6 pt-0 + 5 tabindex-wrapped tiles rendering `flex`; Goals dark card without close; Accounts black/60 + bg-card; AI Coach prose p without the `node` attribute); FAB Quick Add round-trip (chooser → expense form → submit → list → confirm-delete → clean); quick-select tile prefill ("Rent/Mortgage"); dark-mode toggle + reload persistence; zero console errors/warnings.

**DOM re-diff:** per-view signature diff vs the live captures — every only-live residual classifies into the documented buckets (lucide SVG internals, sun/moon theme-state artifact, fade-in-up/stagger animation classes, AI-insights empty state [data], duplicated toaster, infra). Login diff: only the deliberate demo-credentials affordance + infra + a bare-span/framer-wrapper remainder.

**VLM side-by-side:** dashboard — "visually identical apart from data"; expenses — "visually identical"; login — only the dev-mode Next.js tools button (absent in production builds) besides the documented demo-credentials box.
