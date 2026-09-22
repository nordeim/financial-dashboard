import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDatabaseUrl } from "@/lib/db-path";

/**
 * Round-21 contract (the `.env.example` database block, finally
 * implemented): a RELATIVE `file:` SQLite URL resolves against
 * prisma/schema.prisma — exactly like the Prisma CLI — so
 * `file:../db/custom.db` points at <repo>/db/custom.db for the CLI,
 * `next build`, and the running server alike, regardless of the
 * process working directory. Absolute `file:` URLs (the Playwright
 * webServer's hermetic db/e2e.db; production deployments) and
 * non-SQLite URLs pass through unchanged.
 *
 * The repo root is derived here from THIS MODULE's location — an
 * anchor independent of the implementation's CWD walk, so the
 * assertions cannot be tautological.
 */
const thisDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(thisDir, "../../..");

describe("resolveDatabaseUrl (round-21 db-path contract)", () => {
  it("resolves the relative dev URL CLI-equivalently from the repo root", () => {
    // Independent truth: prisma db push resolves `file:../db/custom.db`
    // against prisma/schema.prisma → <repoRoot>/db/custom.db.
    const url = resolveDatabaseUrl(
      { DATABASE_URL: "file:../db/custom.db" },
      repoRoot,
    );
    expect(url).toBe(`file:${join(repoRoot, "db", "custom.db")}`);
  });

  it("is CWD-independent: a subdirectory launch hits the same file", () => {
    // The walk-up must find prisma/schema.prisma from anywhere inside
    // the repo (next dev/start launched from a nested directory).
    const fromSrc = resolveDatabaseUrl(
      { DATABASE_URL: "file:../db/custom.db" },
      join(repoRoot, "src", "lib"),
    );
    expect(fromSrc).toBe(`file:${join(repoRoot, "db", "custom.db")}`);
  });

  it("passes an absolute file: URL through unchanged (the E2E pin)", () => {
    const absolute = `file:${join(repoRoot, "db", "e2e.db")}`;
    expect(
      resolveDatabaseUrl({ DATABASE_URL: absolute }, repoRoot),
    ).toBe(absolute);
  });

  it("passes non-SQLite URLs through unchanged", () => {
    const pg = "postgresql://user:password@localhost:5432/financial_dashboard";
    expect(resolveDatabaseUrl({ DATABASE_URL: pg }, repoRoot)).toBe(pg);
  });

  it("throws the actionable setup error when DATABASE_URL is missing", () => {
    expect(() => resolveDatabaseUrl({}, repoRoot)).toThrow(/\.env\.example/);
  });

  it("the contract's anchor file exists (prisma/schema.prisma)", () => {
    // Guards the walk-up heuristic itself: if the schema ever moves,
    // this spec fails before the resolver silently degrades to the
    // CWD fallback.
    expect(existsSync(join(repoRoot, "prisma", "schema.prisma"))).toBe(true);
  });
});
