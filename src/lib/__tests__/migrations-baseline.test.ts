import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Prisma migration-baseline source contracts (round 15, PAD §10 MEDIUM).
 *
 * Through round 14 the schema was managed exclusively via `prisma db push`
 * (declarative sync) — fine for disposable dev/hermetic DBs, unsafe for
 * schema evolution on live data (the PAD §10 open item). Round 15 adopts a
 * committed baseline: `prisma/migrations/<init>/migration.sql` generated
 * from schema.prisma via `prisma migrate diff --from-empty`, plus the
 * sqlite migration_lock.toml.
 *
 * Workflow split (documented in AGENTS.md):
 *  - dev + E2E keep `bun run db:push` (disposable DBs; the Playwright
 *    webServer resets db/e2e.db with it — unchanged).
 *  - production deploys use `bun run db:deploy` (`prisma migrate deploy`)
 *    so schema evolution becomes reviewable SQL instead of data-loss sync.
 *
 * These specs pin the baseline's existence and its equivalence to
 * schema.prisma: every model must have its CREATE TABLE in the baseline,
 * so a schema edit without a matching migration fails the unit gate (the
 * drift guard the PAD item asked for).
 */

const read = (rel: string): string =>
  readFileSync(join(process.cwd(), rel), "utf8");

const migrationsDir = join(process.cwd(), "prisma", "migrations");

describe("round 15 F4: the committed migration baseline", () => {
  it("carries the sqlite migration lock", () => {
    const lockPath = join(migrationsDir, "migration_lock.toml");
    expect(existsSync(lockPath), "prisma/migrations/migration_lock.toml").toBe(true);
    expect(read("prisma/migrations/migration_lock.toml")).toContain(
      'provider = "sqlite"',
    );
  });

  it("has at least one migration directory with a migration.sql", () => {
    expect(existsSync(migrationsDir), "prisma/migrations/").toBe(true);
    const dirs = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    expect(dirs.length).toBeGreaterThan(0);
    const sqlFiles = dirs.filter((d) =>
      existsSync(join(migrationsDir, d, "migration.sql")),
    );
    expect(sqlFiles.length).toBe(dirs.length);
  });

  it("every schema.prisma model has its CREATE TABLE in the baseline (drift guard)", () => {
    const schema = read("prisma/schema.prisma");
    const models = [...schema.matchAll(/^model (\w+)/gm)].map((m) => m[1]);
    expect(models.length).toBeGreaterThan(0);

    const sql = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => read(`prisma/migrations/${d.name}/migration.sql`))
      .join("\n");

    for (const model of models) {
      expect(
        sql.includes(`CREATE TABLE "${model}"`),
        `baseline must CREATE TABLE "${model}" — a schema edit without a migration (or vice versa) fails here; run bunx prisma migrate diff to generate the next migration`,
      ).toBe(true);
    }
  });
});
