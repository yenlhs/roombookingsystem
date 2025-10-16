/**
 * Test notification helpers for development
 * Use these to test notifications on iOS simulator
 */

import { scheduleLocalNotification, NotificationType, createNotificationData } from './notifications';

/**
 * Send a test booking confirmation notification
 * Works on iOS simulator!
 */
export async function testBookingConfirmation(roomName: string = 'Conference Room A') {
  const notificationId = await scheduleLocalNotification(
    'Booking Confirmed!',
    `Your booking for ${roomName} on October 17 at 2:00 PM has been confirmed`,
    createNotificationData(NotificationType.BOOKING_CONFIRMED, {
      bookingId: 'test-booking-123',
      roomName,
      category: 'bookings',
    }),
    2 // Show in 2 seconds
  );

  console.log('Test notification scheduled:', notificationId);
  return notificationId;
}

/**
 * Send a test booking cancellation notification
 */
export async function testBookingCancellation(roomName: string = 'Conference Room A') {
  const notificationId = await scheduleLocalNotification(
    'Booking Cancelled',
    `Your booking for ${roomName} on October 17 has been cancelled`,
    createNotificationData(NotificationType.BOOKING_CANCELLED, {
      bookingId: 'test-booking-123',
      roomName,
      category: 'bookings',
    }),
    2
  );

  console.log('Test cancellation notification scheduled:', notificationId);
  return notificationId;
}

/**
 * Send a test booking reminder notification
 */
export async function testBookingReminder(roomName: string = 'Conference Room A') {
  const notificationId = await scheduleLocalNotification(
    'Booking Reminder',
    `Your booking for ${roomName} starts in 15 minutes`,
    createNotificationData(NotificationType.BOOKING_REMINDER, {
      bookingId: 'test-booking-123',
      roomName,
      category: 'reminders',
    }),
    2
  );

  console.log('Test reminder notification scheduled:', notificationId);
  return notificationId;
}

/**
 * Send an immediate test notification
 */
export async function testImmediateNotification() {
  const notificationId = await scheduleLocalNotification(
    'Test Notification',
    'This is a test notification from the Room Booking System',
    { test: true },
    0 // Immediate
  );

  console.log('Immediate test notification sent:', notificationId);
  return notificationId;
}

/**
 * Test all notification types in sequence
 */
export async function testAllNotifications() {
  console.log('Testing all notification types...');

  // Test confirmation
  await testBookingConfirmation();

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test cancellation
  await testBookingCancellation();

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test reminder
  await testBookingReminder();

  console.log('All test notifications scheduled!');
}
