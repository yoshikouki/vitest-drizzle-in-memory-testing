import { beforeEach, describe, expect, it } from "vitest";
import { testDb } from "./tests/setup";
import type { NewUser, User } from "./users";
import { UserRepository } from "./users";

describe("UserRepository", () => {
  const userRepository = new UserRepository(testDb);
  let createdUser: User;

  const testUser: NewUser = {
    name: "Test User",
    age: 25,
    email: "test@example.com",
  };

  beforeEach(async () => {
    createdUser = await userRepository.create(testUser);
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const newUser: NewUser = {
        name: "Another User",
        age: 30,
        email: "another@example.com",
      };
      const user = await userRepository.create(newUser);
      expect(user).toMatchObject(newUser);
      expect(user.id).toBeDefined();
    });

    it("should validate email format", async () => {
      const invalidUser = { ...testUser, email: "invalid-email" };
      const isValid = await userRepository.validateEmail(invalidUser.email);
      expect(isValid).toBe(false);
    });

    it("should not allow duplicate emails", async () => {
      const duplicateUser = { ...testUser };
      await expect(userRepository.create(duplicateUser)).rejects.toThrow();
    });
  });

  describe("createMany", () => {
    it("should create multiple users", async () => {
      const users: NewUser[] = [
        {
          name: "User 1",
          age: 30,
          email: "user1@example.com",
        },
        {
          name: "User 2",
          age: 35,
          email: "user2@example.com",
        },
      ];

      const createdUsers = await userRepository.createMany(users);
      expect(createdUsers).toHaveLength(2);
      expect(createdUsers[0]?.email).toBe("user1@example.com");
      expect(createdUsers[1]?.email).toBe("user2@example.com");
    });
  });

  describe("find operations", () => {
    it("should find all users", async () => {
      const users = await userRepository.findAll();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toMatchObject(testUser);
    });

    it("should find user by id", async () => {
      const user = await userRepository.findById(createdUser.id);
      expect(user).toMatchObject({
        id: createdUser.id,
        name: testUser.name,
        email: testUser.email,
      });
    });

    it("should find user by email", async () => {
      const user = await userRepository.findByEmail(testUser.email);
      expect(user).toMatchObject({
        id: createdUser.id,
        name: testUser.name,
        email: testUser.email,
      });
    });

    it("should return undefined for non-existent id", async () => {
      const user = await userRepository.findById(99999);
      expect(user).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update user information", async () => {
      const updatedUser = await userRepository.update(createdUser.id, {
        name: "Updated Name",
        age: 41,
      });

      expect(updatedUser).toMatchObject({
        id: createdUser.id,
        name: "Updated Name",
        age: 41,
        email: testUser.email,
      });
    });

    it("should return undefined when updating non-existent user", async () => {
      const result = await userRepository.update(99999, { name: "Non-existent" });
      expect(result).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      await userRepository.delete(createdUser.id);
      const deleted = await userRepository.findById(createdUser.id);
      expect(deleted).toBeUndefined();
    });

    it("should not throw when deleting non-existent user", async () => {
      await expect(userRepository.delete(99999)).resolves.not.toThrow();
    });
  });

  describe("exists", () => {
    it("should return true for existing user", async () => {
      const exists = await userRepository.exists(createdUser.id);
      expect(exists).toBe(true);
    });

    it("should return false for non-existent user", async () => {
      const exists = await userRepository.exists(99999);
      expect(exists).toBe(false);
    });
  });
});
