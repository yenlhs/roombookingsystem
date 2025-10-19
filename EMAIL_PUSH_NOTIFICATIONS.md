# Email & Push Notification Integration

## Overview

The Room Booking System now supports **both email and push notifications** for booking events. Notifications are sent automatically when users:

- Create a new booking (confirmation)
- Cancel a booking
- Update a booking (when date/time changes)

## Architecture

### Components

1. **Edge Function**: `/supabase/functions/send-booking-notification/`
   - Handles sending both email and push notifications
   - Gets booking details, user preferences, and push tokens
   - Uses Resend for email delivery
   - Uses Expo Push API for mobile notifications

2. **Notification Service**: `/packages/supabase/src/notifications.ts`
   - Client-side API for triggering notifications
   - Methods: `sendBookingNotification()`, `registerPushToken()`, etc.

3. **Email Templates**: `/supabase/functions/_shared/email-templates.ts`
   - HTML email templates with inline styles
   - Plain text fallbacks
   - Templates for: confirmation, cancellation, reminder

4. **Mobile App Integration**:
   - Book room: Sends confirmation notification after booking
   - Cancel booking: Sends cancellation notification
   - Edit booking: Sends update notification (only if date/time changed)

## Setup Instructions

### 1. Environment Variables

Add these to your Supabase project environment variables:

```bash
# Resend API Key (for email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx

# Expo Access Token (for push notifications)
EXPO_ACCESS_TOKEN=your-expo-access-token
```

#### Getting Resend API Key:

1. Sign up at https://resend.com
2. Create a new API key
3. Verify your domain or use Resend's test domain

#### Getting Expo Access Token:

1. Login to https://expo.dev
2. Go to Settings → Access Tokens
3. Create a new token with push notification permissions

### 2. Deploy Edge Function

```bash
cd supabase
npx supabase functions deploy send-booking-notification
```

### 3. Apply Database Migration

The notification trigger migration has already been created at:
`/supabase/migrations/20251016000002_booking_notification_trigger.sql`

This creates:

- `notification_queue` table for async processing
- Trigger function that queues notifications on booking changes
- Helper function to process the queue

Apply it with:

```bash
npx supabase db push
```

### 4. Push Token Registration

The mobile app automatically:

1. Requests notification permissions on launch
2. Gets Expo push token
3. Registers token with backend
4. Token is stored in `push_tokens` table

See `/apps/mobile/lib/hooks/use-notifications.ts` for implementation.

## How It Works

### Booking Creation Flow

```
User creates booking
    ↓
bookingService.createBooking()
    ↓
notificationService.sendBookingNotification({
  bookingId,
  notificationType: 'booking_confirmed'
})
    ↓
Edge function invoked
    ↓
┌─────────────────┐         ┌──────────────────┐
│ Get booking     │         │ Get user prefs   │
│ details         │         │ and push tokens  │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         └───────────┬───────────────┘
                     ↓
         ┌───────────────────────┐
         │ Send Email (Resend)   │
         │ if enabled            │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │ Send Push (Expo)      │
         │ if enabled            │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │ Log to                │
         │ notification_log      │
         └───────────────────────┘
```

### Notification Types

| Event             | Type                | Trigger                                             |
| ----------------- | ------------------- | --------------------------------------------------- |
| New booking       | `booking_confirmed` | After `createBooking()`                             |
| Cancelled booking | `booking_cancelled` | After `cancelBooking()`                             |
| Updated booking   | `booking_updated`   | After `updateBooking()` (only if date/time changed) |
| Upcoming reminder | `booking_reminder`  | 15 mins before (scheduled separately)               |

## Notification Preferences

Users can control their notification preferences via the `notification_preferences` table:

```typescript
{
  // Email preferences
  email_enabled: boolean,
  email_booking_confirmed: boolean,
  email_booking_cancelled: boolean,
  email_booking_reminder: boolean,
  email_booking_reminder_minutes: number,

  // Push preferences
  push_enabled: boolean,
  push_booking_confirmed: boolean,
  push_booking_cancelled: boolean,
  push_booking_reminder: boolean,
  push_booking_reminder_minutes: number,
}
```

