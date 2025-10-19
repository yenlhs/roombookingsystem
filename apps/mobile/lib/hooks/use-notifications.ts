/**
 * React Hook for managing push notifications
 */

import { useEffect, useState, useRef } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  initializeNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  type PushNotificationToken,
} from "../notifications";
import { createNotificationService } from "@workspace/supabase";
import { supabase } from "../supabase";
import { useAuth } from "../auth/context";

export function useNotifications() {
  const router = useRouter();
  const routerRef = useRef(router);
  const { user, loading: authLoading } = useAuth();
  const [pushToken, setPushToken] = useState<PushNotificationToken | null>(
    null,
  );
  const [isRegistered, setIsRegistered] = useState(false);

  // Track if we've already initialized to prevent multiple setups
  const hasInitialized = useRef(false);
  const hasRegisteredToken = useRef(false);

  // Keep router ref up to date
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Setup notification listeners once
  useEffect(() => {
    // Listen for notifications when app is in foreground
    const receivedSubscription = addNotificationReceivedListener(
      (notification) => {
        console.log("[Notifications] Received in foreground:", notification);

        // Show alert for foreground notifications
        Alert.alert(
          notification.request.content.title || "Notification",
          notification.request.content.body || "",
          [{ text: "OK" }],
        );
      },
    );

    // Listen for notification taps
    const responseSubscription = addNotificationResponseListener((response) => {
      console.log("[Notifications] User tapped notification:", response);

      const data = response.notification.request.content.data;

      // Handle navigation based on notification type
      if (data?.bookingId) {
        // Navigate to booking details or bookings tab
        routerRef.current.push("/(tabs)/bookings");
      }
    });

    // Cleanup
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Initialize push token once
  useEffect(() => {
    if (hasInitialized.current || authLoading) {
      return;
    }

    hasInitialized.current = true;

    const initPushToken = async () => {
      try {
        console.log("[Notifications] Initializing...");
        const token = await initializeNotifications();

        if (!token) {
          console.warn("[Notifications] Could not obtain push token");
          return;
        }

        setPushToken(token);
        console.log("[Notifications] Got push token:", token.token);
      } catch (error) {
        console.error("[Notifications] Setup failed:", error);
      }
    };

    initPushToken();
  }, [authLoading]);

  // Register token with backend when user becomes available
  useEffect(() => {
    if (!user || !pushToken || hasRegisteredToken.current) {
      return;
    }

    hasRegisteredToken.current = true;

    const registerToken = async () => {
      try {
        const notificationService = createNotificationService(supabase);
        await notificationService.registerPushToken({
          token: pushToken.token,
          token_type: pushToken.type,
          platform: "ios",
          app_version: "1.0.0",
        });

        setIsRegistered(true);
        console.log("[Notifications] Token registered with backend");
      } catch (error) {
        console.error("[Notifications] Failed to register token:", error);
        // Reset flag to allow retry
        hasRegisteredToken.current = false;
      }
    };

    registerToken();
  }, [user, pushToken]);

  return {
    pushToken,
    isRegistered,
  };
}
