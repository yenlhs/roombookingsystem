/**
 * Notification Service
 * Handles push notifications and email notifications
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  token_type: "expo" | "fcm" | "apns";
  device_id?: string;
  device_name?: string;
  platform?: "ios" | "android";
  app_version?: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_booking_confirmed: boolean;
  email_booking_cancelled: boolean;
  email_booking_reminder: boolean;
  email_booking_reminder_minutes: number;
  push_enabled: boolean;
  push_booking_confirmed: boolean;
  push_booking_cancelled: boolean;
  push_booking_reminder: boolean;
  push_booking_reminder_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  user_id?: string;
  booking_id?: string;
  notification_type:
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "booking_updated";
  channel: "email" | "push";
  status: "pending" | "sent" | "failed" | "delivered";
  recipient: string;
  subject?: string;
  body?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface RegisterPushTokenParams {
  token: string;
  token_type: "expo" | "fcm" | "apns";
  device_id?: string;
  device_name?: string;
  platform?: "ios" | "android";
  app_version?: string;
}

export interface UpdateNotificationPreferencesParams {
  email_enabled?: boolean;
  email_booking_confirmed?: boolean;
  email_booking_cancelled?: boolean;
  email_booking_reminder?: boolean;
  email_booking_reminder_minutes?: number;
  push_enabled?: boolean;
  push_booking_confirmed?: boolean;
  push_booking_cancelled?: boolean;
  push_booking_reminder?: boolean;
  push_booking_reminder_minutes?: number;
}

export interface SendBookingNotificationParams {
  bookingId: string;
  notificationType:
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "booking_updated";
}

export function createNotificationService(supabase: SupabaseClient) {
  return {
    /**
     * Register a push notification token for the current user
     */
    async registerPushToken(
      params: RegisterPushTokenParams,
    ): Promise<{ id: string }> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.rpc("register_push_token", {
        p_user_id: user.id,
        p_token: params.token,
        p_token_type: params.token_type,
        p_device_id: params.device_id || null,
        p_device_name: params.device_name || null,
        p_platform: params.platform || null,
        p_app_version: params.app_version || null,
      });

      if (error) {
        throw error;
      }

      return { id: data };
    },

    /**
     * Deactivate a push notification token
     */
    async deactivatePushToken(token: string): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.rpc("deactivate_push_token", {
        p_user_id: user.id,
        p_token: token,
      });

      if (error) {
        throw error;
      }
    },

    /**
     * Get active push tokens for the current user
     */
    async getPushTokens(): Promise<PushToken[]> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("push_tokens")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("last_used_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },

    /**
     * Get notification preferences for the current user
     */
    async getNotificationPreferences(): Promise<NotificationPreferences | null> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // Return null if not found, throw on other errors
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data;
    },

    /**
     * Update notification preferences for the current user
     */
    async updateNotificationPreferences(
      params: UpdateNotificationPreferencesParams,
    ): Promise<NotificationPreferences> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("notification_preferences")
        .update({
          ...params,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    /**
     * Get notification logs for the current user
     */
    async getNotificationLogs(limit: number = 50): Promise<NotificationLog[]> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("notification_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    },

    /**
     * Send booking notification (triggers email and/or push notification)
     * This calls a Supabase Edge Function
     */
    async sendBookingNotification(
      params: SendBookingNotificationParams,
    ): Promise<void> {
      const { error } = await supabase.functions.invoke(
        "send-booking-notification",
        {
          body: params,
        },
      );

      if (error) {
        throw error;
      }
    },

    /**
     * Test notification - sends a test notification to the current user
     */
    async sendTestNotification(): Promise<void> {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.functions.invoke(
        "send-test-notification",
        {
          body: {
            userId: user.id,
          },
        },
      );

      if (error) {
        throw error;
      }
    },
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
