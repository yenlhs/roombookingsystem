/**
 * Push Notification Service for React Native
 * Handles notification permissions, registration, and handling
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  type: "expo" | "fcm" | "apns";
}

/**
 * Check if push notifications are supported on this device
 */
export function isPushNotificationSupported(): boolean {
  return (
    Device.isDevice && (Platform.OS === "ios" || Platform.OS === "android")
  );
}

/**
 * Request permission to send push notifications
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.warn("Push notifications are not supported on this device");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Failed to get push notification permissions");
    return false;
  }

  return true;
}

/**
 * Get the Expo Push Token for this device
 * This token is used to send push notifications via Expo's push service
 */
export async function getExpoPushToken(): Promise<PushNotificationToken | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get project ID from app.json
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("No EAS project ID found. Configure in app.json");
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return {
      token: token.data,
      type: "expo",
    };
  } catch (error) {
    console.error("Error getting Expo push token:", error);
    return null;
  }
}

/**
 * Configure Android notification channel
 * Required for Android 8.0+ to show notifications
 */
export async function configureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    // Booking notifications channel
    await Notifications.setNotificationChannelAsync("bookings", {
      name: "Booking Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
      description: "Notifications about your room bookings",
    });

    // Reminders channel
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Booking Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F59E0B",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
      description: "Reminders for upcoming bookings",
    });
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  triggerSeconds?: number,
): Promise<string> {
  let trigger: Notifications.NotificationTriggerInput = null;

  if (triggerSeconds) {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
      repeats: false,
    } as Notifications.TimeIntervalTriggerInput;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: data?.category || "default",
    },
    trigger,
  });

  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(
  notificationId: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Add listener for when notification is received while app is in foreground
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void,
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add listener for when user taps on a notification
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Get the notification that launched the app (if any)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Initialize notification service
 * Call this when the app starts
 */
export async function initializeNotifications(): Promise<PushNotificationToken | null> {
  try {
    // Configure Android channels
    await configureAndroidNotificationChannel();

    // Get push token
    const token = await getExpoPushToken();

    if (token) {
      console.log("Push token obtained:", token.token);
    }

    return token;
  } catch (error) {
    console.error("Error initializing notifications:", error);
    return null;
  }
}

/**
 * Notification types for this app
 */
export enum NotificationType {
  BOOKING_CONFIRMED = "booking_confirmed",
  BOOKING_CANCELLED = "booking_cancelled",
  BOOKING_REMINDER = "booking_reminder",
  ROOM_AVAILABLE = "room_available",
}

/**
 * Helper to create typed notification data
 */
export function createNotificationData(
  type: NotificationType,
  data: Record<string, any>,
): Record<string, any> {
  return {
    type,
    ...data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Schedule a booking reminder notification
 * @param bookingId - The booking ID
 * @param roomName - The room name
 * @param bookingTime - The booking date/time
 * @param minutesBefore - Minutes before booking to show reminder
 */
export async function scheduleBookingReminder(
  bookingId: string,
  roomName: string,
  bookingTime: Date,
  minutesBefore: number = 15,
): Promise<string | null> {
  const now = new Date();
  const reminderTime = new Date(
    bookingTime.getTime() - minutesBefore * 60 * 1000,
  );
  const secondsUntilReminder = Math.max(
    0,
    (reminderTime.getTime() - now.getTime()) / 1000,
  );

  // Only schedule if reminder is in the future
  if (secondsUntilReminder <= 0) {
    console.log("Booking reminder time has passed, not scheduling");
    return null;
  }

  const notificationId = await scheduleLocalNotification(
    "Booking Reminder",
    `Your booking for ${roomName} starts in ${minutesBefore} minutes`,
    createNotificationData(NotificationType.BOOKING_REMINDER, {
      bookingId,
      roomName,
      category: "reminders",
    }),
    secondsUntilReminder,
  );

  return notificationId;
}
