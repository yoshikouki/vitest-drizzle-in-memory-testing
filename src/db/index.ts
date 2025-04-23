import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

export const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:2345/postgres";
export const db = drizzle(DATABASE_URL);
