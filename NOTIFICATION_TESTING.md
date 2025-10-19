# Testing Mobile Push Notifications

## Current Status

✅ Notification infrastructure is fully set up
✅ Database tables created (push_tokens, notification_preferences, notification_log)
✅ Mobile app integrated with notification hooks
✅ Expo notification plugin configured
✅ Test notification buttons added to Profile screen

## iOS Simulator vs Physical Device

### ⚠️ Important: iOS Simulator Limitations

**What WORKS on iOS Simulator:**

- ✅ Local notifications (what we use for testing)
- ✅ Notification permissions
- ✅ Token registration
- ✅ Notification UI/UX testing
- ✅ Foreground notifications

**What DOESN'T WORK on iOS Simulator:**

- ❌ Remote push notifications from Expo Push Service
- ❌ APNS (Apple Push Notification Service)

**Solution:** We've set up **local notification testing** that perfectly simulates the notification experience on the simulator!

## Quick Start Testing

### Step 1: Initialize EAS Project (One-time)

```bash
cd apps/mobile
npx eas init
```

When prompted:

- Accept to create a project for your account
- This will update `app.json` with your real EAS project ID

### Step 2: Reload Your App

```bash
# Stop the current dev server (Ctrl+C)
# Then start it again
npx expo start
```

### Step 3: Test Notifications (iOS Simulator)

**Easy Testing via Profile Screen:**

1. **Launch the app** on your iOS simulator
2. **Grant notification permissions** when prompted
3. **Go to Profile tab** (bottom right)
4. **Scroll down** to "Test Notifications" section
5. **Tap any test button**:
   - "Send Test Notification" - Immediate test
   - "Test Booking Confirmed" - Confirmation notification
   - "Test Booking Cancelled" - Cancellation notification
   - "Test Booking Reminder" - Reminder notification

6. **Wait 2 seconds** - notification will appear! 🎉

**What happens:**

- Notification appears in notification center
- You'll see the notification banner
- Tap it to test navigation
- Works perfectly on simulator!

### Step 4: Test Real Bookings (Physical Device Only)

For testing actual booking notifications from the backend:

1. Use a physical iPhone (not simulator)
2. Create a booking via the app
3. You'll receive a real push notification from Expo's servers

### Step 4: Verify in Database

You can check if your push token was registered:

```sql
-- In Supabase SQL Editor
SELECT * FROM push_tokens WHERE is_active = true;
```

You should see your device's push token.

## Testing Different Scenarios

### Scenario 1: Booking Confirmation Notification

**Steps:**

1. Create a new booking from the mobile app
2. **Expected**: Immediate push notification with booking details

**What to check:**

- Notification appears in notification center
- Tapping notification opens the Bookings tab
- Notification shows correct room name, date, and time

### Scenario 2: Booking Cancellation Notification

**Steps:**

1. Go to Bookings tab
2. Select an upcoming booking
3. Tap "Cancel" button
4. **Expected**: Push notification about cancellation

**What to check:**

- Cancellation notification received
- Notification explains booking was cancelled
- Shows cancelled room and date

### Scenario 3: Booking Reminder Notification

Reminders are scheduled automatically, but you can test with a near-future booking:

**Steps:**

1. Create a booking for 20 minutes from now
2. Wait 5 minutes (reminder fires 15 minutes before)
3. **Expected**: Reminder notification appears

**What to check:**

- Reminder arrives 15 minutes before booking
- Shows correct booking details
- Can tap to open app

### Scenario 4: Foreground Notification

**Steps:**

1. Keep the app open
2. Create a booking (from web admin or another device)
3. **Expected**: Alert dialog appears in app

**What to check:**

- Alert shows notification content
- User can dismiss alert
- App remains responsive

## Manual Push Notification Test

You can send a test push notification directly without creating a booking:

### Method 1: Using Expo Push Tool

1. Go to https://expo.dev/notifications
2. Enter your push token (from console logs)
3. Add title and message
4. Click "Send Notification"

