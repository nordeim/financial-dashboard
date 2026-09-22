import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Server-only DATABASE_URL resolver (round-21; the `.env.example`
 * database contract, finally implemented).
 *
 * A RELATIVE `file:` SQLite URL is resolved against the directory of
 * prisma/schema.prisma — exactly like the Prisma CLI (`prisma db push`,
 * `prisma migrate`) — so `file:../db/custom.db` always points at
 * <repo>/db/custom.db for the CLI, `next build`, and the running
 * server alike, regardless of the process working directory. The repo
 * root is discovered by walking up from the process CWD to the nearest
 * directory containing prisma/schema.prisma; when no schema is found
 * (an exotic launch context), the CWD itself anchors the resolution —
 * the standard `next dev` / `next start` flow runs from the repo root.
 *
 * Absolute `file:` URLs pass through unchanged: the Playwright E2E
 * webServer pins one (the hermetic db/e2e.db reset) and production
 * deployments set one. Non-SQLite URLs (postgresql://…) also pass
 * through untouched.
 *
 * Never import this from a client component — it pulls node:fs/path
 * (same rule as lib/db.ts).
 */

/** The env-like shape read by the resolver (injectable for hermetic specs). */
export interface DatabaseEnv {
  DATABASE_URL?: string | undefined;
  // Node's ProcessEnv is a pure index-signature record — carrying one
  // here keeps `process.env` directly assignable (a weak all-optional
  // interface would reject it under TS2559).
  [key: string]: string | undefined;
}

/**
 * Walks up from `startDir` to the filesystem root looking for the
 * nearest `prisma/schema.prisma` — the CLI's own anchor for relative
 * SQLite URLs. Returns the REPO ROOT (the schema's parent), or null
 * when no ancestor carries the schema.
 */
function findRepoRoot(startDir: string): string | null {
  let dir = path.resolve(startDir);
  // Depth cap: a repo root sits well within 32 levels of any launch
  // directory inside it; the cap keeps pathological CWDs bounded.
  for (let i = 0; i < 32; i += 1) {
    if (existsSync(path.join(dir, "prisma", "schema.prisma"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

/**
 * Resolves the runtime DATABASE_URL to the form the Prisma client
 * should use. See the module doc for the contract; throws a crisp,
 * setup-pointing error when DATABASE_URL is unset (Prisma's raw
 * constructor error names neither the file nor the fix).
 */
export function resolveDatabaseUrl(
  env: DatabaseEnv = process.env,
  cwd: string = process.cwd(),
): string {
  const raw = env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set — copy .env.example to .env and run `bun run db:push` (see README §Quick Start).",
    );
  }

  // Non-SQLite providers pass straight through.
  if (!raw.startsWith("file:")) return raw;

  const filePath = raw.slice("file:".length);
  // Absolute SQLite paths (the E2E hermetic pin, production deploys)
  // need no anchoring.
  if (path.isAbsolute(filePath)) return raw;

  // Relative: anchor at the schema directory (CLI-equivalent), with the
  // CWD as the documented fallback when no schema is found above it.
  const repoRoot = findRepoRoot(cwd) ?? cwd;
  const anchored = path.resolve(repoRoot, "prisma", filePath);
  return `file:${anchored}`;
}
