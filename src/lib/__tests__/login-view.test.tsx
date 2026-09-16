import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LoginView } from "@/components/finara/login-view";

/**
 * Login-page class-set pins (round 6): the live sign-in screen's anatomy,
 * captured 2026-09-17. The login page is statically renderable (module-store
 * toast hook, no portal usage), so every live-exact string below is pinned
 * the same way the shadcn primitives are pinned — do not "improve" these
 * toward shadcn defaults; the live app renders raw elements with its own
 * classes here (see the round-6 plan §B.F12–F22).
 */

function renderLogin(): string {
  return decodeURIComponent(renderToStaticMarkup(<LoginView onSignIn={() => undefined} />))
    .replace(/&amp;/g, "&");
}

describe("LoginView logo anatomy (live: ringed span wrapper + aspect-square img)", () => {
  it("renders the visual classes on a span wrapper with a plain img inside", () => {
    const html = renderLogin();
    expect(html).toContain('class="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50 group-hover:shadow-xl transition-all duration-300"');
    expect(html).toMatch(/<img[^>]*class="aspect-square h-full w-full object-cover"/);
    expect(html).not.toMatch(/<img[^>]*ring-4/);
  });
});

describe("LoginView Google button (live: raw button, not the shadcn Button base)", () => {
  it("renders the live-exact raw class string with a div icon wrapper", () => {
    const html = renderLogin();
    expect(html).toContain(
      'class="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[16px] group"',
    );
    expect(html).toContain('class=" transition-transform duration-200 -ml-4"');
  });
});

describe("LoginView form anatomy (live: space-y on the form itself, no novalidate)", () => {
  it("carries the spacing classes on the form element", () => {
    const html = renderLogin();
    expect(html).toMatch(/<form class="space-y-4 sm:space-y-5">/);
    expect(html).not.toContain("novalidate");
  });

  it("renders the live divider line (shrink-0 h-[1px])", () => {
    const html = renderLogin();
    expect(html).toContain('class="shrink-0 h-[1px] w-full bg-slate-200"');
  });

  it("renders the mobile-only spacer footer (sm:hidden)", () => {
    const html = renderLogin();
    expect(html).toMatch(/class="mt-8 text-center text-xs text-slate-400 sm:hidden"/);
  });
});

describe("LoginView field icons (live: text-slate-500 + transform, no pointer-events-none)", () => {
  it("renders mail and lock icons with the live classes", () => {
    const html = renderLogin();
    const mail = html.match(/class="([^"]*lucide-mail[^"]*)"/)?.[1] ?? "";
    const lock = html.match(/class="([^"]*lucide-lock[^"]*)"/)?.[1] ?? "";
    expect(mail).toContain("text-slate-500");
    expect(mail).toContain("transform");
    expect(mail).not.toContain("pointer-events-none");
    expect(lock).toContain("text-slate-500");
    expect(lock).toContain("transform");
    expect(lock).not.toContain("pointer-events-none");
  });
});

describe("LoginView inputs (live: py-2, ring-2 + ring-offset, no shadow-sm/transition-colors)", () => {
  it("renders the live-exact input class string on both fields", () => {
    const html = renderLogin();
    const live = "flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-600";
    const inputs = html.match(/<input[^>]*class="([^"]+)"/g) ?? [];
    const textInputs = inputs.filter((tag) => !tag.includes('type="hidden"'));
    expect(textInputs.length).toBeGreaterThanOrEqual(2);
    for (const tag of textInputs) {
      const cls = tag.match(/class="([^"]+)"/)?.[1] ?? "";
      expect(cls.split(/\s+/).sort().join(" ")).toBe(live.split(/\s+/).sort().join(" "));
    }
  });

  it("labels target the live ids (email/password)", () => {
    const html = renderLogin();
    expect(html).toMatch(/for="email"/);
    expect(html).toMatch(/for="password"/);
  });
});

describe("LoginView submit + footer buttons (live: gap-1 px-3 py-2 ring-2; sign-up span)", () => {
  it("renders the live sign-in button class string", () => {
    const html = renderLogin();
    const submit = html.match(/<button[^>]*type="submit"[^>]*class="([^"]+)"/)?.[1] ?? "";
    for (const cls of [
      "gap-1",
      "px-3 py-2",
      "ring-offset-background",
      "focus-visible:ring-2",
      "focus-visible:ring-offset-2",
      "h-11 sm:h-12",
      "bg-slate-900",
    ]) {
      expect(submit).toContain(cls);
    }
    expect(submit).not.toContain("px-4");
  });

  it("wraps only “Sign up” in the font-medium span (live anatomy)", () => {
    const html = renderLogin();
    expect(html).toMatch(/Need an account\? <span class="font-medium text-slate-700">Sign up<\/span>/);
    const signup = html.match(/<button[^>]*>([^<]*Need an account[^<]*)<span/)?.[1] ?? "SIGNUP-BUTTON";
    expect(signup).not.toContain("font-medium");
  });
});
