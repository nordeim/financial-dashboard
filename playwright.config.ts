import { defineConfig } from "@playwright/test";
import path from "node:path";

/**
 * Round-12 E2E layer — golden-path lock (PAD §10).
 *
 * Runs against the PRODUCTION build (`bun run test:e2e` = build + this suite)
 * served on :3100 — port 3100 + reuseExistingServer:false so a running dev
 * server on :3000 never collides and a stale server is never silently reused.
 *
 * DB isolation: a dedicated db/e2e.db, reset by the webServer command before
 * every run. The absolute file:// URL sidesteps Prisma's relative-path
 * ambiguity (CLI resolves CWD-relative; the generated client
 * schema-relative). ensureSeeded() fills it on the first API request.
 *
 * Serial execution (workers:1, fullyParallel:false) — specs mutate one shared
 * SQLite file; determinism beats wall-clock. Retries stay 0 locally (a red
 * gate is a regression, never a flake to wave through — CLAUDE.md).
 */
const E2E_DB = `file:${path.resolve(__dirname, "db/e2e.db")}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "rm -f db/e2e.db && bun run db:push && bunx next start -p 3100",
    url: "http://localhost:3100/login",
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      DATABASE_URL: E2E_DB,
      // Round 13: the insights LLM polish rewrites text nondeterministically
      // — one run's polished title substring-collided with spec assertions.
      // The gate stays hermetic: deterministic insight drafts only.
      FINARA_INSIGHTS_LLM_OFF: "1",
    },
  },
});
