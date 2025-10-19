import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SubscriptionTier,
  UserSubscription,
  UserSubscriptionWithTier,
  CreateCheckoutSessionInput,
  CheckoutSessionResponse,
  CreatePortalSessionInput,
  PortalSessionResponse,
  SubscriptionEvent,
} from "@workspace/types";

/**
 * Subscription Service
 * Handles all subscription-related operations
 */
export class SubscriptionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all active subscription tiers
   */
  async getTiers(): Promise<SubscriptionTier[]> {
    const { data, error } = await this.supabase
      .from("subscription_tiers")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get a specific tier by ID
   */
  async getTierById(tierId: string): Promise<SubscriptionTier> {
    const { data, error } = await this.supabase
      .from("subscription_tiers")
      .select("*")
      .eq("id", tierId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Subscription tier not found");
    }

    return data;
  }

  /**
   * Get a tier by name (e.g., 'free', 'premium')
   */
  async getTierByName(name: string): Promise<SubscriptionTier> {
    const { data, error } = await this.supabase
      .from("subscription_tiers")
      .select("*")
      .eq("name", name)
      .eq("is_active", true)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error(`Subscription tier '${name}' not found`);
    }

    return data;
  }

  /**
   * Get the current user's active subscription
   */
  async getUserSubscription(
    userId: string,
  ): Promise<UserSubscriptionWithTier | null> {
    const { data, error } = await this.supabase
      .from("user_subscriptions")
      .select(
        `
        *,
        tier:subscription_tiers(*)
      `,
      )
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no subscription found, return null (not an error)
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    return data as UserSubscriptionWithTier;
  }

  /**
   * Check if user has access to exclusive rooms
   */
  async hasExclusiveAccess(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || !subscription.tier) {
      return false;
    }

    const hasFeature = subscription.tier.features?.exclusive_rooms === true;
    const isActive = ["active", "trialing"].includes(subscription.status);
    const notExpired =
      !subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date();

    return hasFeature && isActive && notExpired;
  }

  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke(
        "create-checkout-session",
        {
          body: input,
        },
      );

      // Even when there's an error, data might contain the parsed error response
      console.log("Checkout response - data:", data);
      console.log("Checkout response - error:", error);

      // Check if data contains an error message (Edge Function returned error response)
      if (data?.error) {
        console.error("Edge Function returned error:", data.error);
        console.error("Error stack:", data.stack);
        console.error("Error type:", data.type);
        console.error("Error code:", data.code);
        console.error("Full error:", data.fullError);
        throw new Error(`Stripe checkout failed: ${data.error}`);
      }

      if (error) {
        console.error("Supabase Functions client error:", error);
        throw new Error(`Checkout error: ${error.message}`);
      }

      if (!data || !data.url) {
        console.error("Invalid checkout session response:", data);
        throw new Error("Failed to create checkout session - no URL returned");
      }

      return data as CheckoutSessionResponse;
    } catch (err) {
      console.error("Exception in createCheckoutSession:", err);
      throw err;
    }
  }

  /**
   * Create a Stripe billing portal session
   */
  async createPortalSession(
    input: CreatePortalSessionInput,
  ): Promise<PortalSessionResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke(
        "create-portal-session",
        {
          body: input,
        },
      );

      console.log("Portal response - data:", data);
      console.log("Portal response - error:", error);

      // Check if data contains an error message (Edge Function returned error response)
      if (data?.error) {
        console.error("Edge Function returned error:", data.error);
        console.error("Error stack:", data.stack);
        console.error("Error type:", data.type);
        throw new Error(`Billing portal failed: ${data.error}`);
      }

      if (error) {
        console.error("Supabase Functions client error:", error);
        throw new Error(`Portal error: ${error.message}`);
      }

      if (!data || !data.url) {
        console.error("Invalid portal session response:", data);
        throw new Error("Failed to create portal session - no URL returned");
      }

      return data as PortalSessionResponse;
    } catch (err) {
      console.error("Exception in createPortalSession:", err);
      throw err;
    }
  }

  /**
   * Get subscription events for a user (audit trail)
   */
  async getUserSubscriptionEvents(
    userId: string,
    limit: number = 10,
  ): Promise<SubscriptionEvent[]> {
    const { data, error } = await this.supabase
      .from("subscription_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get all user subscriptions (admin only)
   */
  async getAllSubscriptions(
    page: number = 1,
    perPage: number = 20,
  ): Promise<{ data: UserSubscriptionWithTier[]; total: number }> {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await this.supabase
      .from("user_subscriptions")
      .select(
        `
        *,
        tier:subscription_tiers(*),
        user:users(id, email, full_name)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []) as UserSubscriptionWithTier[],
      total: count || 0,
    };
  }

  /**
   * Get subscription statistics (admin only)
   */
  async getSubscriptionStats(): Promise<{
    total_subscriptions: number;
    active_subscriptions: number;
    premium_subscriptions: number;
    mrr: number;
    churn_rate: number;
  }> {
    // Get all subscriptions
    const { data: allSubs, error: allError } = await this.supabase
      .from("user_subscriptions")
      .select("status, tier:subscription_tiers(price_monthly)");

    if (allError) {
      throw new Error(allError.message);
    }

    const total_subscriptions = allSubs?.length || 0;
    const active_subscriptions =
      allSubs?.filter(
        (s: any) => s.status === "active" || s.status === "trialing",
      ).length || 0;
    const premium_subscriptions =
      allSubs?.filter(
        (s: any) =>
          (s.status === "active" || s.status === "trialing") &&
          s.tier?.price_monthly > 0,
      ).length || 0;

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr =
      allSubs
        ?.filter((s: any) => s.status === "active" || s.status === "trialing")
        .reduce(
          (sum: number, s: any) => sum + (s.tier?.price_monthly || 0),
          0,
        ) || 0;

    // Calculate churn rate (simplified - cancelled in last month / active at start of month)
    // This is a placeholder - in production, you'd query subscription_events
    const churn_rate = 0; // TODO: Implement proper churn rate calculation

    return {
      total_subscriptions,
      active_subscriptions,
      premium_subscriptions,
      mrr,
      churn_rate,
    };
  }
}

/**
 * Factory function to create a SubscriptionService instance
 */
export const createSubscriptionService = (
  supabase: SupabaseClient,
): SubscriptionService => {
  return new SubscriptionService(supabase);
};
