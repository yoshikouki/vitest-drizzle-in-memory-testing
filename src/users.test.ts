import { describe, expect, it } from "vitest";
import { testDb } from "./tests/setup";
import type { NewUser, User } from "./users";
import { UserRepository } from "./users";

describe("UserRepository", () => {
  const userRepository = new UserRepository();

  const testUser: NewUser = {
    name: "Test User",
    age: 25,
    email: "test@example.com",
  };

  describe("create", () => {
    it("should create a new user", async () => {
      const user = await userRepository.create(testUser);
      expect(user).toMatchObject(testUser);
      expect(user.id).toBeDefined();
    });

    it("should validate email format", async () => {
      const invalidUser = { ...testUser, email: "invalid-email" };
      const isValid = await userRepository.validateEmail(invalidUser.email);
      expect(isValid).toBe(false);
    });

    it("should not allow duplicate emails", async () => {
      await expect(userRepository.create(testUser)).rejects.toThrow();
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
    let createdUser: User;

    it("should find all users", async () => {
      createdUser = await userRepository.create({
        name: "Find Test User",
        age: 28,
        email: "find@example.com",
      });

      const users = await userRepository.findAll();
      expect(users.length).toBeGreaterThan(0);
    });

    it("should find user by id", async () => {
      const user = await userRepository.findById(createdUser.id);
      expect(user).toMatchObject({
        id: createdUser.id,
        name: "Find Test User",
        email: "find@example.com",
      });
    });

    it("should find user by email", async () => {
      const user = await userRepository.findByEmail("find@example.com");
      expect(user).toMatchObject({
        id: createdUser.id,
        name: "Find Test User",
        email: "find@example.com",
      });
    });

    it("should return undefined for non-existent id", async () => {
      const user = await userRepository.findById(99999);
      expect(user).toBeUndefined();
    });
  });

  describe("update", () => {
    let userToUpdate: User;

    it("should update user information", async () => {
      userToUpdate = await userRepository.create({
        name: "Update Test User",
        age: 40,
        email: "update@example.com",
      });

      const updatedUser = await userRepository.update(userToUpdate.id, {
        name: "Updated Name",
        age: 41,
      });

      expect(updatedUser).toMatchObject({
        id: userToUpdate.id,
        name: "Updated Name",
        age: 41,
        email: "update@example.com",
      });
    });

    it("should return undefined when updating non-existent user", async () => {
      const result = await userRepository.update(99999, { name: "Non-existent" });
      expect(result).toBeUndefined();
    });
  });

  describe("delete", () => {
    let userToDelete: User;

    it("should delete a user", async () => {
      userToDelete = await userRepository.create({
        name: "Delete Test User",
        age: 50,
        email: "delete@example.com",
      });

      await userRepository.delete(userToDelete.id);
      const deleted = await userRepository.findById(userToDelete.id);
      expect(deleted).toBeUndefined();
    });

    it("should not throw when deleting non-existent user", async () => {
      await expect(userRepository.delete(99999)).resolves.not.toThrow();
    });
  });

  describe("exists", () => {
    let existingUser: User;

    it("should return true for existing user", async () => {
      existingUser = await userRepository.create({
        name: "Exists Test User",
        age: 60,
        email: "exists@example.com",
      });

      const exists = await userRepository.exists(existingUser.id);
      expect(exists).toBe(true);
    });

    it("should return false for non-existent user", async () => {
      const exists = await userRepository.exists(99999);
      expect(exists).toBe(false);
    });
  });
});
