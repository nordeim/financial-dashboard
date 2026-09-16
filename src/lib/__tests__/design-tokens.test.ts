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

  it("pins primary to the live emerald (probed: budget fill rgb(5,150,105)) and ring to neutral-950 (probed: '0 0% 3.9%')", () => {
    expect(token(root, "primary")).toBe("#059669");
    expect(token(root, "primary-foreground")).toBe("#ffffff");
    expect(token(root, "ring")).toBe("#0a0a0a");
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
    expect(token(dark, "ring")).toBe("#0a0a0a");
  });

  it("keeps the live emerald primary in dark mode", () => {
    expect(token(dark, "primary")).toBe("#059669");
    expect(token(dark, "primary-foreground")).toBe("#ffffff");
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
