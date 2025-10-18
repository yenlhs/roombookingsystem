import { z } from 'zod';
import {
  SubscriptionTierName,
  SubscriptionStatus,
  SubscriptionEventType,
} from '@workspace/types';

// Create checkout session schema
export const createCheckoutSessionSchema = z.object({
  tier_id: z.string().uuid('Invalid tier ID'),
  success_url: z.string().url('Invalid success URL').optional(),
  cancel_url: z.string().url('Invalid cancel URL').optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

// Create portal session schema
export const createPortalSessionSchema = z.object({
  return_url: z.string().url('Invalid return URL').optional(),
});

export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>;

// Subscription tier schema
export const subscriptionTierSchema = z.object({
  id: z.string().uuid(),
  name: z.nativeEnum(SubscriptionTierName),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().optional().nullable(),
  price_monthly: z.number().nonnegative('Price must be non-negative'),
  stripe_price_id: z.string().optional().nullable(),
  features: z.object({
    exclusive_rooms: z.boolean(),
    max_concurrent_bookings: z.number().int().positive().optional(),
  }),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SubscriptionTierInput = z.infer<typeof subscriptionTierSchema>;

// User subscription schema
export const userSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  tier_id: z.string().uuid(),
  stripe_subscription_id: z.string().optional().nullable(),
  stripe_customer_id: z.string().optional().nullable(),
  status: z.nativeEnum(SubscriptionStatus),
  current_period_start: z.string().optional().nullable(),
  current_period_end: z.string().optional().nullable(),
  cancel_at_period_end: z.boolean(),
  cancelled_at: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserSubscriptionInput = z.infer<typeof userSubscriptionSchema>;

// Subscription event schema
export const subscriptionEventSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  subscription_id: z.string().uuid().optional().nullable(),
  event_type: z.nativeEnum(SubscriptionEventType),
  stripe_event_id: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string(),
});

export type SubscriptionEventInput = z.infer<typeof subscriptionEventSchema>;

// Tier ID param schema
export const tierIdSchema = z.object({
  id: z.string().uuid('Invalid tier ID'),
});

export type TierIdParam = z.infer<typeof tierIdSchema>;
