import { z } from "zod";
import { UserRole, UserStatus } from "@workspace/types";

// Update user schema (admin)
export const updateUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .optional(),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be 10 digits")
    .optional()
    .or(z.literal("")),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// User filter schema
export const userFilterSchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
});

export type UserFilterInput = z.infer<typeof userFilterSchema>;

// User ID param schema
export const userIdSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

export type UserIdParam = z.infer<typeof userIdSchema>;

// Deactivate user schema
export const deactivateUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
  reason: z
    .string()
    .max(500, "Reason must be less than 500 characters")
    .optional(),
});

export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;
