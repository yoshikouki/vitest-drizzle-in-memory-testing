import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle, PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, afterEach, beforeEach, vi } from "vitest";
import * as schema from "../db/schema";

type DbModule = {
  client: PGlite;
  db: PgliteDatabase<typeof schema>;
};

// Create a test database instance
const testClient = new PGlite();
export const testDb = drizzle(testClient, { schema });

// Move the mock implementation to a factory function
vi.mock("@/lib/db", (): DbModule => {
  return {
    __esModule: true,
    get client(): PGlite {
      return testClient;
    },
    get db(): PgliteDatabase<typeof schema> {
      return testDb;
    },
  } as DbModule;
});

// Import after mock definition
import { db } from "../db";

const applyMigrations = async () => {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS public`);
  await migrate(db as unknown as PgliteDatabase<typeof schema>, {
    migrationsFolder: "drizzle",
  });
};

// Apply migrations before each test
beforeEach(async () => {
  await applyMigrations();
});

// Clean up the database after each test
afterEach(async () => {
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
});

// Free up resources after all tests are done
afterAll(async () => {
  testClient.close();
});
