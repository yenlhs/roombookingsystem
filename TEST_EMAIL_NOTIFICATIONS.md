# Test Email Notifications

## ✅ What's Fixed

The notification database tables have been successfully created:

- `push_tokens` - Stores push notification tokens
- `notification_preferences` - User notification settings (defaults created for all users)
- `notification_log` - Tracks all sent notifications

## 🔧 Required Setup

### 1. Verify Resend API Key is Set

Go to: https://supabase.com/dashboard/project/nladwgkecjkcjsdawzoc/settings/functions

Click on **Edge Functions** → **Secrets** and verify you have:

- `RESEND_API_KEY` = `re_...` (your API key from https://resend.com)

If not set, add it now.

### 2. Restart the Edge Function (if needed)

After adding environment variables, you may need to redeploy:

```bash
npx supabase functions deploy send-booking-notification
```

## 🧪 Test Email Notifications

### Option 1: Test via Mobile App

1. Open your mobile app
2. Create a new booking for any room
3. Check your email inbox
4. You should receive a "Booking Confirmed" email

### Option 2: Test via SQL (Direct Edge Function Call)

Run this in Supabase SQL Editor to manually invoke the function:

```sql
-- Get a test booking ID
SELECT id, user_id FROM bookings ORDER BY created_at DESC LIMIT 1;

-- Then call the edge function manually via SQL
SELECT
  net.http_post(
    url := 'https://nladwgkecjkcjsdawzoc.supabase.co/functions/v1/send-booking-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'role'
    ),
    body := jsonb_build_object(
      'bookingId', 'PASTE_BOOKING_ID_HERE',
      'notificationType', 'booking_confirmed'
    )
  ) as result;
```

### Option 3: Check Notification Logs

After creating a booking, check the notification log:

```sql
SELECT
  notification_type,
  channel,
  status,
  recipient,
  subject,
  error_message,
  created_at
FROM notification_log
ORDER BY created_at DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### "Email not sending"

1. **Check Edge Function Logs:**
   - Dashboard: https://supabase.com/dashboard/project/nladwgkecjkcjsdawzoc/functions/send-booking-notification/logs
   - CLI: `npx supabase functions logs send-booking-notification --project-ref nladwgkecjkcjsdawzoc`

2. **Check notification_log for errors:**

   ```sql
   SELECT error_message, metadata
   FROM notification_log
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Verify Resend API Key:**
   - Valid format: `re_...`
   - Not expired
   - Has correct permissions

4. **Check Resend Domain:**
   - In Resend dashboard, you need a verified domain
   - OR use their test domain (emails will be sent but might go to spam)

### "Function timeout"

The edge function has a 60-second timeout. Email sending should be quick, but if Resend is slow:

- Check Resend status: https://status.resend.com
- Try again in a few minutes

### "CORS error in mobile app"

This shouldn't happen since we're calling via the Supabase client, but if you see CORS errors:

- Make sure you're using `createNotificationService(supabase)` not direct fetch
- Check that the Supabase client is properly initialized

## 📊 Expected Behavior

When you create a booking:

1. Booking is created in database ✅
2. Mobile app calls `notificationService.sendBookingNotification()` ✅
3. Edge function receives request ✅
4. Edge function fetches booking + user details ✅
5. Edge function checks notification preferences ✅
6. **Email is sent via Resend API** ✅
7. Record is logged in `notification_log` table ✅
8. User receives email (check inbox/spam) ✅

The mobile app will show console logs:

- Success: `[Booking] Notification sent successfully`
- Warning (non-fatal): `[Booking] Failed to send notification: ...`

## 🎯 Next Steps

1. **Create a test booking** in the mobile app
2. **Check your email** (including spam folder)
3. **Check notification_log** table for success/error details
4. If errors persist, check edge function logs

The system is now ready to send emails! 🚀