### Method 2: Using curl

```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "title": "Test Notification",
    "body": "This is a test from curl",
    "data": {"test": true}
  }'
```

## Checking Notification Logs

View all notifications sent to you:

```typescript
import { createNotificationService } from "@workspace/supabase";
import { supabase } from "./lib/supabase";

const notificationService = createNotificationService(supabase);
const logs = await notificationService.getNotificationLogs(20);
console.log("Notification history:", logs);
```

Or check in database:

```sql
SELECT
  notification_type,
  channel,
  status,
  subject,
  sent_at,
  error_message
FROM notification_log
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 20;
```

## Troubleshooting

### No Push Token Obtained

**Problem**: Console shows "Could not obtain push token"

**Solutions:**

1. Make sure EAS project ID is set in `app.json`
2. Restart the dev server
3. Clear app cache: `npx expo start -c`
4. On iOS simulator, check notification permissions in Settings > Notifications

### Token Not Registered

**Problem**: Token obtained but not registered with backend

**Solutions:**

1. Check you're logged in (auth required)
2. Check console for error messages
3. Verify database connection
4. Check RLS policies allow push_tokens INSERT

### Notifications Not Appearing

**Problem**: Token registered but no notifications appear

**Solutions:**

1. **Check notification permissions**:

   ```typescript
   import * as Notifications from "expo-notifications";
   const { status } = await Notifications.getPermissionsAsync();
   console.log("Permission status:", status); // Should be 'granted'
   ```

2. **Verify push token in database**:

   ```sql
   SELECT * FROM push_tokens
   WHERE user_id = 'your-user-id'
   AND is_active = true;
   ```

3. **Check notification preferences**:

   ```sql
   SELECT * FROM notification_preferences
   WHERE user_id = 'your-user-id';
   ```

   Make sure `push_enabled` and `push_booking_confirmed` are true.

4. **Check notification log for errors**:
   ```sql
   SELECT * FROM notification_log
   WHERE user_id = 'your-user-id'
   AND status = 'failed'
   ORDER BY created_at DESC;
   ```

### iOS Simulator Limitations

**Note**: Push notifications work differently on iOS simulator:

- Local notifications work fine
- Remote push notifications require a physical device
- For testing, use local notifications or a physical iPhone

## Console Commands for Testing

Open your dev tools and run these in your mobile app:

```typescript
// Get current push token
const { pushToken, isRegistered } = useNotifications();
console.log("Token:", pushToken);
console.log("Registered:", isRegistered);

// Get notification preferences
const service = createNotificationService(supabase);
const prefs = await service.getNotificationPreferences();
console.log("Preferences:", prefs);

// Get active push tokens
const tokens = await service.getPushTokens();
console.log("Active tokens:", tokens);

// Send test notification
await service.sendTestNotification();
```

## Expected Notification Content

### Booking Confirmed

- **Title**: "Booking Confirmed!"
- **Body**: "Your booking for [Room Name] on [Date] at [Time] has been confirmed"
- **Data**: `{ bookingId, roomName, date, time }`

### Booking Cancelled

- **Title**: "Booking Cancelled"
- **Body**: "Your booking for [Room Name] on [Date] has been cancelled"
- **Data**: `{ bookingId, roomName, date }`

### Booking Reminder

- **Title**: "Booking Reminder"
- **Body**: "Your booking for [Room Name] starts in 15 minutes"
- **Data**: `{ bookingId, roomName, time }`

## Next Steps

Once notifications are working:

1. **Test on a physical device** - Simulator has limitations
2. **Customize notification preferences** - Let users control what they receive
3. **Test edge cases** - Multiple devices, app in background, etc.
4. **Build production app** - With `eas build`
5. **Submit to App Store** - Notifications work in production builds

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/push-notifications/overview/)
- [Testing Push Notifications](https://docs.expo.dev/push-notifications/testing/)
- [Expo Push Tool](https://expo.dev/notifications)
- Full notification docs: `docs/NOTIFICATIONS.md`
