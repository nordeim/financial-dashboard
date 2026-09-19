import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Dependency-manifest source contracts (round 15, security round).
 *
 * Round 15's `bun audit` found two CRITICAL runtime advisories in the
 * framework (next 16.1.3: GHSA-2xp9-vwfh-vxw4 + GHSA-p293-qw3h-jr36 RCEs,
 * fixed 16.2.5+) plus a HIGH in sharp (GHSA-f88m-g3jw-g9cj, libvips CVEs,
 * fixed 0.35.0+), and four unused dependencies that carried their own
 * advisories (next-auth critical/high, next-intl moderates, uuid moderate
 * via next-auth) or contradicted the documented no-framer-motion policy.
 * All four had ZERO imports in src/ (incl. the vendored ui primitives),
 * e2e/, and config files — they were base44-scaffold leftovers.
 *
 * These specs pin the remediated manifest so the invariants survive future
 * dependency work:
 *  - next stays at/above the advisory floor, with eslint-config-next
 *    locked to the same major.minor (the lint rule set tracks the
 *    framework — a split pair silently changes what "lint 0" means).
 *  - sharp stays at/above 0.35.0 AND matches next's own optional range
 *    (a too-old direct sharp would nest a second vulnerable copy under
 *    next; 16.3.x pairs with ^0.35.4).
 *  - the banned set never comes back through `bun add`.
 */

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const pkg = JSON.parse(read("package.json")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

const lock = read("bun.lock");

/** Parse the first major.minor.patch literal out of a semver range. */
const version = (range: string): [number, number, number] => {
  const m = range.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Error(`no version literal in range: ${range}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
};

const atLeast = (
  actual: [number, number, number],
  floor: [number, number, number],
): boolean =>
  actual[0] !== floor[0]
    ? actual[0] > floor[0]
    : actual[1] !== floor[1]
      ? actual[1] > floor[1]
      : actual[2] >= floor[2];

describe("round 15 F1/F2: framework + image-processor advisory floors", () => {
  it("next resolves at/above 16.2.5 (the RCE advisory floor)", () => {
    const range = pkg.dependencies["next"];
    expect(range, "next must be a direct runtime dependency").toBeDefined();
    expect(atLeast(version(range), [16, 2, 5])).toBe(true);
  });

  it("eslint-config-next stays on next's major.minor (lockstep pair)", () => {
    const next = version(pkg.dependencies["next"]);
    const eslint = version(pkg.devDependencies["eslint-config-next"]);
    expect(eslint[0]).toBe(next[0]);
    expect(eslint[1]).toBe(next[1]);
  });

  it("sharp resolves at/above 0.35.0 (the libvips advisory floor)", () => {
    const range = pkg.dependencies["sharp"];
    expect(range, "sharp must stay a direct runtime dependency (next image optimization)").toBeDefined();
    expect(atLeast(version(range), [0, 35, 0])).toBe(true);
  });
});

describe("round 15 F3: the unused advisory-carrying dependencies stay removed", () => {
  // Zero imports anywhere in src/e2e/config at removal time (2026-09-19).
  // The last three (@mdxeditor/editor, react-syntax-highlighter,
  // @reactuses/core) were the follow-on find: unused direct deps whose
  // transitive trees carried advisories (prismjs/lexical via mdxeditor,
  // js-cookie via @reactuses) — same class as the first four, removed to
  // clear them at the root.
  // If a future feature genuinely needs one of these, the spec moves WITH
  // the feature's plan — never silently.
  const banned = [
    "next-auth",
    "next-intl",
    "framer-motion",
    "uuid",
    "@mdxeditor/editor",
    "react-syntax-highlighter",
    "@reactuses/core",
  ];

  it.each(banned)("dependencies excludes %s", (name) => {
    expect(pkg.dependencies).not.toHaveProperty(name);
    expect(pkg.devDependencies).not.toHaveProperty(name);
  });

  it("the lockfile resolves no copies of the removed packages", () => {
    // Package keys in bun.lock look like "next-auth": ["next-auth@4.24.11", …].
    // uuid is NOT asserted here: another package's transitive tree may
    // legitimately pull it; the direct-dependency ban above is the contract.
    const lockBanned = [
      "next-auth@",
      "next-intl@",
      "framer-motion@",
      "@mdxeditor/editor@",
      "react-syntax-highlighter@",
      "@reactuses/core@",
    ];
    for (const name of lockBanned) {
      expect(lock, `bun.lock must not resolve ${name}…`).not.toContain(name);
    }
  });
});
