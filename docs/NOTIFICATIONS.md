# Notification System

## Overview

The Room Booking System supports two types of notifications:
1. **Push Notifications** - Mobile app notifications via Expo Push Service
2. **Email Notifications** - Email notifications for booking events

## Architecture

### Database Schema

#### Push Tokens Table (`push_tokens`)
Stores push notification tokens for registered mobile devices.

**Columns:**
- `id` - Unique token ID
- `user_id` - User who owns the device
- `token` - Expo/FCM/APNS push token
- `token_type` - Type of token (expo, fcm, apns)
- `device_id` - Device identifier
- `device_name` - Human-readable device name
- `platform` - Platform (ios, android)
- `app_version` - App version when token was registered
- `is_active` - Whether token is still valid
- `last_used_at` - Last time token was used
- `created_at`, `updated_at` - Timestamps

#### Notification Preferences Table (`notification_preferences`)
User preferences for email and push notifications.

**Columns:**
- `id` - Unique preference ID
- `user_id` - User who owns these preferences
- `email_enabled` - Master email toggle
- `email_booking_confirmed` - Email on booking confirmation
- `email_booking_cancelled` - Email on booking cancellation
- `email_booking_reminder` - Email reminders before bookings
- `email_booking_reminder_minutes` - Minutes before booking to send email
- `push_enabled` - Master push toggle
- `push_booking_confirmed` - Push on booking confirmation
- `push_booking_cancelled` - Push on booking cancellation
- `push_booking_reminder` - Push reminders before bookings
- `push_booking_reminder_minutes` - Minutes before booking to send push
- `created_at`, `updated_at` - Timestamps

#### Notification Log Table (`notification_log`)
Audit log of all sent notifications.

**Columns:**
- `id` - Unique log entry ID
- `user_id` - Recipient user ID
- `booking_id` - Related booking ID
- `notification_type` - Type (booking_confirmed, booking_cancelled, booking_reminder, booking_updated)
- `channel` - Delivery channel (email, push)
- `status` - Status (pending, sent, failed, delivered)
- `recipient` - Email address or push token
- `subject` - Email subject line
- `body` - Notification body
- `error_message` - Error if failed
- `metadata` - Additional data (JSON)
- `sent_at`, `delivered_at` - Timestamps
- `created_at` - Timestamp

## Push Notifications (Mobile)

### Setup

1. **Install Dependencies**
   ```bash
   cd apps/mobile
   pnpm add expo-notifications expo-device expo-constants
   ```

