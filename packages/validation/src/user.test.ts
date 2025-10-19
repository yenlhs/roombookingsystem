import { describe, it, expect } from "vitest";
import { UserRole, UserStatus } from "@workspace/types";
import {
  updateUserSchema,
  userFilterSchema,
  deactivateUserSchema,
} from "./user";

describe("User Validation Schemas", () => {
  describe("updateUserSchema", () => {
    it("should accept valid user update data", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        full_name: "John Doe",
        phone: "1234567890",
        status: UserStatus.ACTIVE,
        role: UserRole.ADMIN,
      };
      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept partial update with only full_name", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        full_name: "Jane Smith",
      };
      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept partial update with only status", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: UserStatus.INACTIVE,
      };
      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept partial update with only role", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        role: UserRole.USER,
      };
      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid user ID", () => {
      const invalidData = {
        id: "not-a-uuid",
        full_name: "John Doe",
      };
      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid user ID");
      }
    });

    it("should reject short full_name", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        full_name: "J",
      };
      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "at least 2 characters",
        );
      }
    });

    it("should reject long full_name", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        full_name: "a".repeat(101),
      };
      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "less than 100 characters",
        );
      }
    });

    it("should reject invalid phone format", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        phone: "123",
      };
      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("10 digits");
      }
    });

    it("should accept empty phone", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        phone: "",
      };
      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept all UserStatus enum values", () => {
      const activeData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: UserStatus.ACTIVE,
      };
      const inactiveData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: UserStatus.INACTIVE,
      };

      expect(updateUserSchema.safeParse(activeData).success).toBe(true);
      expect(updateUserSchema.safeParse(inactiveData).success).toBe(true);
    });

    it("should accept all UserRole enum values", () => {
      const adminData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        role: UserRole.ADMIN,
      };
      const userData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        role: UserRole.USER,
      };

      expect(updateUserSchema.safeParse(adminData).success).toBe(true);
      expect(updateUserSchema.safeParse(userData).success).toBe(true);
    });
  });

  describe("userFilterSchema", () => {
    it("should accept valid filter data", () => {
      const validData = {
        status: UserStatus.ACTIVE,
        role: UserRole.ADMIN,
        search: "john",
      };
      const result = userFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept empty filters", () => {
      const validData = {};
      const result = userFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept only status filter", () => {
      const validData = {
        status: UserStatus.INACTIVE,
      };
      const result = userFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept only role filter", () => {
      const validData = {
        role: UserRole.USER,
      };
      const result = userFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept only search filter", () => {
      const validData = {
        search: "test user",
      };
      const result = userFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept combination of filters", () => {
      const validData = {
        status: UserStatus.ACTIVE,
        search: "admin",
      };
      const result = userFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("deactivateUserSchema", () => {
    it("should accept valid deactivation data with reason", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        reason: "User requested account deactivation",
      };
      const result = deactivateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept deactivation without reason", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };
      const result = deactivateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid user ID", () => {
      const invalidData = {
        id: "not-a-uuid",
        reason: "Test reason",
      };
      const result = deactivateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid user ID");
      }
    });

    it("should reject reason longer than 500 characters", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        reason: "a".repeat(501),
      };
      const result = deactivateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "less than 500 characters",
        );
      }
    });

    it("should accept reason with exactly 500 characters", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        reason: "a".repeat(500),
      };
      const result = deactivateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
