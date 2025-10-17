/**
 * React Hook for managing push notifications
 */

import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  initializeNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  type PushNotificationToken,
} from '../notifications';
import { createNotificationService } from '@workspace/supabase';
import { supabase } from '../supabase';
import { useAuth } from '../auth/context';

export function useNotifications() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pushToken, setPushToken] = useState<PushNotificationToken | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const notificationService = createNotificationService(supabase);

    // Initialize notifications and register token
    const setupNotifications = async () => {
      try {
        console.log('[Notifications] Initializing...');

        // Get push token
        const token = await initializeNotifications();

        if (!token) {
          console.warn('[Notifications] Could not obtain push token');
          return;
        }

        setPushToken(token);
        console.log('[Notifications] Got push token:', token.token);

        // Only register with backend if user is authenticated
        if (!user) {
          console.log('[Notifications] User not authenticated, skipping backend registration');
          return;
        }

        // Register with backend
        try {
          await notificationService.registerPushToken({
            token: token.token,
            token_type: token.type,
            platform: 'ios', // Or detect dynamically
            app_version: '1.0.0',
          });

          setIsRegistered(true);
          console.log('[Notifications] Token registered with backend');
        } catch (error) {
          console.error('[Notifications] Failed to register token:', error);
        }
      } catch (error) {
        console.error('[Notifications] Setup failed:', error);
      }
    };

    // Wait for auth to finish loading before setting up notifications
    if (authLoading) {
      console.log('[Notifications] Waiting for auth to load...');
      return;
    }

    setupNotifications();

    // Listen for notifications when app is in foreground
    const receivedSubscription = addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Received in foreground:', notification);

      // Show alert for foreground notifications
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || '',
        [{ text: 'OK' }]
      );
    });

    // Listen for notification taps
    const responseSubscription = addNotificationResponseListener((response) => {
      console.log('[Notifications] User tapped notification:', response);

      const data = response.notification.request.content.data;

      // Handle navigation based on notification type
      if (data?.bookingId) {
        // Navigate to booking details or bookings tab
        router.push('/(tabs)/bookings');
      }
    });

    // Cleanup
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [user, authLoading, router]);

  return {
    pushToken,
    isRegistered,
  };
}
