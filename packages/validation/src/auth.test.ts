import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth";

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should accept valid login credentials", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        full_name: "John Doe",
        phone: "1234567890",
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject weak password (no uppercase)", () => {
      const invalidData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        full_name: "John Doe",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("uppercase");
      }
    });

    it("should reject weak password (no lowercase)", () => {
      const invalidData = {
        email: "test@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
        full_name: "John Doe",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("lowercase");
      }
    });

    it("should reject weak password (no number)", () => {
      const invalidData = {
        email: "test@example.com",
        password: "PasswordABC",
        confirmPassword: "PasswordABC",
        full_name: "John Doe",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("number");
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
        full_name: "John Doe",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "at least 8 characters",
        );
      }
    });

    it("should reject mismatched passwords", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password456",
        full_name: "John Doe",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });

    it("should reject short full name", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        full_name: "J",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "at least 2 characters",
        );
      }
    });

    it("should reject invalid phone format", () => {
      const invalidData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        full_name: "John Doe",
        phone: "123",
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("10 digits");
      }
    });

    it("should accept empty phone", () => {
      const validData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        full_name: "John Doe",
        phone: "",
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should accept valid email", () => {
      const validData = {
        email: "test@example.com",
      };
      const result = forgotPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
      };
      const result = forgotPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should accept valid password reset data", () => {
      const validData = {
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };
      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject mismatched passwords", () => {
      const invalidData = {
        password: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      };
      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });
  });

  describe("changePasswordSchema", () => {
    it("should accept valid password change data", () => {
      const validData = {
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      };
      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject when new password matches current password", () => {
      const invalidData = {
        currentPassword: "Password123",
        newPassword: "Password123",
        confirmPassword: "Password123",
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "different from current",
        );
      }
    });

    it("should reject mismatched confirmation", () => {
      const invalidData = {
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
        confirmPassword: "DifferentPassword123",
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });
  });

  describe("updateProfileSchema", () => {
    it("should accept valid profile update data", () => {
      const validData = {
        full_name: "John Doe",
        phone: "1234567890",
        avatar_url: "https://example.com/avatar.jpg",
      };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept empty optional fields", () => {
      const validData = {
        full_name: "John Doe",
        phone: "",
        avatar_url: "",
      };
      const result = updateProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid avatar URL", () => {
      const invalidData = {
        full_name: "John Doe",
        avatar_url: "not-a-valid-url",
      };
      const result = updateProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid URL");
      }
    });
  });
});
