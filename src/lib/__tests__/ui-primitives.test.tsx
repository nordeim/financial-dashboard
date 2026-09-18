/**
 * Live-exact shadcn primitive class sets (round-4 parity contract).
 *
 * The live Finara app renders the CLASSIC shadcn/ui class sets — captured
 * verbatim from the live DOM on 2026-09-15 (audit/round4/, see
 * docs/plans/2026-09-15-parity-remediation-round4.md §A.3). These specs pin
 * every in-use primitive to those strings so the primitives cannot silently
 * drift to a newer shadcn snapshot again.
 *
 * Portal-dependent surfaces (Dialog content, Select dropdown, DropdownMenu
 * content) are covered by the browser E2E pass instead — they do not render
 * under `renderToStaticMarkup` without an open portal.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

/** First class="…" value, whitespace-normalized, HTML entities decoded
 * (renderToStaticMarkup escapes `&`/`>`/`<` inside class strings). */
function classOf(html: string): string {
  const match = html.match(/class="([^"]*)"/);
  if (!match?.[1]) return "";
  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
}

/** Decode HTML entities that renderToStaticMarkup escapes inside class strings. */
function decode(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"');
}

describe("Button (classic live set)", () => {
  it("renders the live base + default variant + default size", () => {
    const cls = classOf(render(<Button>Save</Button>));
    expect(cls).toContain(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    );
    // Round 8: the live default variant carries `shadow` (plan F6).
    expect(cls).toContain("bg-primary text-primary-foreground shadow hover:bg-primary/90");
    expect(cls).toContain("h-9 px-4 py-2");
  });

  it("renders the live outline/sm/icon variants", () => {
    const outline = classOf(render(<Button variant="outline">X</Button>));
    expect(outline).toContain("border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground");
    const sm = classOf(render(<Button size="sm">X</Button>));
    expect(sm).toContain("h-8 rounded-md px-3 text-xs");
    const icon = classOf(render(<Button size="icon">X</Button>));
    expect(icon).toContain("h-9 w-9");
  });

  it("carries no newest-shadcn markers", () => {
    const cls = classOf(render(<Button>Save</Button>));
    expect(cls).not.toContain("transition-all");
    expect(cls).not.toContain("ring-[3px]");
    expect(cls).not.toContain("shadow-xs");
    expect(cls).not.toContain("size-9");
    expect(cls).not.toContain("has-[>svg]");
    expect(render(<Button>Save</Button>)).not.toContain("data-slot");
  });
});

