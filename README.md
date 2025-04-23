# Vitest + Prisma + PGLite Inline Testing

This project demonstrates how to set up a testing environment for Prisma using PGLite for in-memory PostgreSQL testing without mocks. This approach provides several benefits:

- **Fast tests**: In-memory database is much faster than a real PostgreSQL instance
- **Realistic testing**: Tests run against a real PostgreSQL-compatible database 
- **No external dependencies**: No need to set up a separate database server
- **Isolation**: Each test runs in its own isolated environment

## How It Works

The setup uses:

- [Vitest](https://vitest.dev/) for testing
- [Prisma](https://www.prisma.io/) as the ORM
- [PGLite](https://pglite.dev/) for in-memory PostgreSQL

Instead of mocking the Prisma client, we create a mock implementation that forwards calls to PGLite, which runs PostgreSQL in memory.

## Setup

1. Install dependencies:

```bash
bun add -d vitest prisma @prisma/client @electric-sql/pglite
```

2. Create a Prisma schema:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Your models here
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

3. Set up the test configuration in `src/tests/setup.ts`:

```typescript
import { PGlite } from "@electric-sql/pglite";
import { afterAll, afterEach, beforeEach, vi } from "vitest";

// Create a PGlite instance for testing
const pglite = new PGlite();

// Mock the Prisma client
// This redirects Prisma operations to our in-memory PGLite database
vi.mock("../../generated/prisma", () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => {
      // Implementation that forwards to PGLite
      // See full implementation in src/tests/setup.ts
    }),
  };
});

// Mock the actual client import
vi.mock("@/lib/db", () => {
  return {
    prisma: {}, // This will be filled with the mocked implementation
  };
});

// Import after mock definition
import { prisma } from "@/lib/db";

// Set up database schema before tests
const setupDatabase = async () => {
  // Create tables based on your Prisma schema
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS "User" (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Run before each test
beforeEach(async () => {
  await setupDatabase();
});

// Clean up after each test
afterEach(async () => {
  await pglite.exec(`DROP TABLE IF EXISTS "User" CASCADE`);
});

// Clean up after all tests
afterAll(() => {
  pglite.close();
});

// Export for use in tests
export { pglite, prisma };
```

## Usage

Write tests using both the Prisma client and direct PGLite access:

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { prisma, pglite } from "../tests/setup";

describe("User model tests", () => {
  beforeEach(async () => {
    await pglite.exec(`DELETE FROM "User"`);
  });

  it("should create a user", async () => {
    // Use Prisma API
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });

    expect(user.email).toBe("test@example.com");
    
    // You can also verify directly with PGLite
    const result = await pglite.query(`SELECT * FROM "User" WHERE id = $1`, [user.id]);
    expect(result.rows.length).toBe(1);
  });
});
```

## Benefits

1. **Speed**: Tests run much faster with an in-memory database
2. **No mocking complexity**: Use real database operations instead of complex mocks
3. **DB-level verification**: Can check database state directly with SQL queries
4. **Realistic behavior**: Tests use real PostgreSQL functionality
5. **Isolated tests**: Each test runs with a clean database state

## Limitations

1. Only a subset of Prisma operations are mocked in the example
2. Extensions or PostgreSQL-specific features may need additional setup
3. PGLite has some differences from a full PostgreSQL installation

## Extending

To support more Prisma operations, expand the mock implementation in `setup.ts`. For complex applications, you'll need to:

1. Mock more Prisma model methods
2. Support more complex query scenarios
3. Potentially add transaction support for complex operations

---

Feel free to adapt this setup to your specific needs and application structure!