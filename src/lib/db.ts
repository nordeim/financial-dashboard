import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "@/lib/db-path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Round-21: the datasource URL goes through db-path so a RELATIVE
// `file:` URL (`.env`'s `file:../db/custom.db`) anchors at
// prisma/schema.prisma exactly like the Prisma CLI — CWD-independent
// for dev/build/start alike. Absolute URLs (the E2E webServer's
// hermetic db/e2e.db) pass through unchanged.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: resolveDatabaseUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