2. **Configure app.json**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/icon.png",
             "color": "#ffffff"
           }
         ]
       ],
       "android": {
         "permissions": ["NOTIFICATIONS", "VIBRATE"],
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

3. **Get EAS Project ID**
   - Run `eas init` to create an EAS project
   - Add project ID to `app.json`:
     ```json
     {
       "extra": {
         "eas": {
           "projectId": "your-project-id"
         }
       }
     }
     ```

### Usage in Mobile App

```typescript
import {
  initializeNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  scheduleBookingReminder,
} from '../lib/notifications';
import { createNotificationService } from '@workspace/supabase';

// Initialize on app start
useEffect(() => {
  const init = async () => {
    // Get push token and configure notifications
    const token = await initializeNotifications();

    if (token) {
      // Register token with backend
      const notificationService = createNotificationService(supabase);
      await notificationService.registerPushToken({
        token: token.token,
        token_type: token.type,
        device_id: 'device-123',
        device_name: 'John's iPhone',
        platform: 'ios',
        app_version: '1.0.0',
      });
    }

    // Listen for notifications
    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    const responseSub = addNotificationResponseListener((response) => {
      console.log('User tapped notification:', response);
      // Navigate to booking details, etc.
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  };

  init();
}, []);

// Schedule a booking reminder
const scheduleReminder = async () => {
  const bookingTime = new Date('2025-10-17T14:00:00');
  await scheduleBookingReminder(
    'booking-id',
    'Conference Room A',
    bookingTime,
    15 // 15 minutes before
  );
};
```

### Notification Channels (Android)

The app automatically configures three notification channels:

1. **Default** - General notifications
2. **Bookings** - Booking confirmations and cancellations
3. **Reminders** - Booking reminders

Users can customize notification behavior per channel in Android settings.

## Email Notifications

### Email Templates

Pre-built HTML email templates are available:

1. **Booking Confirmed** - Sent when a booking is created
2. **Booking Cancelled** - Sent when a booking is cancelled
3. **Booking Reminder** - Sent before a booking starts

All templates include:
- Responsive design
- Inline CSS for email client compatibility
- Plain text fallback
- Consistent branding
- Clear call-to-action buttons

### Email Template Usage

```typescript
import {
  bookingConfirmedEmail,
  bookingCancelledEmail,
  bookingReminderEmail,
  bookingConfirmedText,
} from '../supabase/functions/_shared/email-templates';

// Generate booking confirmation email
const { subject, html } = bookingConfirmedEmail({
  userName: 'John Doe',
  roomName: 'Conference Room A',
  bookingDate: 'October 17, 2025',
  startTime: '2:00 PM',
  endTime: '3:00 PM',
  notes: 'Team standup meeting',
  bookingId: 'booking-123',
});

const textVersion = bookingConfirmedText({...});

// Send via email service
await sendEmail({
  to: 'user@example.com',
  subject,
  html,
  text: textVersion,
});
```

## Notification Service API

### Client-Side Service

```typescript
import { createNotificationService } from '@workspace/supabase';

const notificationService = createNotificationService(supabase);

// Register push token
await notificationService.registerPushToken({
  token: 'ExponentPushToken[xxx]',
  token_type: 'expo',
  platform: 'ios',
});

// Deactivate token (on logout)
await notificationService.deactivatePushToken('ExponentPushToken[xxx]');

// Get notification preferences
const prefs = await notificationService.getNotificationPreferences();

// Update notification preferences
await notificationService.updateNotificationPreferences({
  email_enabled: true,
  push_booking_reminder: true,
  push_booking_reminder_minutes: 30,
});

// Get notification history
const logs = await notificationService.getNotificationLogs(50);

// Send test notification
await notificationService.sendTestNotification();
```

## Notification Triggers

### Automatic Notifications

Notifications are automatically triggered for:

1. **Booking Created** (confirmed status)
   - Email: Confirmation with booking details
   - Push: "Booking confirmed for [Room] on [Date]"

2. **Booking Cancelled**
   - Email: Cancellation notice with reason
   - Push: "Booking cancelled for [Room] on [Date]"

3. **Booking Reminder**
   - Email: Reminder X minutes before booking
   - Push: Reminder X minutes before booking
   - Default: 30 minutes for email, 15 minutes for push

### Manual Notifications

```typescript
// Send notification for a specific booking
await notificationService.sendBookingNotification({
  bookingId: 'booking-123',
  notificationType: 'booking_confirmed',
});
```

## User Preferences

Users can customize notification preferences:

### Email Preferences
- Master email toggle
- Per-event toggles (confirmed, cancelled, reminder)
- Reminder timing (minutes before booking)

### Push Preferences
- Master push toggle
- Per-event toggles (confirmed, cancelled, reminder)
- Reminder timing (minutes before booking)

### Default Settings
- All notifications enabled by default
- Email reminders: 30 minutes before
- Push reminders: 15 minutes before

## Testing Notifications

### Test Push Notifications

```bash
# Send test push via Expo Push Tool
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[xxx]",
    "title": "Test Notification",
    "body": "This is a test",
    "data": {"test": true}
  }'
```

### Test Email Templates

```typescript
// In development, log email HTML to console
const email = bookingConfirmedEmail({...});
console.log(email.html);

// Or save to file for preview
fs.writeFileSync('preview.html', email.html);
```

## Security & Privacy

### Push Token Security
- Tokens are user-scoped with RLS policies
- Only active tokens are used for sending
- Tokens are automatically deactivated on logout
- Old/unused tokens are periodically cleaned

### Email Privacy
- Users can opt out of any notification type
- Notification logs are user-scoped
- Email addresses are never shared with third parties

### RLS Policies

```sql
-- Users can only manage their own tokens
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Users can only view their own preferences
CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Users can only view their own notification logs
CREATE POLICY "Users can view own logs"
  ON notification_log FOR SELECT
  USING (auth.uid() = user_id);
```

## Troubleshooting

### Push Notifications Not Received

1. **Check permissions**
   ```typescript
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Permission status:', status);
   ```

2. **Verify token registration**
   ```typescript
   const tokens = await notificationService.getPushTokens();
   console.log('Active tokens:', tokens);
   ```

3. **Check notification log**
   ```typescript
   const logs = await notificationService.getNotificationLogs();
   const failed = logs.filter(l => l.status === 'failed');
   console.log('Failed notifications:', failed);
   ```

4. **Test notification manually**
   ```typescript
   await notificationService.sendTestNotification();
   ```

### Email Notifications Not Received

1. **Check spam folder**
2. **Verify email preferences**
   ```typescript
   const prefs = await notificationService.getNotificationPreferences();
   console.log('Email enabled:', prefs?.email_enabled);
   ```

3. **Check notification log for errors**
   ```sql
   SELECT * FROM notification_log
   WHERE channel = 'email'
     AND status = 'failed'
   ORDER BY created_at DESC;
   ```

## Performance Considerations

### Push Notification Batching
- Batch multiple notifications when possible
- Use Expo's batch API for multiple recipients
- Limit to 100 notifications per request

### Email Rate Limiting
- Respect email service provider limits
- Implement exponential backoff for failures
- Queue emails during high traffic

### Database Cleanup
```sql
-- Clean up old notification logs (older than 90 days)
DELETE FROM notification_log
WHERE created_at < NOW() - INTERVAL '90 days';

-- Deactivate tokens not used in 30 days
UPDATE push_tokens
SET is_active = false
WHERE last_used_at < NOW() - INTERVAL '30 days'
  AND is_active = true;
```

## Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Slack/Teams integration
- [ ] In-app notification center
- [ ] Notification scheduling (send at specific time)
- [ ] Notification templates customization
- [ ] Notification analytics dashboard
- [ ] Rich push notifications (images, actions)
- [ ] Web push notifications
- [ ] Notification preferences UI in web app

## Resources

- [Expo Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Email Template Best Practices](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
