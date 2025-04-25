import { eq } from "drizzle-orm";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./db/schema";
import { usersTable } from "./db/schema";

export type NewUser = {
  name: string;
  age: number;
  email: string;
};

export type User = NewUser & {
  id: number;
};

export class UserRepository {
  private readonly db: PgliteDatabase<typeof schema>;

  constructor(db: PgliteDatabase<typeof schema>) {
    this.db = db;
  }

  async create(user: NewUser): Promise<User> {
    const [result] = await this.db.insert(usersTable).values(user).returning();
    if (!result) {
      throw new Error("Failed to create user");
    }
    return result;
  }

  async createMany(users: NewUser[]): Promise<User[]> {
    const result = await this.db.insert(usersTable).values(users).returning();
    if (!result.length) {
      throw new Error("Failed to create users");
    }
    return result;
  }

  async findAll(): Promise<User[]> {
    return await this.db.select().from(usersTable);
  }

  async findById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.email, email));
    return user;
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    const [updated] = await this.db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning();
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(usersTable).where(eq(usersTable.id, id));
  }

  async exists(id: number): Promise<boolean> {
    const [result] = await this.db
      .select({ count: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return !!result;
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
