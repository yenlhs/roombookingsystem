# Subscription Feature - Deployment Steps

## ✅ Implementation Complete!

All code has been successfully implemented for the paid subscription feature. Follow these steps to deploy and test.

---

## Step 1: Apply Database Migrations

```bash
# Navigate to Supabase directory
cd supabase

# Apply migrations to local development
supabase db reset

# OR apply to production
supabase db push
```

**Migrations applied:**

- ✅ `20251018000000_add_subscription_tiers.sql` - Subscription plans
- ✅ `20251018000001_add_user_subscriptions.sql` - User subscriptions
- ✅ `20251018000002_add_subscription_events.sql` - Audit trail
- ✅ `20251018000003_add_rooms_is_exclusive.sql` - Room exclusive flag
- ✅ `20251018000004_update_rls_for_exclusive_rooms.sql` - Access control

---

## Step 2: Set Up Stripe

### Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Complete account setup

### Create Products

1. Go to **Products** → **Add Product**
2. Create "Premium Subscription":
   - Name: `Premium Subscription`
   - Description: `Access to exclusive premium rooms`
   - Pricing: `$9.99/month` (recurring)
3. **Copy the Price ID** (starts with `price_...`)

### Get API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (`pk_test_...`)
   - **Secret key** (`sk_test_...`)

---

## Step 3: Configure Environment Variables

### Supabase Secrets (Edge Functions)

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Set webhook secret (get this after Step 4)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### Mobile App

Update `apps/mobile/.env`:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Web App (if needed)

Create/update `apps/web/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## Step 4: Deploy Edge Functions

```bash
# Deploy all three Stripe functions
supabase functions deploy stripe-webhooks
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
```

**After deployment, note the function URLs** (shown in output).

---

## Step 5: Configure Stripe Webhooks

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhooks`
   - Replace `YOUR_PROJECT_REF` with your Supabase project reference
3. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy the Signing Secret** (`whsec_...`)
5. Add it to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

## Step 6: Update Database with Stripe Price ID

```sql
-- Update the premium tier with your Stripe Price ID
UPDATE subscription_tiers
SET stripe_price_id = 'price_YOUR_PRICE_ID_HERE'
WHERE name = 'premium';
```

Run this in Supabase SQL Editor or via:

```bash
supabase db execute -f update-price-id.sql
```

---

## Step 7: Test the Implementation

### Test Database Access Control

```sql
-- Create a test user (or use existing user ID)
-- Check their subscription
SELECT * FROM user_subscriptions WHERE user_id = 'user-uuid';

-- Check if they can access exclusive rooms
SELECT user_has_exclusive_access('user-uuid');
```

### Test Mobile App

1. **Start the app**:

   ```bash
   cd apps/mobile
   pnpm start
   ```

2. **Test flow**:
   - ✅ Login/signup (automatically gets free tier)
   - ✅ Browse rooms (see subscription banner for free users)
   - ✅ Tap exclusive room → redirected to subscription page
   - ✅ View subscription details
   - ✅ Click "Upgrade to Premium"
   - ✅ Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
   - ✅ Verify subscription activated
   - ✅ Exclusive rooms now accessible

### Test Web Admin

1. **Start the app**:

   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Test flow**:
   - ✅ Create new room with "Premium Exclusive" checkbox
   - ✅ Edit existing room to mark as exclusive
   - ✅ View subscriptions dashboard (coming soon - optional)

### Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

---

## Step 8: Monitor & Debug

### Check Supabase Logs

```bash
# View Edge Function logs
supabase functions logs stripe-webhooks --tail

# View all function logs
supabase functions logs --tail
```

### Check Stripe Dashboard

1. Go to **Developers** → **Webhooks**
2. Click your webhook endpoint
3. View **Recent deliveries** for debugging

### Common Issues

**Webhook not receiving events:**

- Verify webhook URL is correct
- Check webhook secret matches in Supabase
- Test webhook manually in Stripe dashboard

**Payment not activating subscription:**

- Check Edge Function logs for errors
- Verify `stripe_price_id` matches in database
- Check `subscription_events` table for error logs

**RLS blocking access:**

- Test: `SELECT user_has_exclusive_access('user-id');`
- Verify subscription status is 'active' or 'trialing'
- Check `current_period_end` is in the future

---

## Step 9: Production Deployment

### Switch to Live Mode

1. **Stripe**: Switch dashboard to "Live mode" (toggle in top right)
2. **Get live keys**:
   - Live publishable key: `pk_live_...`
   - Live secret key: `sk_live_...`
3. **Update secrets**:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_KEY
   ```
4. **Update mobile .env** with live publishable key
5. **Create live webhook** endpoint (same steps as test)

### Deploy Apps

**Mobile (Expo)**:

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
eas submit
```

**Web (Vercel)**:

```bash
cd apps/web
vercel --prod
```

---

## Testing Checklist

### Database & RLS

- [ ] New users get free tier automatically
- [ ] Free users cannot book exclusive rooms
- [ ] Premium users can book exclusive rooms
- [ ] RLS policies prevent unauthorized access

### Payment Flow

- [ ] Checkout completes successfully
- [ ] Webhook updates subscription
- [ ] User gains immediate access
- [ ] Subscription shows expiry date
- [ ] Billing portal works for management
- [ ] Cancellation reverts to free tier

### UI/UX

- [ ] Subscription banner shows for free users
- [ ] Exclusive rooms show premium badge
- [ ] Lock icon on inaccessible rooms
- [ ] Subscription screen displays correctly
- [ ] Web room form has exclusive checkbox

---

## 🎉 You're All Set!

Your subscription feature is now live. Users can:

- Browse rooms with exclusive premium options
- Subscribe via Stripe for $9.99/month
- Access exclusive rooms with active subscription
- Manage subscriptions through Stripe portal

## Support

For issues:

- Check Supabase function logs
- Review Stripe webhook deliveries
- Verify RLS policies
- Consult `SUBSCRIPTION_IMPLEMENTATION_GUIDE.md` for details

---

**Need Help?** See `SUBSCRIPTION_IMPLEMENTATION_GUIDE.md` for comprehensive implementation details.