describe("Badge (classic live set, div-based)", () => {
  it("renders as a div with the live base classes", () => {
    const html = render(<Badge>needs</Badge>);
    expect(html).toMatch(/^<div /);
    const cls = classOf(html);
    expect(cls).toContain(
      "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    );
  });

  it("default variant carries shadow + hover:bg-primary/80; secondary carries hover:bg-secondary/80", () => {
    expect(classOf(render(<Badge>x</Badge>))).toContain("border-transparent shadow hover:bg-primary/80");
    expect(classOf(render(<Badge variant="secondary">x</Badge>))).toContain(
      "border-transparent hover:bg-secondary/80",
    );
    expect(classOf(render(<Badge variant="outline">x</Badge>))).toContain("text-foreground");
  });
});

describe("Card family (classic live anatomy)", () => {
  it("Card has no flex/gap/py layout classes", () => {
    const cls = classOf(render(<Card />));
    expect(cls).toContain("rounded-xl border bg-card text-card-foreground shadow");
    expect(cls).not.toContain("flex flex-col gap-6 py-6");
  });

  it("CardHeader is flex flex-col space-y-1.5 p-6; CardContent is p-6 pt-0", () => {
    expect(classOf(render(<CardHeader />))).toContain("flex flex-col space-y-1.5 p-6");
    expect(classOf(render(<CardContent />))).toContain("p-6 pt-0");
  });
});

describe("Input (classic live set)", () => {
  it("renders the live classes", () => {
    const cls = classOf(render(<Input />));
    expect(cls).toContain(
      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    );
    expect(cls).not.toContain("dark:bg-input/30");
    expect(cls).not.toContain("min-w-0");
    expect(cls).not.toContain("shadow-xs");
  });
});

describe("Label (classic live set)", () => {
  it("renders the live classes without flex/gap wrappers", () => {
    const cls = classOf(render(<Label>Email</Label>));
    expect(cls).toContain("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
    expect(cls).not.toContain("flex");
    expect(cls).not.toContain("select-none");
  });
});

describe("Select trigger (classic live set)", () => {
  it("renders the live trigger classes", () => {
    const html = render(
      <Select>
        <SelectTrigger aria-label="x" />
      </Select>,
    );
    const cls = classOf(html);
    expect(cls).toContain(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    );
  });
});

describe("Tabs family (classic live set)", () => {
  it("TabsList/TabsTrigger/TabsContent render the live classes", () => {
    const html = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">body</TabsContent>
      </Tabs>,
    );
    const all = decode(html);
    expect(all).toContain("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground");
    expect(all).toContain("ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2");
    expect(all).toContain("data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow");
    expect(all).toContain("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2");
    expect(all).not.toContain("h-[calc(100%-1px)]");
  });
});

describe("Checkbox + Switch (classic live sets)", () => {
  it("checkbox renders peer h-4 w-4 rounded-sm", () => {
    const cls = classOf(render(<Checkbox aria-label="x" />));
    expect(cls).toContain("peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow");
    expect(cls).not.toContain("rounded-[4px]");
    expect(cls).not.toContain("size-4");
  });

  it("switch thumb uses h-4 w-4 translate-x-4 with shadow-lg", () => {
    const html = render(<Switch aria-label="x" />);
    expect(html).toContain("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform");
    expect(html).toContain("data-[state=checked]:translate-x-4");
    expect(html).not.toContain("translate-x-[calc(100%-2px)]");
    expect(html).not.toContain("size-4");
  });
});

describe("Table family (classic live set)", () => {
  it("th is text-muted-foreground with no whitespace-nowrap anywhere", () => {
    const html = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>AAPL</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const all = decode(html);
    expect(all).toContain("h-10 px-2 text-left align-middle font-medium text-muted-foreground");
    expect(all).toContain("w-full caption-bottom text-sm");
    expect(all).toContain("p-2 align-middle");
    expect(all).not.toContain("whitespace-nowrap");
    expect(all).toContain('class="relative w-full overflow-auto"');
  });
});

describe("ScrollArea (classic live set)", () => {
  it("renders the radix viewport structure with hidden scrollbar styles", () => {
    const html = render(
      <ScrollArea className="h-80">
        <div>content</div>
      </ScrollArea>,
    );
    const all = decode(html);
    expect(all).toContain('class="relative overflow-hidden h-80"');
    expect(all).toContain("data-radix-scroll-area-viewport");
    expect(all).toContain("h-full w-full rounded-[inherit]");
    expect(all).toContain("[data-radix-scroll-area-viewport]");
  });
});

describe("Progress (classic live set)", () => {
  it("renders the shadcn-classic track + indicator", () => {
    const html = render(<Progress value={25} aria-label="x" />);
    const all = decode(html);
    expect(all).toContain("relative w-full overflow-hidden rounded-full");
    expect(all).toContain("h-full w-full flex-1 bg-primary transition-all");
  });
});

describe("DialogTitle (classic live set, round-5)", () => {
  // Round-5 live capture: every live modal title carries a DIFFERENT class
  // set (Quick Add: text-lg font-semibold text-gray-900 dark:text-white;
  // full modals: font-semibold leading-none tracking-tight + caller classes).
  // DialogTitle is therefore a pure Radix semantics wrapper — it injects no
  // base classes; call sites own the live-exact strings. DialogContent itself
  // is portal-dependent and is verified by the browser DOM re-diff (base must
  // NOT carry max-h-[90vh]/overflow-y-auto — only the Add Expense modal and
  // the edit form dialogs pass them explicitly).
  it("renders exactly the caller's classes — no injected base", () => {
    const html = render(
      <Dialog>
        <DialogTitle className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
          AI Financial Coach
        </DialogTitle>
      </Dialog>,
    );
    const all = decode(html);
    expect(all).toContain(
      'class="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white"',
    );
    // The Quick Add title set must survive verbatim as well.
    const quick = render(
      <Dialog>
        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Quick Add</DialogTitle>
      </Dialog>,
    );
    expect(decode(quick)).toContain('class="text-lg font-semibold text-gray-900 dark:text-white"');
  });
});

describe("DialogContent card base (round-6, ADR-019)", () => {
  // Round-6 live capture (2026-09-17): every live modal card renders
  // `rounded-xl border text-card-foreground shadow w-full max-w-2xl bg-white
  // dark:bg-gray-800 …` — with NO `relative` (the close button sits IN the
  // header row, not absolutely positioned). The base is exported so this pin
  // survives without a portal; width/max-h/dark-card overrides stay per
  // call site via className.
  it("exports the live-exact card base with no `relative`", async () => {
    const dialog = await import("@/components/ui/dialog");
    const base = (dialog as unknown as { DIALOG_CARD_BASE: string }).DIALOG_CARD_BASE;
    expect(typeof base).toBe("string");
    expect(base).toContain("rounded-xl");
    expect(base).toContain("border");
    expect(base).toContain("text-card-foreground");
    expect(base).toContain("shadow");
    expect(base).toContain("w-full");
    expect(base).toContain("bg-white");
    expect(base).toContain("dark:bg-gray-800");
    expect(base).not.toContain("relative");
    // The merged default width stays max-w-2xl (Add Expense); callers narrow it.
    expect(base).toContain("max-w-2xl");
  });
});

describe("Select popup source contracts (round-11 live capture — portal surfaces)", () => {
  // The popup (SelectContent/Viewport/Item) renders through a Radix portal and
  // cannot be captured under renderToStaticMarkup — the round-4 header comment
  // delegated these to the browser E2E pass. Round 11 captured the live popup
  // DOM (Settings currency dropdown, 2026-09-17) and these source pins lock
  // the class sets so the primitive cannot drift.
  const selectSource = readFileSync(join(process.cwd(), "src/components/ui/select.tsx"), "utf8");

  it("SelectContent renders the live classic set incl. popper translate classes", () => {
    expect(selectSource).toContain(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    );
    expect(selectSource).toContain(
      '"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"',
    );
  });

  it("the viewport renders p-1 plus the popper trigger-height/width vars", () => {
    expect(selectSource).toContain(
      '"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"',
    );
  });

  it("SelectItem keeps the classic anatomy (focus:bg-accent, absolute check indicator)", () => {
    expect(selectSource).toContain(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    );
    expect(selectSource).toContain('"absolute right-2 flex h-3.5 w-3.5 items-center justify-center"');
    expect(selectSource).toContain('<Check className="h-4 w-4" />');
  });
});

describe("round 13: dialog overlay base (animate utilities removed with the live update)", () => {
  it("the overlay no longer carries animate-in/out utilities (live: plain classes + framer-motion inline)", () => {
    const dialog = readFileSync(join(process.cwd(), "src/components/ui/dialog.tsx"), "utf8");
    const base = dialog.match(/DIALOG_OVERLAY_BASE =\s*\n?\s*"([^"]+)"/);
    expect(base).not.toBeNull();
    expect(base?.[1]).toBe("fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50");
  });
});

describe("round 13: DialogTitle renders asChild divs (live titles are DIVs)", () => {
  it("asChild forwards the semantics onto the caller's div", () => {
    const html = render(
      <Dialog>
        <DialogTitle asChild>
          <div className="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white">
            Add Expense
          </div>
        </DialogTitle>
      </Dialog>,
    );
    const all = decode(html);
    expect(all).toContain("<div");
    expect(all).not.toContain("<h2");
    expect(all).toContain(
      'class="font-semibold leading-none tracking-tight flex items-center gap-2 text-primary-navy dark:text-white"',
    );
  });
});

describe("round 13: Progress indeterminate mechanism (live-probed)", () => {
  it("never renders aria-valuenow and carries data-state=indeterminate + the manual transform", () => {
    const html = render(<Progress value={24.5} aria-label="x" />);
    const all = decode(html);
    expect(all).not.toContain("aria-valuenow");
    expect(all).toContain('data-state="indeterminate"');
    expect(all).toContain("translateX(-75.5%)");
    expect(all).toContain('data-max="100"');
  });
});
