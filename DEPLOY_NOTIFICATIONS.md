# Deploy Notification Edge Function

## Option 1: Deploy via Supabase CLI (Recommended)

### Step 1: Link to your project

```bash
# Login to Supabase (you'll need an access token from https://supabase.com/dashboard/account/tokens)
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:

- Go to https://supabase.com/dashboard
- Select your project
- Go to Settings → General
- Copy the "Reference ID"

### Step 2: Deploy the function

```bash
npx supabase functions deploy send-booking-notification
```

### Step 3: Set environment variables

In Supabase Dashboard → Settings → Edge Functions → Add new secret:

**Required for email notifications:**

- `RESEND_API_KEY` - Get from https://resend.com (free tier available)

**Optional (already working without this):**

- `EXPO_ACCESS_TOKEN` - Get from https://expo.dev/settings/access-tokens

## Option 2: Deploy via Supabase Dashboard

If you prefer using the web interface:

### Step 1: Create function in dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Edge Functions** (in sidebar)
4. Click **"Deploy a new function"**
5. Function name: `send-booking-notification`

### Step 2: Copy function code

Use the code from `/supabase/functions/send-booking-notification/index.ts`

But you'll also need to include the email templates. Here's a combined version:

```typescript
// Copy the entire contents of:
// 1. /supabase/functions/_shared/email-templates.ts (paste at top)
// 2. /supabase/functions/send-booking-notification/index.ts (paste below)
```

### Step 3: Set environment variables

In the same Edge Functions page:

- Click on your function
- Go to "Secrets" tab
- Add:
  - `RESEND_API_KEY` (if you want email)
  - `EXPO_ACCESS_TOKEN` (optional for push)

## ✅ Migration Applied

The notification database tables have been successfully created:

- `push_tokens`
- `notification_preferences`
- `notification_log`

## Verify Deployment

After deploying, test a booking:

- Check logs: `npx supabase functions logs send-booking-notification`
- Or view logs in Supabase Dashboard → Edge Functions → Your function → Logs
- Check `notification_log` table for sent notifications

## Testing

See **TEST_EMAIL_NOTIFICATIONS.md** for detailed testing instructions.

## Troubleshooting

**"Function not found" error:**

- Function isn't deployed yet (deploy it!)
- Function name mismatch (must be `send-booking-notification`)

**"Database tables not found" error:**

- Migration has been applied ✅
- Tables created: `push_tokens`, `notification_preferences`, `notification_log`

**"Environment variable not set" error:**

- Add `RESEND_API_KEY` if using email
- Add `EXPO_ACCESS_TOKEN` if using push (optional)
- Redeploy function after adding: `npx supabase functions deploy send-booking-notification`

**Email not sending:**

- Verify Resend API key is set in Edge Functions secrets
- Check function logs for detailed error
- Verify domain in Resend (or use test domain)
- Check `notification_log` table for error messages

**Push notifications not working:**

- Check if user has registered push token: `SELECT * FROM push_tokens`
- Verify notification permissions granted
- Check if using physical device (simulator has limitations)