Default: All notifications enabled.

## Email Templates

Three email templates are available:

### 1. Booking Confirmed

- Subject: `Booking Confirmed: {Room Name} on {Date}`
- Content: Green checkmark, booking details, add to calendar reminder

### 2. Booking Cancelled

- Subject: `Booking Cancelled: {Room Name} on {Date}`
- Content: Red X icon, cancelled booking details, cancellation reason

### 3. Booking Reminder

- Subject: `Reminder: {Room Name} booking starts in {X} minutes`
- Content: Bell icon, reminder message, booking details

All templates include:

- Professional HTML with inline styles
- Plain text fallback
- Responsive design
- Consistent branding

## Push Notification Content

Push notifications use the Expo format:

```typescript
{
  to: 'ExponentPushToken[...]',
  title: 'Booking Confirmed!',
  body: 'Your booking for Conference Room A on Oct 17 at 2:00 PM has been confirmed',
  data: {
    bookingId: 'uuid',
    roomName: 'Conference Room A',
    notificationType: 'booking_confirmed',
    category: 'bookings'
  },
  sound: 'default',
  priority: 'high'
}
```

## Testing

### Email Testing (Development)

1. Use Resend's test domain for development
2. Check Resend dashboard for delivery status
3. Test email rendering at https://putsmail.com

### Push Notification Testing

**iOS Simulator:**

- Remote push notifications DON'T work
- Use local notification testing buttons in Profile tab
- See `/NOTIFICATION_TESTING.md` for details

**Physical Device:**

1. Build app with `eas build --platform ios --profile preview`
2. Install on device
3. Create a booking
4. Should receive push notification

### Debugging

Check notification logs:

```sql
SELECT * FROM notification_log
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

Check push tokens:

```sql
SELECT * FROM push_tokens
WHERE user_id = 'your-user-id'
AND is_active = true;
```

## Error Handling

The notification flow is designed to **never fail the booking**:

```typescript
try {
  await notificationService.sendBookingNotification(...);
} catch (error) {
  // Log error but don't throw
  console.warn('Failed to send notification:', error);
}
```

This ensures:

- Bookings complete even if notification service is down
- Users aren't blocked by email/push failures
- Errors are logged for debugging

## Notification Queue (Optional)

The database trigger creates a `notification_queue` for async processing. This is useful for:

- Batch processing notifications
- Retry failed notifications
- Rate limiting

To process the queue manually:

```sql
SELECT * FROM process_notification_queue(10);
```

For production, set up a cron job or scheduled function to call this periodically.

## Future Enhancements

1. **Reminder Scheduling**
   - Implement booking reminder system
   - Send 15 minutes before booking (configurable)
   - Use Supabase scheduled functions or cron jobs

2. **SMS Notifications**
   - Add SMS channel via Twilio
   - User preference for SMS notifications

3. **Digest Emails**
   - Daily/weekly booking summary emails
   - Upcoming bookings reminder

4. **Admin Notifications**
   - Notify admins of new bookings
   - Alert on booking conflicts or issues

5. **In-App Notifications**
   - Show notifications within web/mobile app
   - Notification center with history

## Troubleshooting

### Emails Not Sending

1. Check Resend API key is set correctly
2. Verify domain is verified in Resend (or use test domain)
3. Check `notification_log` table for error messages
4. Test with Resend API directly: https://resend.com/docs/send-with-curl

### Push Notifications Not Working

1. Verify user has granted notification permissions
2. Check push token is registered: `SELECT * FROM push_tokens`
3. Verify Expo access token is set
4. Test with Expo push tool: https://expo.dev/notifications
5. Check device is not in simulator (for remote push)

### Edge Function Errors

1. View function logs: `npx supabase functions logs send-booking-notification`
2. Check environment variables are set
3. Verify function is deployed: `npx supabase functions list`
4. Test function directly with curl

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Email Template Best Practices](https://www.campaignmonitor.com/dev-resources/)
