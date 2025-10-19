import { z } from "zod";
import { SubscriptionStatus, SubscriptionTierName } from "@workspace/types";

// ============================================
// Admin Subscription Filter Schemas
// ============================================

export const adminSubscriptionFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
  status: z.array(z.nativeEnum(SubscriptionStatus)).optional(),
  tierIds: z.array(z.string().uuid()).optional(),
  search: z.string().min(1).optional(), // Search by user name or email
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  expiringInDays: z.number().int().positive().max(365).optional(),
});

export type AdminSubscriptionFilterInput = z.input<
  typeof adminSubscriptionFilterSchema
>;

// ============================================
// Admin Subscription Update Schemas
// ============================================

export const adminSubscriptionUpdateSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  updates: z.object({
    status: z.nativeEnum(SubscriptionStatus).optional(),
    current_period_start: z.string().datetime().optional(),
    current_period_end: z.string().datetime().optional(),
    cancel_at_period_end: z.boolean().optional(),
  }),
});

export type AdminSubscriptionUpdateInput = z.infer<
  typeof adminSubscriptionUpdateSchema
>;

// ============================================
// Admin Cancellation Schema
// ============================================

export const adminCancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  immediate: z.boolean().default(false),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export type AdminCancelSubscriptionInput = z.infer<
  typeof adminCancelSubscriptionSchema
>;

// ============================================
// Admin Extension Schema
// ============================================

export const adminExtendSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  extensionDays: z
    .number()
    .int()
    .min(1, "Extension must be at least 1 day")
    .max(365, "Extension cannot exceed 365 days"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export type AdminExtendSubscriptionInput = z.infer<
  typeof adminExtendSubscriptionSchema
>;

// ============================================
// Admin Tier Change Schema
// ============================================

export const adminChangeTierSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  newTierId: z.string().uuid("Invalid tier ID"),
  prorate: z.boolean().default(false),
  effectiveDate: z.string().datetime().optional(),
  reason: z.string().min(10).max(500).optional(),
});

export type AdminChangeTierInput = z.infer<typeof adminChangeTierSchema>;

// ============================================
// Manual Subscription Creation Schema
// ============================================

export const adminCreateManualSubscriptionSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  tierId: z.string().uuid("Invalid tier ID"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isComplimentary: z.boolean().default(true),
  reason: z.string().min(10).max(500),
});

export type AdminCreateManualSubscriptionInput = z.infer<
  typeof adminCreateManualSubscriptionSchema
>;

// ============================================
// Subscription Transfer Schema
// ============================================

export const adminTransferSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  toUserId: z.string().uuid("Invalid user ID"),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export type AdminTransferSubscriptionInput = z.infer<
  typeof adminTransferSubscriptionSchema
>;

// ============================================
// Admin Tier Management Schemas
// ============================================

export const adminCreateTierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Name must contain only lowercase letters, numbers, and hyphens",
    ),
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  price_monthly: z.number().nonnegative("Price must be non-negative"),
  stripe_price_id: z.string().optional().nullable(),
  features: z
    .object({
      exclusive_rooms: z.boolean(),
      max_concurrent_bookings: z.number().int().positive().optional(),
    })
    .catchall(z.any()), // Allow additional custom features
  is_active: z.boolean().default(true),
});

export type AdminCreateTierInput = z.infer<typeof adminCreateTierSchema>;

export const adminUpdateTierSchema = z.object({
  tierId: z.string().uuid("Invalid tier ID"),
  updates: z.object({
    name: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    display_name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    price_monthly: z.number().nonnegative().optional(),
    stripe_price_id: z.string().optional().nullable(),
    features: z
      .object({
        exclusive_rooms: z.boolean().optional(),
        max_concurrent_bookings: z.number().int().positive().optional(),
      })
      .catchall(z.any())
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

export type AdminUpdateTierInput = z.infer<typeof adminUpdateTierSchema>;

// ============================================
// Admin Notes Schemas
// ============================================

export const adminAddNoteSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  note: z
    .string()
    .min(10, "Note must be at least 10 characters")
    .max(1000, "Note must be at most 1000 characters"),
});

export type AdminAddNoteInput = z.infer<typeof adminAddNoteSchema>;

export const adminUpdateNoteSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  noteId: z.string().uuid("Invalid note ID"),
  note: z
    .string()
    .min(10, "Note must be at least 10 characters")
    .max(1000, "Note must be at most 1000 characters"),
});

export type AdminUpdateNoteInput = z.infer<typeof adminUpdateNoteSchema>;

export const adminDeleteNoteSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  noteId: z.string().uuid("Invalid note ID"),
});

export type AdminDeleteNoteInput = z.infer<typeof adminDeleteNoteSchema>;

// ============================================
// Event Filter Schema
// ============================================

export const adminEventFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().min(1).max(100).optional().default(20),
  eventTypes: z.array(z.string()).optional(),
  userId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type AdminEventFilterInput = z.input<typeof adminEventFilterSchema>;
