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
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
    expect(cls).toContain("bg-primary text-primary-foreground hover:bg-primary/90");
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
    expect(cls).toContain("text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
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
