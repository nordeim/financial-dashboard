import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Design-token pins (round 6, ADR-019): the live app renders the classic
 * shadcn *neutral* semantic theme over Tailwind v3, while this clone runs
 * Tailwind v4 whose regenerated defaults drift on every channel. Every value
 * below was probed on the live app (2026-09-17) via computed styles on real
 * elements (outline-button bg/border, table headers, focus rings) plus
 * synthetic test divs (`bg-background`, `text-muted-foreground`, …) in both
 * themes — see docs/plans/2026-09-17-parity-remediation-round6.md §B.F1–F3.
 *
 * Do NOT "modernize" these to oklch/v4 values — utilities must render the
 * live app's colors, radii, and blur.
 */

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`unbalanced block: ${selector}`);
}

function token(blockText: string, name: string): string {
  const match = blockText.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token not found: --${name}`);
  return match[1].trim();
}

describe(":root semantic tokens match the live app's classic neutral theme (light)", () => {
  const root = block(":root {") ?? block(":root");

  it("pins the surface/ink ramp (probed: outline button bg rgb(255,255,255), fg rgb(10,10,10))", () => {
    expect(token(root, "background")).toBe("#ffffff");
    expect(token(root, "foreground")).toBe("#0a0a0a");
    expect(token(root, "card")).toBe("#ffffff");
    expect(token(root, "card-foreground")).toBe("#0a0a0a");
    expect(token(root, "popover")).toBe("#ffffff");
    expect(token(root, "popover-foreground")).toBe("#0a0a0a");
  });

  it("pins muted/secondary/accent to neutral-100 (probed: rgb(245,245,245))", () => {
    expect(token(root, "secondary")).toBe("#f5f5f5");
    expect(token(root, "secondary-foreground")).toBe("#0a0a0a");
    expect(token(root, "muted")).toBe("#f5f5f5");
    expect(token(root, "accent")).toBe("#f5f5f5");
    expect(token(root, "accent-foreground")).toBe("#0a0a0a");
  });

  it("pins muted-foreground to neutral-500 (probed: table header rgb(115,115,115))", () => {
    expect(token(root, "muted-foreground")).toBe("#737373");
  });

  it("pins border/input to neutral-200 (probed: outline button border rgb(229,229,229))", () => {
    expect(token(root, "border")).toBe("#e5e5e5");
    expect(token(root, "input")).toBe("#e5e5e5");
  });

  // Round-10 correction (variable-level probe): the live `--primary` is the
  // classic shadcn NEUTRAL, NOT the sage. Round 6 misattributed the budget
  // fill's green (an explicit emerald class on that element) to this token.
  // Live light: --primary '0 0% 9%' (#171717), --primary-foreground '0 0% 98%'
  // (#fafafa); probed via getComputedStyle(document.documentElement) on
  // 2026-09-17 — rendered evidence: goal/budget progress fills compute
  // rgb(23,23,23) in light, default-variant buttons render monochrome, the
  // checked switch/checkbox render rgb(23,23,23). The sage CTAs use the
  // separate --primary-sage token (globals.css Finara block), unaffected.
  it("pins primary to the live classic-neutral ink (probed: --primary '0 0% 9%', goals fill rgb(23,23,23))", () => {
    expect(token(root, "primary")).toBe("#171717");
    expect(token(root, "primary-foreground")).toBe("#fafafa");
    expect(token(root, "ring")).toBe("#0a0a0a");
  });

  it("pins destructive to red-500 with a neutral-50 foreground (probed: '0 84.2% 60.2%')", () => {
    expect(token(root, "destructive")).toBe("#ef4444");
    expect(token(root, "destructive-foreground")).toBe("#fafafa");
  });
});

describe(".dark semantic tokens match the live app's dark probes", () => {
  const dark = block(".dark {") ?? block(".dark");

  it("pins the dark surface/ink ramp (probed: bg rgb(10,10,10), fg rgb(250,250,250))", () => {
    expect(token(dark, "background")).toBe("#0a0a0a");
    expect(token(dark, "foreground")).toBe("#fafafa");
    expect(token(dark, "card")).toBe("#0a0a0a");
    expect(token(dark, "card-foreground")).toBe("#fafafa");
    expect(token(dark, "popover")).toBe("#0a0a0a");
    expect(token(dark, "popover-foreground")).toBe("#fafafa");
  });

  it("pins dark muted/accent/border to neutral-800/400 (probed: rgb(38,38,38) / rgb(163,163,163))", () => {
    expect(token(dark, "secondary")).toBe("#262626");
    expect(token(dark, "secondary-foreground")).toBe("#fafafa");
    expect(token(dark, "muted")).toBe("#262626");
    expect(token(dark, "muted-foreground")).toBe("#a3a3a3");
    expect(token(dark, "accent")).toBe("#262626");
    expect(token(dark, "accent-foreground")).toBe("#fafafa");
    expect(token(dark, "border")).toBe("#262626");
    expect(token(dark, "input")).toBe("#262626");
  });

  // Round-10 variable-level probes (live dark): --primary '0 0% 98%'
  // (#fafafa), --primary-foreground '0 0% 9%' (#171717), --ring '0 0% 83.1%'
  // (#d4d4d4), --destructive '0 62.8% 30.6%' (#7f1d1d). Rendered evidence:
  // budget/goal fills compute rgb(250,250,250); the disabled Upload-and-Extract
  // and the AI send button render bg rgb(250,250,250); the Quick Add Add button
  // text computes rgb(23,23,23) on its sage background.
  it("pins the dark primary to classic-neutral paper (probed: --primary '0 0% 98%', dark fills rgb(250,250,250))", () => {
    expect(token(dark, "primary")).toBe("#fafafa");
    expect(token(dark, "primary-foreground")).toBe("#171717");
  });

  it("pins the dark ring to neutral-300 and destructive to the dark red (probed: '0 0% 83.1%' / '0 62.8% 30.6%')", () => {
    expect(token(dark, "ring")).toBe("#d4d4d4");
    expect(token(dark, "destructive")).toBe("#7f1d1d");
    expect(token(dark, "destructive-foreground")).toBe("#fafafa");
  });
});

describe("@theme inline utility-scale pins (Tailwind v3 values the live app renders)", () => {
  it("pins the v3 radius scale (probed: rounded-md 6px, rounded-lg 8px, rounded-xl 12px, rounded-sm 2px)", () => {
    expect(css).toMatch(/--radius-sm:\s*0\.125rem;/);
    expect(css).toMatch(/--radius-md:\s*0\.375rem;/);
    expect(css).toMatch(/--radius-lg:\s*0\.5rem;/);
    expect(css).toMatch(/--radius-xl:\s*0\.75rem;/);
  });

  it("pins backdrop-blur-sm to the v3 4px (probed: blur(4px) on every live glass card)", () => {
    expect(css).toMatch(/--blur-sm:\s*4px;/);
  });
});
