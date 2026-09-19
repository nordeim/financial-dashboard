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

/**
 * Round-14 re-pins (live re-probe 2026-09-19): the live login page was
 * restyled — ten class-ORDER deltas, the Google label gained a <span>
 * wrapper, and the field icons render h-FIRST (`h-4 w-4` — the login joins
 * the Select-chevron/CloudUpload h-first exception group). Element set and
 * all other strings verified unchanged.
 */
describe("LoginView round-14 class orders (live 2026-09-19)", () => {
  it("renders the live main + card + inner-pad orders", () => {
    const html = renderLogin();
    expect(html).toContain(
      '<main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">',
    );
    expect(html).toContain(
      'class="text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl"',
    );
    expect(html).toContain('class="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10"');
  });

  it("renders the live stack + logo wrapper + blur orders", () => {
    const html = renderLogin();
    expect(html).toContain('class="flex flex-col items-center text-center space-y-6 sm:space-y-8"');
    expect(html).toContain('class="relative group"');
    expect(html).toContain(
      'class="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"',
    );
  });

  it("renders the live h1 + subtitle orders", () => {
    const html = renderLogin();
    expect(html).toContain('class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"');
    expect(html).toContain('class="text-slate-500 text-sm sm:text-base font-medium"');
  });

  it("wraps the Google label in a span (live structural change)", () => {
    const html = renderLogin();
    expect(html).toMatch(/<div class=" transition-transform duration-200 -ml-4">[\s\S]{0,900}?<span>Continue with Google<\/span>/);
  });

  it("renders the live divider-span order (text-slate-500 before font-medium)", () => {
    const html = renderLogin();
    expect(html).toContain('class="bg-white px-3 text-slate-500 font-medium tracking-wider"');
  });

  it("renders the field icons h-FIRST (the login exception to the app-wide w-first rule)", () => {
    const html = renderLogin();
    expect(html).toMatch(
      /class="lucide lucide-mail absolute left-3 top-1\/2 transform -translate-y-1\/2 h-4 w-4 text-slate-500"/,
    );
    expect(html).toMatch(
      /class="lucide lucide-lock absolute left-3 top-1\/2 transform -translate-y-1\/2 h-4 w-4 text-slate-500"/,
    );
  });

  it("renders the live bottom-row order (sm:flex-row directly after flex-col)", () => {
    const html = renderLogin();
    expect(html).toContain('class="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0"');
  });

  it("renders the img attributes in the live order (class first)", () => {
    const html = renderLogin();
    expect(html).toMatch(/<img class="aspect-square h-full w-full object-cover" alt="Finara logo" src="/);
  });
});
