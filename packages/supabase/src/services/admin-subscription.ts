import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  UserSubscription,
  UserSubscriptionWithTier,
  SubscriptionTier,
  SubscriptionEvent,
  SubscriptionStatus,
  SubscriptionEventType,
} from '@workspace/types';
import type {
  AdminSubscriptionFilterInput,
  AdminCancelSubscriptionInput,
  AdminExtendSubscriptionInput,
  AdminChangeTierInput,
  AdminCreateManualSubscriptionInput,
  AdminTransferSubscriptionInput,
  AdminCreateTierInput,
  AdminUpdateTierInput,
  AdminEventFilterInput,
} from '@workspace/validation';

/**
 * Admin Subscription Service
 * Handles admin-specific subscription operations
 */
export class AdminSubscriptionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all subscriptions with advanced filtering (admin only)
   */
  async getAllSubscriptionsAdmin(
    filters: AdminSubscriptionFilterInput = {}
  ): Promise<{ data: UserSubscriptionWithTier[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      perPage = 20,
      status,
      tierIds,
      search,
      dateFrom,
      dateTo,
      cancelAtPeriodEnd,
      expiringInDays,
    } = filters;

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = this.supabase
      .from('user_subscriptions')
      .select(
        `
        *,
        tier:subscription_tiers(*),
        user:users(id, email, full_name, avatar_url)
      `,
        { count: 'exact' }
      );

    // Apply status filter
    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    // Apply tier filter
    if (tierIds && tierIds.length > 0) {
      query = query.in('tier_id', tierIds);
    }

    // Apply date filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply cancel_at_period_end filter
    if (typeof cancelAtPeriodEnd === 'boolean') {
      query = query.eq('cancel_at_period_end', cancelAtPeriodEnd);
    }

    // Apply expiring soon filter
    if (expiringInDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringInDays);
      query = query
        .lte('current_period_end', futureDate.toISOString())
        .gte('current_period_end', new Date().toISOString())
        .in('status', ['active', 'trialing']);
    }

    // Apply search filter (searching in users table)
    if (search) {
      const { data: userIds } = await this.supabase
        .from('users')
        .select('id')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

      if (userIds && userIds.length > 0) {
        query = query.in(
          'user_id',
          userIds.map((u) => u.id)
        );
      } else {
        // No matching users, return empty result
        return {
          data: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / perPage);

    return {
      data: (data || []) as UserSubscriptionWithTier[],
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get a specific subscription by ID (admin only)
   */
  async getSubscriptionByIdAdmin(subscriptionId: string): Promise<UserSubscriptionWithTier> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select(
        `
        *,
        tier:subscription_tiers(*),
        user:users(id, email, full_name, phone, avatar_url, created_at)
      `
      )
      .eq('id', subscriptionId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Subscription not found');
    }

    return data as UserSubscriptionWithTier;
  }

  /**
   * Update subscription (admin override)
   */
  async updateSubscriptionAdmin(
    subscriptionId: string,
    updates: Partial<UserSubscription>
  ): Promise<UserSubscription> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to update subscription');
    }

    return data as UserSubscription;
  }

  /**
   * Cancel subscription (admin override)
   */
  async cancelSubscriptionAdmin(input: AdminCancelSubscriptionInput): Promise<UserSubscription> {
    const { subscriptionId, immediate, reason } = input;

    const updates: Partial<UserSubscription> = {
      cancel_at_period_end: !immediate,
    };

    if (immediate) {
      updates.status = 'cancelled' as SubscriptionStatus;
      updates.cancelled_at = new Date().toISOString();
    }

    const subscription = await this.updateSubscriptionAdmin(subscriptionId, updates);

    // Log admin action
    await this.logAdminEvent(
      subscription.user_id,
      subscriptionId,
      'admin_cancellation' as SubscriptionEventType,
      {
        immediate,
        reason,
      }
    );

    return subscription;
  }

  /**
   * Extend subscription period (admin grace period)
   */
  async extendSubscription(input: AdminExtendSubscriptionInput): Promise<UserSubscription> {
    const { subscriptionId, extensionDays, reason } = input;

    // Get current subscription
    const subscription = await this.getSubscriptionByIdAdmin(subscriptionId);

    // Calculate new end date
    const currentEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : new Date();
    currentEnd.setDate(currentEnd.getDate() + extensionDays);

    const updates: Partial<UserSubscription> = {
      current_period_end: currentEnd.toISOString(),
    };

    const updatedSubscription = await this.updateSubscriptionAdmin(subscriptionId, updates);

    // Log admin action
    await this.logAdminEvent(
      subscription.user_id,
      subscriptionId,
      'admin_extension' as SubscriptionEventType,
      {
        extension_days: extensionDays,
        new_end_date: currentEnd.toISOString(),
        reason,
      }
    );

    return updatedSubscription;
  }

  /**
   * Change subscription tier (admin override)
   */
  async changeTierAdmin(input: AdminChangeTierInput): Promise<UserSubscription> {
    const { subscriptionId, newTierId, prorate, effectiveDate, reason } = input;

    // Get current subscription
    const subscription = await this.getSubscriptionByIdAdmin(subscriptionId);
    const oldTierId = subscription.tier_id;

    const updates: Partial<UserSubscription> = {
      tier_id: newTierId,
    };

    const updatedSubscription = await this.updateSubscriptionAdmin(subscriptionId, updates);

    // Log admin action
    await this.logAdminEvent(
      subscription.user_id,
      subscriptionId,
      'admin_tier_change' as SubscriptionEventType,
      {
        old_tier_id: oldTierId,
        new_tier_id: newTierId,
        prorate,
        effective_date: effectiveDate,
        reason,
      }
    );

    return updatedSubscription;
  }

  /**
   * Create manual subscription (complimentary, migrations, etc.)
   */
  async createManualSubscription(
    input: AdminCreateManualSubscriptionInput
  ): Promise<UserSubscription> {
    const { userId, tierId, startDate, endDate, isComplimentary, reason } = input;

    const subscriptionData = {
      user_id: userId,
      tier_id: tierId,
      status: 'active' as SubscriptionStatus,
      current_period_start: startDate,
      current_period_end: endDate || null,
      cancel_at_period_end: false,
      // Don't set Stripe IDs for complimentary subscriptions
      stripe_subscription_id: isComplimentary ? null : undefined,
      stripe_customer_id: isComplimentary ? null : undefined,
    };

    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to create subscription');
    }

    // Log admin action
    await this.logAdminEvent(
      userId,
      data.id,
      'admin_manual_creation' as SubscriptionEventType,
      {
        tier_id: tierId,
        is_complimentary: isComplimentary,
        start_date: startDate,
        end_date: endDate,
        reason,
      }
    );

    return data as UserSubscription;
  }

  /**
   * Transfer subscription to another user
   */
  async transferSubscription(
    input: AdminTransferSubscriptionInput
  ): Promise<UserSubscription> {
    const { subscriptionId, toUserId, reason } = input;

    // Get current subscription
    const subscription = await this.getSubscriptionByIdAdmin(subscriptionId);
    const fromUserId = subscription.user_id;

    const updates: Partial<UserSubscription> = {
      user_id: toUserId,
    };

    const updatedSubscription = await this.updateSubscriptionAdmin(subscriptionId, updates);

    // Log admin action for both users
    await this.logAdminEvent(
      fromUserId,
      subscriptionId,
      'admin_transfer' as SubscriptionEventType,
      {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        direction: 'from',
        reason,
      }
    );

    await this.logAdminEvent(
      toUserId,
      subscriptionId,
      'admin_transfer' as SubscriptionEventType,
      {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        direction: 'to',
        reason,
      }
    );

    return updatedSubscription;
  }

  /**
   * Create a new tier (admin only)
   */
  async createTier(tierData: AdminCreateTierInput): Promise<SubscriptionTier> {
    const { data, error } = await this.supabase
      .from('subscription_tiers')
      .insert(tierData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to create tier');
    }

    return data as SubscriptionTier;
  }

  /**
   * Update a tier (admin only)
   */
  async updateTier(input: AdminUpdateTierInput): Promise<SubscriptionTier> {
    const { tierId, updates } = input;

    const { data, error } = await this.supabase
      .from('subscription_tiers')
      .update(updates)
      .eq('id', tierId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to update tier');
    }

    return data as SubscriptionTier;
  }

  /**
   * Delete a tier (admin only)
   * Prevents deletion if users are subscribed to this tier
   */
  async deleteTier(tierId: string): Promise<void> {
    // Check if any users are subscribed to this tier
    const count = await this.getTierSubscriberCount(tierId);

    if (count > 0) {
      throw new Error(`Cannot delete tier: ${count} users are currently subscribed to this tier`);
    }

    const { error } = await this.supabase.from('subscription_tiers').delete().eq('id', tierId);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get the number of users subscribed to a tier
   */
  async getTierSubscriberCount(tierId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('tier_id', tierId)
      .in('status', ['active', 'trialing']);

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }

  /**
   * Get all subscription events with filtering (admin only)
   */
  async getAllSubscriptionEvents(
    filters: AdminEventFilterInput = {}
  ): Promise<{ data: SubscriptionEvent[]; total: number; page: number; totalPages: number }> {
    const { page = 1, perPage = 20, eventTypes, userId, subscriptionId, dateFrom, dateTo } = filters;

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = this.supabase
      .from('subscription_events')
      .select('*', { count: 'exact' });

    // Apply filters
    if (eventTypes && eventTypes.length > 0) {
      query = query.in('event_type', eventTypes);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / perPage);

    return {
      data: (data || []) as SubscriptionEvent[],
      total,
      page,
      totalPages,
    };
  }

  /**
   * Log an admin event to subscription_events table
   */
  private async logAdminEvent(
    userId: string,
    subscriptionId: string,
    eventType: SubscriptionEventType,
    metadata: Record<string, any>
  ): Promise<void> {
    // Get current admin user (from Supabase auth)
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    const eventData = {
      user_id: userId,
      subscription_id: subscriptionId,
      event_type: eventType,
      metadata: {
        ...metadata,
        admin_id: user?.id,
        admin_email: user?.email,
        timestamp: new Date().toISOString(),
      },
    };

    const { error } = await this.supabase.from('subscription_events').insert(eventData);

    if (error) {
      console.error('Failed to log admin event:', error);
      // Don't throw - logging should not block the operation
    }
  }
}

/**
 * Factory function to create an AdminSubscriptionService instance
 */
export const createAdminSubscriptionService = (
  supabase: SupabaseClient
): AdminSubscriptionService => {
  return new AdminSubscriptionService(supabase);
};
